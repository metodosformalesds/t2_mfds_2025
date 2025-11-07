"""
Modelo de base de datos para Reviews.

Implementa la tabla 'reviews'
"""
import uuid
from typing import Optional, TYPE_CHECKING
from datetime import datetime

from sqlalchemy import func, String, Integer, ForeignKey, DateTime, Text, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.order_item import OrderItem
    from app.models.user import User
    from app.models.listing import Listing


class Review(BaseModel):
    """
    Las reviews guardan los calificaciones y comentarios que los compradores
    dejan acerca de un item despues de la compra.

    Relationships:
        - order_item: Relación uno a uno con OrderItem.
        - buyer: Relación muchos a uno con User (el comprador).
        - seller: Relación muchos a uno con User (el vendedor).
        - listing: Relación muchos a uno con Listing.
    
    Database contraints:
        - order_item_id: debe ser UNIQUE para asegurar que solo una review este asignada por item comprado.
        - rating: debe ser un un rango numerico del 1 al 5
        - comment: es un campo TEXT opcional.
    """
    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='rating_check'),
    )

    # COLUMNAS PRINCIPALES
    review_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Identificador único de la review"
    )
    order_item_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("order_items.order_item_id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        comment='Llave foranea UNIQUE a order_items'
    )
    buyer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="NO ACTION"),
        nullable=False,
        comment='UUID del comprador'
    )
    seller_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="NO ACTION"),
        nullable=False,
        comment='UUID del vendedor'
    )
    listing_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("listings.listing_id", ondelete="CASCADE"),
        nullable=False,
        comment='Llave foranea a listings'
    )
    rating: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Calificación de la review (1 a 5 estrellas)"
    )
    comment: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Texto opcional que acompaña la review"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="Fecha y hora de creacion del registro"
    )

    # RELATIONSHIPS
    order_item = relationship("OrderItem", back_populates="review")
    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="reviews_as_buyer")
    seller = relationship("User", foreign_keys=[seller_id], back_populates="reviews_as_seller")
    listing = relationship("Listing", back_populates="reviews")

    def __repr__(self) -> str:
        return (
            f"Review(review_id={self.review_id!r}, "
            f"order_item_id={self.order_item_id!r}, "
            f"buyer_id={self.buyer_id!r}, "
            f"seller_id={self.seller_id!r}, "
            f"listing_id={self.listing_id!r}, "
            f"rating={self.rating!r})"
        )

