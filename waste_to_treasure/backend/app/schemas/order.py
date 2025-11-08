"""
Schemas Pydantic para los modelos Order y OrderItem.

Define los contratos de entrada (request) y salida (response)
para las operaciones de checkout y listado de órdenes.
"""
import uuid
from decimal import Decimal
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

from app.models.order import OrderStatusEnum

# --- Schemas de Soporte ---

class ListingBasic(BaseModel):
    """
    Schema básico para mostrar información del listing en un OrderItem.
    Evita cargar el modelo completo de Listing.
    """
    listing_id: int
    title: str
    
    model_config = ConfigDict(from_attributes=True)


# --- Schemas de OrderItem ---

class OrderItemRead(BaseModel):
    """
    Schema para leer un ítem de una orden (histórico).
    """
    order_item_id: int
    quantity: int
    price_at_purchase: Decimal = Field(
        ...,
        description="Precio unitario del ítem al momento de la compra"
    )
    listing: Optional[ListingBasic] = Field(
        None,
        description="Información básica del listing (puede ser nulo si el listing fue eliminado)"
    )
    
    model_config = ConfigDict(from_attributes=True)


# --- Schemas de Order ---

class OrderRead(BaseModel):
    """
    Schema de respuesta para una orden (compra o venta).
    """
    order_id: int
    buyer_id: uuid.UUID = Field(..., description="ID del comprador")
    created_at: datetime
    
    # Detalles financieros
    subtotal: Decimal
    commission_amount: Decimal
    total_amount: Decimal
    
    # Estado y pago
    order_status: OrderStatusEnum
    payment_method: Optional[str] = None
    payment_charge_id: Optional[str] = Field(
        None, 
        description="ID de la transacción en la pasarela de pago (Stripe)"
    )
    
    # Items
    order_items: List[OrderItemRead] = []
    
    model_config = ConfigDict(from_attributes=True)


class OrderList(BaseModel):
    """
    Schema para respuestas paginadas de listas de órdenes.
    """
    items: List[OrderRead]
    total: int = Field(..., ge=0, description="Total de órdenes encontradas")
    page: int = Field(..., ge=1, description="Página actual")
    page_size: int = Field(..., ge=1, description="Items por página")


# --- Schemas de Checkout (Request) ---

class CheckoutCreate(BaseModel):
    """
    Schema para el body del request POST /checkout.
    El cliente debe proveer un token de pago (ej. de Stripe).
    """
    payment_token: str = Field(
        ...,
        description="Token de pago generado por el cliente (ej: Stripe, PayPal)",
        examples=["tok_1PbHi9P9qA9gV3T9aBcDEfG"]
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "payment_token": "tok_1PbHi9P9qA9gV3T9aBcDEfG"
            }
        }
    )