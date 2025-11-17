# Autor: Arturo Perez Gonzalez
# Fecha: 07/11/2024
# Descripción: Schemas Pydantic para validación de datos del carrito de compras.
#              Define modelos para requests y responses de la API incluyendo
#              items del carrito, cálculos de totales y resúmenes.

"""
Schemas Pydantic para Cart y CartItem.

Define los modelos de validación para requests y responses de la API.
"""
from typing import Optional
from decimal import Decimal
from datetime import datetime
import uuid

from pydantic import BaseModel, Field, field_validator, ConfigDict


# SCHEMAS PARA CART ITEM
class CartItemBase(BaseModel):
    """Schema base para items del carrito."""
    
    listing_id: int = Field(..., gt=0, description="ID del listing a agregar")
    quantity: int = Field(..., gt=0, description="Cantidad de unidades")


class CartItemCreate(CartItemBase):
    """Schema para agregar un item al carrito."""
    pass


class CartItemUpdate(BaseModel):
    """Schema para actualizar la cantidad de un item."""
    
    quantity: int = Field(..., gt=0, description="Nueva cantidad")


class CartItemRead(CartItemBase):
    """Schema de respuesta para un item del carrito."""
    
    cart_item_id: int
    cart_id: int
    created_at: datetime
    updated_at: datetime
    
    # Datos del listing (nested)
    listing_title: Optional[str] = None
    listing_price: Optional[Decimal] = None
    listing_price_unit: Optional[str] = None
    listing_image_url: Optional[str] = None
    listing_available_quantity: Optional[int] = None
    listing_is_available: bool = False
    
    # Cálculos
    item_subtotal: Decimal = Decimal("0.00")

    model_config = ConfigDict(from_attributes=True)


# SCHEMAS PARA CART
class CartRead(BaseModel):
    """Schema de respuesta completo para el carrito."""
    
    cart_id: int
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    # Items del carrito
    items: list[CartItemRead] = []
    
    # Totales calculados
    total_items: int = 0
    subtotal: Decimal = Decimal("0.00")
    estimated_commission: Decimal = Decimal("0.00")
    estimated_total: Decimal = Decimal("0.00")
    has_unavailable_items: bool = False

    model_config = ConfigDict(from_attributes=True)


class CartSummary(BaseModel):
    """Schema con resumen simplificado del carrito."""
    
    cart_id: int
    total_items: int
    subtotal: Decimal
    items_count: int = Field(..., description="Número de líneas en el carrito")

    model_config = ConfigDict(from_attributes=True)