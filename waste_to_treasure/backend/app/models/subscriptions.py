"""
# Autor: Alejandro Campa Alonso 215833

# Fecha: 2025-11-08

# Descripción: Modelo de base de datos para Suscripciones.
Implementa la tabla 'subscriptions' que guarda el plan al que un usuario está suscrito,
su estado, fechas de facturación y el ID de la suscripción en la pasarela de pago.
"""
import uuid
import enum
from datetime import datetime
from typing import TYPE_CHECKING, List

from sqlalchemy import (
    func, 
    String, 
    Integer, 
    ForeignKey, 
    DateTime, 
    Enum as SQLAlchemyEnum,
    UniqueConstraint
)

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.payment_transaction import PaymentTransaction

class SubscriptionStatus(str, enum.Enum):
    # Estados posibles de una suscripcion
    ACTIVE    = "ACTIVE"
    INACTIVE  = "INACTIVE"
    CANCELLED = "CANCELLED"

class Subscription(BaseModel): 
    """
    Guarda el plan al que un usuario esta suscrito, su estado y fechas de facturacion.

    Relationships:
        - user: Relacion con el modelo User.
        - plan: Relacion con el modelo Plan.
    """

    __tablename__ = "subscriptions"
    __table_args__ = (
        UniqueConstraint('user_id', 'plan_id', name='unique_user_plan'),
    )

    # COLUMNAS PRINICIPALES
    subscription_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Identificador único de la Suscripción"
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment='UUID del usuario suscrito'
    )
    plan_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("plans.plan_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment='Llave foranea a la tabla de planes (plans)'
    )
    status: Mapped[SubscriptionStatus] = mapped_column(
        SQLAlchemyEnum(
            SubscriptionStatus,
            name="subscription_status_enum",
            create_constraint=True
        ),
        nullable=False,
        default=SubscriptionStatus.ACTIVE,
        index=True,
        comment="Estatus actual de la suscripcion (e.g., ACTIVE, INACTIVE, CANCELLED)."
    )
    start_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="Fecha y hora de inicio de la suscripcion"
    )
    next_billing_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False, 
        comment="Fecha del proximo cobro de la suscripcion"
    )
    gateway_sub_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        comment="ID unico de la suscripcion en la pasarela de pago"
    )

    # RELATIONSHIPS
    user = relationship("User", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")
    
    payment_transactions: Mapped[List["PaymentTransaction"]] = relationship(
        "PaymentTransaction",
        back_populates="subscription",
        foreign_keys="PaymentTransaction.subscription_id"
    )

    def __repr__(self) -> str:
        return (
            f"<Subscription(subscription_id={self.subscription_id!r}, "
            f"user_id={self.user_id!r}, "
            f"plan_id={self.plan_id!r}, "
            f"status={self.status!r}, "
            f"start_date={self.start_date!r}, "
            f"next_billing_date={self.next_billing_date!r}, "
            f"gateway_sub_id={self.gateway_sub_id!r})>"
        )

