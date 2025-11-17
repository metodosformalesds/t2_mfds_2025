"""
Modelo de base de datos para OrderItem.

Implementa la tabla 'order_items'
Representa un ítem dentro de una orden de compra.
"""

# Autor: Oscar Alonso Nava Rivera
# Fecha: 03/11/2025
# Descripción: Modelo de SQLAlchemy para representar ítems dentro de una orden (snapshot de precio y relaciones).
from decimal import Decimal
from sqlalchemy import Integer, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, TYPE_CHECKING

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.order import Order
    from app.models.listing import Listing
    from app.models.reviews import Review

class OrderItem(BaseModel):
    """
    Autor: Oscar Alonso Nava Rivera

    Modelo de ítem de orden.
    
    Representa un producto o material específico dentro de una orden de compra.
    Guarda un "snapshot" del precio para mantener la integridad histórica.
    """
    __tablename__ = "order_items"

    order_item_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Identificador único del ítem de la orden"
    )
    
    # TODO: El modelo 'Order' debe ser creado y definir 'orders.order_id' como PK.
    order_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("orders.order_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="ID de la orden a la que pertenece este ítem"
    )
    
    # TODO: El modelo 'Listing' debe ser creado y definir 'listings.listing_id' como PK.
    listing_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("listings.listing_id", ondelete="SET NULL"),
        nullable=True, # Permitir nulo para que si se borra el listing, no se pierda el historial
        comment="ID del listing (producto/material) asociado. Nulo si el listing fue eliminado."
    )
    
    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Cantidad del ítem comprado"
    )
    
    price_at_purchase: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        comment="Precio unitario del ítem en el momento de la compra (precisión de 2 decimales)"
    )

    # RELACIONES
    
    # Relación con la orden a la que pertenece este ítem
    order: Mapped["Order"] = relationship(
        "Order",
        back_populates="order_items"
    )
    
    # Relación con el listing (producto/material) que se compró
    listing: Mapped[Optional["Listing"]] = relationship(
        "Listing",
        back_populates="order_items"
    )
    
    # Relación con la review (uno a uno)
    review: Mapped[Optional["Review"]] = relationship(
        "Review",
        back_populates="order_item",
        uselist=False  # Indica que es relación uno-a-uno
    )

    def __repr__(self) -> str:
        """
        Autor: Oscar Alonso Nava Rivera

        Representación en string útil para logging y debugging.
        """
        return (
            f"OrderItem(order_item_id={self.order_item_id!r}, "
            f"order_id={self.order_id!r}, listing_id={self.listing_id!r}, "
            f"quantity={self.quantity!r}, price_at_purchase={self.price_at_purchase!r})"
        )
