"""
Módulo de modelos de base de datos.

Expone todos los modelos SQLAlchemy para facilitar importaciones
y permitir que Alembic detecte automáticamente los modelos.
"""
from app.models.base import Base, BaseModel, TimestampMixin
from app.models.category import Category, ListingTypeEnum
from app.models.user import User, UserRoleEnum, UserStatusEnum
from app.models.order import Order, OrderStatusEnum
from app.models.listing import Listing, ListingStatusEnum
from app.models.listing_image import ListingImage
from app.models.order_item import OrderItem
from app.models.reviews import Review
from app.models.address import Address
from app.models.cart import Cart, CartItem

__all__ = [
# Base classes
    "Base",
    "BaseModel",
    "TimestampMixin",
    
    # Category
    "Category",
    "ListingTypeEnum",
    
    # User
    "User",
    "UserRoleEnum",
    "UserStatusEnum",
    
    # Order
    "Order",
    "OrderStatusEnum",
    "OrderItem",
    
    # Listing
    "Listing",
    "ListingStatusEnum",
    "ListingImage",
    
    # Review
    "Review",
    
    # Address
    "Address",
    
    # Cart
    "Cart",
    "CartItem",
]
