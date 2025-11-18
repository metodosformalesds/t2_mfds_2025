"""
Modelo de base de datos para PaymentTransaction.

Implementa la tabla 'payment_transactions'
Registra todas las transacciones de pago (órdenes y suscripciones).

Autor: Oscar Alonso Nava Rivera
Fecha: 07/11/2025
Descripción: Modelo PaymentTransaction y utilidades para workflow de pagos.
"""
import uuid
from typing import Optional, TYPE_CHECKING
from decimal import Decimal
from datetime import datetime

from sqlalchemy import String, Integer, Numeric, ForeignKey, Text, DateTime, Index, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Enum as SQLEnum

from app.models.base import BaseModel
from app.models.payment_enums import PaymentGatewayEnum, PaymentStatusEnum

if TYPE_CHECKING:
    from app.models.order import Order
    from app.models.subscriptions import Subscription
    from app.models.user import User


class PaymentTransaction(BaseModel):
    """
    Modelo de transacción de pago.
    
    Registra el detalle completo de cada transacción procesada por Stripe/PayPal.
    Complementa Order.payment_charge_id con información extendida para auditoría.
    
    Relationships:
        order: Orden asociada a esta transacción.
        subscription: Suscripción asociada a esta transacción.
        user: Usuario que realizó el pago.
        
    Business Rules:
        - Una transacción pertenece a UNA orden O UNA suscripción, no ambas.
        - El status COMPLETED es terminal (no puede cambiar después).
        - Las transacciones FAILED/CANCELLED pueden reintentar con nueva transacción.
        - gateway_transaction_id se obtiene de Stripe/PayPal después de procesar.
    """
    __tablename__ = "payment_transactions"
    
    # COLUMNAS PRINCIPALES
    transaction_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Identificador único de la transacción de pago"
    )
    
    order_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("orders.order_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="ID de la orden asociada (NULL para subscriptions)"
    )
    
    subscription_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("subscriptions.subscription_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="ID de la suscripción asociada (NULL para orders)"
    )
    
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="NO ACTION"),
        nullable=False,
        index=True,
        comment="UUID del usuario que realizó el pago"
    )
    
    # INFORMACIÓN DE LA PASARELA
    gateway: Mapped[PaymentGatewayEnum] = mapped_column(
        SQLEnum(PaymentGatewayEnum, name="payment_gateway_enum", create_constraint=True),
        nullable=False,
        index=True,
        comment="Pasarela de pago utilizada: STRIPE o PAYPAL"
    )
    
    gateway_transaction_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        comment="ID único de la transacción en la pasarela (ch_xxx, pi_xxx, PAYID-xxx)"
    )
    
    gateway_customer_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="ID del customer en la pasarela (cus_xxx para Stripe)"
    )
    
    # DETALLES DEL PAGO
    amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        comment="Monto total pagado (precisión de 2 decimales)"
    )
    
    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="MXN",
        comment="Código de moneda ISO 4217 (MXN, USD, etc)"
    )
    
    status: Mapped[PaymentStatusEnum] = mapped_column(
        SQLEnum(PaymentStatusEnum, name="payment_status_enum", create_constraint=True),
        nullable=False,
        default=PaymentStatusEnum.PENDING,
        index=True,
        comment="Estado actual de la transacción"
    )
    
    # MÉTODO DE PAGO
    payment_method_type: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="Tipo de método de pago (card, oxxo, spei, paypal, etc)"
    )
    
    payment_method_last4: Mapped[Optional[str]] = mapped_column(
        String(4),
        nullable=True,
        comment="Últimos 4 dígitos del método de pago (tarjetas)"
    )
    
    payment_method_brand: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="Marca del método de pago (visa, mastercard, amex, etc)"
    )
    
    # TIMESTAMPS
    initiated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="Fecha y hora de inicio de la transacción"
    )
    
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Fecha y hora de completado exitoso (NULL si no completado)"
    )
    
    # MANEJO DE ERRORES
    error_code: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="Código de error de la pasarela si la transacción falló"
    )
    
    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Mensaje de error detallado para debugging"
    )
    
    # METADATA ADICIONAL
    transaction_metadata: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="JSON con metadata adicional de la transacción"
    )
    
    # RELACIONES
    order: Mapped[Optional["Order"]] = relationship(
        "Order",
        back_populates="payment_transactions",
        foreign_keys=[order_id]
    )
    
    subscription: Mapped[Optional["Subscription"]] = relationship(
        "Subscription",
        back_populates="payment_transactions",
        foreign_keys=[subscription_id]
    )
    
    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id]
    )
    
    # ÍNDICES COMPUESTOS
    __table_args__ = (
        CheckConstraint('amount > 0', name='check_payment_amount_positive'),
        CheckConstraint(
            '(order_id IS NOT NULL AND subscription_id IS NULL) OR '
            '(order_id IS NULL AND subscription_id IS NOT NULL)',
            name='check_transaction_type_exclusive'
        ),
        Index("ix_payment_transactions_gateway_status", "gateway", "status"),
        Index("ix_payment_transactions_user_status", "user_id", "status"),
        Index("ix_payment_transactions_created", "created_at"),
    )
    
    # MÉTODOS DE INSTANCIA
    def is_successful(self) -> bool:
        """
        Verifica si la transacción fue exitosa.
        
        Returns:
            True si el status es COMPLETED.
        """
        return self.status == PaymentStatusEnum.COMPLETED
    
    def is_pending(self) -> bool:
        """
        Verifica si la transacción está pendiente.
        
        Returns:
            True si el status es PENDING o PROCESSING.
        """
        return self.status in [
            PaymentStatusEnum.PENDING,
            PaymentStatusEnum.PROCESSING
        ]
    
    def is_failed(self) -> bool:
        """
        Verifica si la transacción falló.
        
        Returns:
            True si el status es FAILED o CANCELLED.
        """
        return self.status in [
            PaymentStatusEnum.FAILED,
            PaymentStatusEnum.CANCELLED
        ]
    
    def can_be_refunded(self) -> bool:
        """
        Verifica si la transacción puede ser reembolsada.
        
        Returns:
            True si está COMPLETED y no ha sido reembolsada.
        """
        return (
            self.status == PaymentStatusEnum.COMPLETED and
            self.completed_at is not None
        )
    
    def get_formatted_amount(self) -> str:
        """
        Obtiene el monto formateado con moneda.
        
        Returns:
            String con el monto formateado (ej: "$110.00 MXN").
        """
        return f"${self.amount:.2f} {self.currency}"
    
    def get_masked_payment_method(self) -> Optional[str]:
        """
        Obtiene el método de pago enmascarado.
        
        Returns:
            String con método enmascarado (ej: "•••• 4242") o None.
        """
        if self.payment_method_last4:
            return f"•••• {self.payment_method_last4}"
        return None
    
    def __repr__(self) -> str:
        return (
            f"PaymentTransaction(transaction_id={self.transaction_id!r}, "
            f"gateway={self.gateway.value!r}, "
            f"amount={self.amount!r}, status={self.status.value!r}, "
            f"gateway_transaction_id={self.gateway_transaction_id!r})"
        )