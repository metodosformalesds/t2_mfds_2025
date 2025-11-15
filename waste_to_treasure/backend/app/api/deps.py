"""
Módulo para gestionar las dependencias de la API de FastAPI.

Este es el lugar central para definir las dependencias que se utilizarán
en los endpoints de la aplicación, como la obtención de la configuración,
la sesión de la base de datos, o la validación del usuario actual.

Incluye implementación de Just-In-Time (JIT) User Creation para AWS Cognito.
"""

import logging
import uuid
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

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
    Dependencia principal de autenticación con Just-In-Time (JIT) User Creation.
    
    Valida el token JWT de AWS Cognito y:
    1. Si el usuario existe en la BD → lo retorna
    2. Si el usuario NO existe → lo crea automáticamente (JIT)
    
    Este flujo permite que usuarios registrados en Cognito accedan
    automáticamente sin necesidad de un endpoint de registro separado.
    
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
        - Usuarios nuevos se crean con role=BUYER y status=ACTIVE
    """
    token = credentials.credentials
    
    # Verificar el token de Cognito
    payload = verify_cognito_token(token)
    
    # Extraer datos del token
    user_id_str: str = payload.get("sub")
    email: str = payload.get("email")
    
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: falta el claim 'sub' (user ID)",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: falta el claim 'email'",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Convertir sub a UUID
    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: 'sub' no es un UUID válido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Buscar usuario en la base de datos
    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    
    # JIT: Si el usuario no existe, crearlo automáticamente
    if user is None:
        logger.info(f"Usuario no encontrado en BD. Creando JIT: {email} (UUID: {user_id})")
        
        try:
            # Extraer nombre completo del token de Cognito
            # Cognito usa 'name' como atributo para nombre completo
            full_name = payload.get("name", "")
            
            # Si no hay nombre, usar parte local del email como fallback
            if not full_name:
                full_name = email.split("@")[0]
            
            # Crear nuevo usuario
            new_user = User(
                user_id=user_id,  # UUID de Cognito (claim 'sub')
                email=email,
                full_name=full_name,
                role=UserRoleEnum.USER,  # Rol por defecto
                status=UserStatusEnum.ACTIVE,  # Activo inmediatamente
            )
            
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            
            logger.info(f"Usuario creado exitosamente (JIT): {email}")
            user = new_user
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error creando usuario JIT: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error creando usuario en la base de datos"
            )
    
    # Verificar estado del usuario
    if user.status == UserStatusEnum.BLOCKED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario bloqueado. Contacte al administrador."
        )
    
    if user.status == UserStatusEnum.PENDING:
        # Esto no debería pasar con Cognito, pero por seguridad
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario pendiente de activación."
        )
    
    logger.debug(f"Usuario autenticado: {user.email} (UUID: {user.user_id})")
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user_with_jit)
) -> User:
    """
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
