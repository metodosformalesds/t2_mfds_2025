"""
Schemas Pydantic para los modelos Order y OrderItem.

Define los contratos de entrada (request) y salida (response)
para las operaciones de checkout y listado de órdenes.
"""
import uuid
from decimal import Decimal
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, computed_field

from app.models.order import OrderStatusEnum

# --- Schemas de Soporte ---

class ListingBasic(BaseModel):
    """
    Schema básico para mostrar información del listing en un OrderItem.
    Evita cargar el modelo completo de Listing.
    """
    listing_id: int
    title: str
    seller_id: uuid.UUID = Field(..., description="ID del vendedor del producto")
    primary_image_url: Optional[str] = Field(
        None,
        description="URL de la imagen principal del listing"
    )
    
    @classmethod
    def from_listing(cls, listing):
        """Crea una instancia desde un modelo Listing con la imagen principal."""
        primary_image = listing.get_primary_image() if listing else None
        return cls(
            listing_id=listing.listing_id,
            title=listing.title,
            seller_id=listing.seller_id,
            primary_image_url=primary_image.image_url if primary_image else None
        )
    
    model_config = ConfigDict(from_attributes=True)


class BuyerBasic(BaseModel):
    """
    Schema básico para mostrar información del comprador en una orden.
    """
    user_id: uuid.UUID
    email: str
    full_name: Optional[str] = None
    
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
    
    @classmethod
    def from_order_item(cls, order_item):
        """Crea una instancia desde un modelo OrderItem con listing incluido."""
        listing_basic = ListingBasic.from_listing(order_item.listing) if order_item.listing else None
        return cls(
            order_item_id=order_item.order_item_id,
            quantity=order_item.quantity,
            price_at_purchase=order_item.price_at_purchase,
            listing=listing_basic
        )
    
    model_config = ConfigDict(from_attributes=True)


# --- Schemas de Order ---

class OrderRead(BaseModel):
    """
    Schema de respuesta para una orden (compra o venta).
    """
    order_id: int
    buyer_id: uuid.UUID = Field(..., description="ID del comprador")
    buyer: Optional[BuyerBasic] = Field(
        None,
        description="Información básica del comprador (disponible en ventas)"
    )
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
    
    @classmethod
    def from_order(cls, order):
        """Crea una instancia desde un modelo Order con order_items procesados."""
        order_items = [
            OrderItemRead.from_order_item(item) 
            for item in order.order_items
        ]
        
        # Incluir buyer si está cargado (para ventas)
        buyer_data = None
        if hasattr(order, 'buyer') and order.buyer:
            buyer_data = BuyerBasic.model_validate(order.buyer)
        
        return cls(
            order_id=order.order_id,
            buyer_id=order.buyer_id,
            buyer=buyer_data,
            created_at=order.created_at,
            subtotal=order.subtotal,
            commission_amount=order.commission_amount,
            total_amount=order.total_amount,
            order_status=order.order_status,
            payment_method=order.payment_method,
            payment_charge_id=order.payment_charge_id,
            order_items=order_items
        )
    
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
    
    shipping_address_id: Optional[int] = Field(
        None,
        description="ID de la dirección de envío"
    )
    
    shipping_method_id: Optional[int] = Field(
        None,
        description="ID del método de envío"
    )
    
    return_url: Optional[str] = Field(
        None,
        description="URL de retorno para métodos de pago que requieren redirección (3D Secure, OXXO, etc)"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "payment_token": "tok_1PbHi9P9qA9gV3T9aBcDEfG",
                "shipping_address_id": 1,
                "shipping_method_id": 1,
                "return_url": "https://waste-to-treasure.com/checkout/success"
            }
        }
    )