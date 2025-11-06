"""
Módulo de seguridad y autenticación.

Proporciona funciones y dependencias para autenticación JWT,
verificación de roles y autorización de recursos.
"""
import logging
from typing import Optional
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_async_session
from app.models.user import User, UserRoleEnum, UserStatusEnum
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Esquema de seguridad HTTP Bearer
security = HTTPBearer()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un token JWT de acceso.
    
    Args:
        data: Datos a codificar en el token (ej: {"sub": user_id}).
        expires_delta: Tiempo de expiración personalizado.
        
    Returns:
        Token JWT codificado.
        
    Note:
        En producción, este token será generado por Amazon Cognito.
        Esta implementación es un fallback para desarrollo local.
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt


def decode_token(token: str) -> dict:
    """
    Decodifica y valida un token JWT.
    
    Args:
        token: Token JWT a decodificar.
        
    Returns:
        Payload del token decodificado.
        
    Raises:
        HTTPException: Si el token es inválido o ha expirado.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError as e:
        logger.warning(f"Error decodificando token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudo validar las credenciales",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_async_session)
) -> User:
    """
    Dependencia de FastAPI que extrae el usuario actual del token JWT.
    
    Args:
        credentials: Credenciales HTTP Bearer del header Authorization.
        db: Sesión de base de datos asíncrona.
        
    Returns:
        Usuario autenticado.
        
    Raises:
        HTTPException 401: Si el token es inválido o el usuario no existe.
        HTTPException 403: Si el usuario está bloqueado.
        
    Example:
        ```python
        @router.get("/me")
        def get_me(current_user: User = Depends(get_current_user)):
            return current_user
        ```
    """
    token = credentials.credentials
    payload = decode_token(token)
    
    # Extraer el user_id del token
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: falta el subject",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Buscar usuario en la base de datos
    try:
        user_id_int = int(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: user_id no es un entero válido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    result = await db.execute(select(User).where(User.user_id == user_id_int))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar que el usuario esté activo
    if user.status == UserStatusEnum.BLOCKED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario bloqueado. Contacte al administrador."
        )
    
    if user.status == UserStatusEnum.PENDING:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario pendiente de activación. Verifique su email."
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependencia que verifica que el usuario esté activo.
    
    Args:
        current_user: Usuario autenticado obtenido de get_current_user.
        
    Returns:
        Usuario activo.
        
    Raises:
        HTTPException 403: Si el usuario no está activo.
        
    Note:
        Esta validación ya se hace en get_current_user, por lo que esta
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
        def create_category(data: CategoryCreate, db: AsyncSession = Depends(get_async_session)):
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


def verify_resource_owner(resource_owner_id: int, current_user: User) -> None:
    """
    Verifica que el usuario actual sea el propietario del recurso.
    
    Args:
        resource_owner_id: ID del propietario del recurso.
        current_user: Usuario autenticado actual.
        
    Raises:
        HTTPException 403: Si el usuario no es el propietario ni admin.
        
    Example:
        ```python
        @router.delete("/addresses/{address_id}")
        def delete_address(
            address_id: int,
            current_user: User = Depends(get_current_active_user),
            db: AsyncSession = Depends(get_async_session)
        ):
            address = db.query(Address).filter_by(address_id=address_id).first()
            verify_resource_owner(address.user_id, current_user)
            db.delete(address)
            db.commit()
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