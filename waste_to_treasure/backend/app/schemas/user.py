"""
Schemas Pydantic para el modelo User.

Estos schemas definen la estructura de datos para operaciones con usuarios,
validando datos de entrada y serializando respuestas de la API.
"""

from typing import Optional
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, ConfigDict

from app.models.user import UserRoleEnum, UserStatusEnum


# ==========================================
# SCHEMAS DE LECTURA (Response)
# ==========================================

class UserRead(BaseModel):
    """
    Schema para lectura de datos de usuario.
    
    Se usa en respuestas de la API para mostrar información de usuarios.
    NO incluye datos sensibles como hashed_password.
    
    Example:
        ```json
        {
            "user_id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "usuario@example.com",
            "first_name": "Juan",
            "last_name": "Pérez",
            "role": "BUYER",
            "status": "ACTIVE",
            "phone_number": "+52 55 1234 5678",
            "created_at": "2025-11-06T10:30:00Z"
        }
        ```
    """
    user_id: UUID = Field(
        ..., 
        description="UUID del usuario (proviene de Cognito 'sub' claim)"
    )
    email: EmailStr = Field(
        ..., 
        description="Email del usuario (único)"
    )
    first_name: str = Field(
        ..., 
        max_length=100, 
        description="Nombre del usuario"
    )
    last_name: str = Field(
        ..., 
        max_length=100, 
        description="Apellido del usuario"
    )
    role: UserRoleEnum = Field(
        ..., 
        description="Rol del usuario (BUYER, SELLER, ADMIN)"
    )
    status: UserStatusEnum = Field(
        ..., 
        description="Estado del usuario (ACTIVE, BLOCKED, PENDING)"
    )
    phone_number: Optional[str] = Field(
        None, 
        max_length=20, 
        description="Número de teléfono (opcional)"
    )
    created_at: datetime = Field(
        ..., 
        description="Fecha de creación del usuario"
    )
    updated_at: datetime = Field(
        ..., 
        description="Última actualización del usuario"
    )
    
    model_config = ConfigDict(from_attributes=True)


class UserPublic(BaseModel):
    """
    Schema para información pública de usuario.
    
    Información mínima que se muestra en listados o perfiles públicos.
    Útil para mostrar vendedores, compradores en reviews, etc.
    
    Example:
        ```json
        {
            "user_id": "550e8400-e29b-41d4-a716-446655440000",
            "first_name": "Juan",
            "last_name": "Pérez",
            "role": "SELLER"
        }
        ```
    """
    user_id: UUID
    first_name: str
    last_name: str
    role: UserRoleEnum
    
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# SCHEMAS DE ESCRITURA (Request)
# ==========================================

class UserUpdate(BaseModel):
    """
    Schema para actualizar datos del usuario.
    
    Permite actualizar SOLO campos editables.
    El email y user_id NO se pueden cambiar (gestionados por Cognito).
    
    Example:
        ```json
        {
            "first_name": "Juan Carlos",
            "last_name": "Pérez López",
            "phone_number": "+52 55 9876 5432"
        }
        ```
    """
    first_name: Optional[str] = Field(
        None, 
        max_length=100, 
        description="Nombre del usuario"
    )
    last_name: Optional[str] = Field(
        None, 
        max_length=100, 
        description="Apellido del usuario"
    )
    phone_number: Optional[str] = Field(
        None, 
        max_length=20, 
        description="Número de teléfono"
    )
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "first_name": "Juan Carlos",
                "last_name": "Pérez López",
                "phone_number": "+52 55 1234 5678"
            }
        }
    )


class UserAdminUpdate(BaseModel):
    """
    Schema para que administradores actualicen usuarios.
    
    Permite modificar campos adicionales que solo admins pueden cambiar:
    - role: Cambiar rol (BUYER ↔ SELLER ↔ ADMIN)
    - status: Activar/bloquear usuarios
    
    Example:
        ```json
        {
            "role": "SELLER",
            "status": "ACTIVE"
        }
        ```
    """
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone_number: Optional[str] = Field(None, max_length=20)
    role: Optional[UserRoleEnum] = Field(
        None, 
        description="Rol del usuario (solo admins pueden cambiar)"
    )
    status: Optional[UserStatusEnum] = Field(
        None, 
        description="Estado del usuario (solo admins pueden cambiar)"
    )
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "role": "SELLER",
                "status": "ACTIVE"
            }
        }
    )


# ==========================================
# NOTA: UserCreate NO EXISTE
# ==========================================
# Con AWS Cognito, el registro de usuarios se hace directamente en Cognito
# a través del frontend (AWS Amplify, Cognito SDK, etc.).
# 
# El backend NO tiene endpoint de registro (/register).
# Los usuarios se crean automáticamente en la BD mediante JIT (Just-In-Time)
# cuando acceden por primera vez con un token válido de Cognito.
# 
# Ver: app/api/deps.py → get_current_user_with_jit()
# ==========================================
