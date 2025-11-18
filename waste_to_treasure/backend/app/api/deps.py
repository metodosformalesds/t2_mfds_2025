"""
Dependencies para la API.

Implementa funciones de dependencia comunes:
- Validación de JWT de AWS Cognito
- JIT (Just-In-Time) user creation
- Verificación de roles y permisos
"""
import jwt
import logging
import uuid
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.core.config import get_settings, Settings
from app.core.database import get_async_session as get_async_db
from app.core.security import verify_cognito_token
from app.models.user import User, UserRoleEnum, UserStatusEnum

logger = logging.getLogger(__name__)
security = HTTPBearer()


async def get_current_user_with_jit(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_async_db)
) -> User:
    """
    Autor: Oscar Alonso Nava Rivera
    Dependencia principal de autenticación con Just-In-Time (JIT) User Creation.
    
    Valida el token JWT de AWS Cognito y:
    1. Si el usuario existe en la BD → lo retorna
    2. Si el usuario NO existe → lo crea automáticamente (JIT)
    
    Este flujo permite que usuarios registrados en Cognito (incluyendo OAuth via Google)
    accedan automáticamente sin necesidad de un endpoint de registro separado.
    
    Args:
        credentials: Credenciales HTTP Bearer del header Authorization.
        db: Sesión de base de datos asíncrona.
        
    Returns:
        Usuario autenticado (existente o recién creado).
        
    Raises:
        HTTPException 401: Si el token es inválido.
        HTTPException 403: Si el usuario está bloqueado.
        HTTPException 500: Si falla la creación del usuario.
        
    Example:
        ```python
        @router.get("/me")
        async def get_me(current_user: User = Depends(get_current_user_with_jit)):
            return {
                "user_id": str(current_user.user_id),
                "email": current_user.email,
                "role": current_user.role
            }
        ```
        
    Note:
        - El primer acceso de un usuario de Cognito creará su registro local
        - El UUID del usuario se toma del claim 'sub' del token Cognito
        - El email se toma del claim 'email' del token
        - Usuarios nuevos se crean con role=USER y status=ACTIVE
        - Soporta autenticación directa y OAuth (Google, etc.)
    """
    
    token = credentials.credentials
    
    try:
        # Verificar el token de Cognito
        payload = verify_cognito_token(token)
    except HTTPException:
        # Re-lanzar excepciones de autenticación sin modificar
        raise
    except Exception as e:
        logger.error(f"Error inesperado al verificar token: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Error al validar credenciales",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extraer datos del token
    user_id_str: str = payload.get("sub")
    email: str = payload.get("email")
    
    if not user_id_str:
        logger.error("❌ Token sin claim 'sub'")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: falta el claim 'sub' (user ID)",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not email:
        logger.error(f"Token sin claim 'email' para user_id: {user_id_str}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: falta el claim 'email'",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Convertir sub a UUID
    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError as e:
        logger.error(f"❌ UUID inválido en token: {user_id_str} - {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: 'sub' no es un UUID válido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Buscar usuario en la base de datos
    try:
        result = await db.execute(select(User).where(User.user_id == user_id))
        user = result.scalar_one_or_none()
    except Exception as e:
        logger.error(f"❌ Error consultando usuario en BD: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al consultar información del usuario"
        )
    
    # JIT: Si el usuario no existe, crearlo automáticamente
    if user is None:
        logger.info(f"Usuario no encontrado en BD. Creando JIT: {email} (UUID: {user_id})")
        
        try:
            # Extraer nombre completo del token de Cognito
            # Cognito puede proveer 'name', 'given_name', 'family_name', etc.
            # Algunos proveedores OAuth (como Google) pueden enviar datos URL-encoded o JSON

            raw_name = payload.get("name")
            given_name = payload.get("given_name")
            family_name = payload.get("family_name")

            # Intentar decodificar si viene URL-encoded desde Google
            if isinstance(raw_name, str):
                try:
                    # Intentar decodificar URL-encoded
                    import urllib.parse
                    decoded_name = urllib.parse.unquote_plus(raw_name)

                    # Si es JSON, intentar parsearlo
                    if decoded_name.startswith('[') or decoded_name.startswith('{'):
                        import json
                        name_data = json.loads(decoded_name)

                        # Si es un array, tomar el primer elemento
                        if isinstance(name_data, list) and len(name_data) > 0:
                            name_data = name_data[0]

                        # Extraer displayName si existe
                        if isinstance(name_data, dict):
                            raw_name = name_data.get('displayName') or name_data.get('unstructuredName')
                            if not raw_name and name_data.get('givenName') and name_data.get('familyName'):
                                raw_name = f"{name_data['givenName']} {name_data['familyName']}"
                    else:
                        raw_name = decoded_name
                except (json.JSONDecodeError, ValueError, urllib.error.URLError):
                    # Si falla el parseo, usar el valor original
                    pass

            # Construir el nombre completo de forma segura
            if isinstance(raw_name, str) and raw_name.strip() and len(raw_name.strip()) <= 255:
                full_name = raw_name.strip()
            elif given_name and family_name:
                # Construir desde given_name y family_name
                full_name = f"{given_name} {family_name}".strip()[:255]
            elif given_name:
                full_name = str(given_name).strip()[:255]
            else:
                # Fallback: usar la parte local del email
                full_name = email.split("@")[0].replace('.', ' ').title()[:255]

            # Validar que no esté vacío
            if not full_name:
                full_name = email.split("@")[0].replace('.', ' ').title()[:255]

            logger.info(f"✅ Nombre procesado para JIT: '{full_name}' (email: {email})")
            
            # Crear nuevo usuario
            new_user = User(
                user_id=user_id,  # UUID de Cognito (claim 'sub')
                email=email.lower(),  # Normalizar email a minúsculas
                full_name=full_name,
                role=UserRoleEnum.USER,  # Rol por defecto para nuevos usuarios
                status=UserStatusEnum.ACTIVE,  # Usuarios OAuth están pre-verificados
            )
            
            db.add(new_user)
            
            # IMPORTANTE: Flush para asignar el ID y hacer commit explícito
            # Esto asegura que el usuario esté disponible en la misma transacción
            await db.flush()
            await db.commit()
            
            # Refresh para obtener valores generados por la BD (timestamps, etc)
            await db.refresh(new_user)
            
            logger.info(f"Usuario JIT creado exitosamente: {email} (user_id: {user_id})")
            user = new_user
            
        except IntegrityError as e:
            # Manejar race condition: el usuario fue creado por otra petición concurrente
            await db.rollback()
            logger.warning(
                f"IntegrityError al crear usuario JIT para {email}. "
                f"Probablemente el usuario fue creado concurrentemente. Reintentando consulta..."
            )
            
            # Reintentar la consulta del usuario
            try:
                result = await db.execute(select(User).where(User.user_id == user_id))
                user = result.scalar_one_or_none()
                
                if user:
                    logger.info(f"Usuario encontrado en segundo intento: {email}")
                else:
                    logger.error(f"Usuario no encontrado después de IntegrityError: {email}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Error creando usuario. Por favor intenta nuevamente."
                    )
            except Exception as retry_error:
                logger.error(f"Error en reintento de consulta: {str(retry_error)}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error al verificar usuario después de creación concurrente"
                )
                
        except SQLAlchemyError as e:
            await db.rollback()
            logger.error(f"Error de base de datos creando usuario JIT para {email}: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error de base de datos al crear usuario. Por favor intenta nuevamente."
            )
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error inesperado creando usuario JIT para {email}: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error creando usuario en la base de datos. Por favor intenta nuevamente."
            )
    
    # Verificar estado del usuario
    if user.status == UserStatusEnum.BLOCKED:
        logger.warning(f"Usuario bloqueado intentó acceder: {user.email} (user_id: {user.user_id})")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta ha sido bloqueada. Contacta al administrador."
        )
    
    if user.status == UserStatusEnum.PENDING:
        logger.warning(f"Usuario pendiente intentó acceder: {user.email} (user_id: {user.user_id})")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta está pendiente de activación."
        )
    
    logger.debug(f"Usuario autenticado exitosamente: {user.email} (user_id: {user.user_id}, role: {user.role})")
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user_with_jit)
) -> User:
    """
    Autor: Oscar Alonso Nava Rivera
    Dependencia que verifica que el usuario esté activo.
    
    Args:
        current_user: Usuario autenticado obtenido de get_current_user_with_jit.
        
    Returns:
        Usuario activo.
        
    Raises:
        HTTPException 403: Si el usuario no está activo.
        
    Note:
        Esta validación ya se hace en get_current_user_with_jit, por lo que esta
        dependencia es principalmente para claridad semántica en el código.
    """
    
    if current_user.status != UserStatusEnum.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    return current_user


async def require_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Dependencia que requiere que el usuario tenga rol ADMIN.
    
    Autor: Oscar Alonso Nava Rivera
    
    Args:
        current_user: Usuario autenticado y activo.
        
    Returns:
        Usuario administrador.
        
    Raises:
        HTTPException 403: Si el usuario no es administrador.
        
    Example:
        ```python
        @router.post("/categories", dependencies=[Depends(require_admin)])
        async def create_category(
            data: CategoryCreate,
            db: AsyncSession = Depends(get_async_db)
        ):
            # Solo admins pueden ejecutar este endpoint
            ...
        ```
    """
    
    if current_user.role != UserRoleEnum.ADMIN:
        logger.warning(
            f"Usuario {current_user.user_id} intentó acceder a endpoint de admin"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador para esta operación"
        )
    return current_user


def verify_resource_owner(resource_owner_id: uuid.UUID, current_user: User) -> None:
    """
    Autor: Oscar Alonso Nava Rivera
    Verifica que el usuario actual sea el propietario del recurso.
    
    Args:
        resource_owner_id: UUID del propietario del recurso.
        current_user: Usuario autenticado actual.
        
    Raises:
        HTTPException 403: Si el usuario no es el propietario ni admin.
        
    Example:
        ```python
        @router.delete("/addresses/{address_id}")
        async def delete_address(
            address_id: int,
            current_user: User = Depends(get_current_active_user),
            db: AsyncSession = Depends(get_async_db)
        ):
            result = await db.execute(
                select(Address).where(Address.address_id == address_id)
            )
            address = result.scalar_one_or_none()
            verify_resource_owner(address.user_id, current_user)
            await db.delete(address)
            await db.commit()
        ```
    """
    # Los administradores pueden acceder a cualquier recurso
    if current_user.role == UserRoleEnum.ADMIN:
        return
    
    # El usuario debe ser el propietario
    if current_user.user_id != resource_owner_id:
        logger.warning(
            f"Usuario {current_user.user_id} intentó acceder a recurso de "
            f"usuario {resource_owner_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para acceder a este recurso"
        )


# Alias para mantener compatibilidad con código existente
get_current_user = get_current_user_with_jit

# La dependencia get_async_db es un alias de get_async_session para mantener
# la consistencia con la guía de migración y la semántica de la capa de API.
__all__ = [
    "get_async_db",
    "get_settings",
    "get_current_user",
    "get_current_user_with_jit",
    "get_current_active_user",
    "require_admin",
    "verify_resource_owner",
]
