"""
Schemas Pydantic para Offer.

Define los modelos de validación para requests y responses de ofertas B2B.
"""
from typing import Optional
from decimal import Decimal
from datetime import datetime

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.offer import OfferStatusEnum


# SCHEMAS BASE
class OfferBase(BaseModel):
    """Schema base con campos comunes de Offer."""

    listing_id: int = Field(..., gt=0, description="ID del material")
    offer_price: Decimal = Field(..., gt=0, decimal_places=2, description="Precio unitario ofertado")
    quantity: int = Field(..., gt=0, description="Cantidad solicitada")
    expires_at: Optional[datetime] = Field(None, description="Fecha de expiración")

    @field_validator('expires_at')
    @classmethod
    def validate_expires_at(cls, v):
        """Valida que la fecha de expiración sea futura."""
        if v is not None:
            from datetime import timezone
            now = datetime.now(timezone.utc)
            if v <= now:
                raise ValueError('La fecha de expiración debe ser futura')
        return v


# SCHEMAS PARA REQUESTS
class OfferCreate(OfferBase):
    """Schema para crear una nueva oferta."""

    message: Optional[str] = Field(None, max_length=500, description="Mensaje opcional al vendedor")


class OfferUpdateStatus(BaseModel):
    """Schema para actualizar el estado de una oferta (vendedor)."""

    action: str = Field(..., description="Acción: 'accept', 'reject', o 'counter'")
    counter_offer_price: Optional[Decimal] = Field(None, gt=0, decimal_places=2, description="Precio de contraoferta")
    rejection_reason: Optional[str] = Field(None, min_length=10, max_length=500, description="Motivo del rechazo")

    @field_validator('action')
    @classmethod
    def validate_action(cls, v):
        """Valida que la acción sea válida."""
        allowed = ['accept', 'reject', 'counter']
        if v not in allowed:
            raise ValueError(f"Acción debe ser una de: {', '.join(allowed)}")
        return v

    @model_validator(mode='after')
    def validate_action_requirements(self):
        """Valida que se proporcionen los campos requeridos según la acción."""
        if self.action == 'counter' and self.counter_offer_price is None:
            raise ValueError('Se requiere counter_offer_price para contraofertar')

        if self.action == 'reject' and not self.rejection_reason:
            raise ValueError('Se requiere rejection_reason para rechazar')

        return self


# SCHEMAS PARA RESPONSES
class OfferRead(OfferBase):
    """Schema de respuesta completo para una oferta."""
    
    offer_id: int
    buyer_id: int
    seller_id: int
    status: OfferStatusEnum
    counter_offer_price: Optional[Decimal]
    rejection_reason: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    # Campos calculados
    current_price: Decimal
    total_amount: Decimal
    is_expired: bool
    
    # Información del listing (nested opcional)
    listing_title: Optional[str] = None
    listing_original_price: Optional[Decimal] = None
    
    class Config:
        from_attributes = True


class OfferCardRead(BaseModel):
    """Schema simplificado para tarjetas de ofertas."""
    
    offer_id: int
    listing_id: int
    listing_title: str
    offer_price: Decimal
    counter_offer_price: Optional[Decimal]
    quantity: int
    status: OfferStatusEnum
    created_at: datetime
    expires_at: Optional[datetime]
    
    # Información contextual según el usuario
    other_party_name: Optional[str] = None  # Nombre del comprador o vendedor
    
    class Config:
        from_attributes = True


class OfferListResponse(BaseModel):
    """Schema de respuesta para listado paginado de ofertas."""
    
    total: int = Field(..., description="Total de resultados")
    page: int = Field(..., description="Página actual")
    page_size: int = Field(..., description="Tamaño de página")
    items: list[OfferCardRead] = Field(..., description="Lista de ofertas")