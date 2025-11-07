"""
Esquemas de Pydantic para el modelo Address.

Define los contratos de entrada y salida para las operaciones CRUD 
sobre las direcciones físicas de los usuarios (Address Book).
"""
from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict, field_validator

class AddressBase(BaseModel):
    """
    Esquema base con campos comunes para Address

    contiene los campos que se usan tanto en creación como actualización.
    """
    street: str = Field(
        ...,
        min_length=5,
        max_length=255,
        description="Calle y número",
        examples=["Av. Tecnológico 1340"]
    )
    city: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Ciudad o municipio",
        examples=["Ciudad Juárez", "Chihuahua"]
    )
    state: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Estado, provincia o región",
        examples=["Chihuahua", "Jalisco", "CDMX"]
    )
    postal_code: str = Field(
        ...,
        min_length=4,
        max_length=20,
        description="Código postal",
        examples=["32500", "44100"]
    )
    country: str = Field(
        default="MX",
        min_length=2,
        max_length=2,
        description="Código de país ISO 3166-1 alpha-2",
        examples=["MX", "US", "CA"]
    )
    notes: Optional[str] = Field(
        None,
        max_length=500,
        description="Referencias adicionales o indicaciones de ubicación",
        examples=["Edificio azul, segundo piso", "Casa con portón verde"]
    )
    is_default: bool = Field(
        default=False,
        description="Indica si es la dirección predeterminada del usuario"
    )

    @field_validator("country")
    @classmethod
    def validate_country_code(cls, v: str) -> str:
        """Valida que el código de país esté en mayúsculas."""
        if not v.isupper():
            raise ValueError("El código de país debe estar en mayúsculas (ej: MX, US)")
        return v
    
class AddressCreate(AddressBase):
    """
    Esquema para crear una nueva dirección.
    
    Usado en: POST /api/v1/addresses
    Requiere: Usuario autenticado
    
    Note:
        - user_id se toma automáticamente del current_user
        - Si is_default=True, se desmarca la anterior dirección default
    """
    pass


class AddressUpdate(BaseModel):
    """
    Esquema para actualizar una dirección existente.
    
    Todos los campos son opcionales para permitir actualizaciones parciales.
    
    Usado en: PATCH /api/v1/addresses/{address_id}
    Requiere: Usuario autenticado y ser el owner
    """
    street: Optional[str] = Field(
        None,
        min_length=5,
        max_length=255,
        description="Calle y número"
    )
    city: Optional[str] = Field(
        None,
        min_length=2,
        max_length=100,
        description="Ciudad o municipio"
    )
    state: Optional[str] = Field(
        None,
        min_length=2,
        max_length=100,
        description="Estado, provincia o región"
    )
    postal_code: Optional[str] = Field(
        None,
        min_length=4,
        max_length=20,
        description="Código postal"
    )
    country: Optional[str] = Field(
        None,
        min_length=2,
        max_length=2,
        description="Código de país ISO 3166-1 alpha-2"
    )
    notes: Optional[str] = Field(
        None,
        max_length=500,
        description="Referencias adicionales"
    )
    is_default: Optional[bool] = Field(
        None,
        description="Marcar como dirección predeterminada"
    )

    @field_validator("country")
    @classmethod
    def validate_country_code(cls, v: Optional[str]) -> Optional[str]:
        """Valida que el código de país esté en mayúsculas."""
        if v is not None and not v.isupper():
            raise ValueError("El código de país debe estar en mayúsculas (ej: MX, US)")
        return v


class AddressInDB(AddressBase):
    """
    Esquema que representa cómo se almacena Address en la base de datos.
    
    Incluye campos autogenerados como ID, user_id y timestamps.
    """
    address_id: int = Field(..., description="Identificador único")
    user_id: Optional[UUID] = Field(
        None, 
        description="UUID del usuario propietario (NULL para direcciones de listings sin usuario)"
    )
    created_at: datetime = Field(..., description="Fecha de creación")
    updated_at: datetime = Field(..., description="Última actualización")
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )


class AddressRead(AddressInDB):
    """
    Esquema de respuesta simple para Address (sin relaciones).
    
    Este esquema se usa para operaciones que NO necesitan cargar
    la relación con User, evitando problemas de lazy loading async.
    
    Usado en: POST, GET, PATCH, DELETE responses
    """
    pass


class AddressList(BaseModel):
    """
    Esquema de respuesta paginada para listar direcciones.
    
    Usado en: GET /api/v1/addresses
    """
    items: list[AddressRead] = Field(..., description="Lista de direcciones")
    total: int = Field(..., ge=0, description="Total de direcciones del usuario")
    page: int = Field(..., ge=1, description="Página actual")
    page_size: int = Field(..., ge=1, le=100, description="Items por página")
    
    model_config = ConfigDict(from_attributes=True)


# Opcional: Si algún endpoint necesita devolver Address con User cargado
class UserBasic(BaseModel):
    """Esquema simplificado de User para relaciones."""
    user_id: UUID = Field(..., description="UUID del usuario")
    email: str = Field(..., description="Email del usuario")
    first_name: str = Field(..., description="Nombre del usuario")
    last_name: str = Field(..., description="Apellido del usuario")
    
    model_config = ConfigDict(from_attributes=True)


class AddressWithUser(AddressInDB):
    """
    Esquema extendido que incluye información básica del usuario.
    
    Usado en: Endpoints que requieren eager loading de la relación User.
    
    Note:
        Si usas este schema, asegúrate de hacer eager loading:
        ```python
        stmt = select(Address).options(selectinload(Address.user))
        ```
    """
    user: Optional[UserBasic] = Field(
        None,
        description="Información básica del usuario propietario"
    )