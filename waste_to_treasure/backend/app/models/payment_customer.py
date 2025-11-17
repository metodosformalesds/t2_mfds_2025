"""
Modelo de base de datos para PaymentCustomer.

Implementa la tabla 'payment_customers'
Almacena la relación entre usuarios y sus Customer IDs en pasarelas de pago.
Permite guardar métodos de pago para compras futuras.
"""
"""
Autor: Oscar Alonso Nava Rivera
Fecha: 07/11/2025
Descripción: Modelo PaymentCustomer (mapeo de clientes en gateway de pagos).
"""
import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, Integer, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Enum as SQLEnum

from app.models.base import BaseModel
from app.models.payment_enums import PaymentGatewayEnum

if TYPE_CHECKING:
    from app.models.user import User


class PaymentCustomer(BaseModel):
    """
    Modelo de customer en pasarelas de pago.
    
    Almacena el Customer ID de un usuario en Stripe/PayPal para:
    - Guardar métodos de pago (tarjetas, cuentas)
    - Facilitar pagos recurrentes
    - Mantener historial de transacciones en la pasarela
    
    Attributes:
        payment_customer_id: Identificador único del registro.
        user_id: Usuario propietario.
        gateway: Pasarela de pago (STRIPE/PAYPAL).
        gateway_customer_id: ID del customer en la pasarela.
        default_payment_method_id: ID del método de pago default (opcional).
        
    Relationships:
        user: Usuario propietario del customer.
        
    Business Rules:
        - Un usuario puede tener UN customer por pasarela (Stripe + PayPal = 2 max).
        - El gateway_customer_id viene de la API de la pasarela (cus_xxx, etc).
        - Si el usuario no tiene customer, se crea al primer pago.
        
    """
    __tablename__ = "payment_customers"
    
    # COLUMNAS PRINCIPALES
    payment_customer_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Identificador único del registro de customer"
    )
    
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="UUID del usuario propietario"
    )
    
    gateway: Mapped[PaymentGatewayEnum] = mapped_column(
        SQLEnum(PaymentGatewayEnum, name="payment_gateway_enum", create_constraint=True),
        nullable=False,
        comment="Pasarela de pago: STRIPE o PAYPAL"
    )
    
    gateway_customer_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        comment="ID único del customer en la pasarela (cus_xxx para Stripe)"
    )
    
    default_payment_method_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="ID del método de pago predeterminado (pm_xxx para Stripe)"
    )
    
    # RELACIONES
    user: Mapped["User"] = relationship(
        "User",
        back_populates="payment_customers"
    )
    
    # CONSTRAINTS
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "gateway",
            name="uq_payment_customer_user_gateway"
        ),
        Index("ix_payment_customers_user_gateway", "user_id", "gateway"),
    )
    
    # MÉTODOS DE INSTANCIA
    def is_stripe_customer(self) -> bool:
        """Verifica si es customer de Stripe."""
        return self.gateway == PaymentGatewayEnum.STRIPE
    
    def is_paypal_customer(self) -> bool:
        """Verifica si es customer de PayPal."""
        return self.gateway == PaymentGatewayEnum.PAYPAL
    
    def has_default_payment_method(self) -> bool:
        """Verifica si tiene método de pago predeterminado."""
        return self.default_payment_method_id is not None
    
    def __repr__(self) -> str:
        return (
            f"PaymentCustomer(payment_customer_id={self.payment_customer_id!r}, "
            f"user_id={self.user_id!r}, gateway={self.gateway.value!r}, "
            f"gateway_customer_id={self.gateway_customer_id!r})"
        )