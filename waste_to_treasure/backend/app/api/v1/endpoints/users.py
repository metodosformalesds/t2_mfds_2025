"""
Endpoints para gestión de usuarios.

Este módulo maneja las operaciones relacionadas con usuarios:
- GET /users/me: Obtener perfil del usuario autenticado (con JIT creation)
- PATCH /users/me: Actualizar perfil del usuario autenticado
- GET /users/{user_id}: Obtener perfil público de un usuario (admin only)
- PATCH /users/{user_id}: Actualizar usuario (admin only)
"""

from uuid import UUID
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, get_async_session
from app.api.deps import get_current_active_user, require_admin
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate, UserAdminUpdate, UserPublic
from sqlalchemy import select


router = APIRouter()


# ==========================================
# ENDPOINTS PÚBLICOS (AUTENTICADOS)
# ==========================================

@router.get(
    "/me",
    response_model=UserRead,
    summary="Obtener perfil propio",
    description="""
    Obtiene el perfil del usuario autenticado.
    
    **JIT User Creation:**
    - Si es la primera vez que el usuario accede con un token válido de Cognito,
      se crea automáticamente en la base de datos.
    - El `user_id` proviene del claim `sub` del JWT de Cognito.
    - Los datos iniciales (email, nombre) provienen de los claims del token.
    
    **Uso:**
    ```bash
    curl -X GET http://localhost:8000/api/v1/users/me \\
      -H "Authorization: Bearer YOUR_COGNITO_ID_TOKEN"
    ```
    """,
    responses={
        200: {
            "description": "Perfil del usuario",
            "content": {
                "application/json": {
                    "example": {
                        "user_id": "550e8400-e29b-41d4-a716-446655440000",
                        "email": "usuario@example.com",
                        "full_name": "Juan Pérez",
                        "role": "USER",
                        "status": "ACTIVE",
                        "created_at": "2025-11-06T10:30:00Z",
                        "updated_at": "2025-11-06T10:30:00Z"
                    }
                }
            }
        },
        401: {"description": "No autenticado (token inválido o expirado)"},
        403: {"description": "Usuario bloqueado"}
    }
)
async def get_current_user_profile(
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> UserRead:
    """
    Retorna el perfil del usuario autenticado.
    
    La dependency `get_current_active_user` ya maneja:
    - Validación del token JWT de Cognito
    - JIT user creation si es la primera vez
    - Verificación de que el usuario esté activo (no bloqueado)
    """
    return UserRead.model_validate(current_user)


@router.patch(
    "/me",
    response_model=UserRead,
    summary="Actualizar perfil propio",
    description="""
    Actualiza el perfil del usuario autenticado.
    
    **Campos editables:**
    - `full_name`: Nombre completo del usuario
    
    **Campos NO editables:**
    - `email`: Gestionado por Cognito
    - `user_id`: Inmutable
    - `role`: Solo admins pueden cambiar
    - `status`: Solo admins pueden cambiar
    """,
    responses={
        200: {"description": "Perfil actualizado exitosamente"},
        401: {"description": "No autenticado"},
        403: {"description": "Usuario bloqueado"},
        422: {"description": "Datos de entrada inválidos"}
    }
)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_async_session)]
) -> UserRead:
    """
    Actualiza el perfil del usuario autenticado.
    
    Args:
        user_update: Datos a actualizar
        current_user: Usuario autenticado (inyectado por dependency)
        db: Sesión de base de datos
    
    Returns:
        UserRead: Perfil actualizado
    """
    # Actualizar solo los campos proporcionados (exclude_unset=True)
    update_data = user_update.model_dump(exclude_unset=True)
    
    if not update_data:
        # No hay nada que actualizar, retornar usuario actual
        return UserRead.model_validate(current_user)
    
    # Aplicar actualizaciones
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    # Guardar cambios (NO necesitamos db.add - el objeto ya está en la sesión)
    await db.commit()
    await db.refresh(current_user)
    
    return UserRead.model_validate(current_user)


# ==========================================
# ENDPOINTS PÚBLICOS (SIN AUTENTICACIÓN)
# ==========================================

@router.get(
    "/{user_id}/public",
    response_model=UserPublic,
    summary="Obtener perfil público de usuario",
    description="""
    Obtiene información pública de un usuario/vendedor por su UUID.

    **Acceso:** Público (no requiere autenticación)

    **Uso:**
    - Mostrar perfiles públicos de vendedores
    - Ver información de sellers en listings
    """,
    responses={
        200: {"description": "Usuario encontrado"},
        404: {"description": "Usuario no encontrado"}
    }
)
async def get_user_public_profile(
    user_id: UUID,
    db: Annotated[AsyncSession, Depends(get_async_session)]
) -> UserPublic:
    """
    Obtiene información pública de un usuario por su UUID.

    Args:
        user_id: UUID del usuario a buscar
        db: Sesión de base de datos

    Returns:
        UserPublic: Información pública del usuario

    Raises:
        HTTPException: 404 si el usuario no existe
    """
    result = await db.execute(
        select(User).where(User.user_id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario con ID {user_id} no encontrado"
        )

    return UserPublic.model_validate(user)


# ==========================================
# ENDPOINTS DE ADMINISTRACIÓN
# ==========================================

@router.get(
    "/{user_id}",
    response_model=UserPublic,
    summary="Obtener usuario por ID (Admin)",
    description="""
    Obtiene información pública de un usuario por su UUID.

    **Requiere:** Rol ADMIN

    **Uso:**
    - Ver perfiles de usuarios
    - Búsqueda de vendedores/compradores
    - Moderación
    """,
    responses={
        200: {"description": "Usuario encontrado"},
        401: {"description": "No autenticado"},
        403: {"description": "Requiere rol ADMIN"},
        404: {"description": "Usuario no encontrado"}
    },
    dependencies=[Depends(require_admin)]
)
async def get_user_by_id(
    user_id: UUID,
    db: Annotated[AsyncSession, Depends(get_async_session)]
) -> UserPublic:
    """
    Obtiene un usuario por su UUID.
    
    Args:
        user_id: UUID del usuario a buscar
        db: Sesión de base de datos
    
    Returns:
        UserPublic: Información pública del usuario
    
    Raises:
        HTTPException: 404 si el usuario no existe
    """
    result = await db.execute(
        select(User).where(User.user_id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario con ID {user_id} no encontrado"
        )
    
    return UserPublic.model_validate(user)


@router.patch(
    "/{user_id}",
    response_model=UserRead,
    summary="Actualizar usuario (Admin)",
    description="""
    Actualiza un usuario (solo administradores).
    
    **Requiere:** Rol ADMIN
    
    **Campos editables por admin:**
    - Todos los campos de usuario normal (first_name, last_name, phone_number)
    - `role`: Cambiar rol del usuario
    - `status`: Activar/bloquear usuario
    
    **Casos de uso:**
    - Cambiar rol de BUYER a SELLER
    - Bloquear usuarios infractores
    - Corregir datos de usuarios
    """,
    responses={
        200: {"description": "Usuario actualizado exitosamente"},
        401: {"description": "No autenticado"},
        403: {"description": "Requiere rol ADMIN"},
        404: {"description": "Usuario no encontrado"},
        422: {"description": "Datos de entrada inválidos"}
    },
    dependencies=[Depends(require_admin)]
)
async def update_user_by_admin(
    user_id: UUID,
    user_update: UserAdminUpdate,
    db: Annotated[AsyncSession, Depends(get_async_session)]
) -> UserRead:
    """
    Actualiza un usuario (operación administrativa).
    
    Args:
        user_id: UUID del usuario a actualizar
        user_update: Datos a actualizar
        db: Sesión de base de datos
    
    Returns:
        UserRead: Usuario actualizado
    
    Raises:
        HTTPException: 404 si el usuario no existe
    """
    result = await db.execute(
        select(User).where(User.user_id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario con ID {user_id} no encontrado"
        )
    
    # Actualizar solo los campos proporcionados
    update_data = user_update.model_dump(exclude_unset=True)
    
    if not update_data:
        # No hay nada que actualizar
        return UserRead.model_validate(user)
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    # NO necesitamos db.add - el objeto ya está en la sesión
    await db.commit()
    await db.refresh(user)
    
    return UserRead.model_validate(user)
