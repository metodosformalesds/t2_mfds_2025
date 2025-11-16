"""
# Autor: Alejandro Campa Alonso 215833

# Fecha: 2025-11-05

# Descripción: Modelo de base de datos para Planes.
Implementa la tabla 'plans' que define los diferentes planes de suscripción disponibles en la plataforma,
con sus características, precios y ciclos de facturación. Cada plan puede tener múltiples suscriptores.
"""
from typing import Optional, TYPE_CHECKING 
from sqlalchemy import String, Integer, Numeric, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel
import enum

if TYPE_CHECKING:
    from app.models.subscriptions import Subscription


class BillingCycle(enum.Enum):
    """Ciclos de facturación disponibles para los planes"""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class Plan(BaseModel):
    """
    Los plans definen los diferentes planes de suscripción disponibles
    en la plataforma, con sus características y precios.
    
    Relationships:
        - subscriptions: Relación uno a muchos con Subscription.
    
    Database constraints:
        - name: debe ser único y no nulo.
        - price: debe ser un valor decimal positivo con precisión (10,2).
        - billing_cycle: debe ser uno de los valores del enum BillingCycle.
        - features_json: almacena las características del plan en formato JSON.
    """
    __tablename__ = "plans"

    # COLUMNAS PRINCIPALES
    plan_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Identificador único del plan"
    )
    
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        comment="Nombre del plan de suscripción"
    )
    
    price: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        comment="Precio del plan"
    )
    
    billing_cycle: Mapped[BillingCycle] = mapped_column(
        Enum(BillingCycle),
        nullable=False,
        comment="Ciclo de facturación: monthly, quarterly o yearly"
    )
    
    features_json: Mapped[Optional[dict]] = mapped_column(
        type_=String,  # SQLAlchemy manejará la serialización JSON
        nullable=True,
        comment="Características y límites del plan en formato JSON"
    )

    # RELATIONSHIPS
    subscriptions: Mapped[list["Subscription"]] = relationship(back_populates="plan")

    def __repr__(self) -> str:
        return (
            f"Plan(plan_id={self.plan_id!r}, "
            f"name={self.name!r}, "
            f"price={self.price!r}, "
            f"billing_cycle={self.billing_cycle!r})"
        )