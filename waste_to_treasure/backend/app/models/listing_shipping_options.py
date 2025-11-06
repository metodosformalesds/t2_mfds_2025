"""
Modelo de base de datos para ListingShippingOption.

Implementa la tabla 'listing_shipping_options'
Tabla pivote que conecta listings con shipping_methods.
Permite a los vendedores especificar qué métodos de envío aplican a cada producto.
"""
from typing import TYPE_CHECKING

from sqlalchemy import Integer, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.listing import Listing
    from app.models.shipping_methods import ShippingMethod


class ListingShippingOption(BaseModel):
    """
    Modelo de relación entre listings y métodos de envío.

    Tabla pivoteMany-to-Many que permite asociar múltiples métodos
    de envío a cada listing. Un vendedor puede definir varios métodos
    de envío para sus productos (ej: recojo en tienda, envío express, envío estándar).

    Attributes:
        listing_id: ID del listing al que aplica el método de envío.
        method_id: ID del método de envío disponible para el listing.

    Relationships:
        listing: El listing al que pertenece esta opción de envío.
        shipping_method: El método de envío asociado.

    Database Constraints:
        - Composite primary key (listing_id, method_id).
        - Foreign keys a listings y shipping_methods.
        - Previene duplicados de la misma combinación listing-método.
    """
    __tablename__ = "listing_shipping_options"

    # COLUMNAS PRINCIPALES
    listing_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("listings.listing_id", ondelete="CASCADE"),
        nullable=False,
        comment="ID del listing al que aplica esta opción de envío"
    )

    method_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("shipping_methods.method_id", ondelete="CASCADE"),
        nullable=False,
        comment="ID del método de envío disponible para este listing"
    )

    # RELACIONES
    listing: Mapped["Listing"] = relationship(
        "Listing",
        back_populates="shipping_options"
    )

    shipping_method: Mapped["ShippingMethod"] = relationship(
        "ShippingMethod",
        back_populates="listing_options"
    )

    # CONSTRAINTS
    __table_args__ = (
        PrimaryKeyConstraint("listing_id", "method_id"),
        {
            "comment": "Tabla pivote que conecta listings con métodos de envío disponibles"
        }
    )

    def __repr__(self) -> str:
        """Representación legible del modelo."""
        return (
            f"<ListingShippingOption(listing_id={self.listing_id}, "
            f"method_id={self.method_id})>"
        )