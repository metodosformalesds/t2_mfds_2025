"""
Modelo de base de datos para Listing.

Implementa la tabla 'listings'
Almacena publicaciones de materiales (B2B) y productos (B2C).
"""
import uuid
from typing import Optional, List, TYPE_CHECKING
from decimal import Decimal

from sqlalchemy import String, Integer, Text, Numeric, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.models.base import BaseModel
from app.models.category import ListingTypeEnum

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.user import User
    from app.models.order_item import OrderItem
    from app.models.listing_image import ListingImage
    from app.models.reviews import Review
    from app.models.address import Address
    from app.models.reports import Report
    from app.models.offer import Offer


class ListingStatusEnum(str, enum.Enum):
    """
    Enum para el estado de moderación de un listing.
    
    Attributes:
        PENDING: Publicación pendiente de aprobación por administrador.
        ACTIVE: Publicación aprobada y visible públicamente.
        REJECTED: Publicación rechazada por moderación.
        INACTIVE: Publicación desactivada por el vendedor.
    """
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    REJECTED = "REJECTED"
    INACTIVE = "INACTIVE"

class Listing(BaseModel):
    """
    Modelo de publicación para materiales y productos.
    
    Representa una publicación en cualquiera de los dos marketplaces:
    - MATERIAL: Para el marketplace B2B de materiales reciclados.
    - PRODUCT: Para el marketplace B2C de productos terminados.
    
    Attributes:
        listing_id: Identificador único de la publicación.
        seller_id: Usuario que creó la publicación.
        category_id: Categoría a la que pertenece.
        listing_type: Tipo de marketplace (MATERIAL o PRODUCT).
        title: Título visible de la publicación.
        description: Descripción detallada del ítem.
        price: Precio monetario del ítem.
        price_unit: Unidad de precio (ej. 'Kg', 'Unidad', 'Lote').
        quantity: Cantidad disponible en inventario (stock).
        location_address_id: Ubicación física del ítem.
        origin_description: Descripción del origen reciclado/reutilizado.
        status: Estado de moderación de la publicación.
        approved_by_admin_id: Administrador que aprobó la publicación.
        
    Relationships:
        seller: Usuario propietario de la publicación.
        category: Categoría a la que pertenece.
        location: Dirección física del ítem.
        approved_by: Administrador que aprobó la publicación.
        images: Lista de imágenes asociadas.
        order_items: Items de órdenes que referencian este listing.
        
    Database Constraints:
        - seller_id debe existir en users.
        - category_id debe existir en categories.
        - location_address_id debe existir en addresses.
        - Índices en seller_id, status, listing_type para queries eficientes.
    """
    __tablename__ = "listings"

    # COLUMNAS PRINCIPALES
    listing_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Identificador único de la publicación"
    )
    
    seller_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="UUID del usuario vendedor que creó esta publicación"
    )
    
    category_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("categories.category_id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        comment="ID de la categoría a la que pertenece"
    )
    
    listing_type: Mapped[ListingTypeEnum] = mapped_column(
        SQLEnum(ListingTypeEnum, name="listing_type_enum", create_constraint=False),
        nullable=False,
        index=True,
        comment="Tipo de publicación: MATERIAL (B2B) o PRODUCT (B2C)"
    )
    
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Título visible de la publicación"
    )
    
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Descripción detallada del material o producto"
    )
    
    price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        comment="Precio monetario del ítem (precisión de 2 decimales)"
    )
    
    price_unit: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="Unidad de precio (ej. 'Kg', 'Tonelada', 'Unidad', 'Lote')"
    )
    
    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        comment="Cantidad disponible en inventario (stock)"
    )
 
    location_address_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("addresses.address_id", ondelete="SET NULL"),
        nullable=True,
        comment="ID de la dirección donde se encuentra el ítem físicamente"
    )
    
    origin_description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Descripción del origen reciclado o reutilizado del material"
    )
    
    status: Mapped[ListingStatusEnum] = mapped_column(
        SQLEnum(ListingStatusEnum, name="listing_status_enum", create_constraint=True),
        nullable=False,
        default=ListingStatusEnum.PENDING,
        index=True,
        comment="Estado de moderación: PENDING, ACTIVE, REJECTED, INACTIVE"
    )
    
    approved_by_admin_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
        comment="UUID del administrador que aprobó la publicación"
    )
    
    # RELACIONES
    seller: Mapped["User"] = relationship(
        "User",
        foreign_keys=[seller_id],
        back_populates="listings"
    )
    category: Mapped["Category"] = relationship(
        "Category",
        back_populates="listings"
    )
    # Relación con Address (ubicación del ítem)
    location: Mapped[Optional["Address"]] = relationship(
        "Address",
        foreign_keys=[location_address_id]
    )
    approved_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[approved_by_admin_id]
    )
    images: Mapped[List["ListingImage"]] = relationship(
        "ListingImage",
        back_populates="listing",
        cascade="all, delete-orphan",
        order_by="ListingImage.is_primary.desc()"  # Primaria primero
    )
    order_items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="listing"
    )
    reviews: Mapped[List["Review"]] = relationship(
        "Review",
        back_populates="listing"
    )
    reports: Mapped[List["Report"]] = relationship(
        "Report",
        back_populates="reported_listing",
        cascade="all, delete-orphan"
    )
    offers: Mapped[List["Offer"]] = relationship(
        "Offer",
        back_populates="listing",
        cascade="all, delete-orphan"
    )
    reports: Mapped[List["Report"]] = relationship(
        "Report",
        back_populates="reported_listing",
        cascade="all, delete-orphan"
    )
    offers: Mapped[List["Offer"]] = relationship(
        "Offer",
        back_populates="listing",
        cascade="all, delete-orphan"
    )
    __table_args__ = (
        Index("ix_listings_type_status", "listing_type", "status"),
        Index("ix_listings_seller_status", "seller_id", "status"),
        Index("ix_listings_category_status", "category_id", "status"),
        Index("ix_listings_price", "price"),
    )
    
    # MÉTODOS DE INSTANCIA
    def is_available(self) -> bool:
        """
        Verifica si el listing está disponible para compra.
        
        Returns:
            True si el listing está activo y tiene stock, False en caso contrario.
        """
        return self.status == ListingStatusEnum.ACTIVE and self.quantity > 0
    
    def reduce_stock(self, amount: int) -> bool:
        """
        Reduce el stock del listing.
        
        Args:
            amount: Cantidad a reducir del stock.
            
        Returns:
            True si se pudo reducir el stock, False si no hay suficiente.
        """
        if self.quantity >= amount:
            self.quantity -= amount
            return True
        return False
    
    def get_price_display(self) -> str:
        """
        Obtiene el precio formateado con su unidad.
        
        Returns:
            String con el precio formateado, ej: "$50.00/Kg" o "$100.00"
        """
        if self.price_unit:
            return f"${self.price:.2f}/{self.price_unit}"
        return f"${self.price:.2f}"
    
    def __repr__(self) -> str:
        return (
            f"Listing(listing_id={self.listing_id!r}, "
            f"title={self.title!r}, listing_type={self.listing_type.value!r}, "
            f"price={self.price!r}, status={self.status.value!r}, "
            f"seller_id={self.seller_id!r})"
        )
    
    def get_primary_image(self) -> Optional["ListingImage"]:
        """
        Obtiene la imagen principal del listing.
        
        Returns:
            La imagen marcada como primaria, o la primera imagen si no hay primaria,
            o None si no hay imágenes.
        """
        if not self.images:
            return None
        
        for image in self.images:
            if image.is_primary:
                return image
        
        return self.images[0] if self.images else None