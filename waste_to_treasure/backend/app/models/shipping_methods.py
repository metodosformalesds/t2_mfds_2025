"""
Modelo de base de datos para ShippingMethod.

Implementa la tabla 'shipping_methods' que permite a los vendedores
definir sus propios métodos de envío, ya sea para recojo en tienda
o para envío a domicilio.
"""
from typing import TYPE_CHECKING, Optional
import enum
from sqlalchemy import (
    Integer,
    String,
    Numeric,
    Enum as SQLEnum,
    ForeignKey,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class ShippingTypeEnum(str, enum.Enum):
    """
    Enum para el tipo de método de envío.

    Attributes:
        PICKUP: El comprador recoge el producto en un lugar acordado.
        DELIVERY: El vendedor envía el producto al comprador.
    """
    PICKUP = "pickup"
    DELIVERY = "delivery"


class ShippingMethod(BaseModel):
    """
    Define un método de envío ofrecido por un vendedor.

    Cada vendedor puede configurar múltiples métodos de envío,
    especificando un nombre, costo y tipo.

    Relationships:
        seller: El usuario (vendedor) que ofrece este método de envío.
    """
    __tablename__ = "shipping_methods"

    method_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Identificador único para el método de envío."
    )
    seller_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False,
        comment="Llave foránea al usuario (vendedor) que oferta este método."
    )
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="Nombre descriptivo (ej. 'Recojo en taller')."
    )
    cost: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        default=0.0,
        comment="El precio que será agregado a la orden si este método es escogido."
    )
    type: Mapped[ShippingTypeEnum] = mapped_column(
        SQLEnum(ShippingTypeEnum, name="shipping_type_enum", create_constraint=True),
        nullable=False,
        default=ShippingTypeEnum.DELIVERY,
        comment="Define si es para recojo ('pickup') o para envío a casa ('delivery')."
    )

    # RELACIONES
    seller: Mapped["User"] = relationship(
        "User",
        back_populates="shipping_methods"
    )
    
    def __repr__(self) -> str:
        """Representación legible del modelo."""
        return (
            f"<ShippingMethod(method_id={self.method_id}, name='{self.name}', "
            f"type='{self.type.value}', cost={self.cost}, seller_id={self.seller_id})>"
        )