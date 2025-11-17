"""
Módulo de modelos de base de datos.

Expone todos los modelos SQLAlchemy para facilitar importaciones
y permitir que Alembic detecte automáticamente los modelos.

Autor: Oscar Alonso Nava Rivera
Fecha: 31/10/2025
Descripción: Exporta modelos y tipos usados por la aplicación.
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
from app.models.reports import Report, ReportType, ModerationStatus
from app.models.offer import Offer, OfferStatusEnum
from app.models.notification import Notification
from app.models.admin_action_logs import AdminActionLog
from app.models.plans import Plan, BillingCycle
from app.models.subscriptions import Subscription, SubscriptionStatus
from app.models.shipping_methods import ShippingMethod, ShippingTypeEnum
from app.models.listing_shipping_options import ListingShippingOption
from app.models.faq_items import FAQItem
from app.models.legal_documents import LegalDocument
from app.models.payment_enums import PaymentGatewayEnum, PaymentStatusEnum, PayoutStatusEnum
from app.models.payment_customer import PaymentCustomer
from app.models.payment_transaction import PaymentTransaction

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

    # Report
    "Report",
    "ReportType",
    "ModerationStatus",

    # Offer
    "Offer",
    "OfferStatusEnum",

    # Notification
    "Notification",
    # Admin action logs
    "AdminActionLog",
    # Plans / subscriptions
    "Plan",
    "BillingCycle",
    "Subscription",
    "SubscriptionStatus",
    # Shipping & listing options
    "ShippingMethod",
    "ShippingTypeEnum",
    "ListingShippingOption",
    # FAQ and legal
    "FAQItem",
    "LegalDocument",
    # Payment system
    "PaymentGatewayEnum",
    "PaymentStatusEnum",
    "PayoutStatusEnum",
    "PaymentCustomer",
    "PaymentTransaction",
]
