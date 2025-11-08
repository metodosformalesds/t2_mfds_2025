"""
Schemas Pydantic para el modelo ShippingMethod.
"""
import uuid
from decimal import Decimal
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

from app.models.shipping_methods import ShippingTypeEnum

class ShippingMethodBase(BaseModel):
    """
    Schema base con campos comunes para ShippingMethod.
    """
    name: str = Field(
        ...,
        min_length=3,
        max_length=100,
        description="Nombre descriptivo del método de envío",
        examples=["Envío Estándar a Domicilio", "Recojo en Tienda"]
    )
    cost: Decimal = Field(
        ...,
        ge=0,
        decimal_places=2,
        description="Costo del método de envío (0.00 para 'gratis' o 'recojo')",
        examples=[150.00, 0.00]
    )
    type: ShippingTypeEnum = Field(
        ...,
        description="Tipo de envío: 'delivery' (a domicilio) o 'pickup' (recojo)",
        examples=["delivery", "pickup"]
    )

class ShippingMethodCreate(ShippingMethodBase):
    """
    Schema para crear un nuevo método de envío.
    Usado en: POST /me/shipping_methods
    """
    pass

class ShippingMethodUpdate(BaseModel):
    """
    Schema para actualizar un método de envío (parcial).
    Usado en: PATCH /me/shipping_methods/{method_id}
    """
    name: Optional[str] = Field(
        None,
        min_length=3,
        max_length=100,
        description="Nuevo nombre descriptivo"
    )
    cost: Optional[Decimal] = Field(
        None,
        ge=0,
        decimal_places=2,
        description="Nuevo costo del método"
    )
    type: Optional[ShippingTypeEnum] = Field(
        None,
        description="Nuevo tipo de envío"
    )

class ShippingMethodRead(ShippingMethodBase):
    """
    Schema de respuesta para un método de envío.
    """
    method_id: int
    seller_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- (MEJORA AÑADIDA) ---
# Schemas para la asociación de Métodos de Envío con Publicaciones (Listings)
# Esto completa la funcionalidad del Módulo 9.

class ListingShippingOptionCreate(BaseModel):
    """
    Schema para asociar un método de envío a una publicación.
    Usado en: POST /me/listings/{listing_id}/shipping_methods
    """
    method_id: int = Field(..., 
                           description="ID del método de envío (propio del vendedor) a asociar")
    
    model_config = ConfigDict(
        json_schema_extra={"example": {"method_id": 1}}
    )

class ListingShippingOptionRead(BaseModel):
    """
    Schema de respuesta para una asociación Listing-ShippingMethod.
    """
    listing_id: int
    method_id: int

    model_config = ConfigDict(from_attributes=True)