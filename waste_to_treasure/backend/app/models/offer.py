# Autor: Arturo Perez Gonzalez
# Fecha: 06/11/2024
# Descripción: Modelo de base de datos para ofertas de negociación B2B.
#              Gestiona ofertas de compra en el marketplace de materiales, incluyendo
#              precios propuestos, contraofertas, estado de negociación y expiración.

"""
Modelo de base de datos para Offer.

Implementa la tabla 'offers'
Permite la funcionalidad de negociación B2B en el marketplace de materiales.
"""
import uuid
from typing import TYPE_CHECKING, Optional
from decimal import Decimal
from datetime import datetime

from sqlalchemy import String, Integer, Numeric, ForeignKey, Enum as SQLEnum, Index, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.listing import Listing
    from app.models.user import User

class OfferStatusEnum(str, enum.Enum):
    """
    Enum para el estado de una oferta de negociación.
    
    Attributes:
        PENDING: Oferta enviada, esperando respuesta del vendedor.
        ACCEPTED: Oferta aceptada por el vendedor.
        REJECTED: Oferta rechazada por el vendedor.
        COUNTERED: Vendedor ha hecho una contraoferta.
        EXPIRED: Oferta expirada sin respuesta.
    """
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    COUNTERED = "COUNTERED"
    EXPIRED = "EXPIRED"


class Offer(BaseModel):
    """
    Modelo de oferta para negociación B2B de materiales.
    
    Permite a los compradores enviar ofertas (precio y cantidad) para materiales,
    y a los vendedores aceptarlas, rechazarlas o hacer contraofertas.
    
    Attributes:
        offer_id: Identificador único de la oferta.
        listing_id: Material sobre el que se hace la oferta.
        buyer_id: Usuario comprador que envía la oferta.
        seller_id: Usuario vendedor que recibe la oferta.
        offer_price: Precio unitario propuesto por el comprador.
        quantity: Cantidad de unidades solicitadas.
        status: Estado actual de la negociación.
        expires_at: Fecha/hora de expiración de la oferta.
        counter_offer_price: Precio propuesto en contraoferta del vendedor.
        rejection_reason: Motivo del rechazo (opcional).
        
    Relationships:
        listing: Material sobre el que se negocia.
        buyer: Usuario comprador.
        seller: Usuario vendedor.
        
    Database Constraints:
        - offer_price debe ser mayor a 0.
        - quantity debe ser mayor a 0.
        - expires_at debe ser futuro al momento de creación.
        - Índices en buyer_id, seller_id, listing_id para queries eficientes.
    """
    __tablename__ = "offers"
    
    # COLUMNAS PRINCIPALES
    offer_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Identificador único de la oferta"
    )
    
    listing_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("listings.listing_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="ID del listing (material) sobre el que se hace la oferta"
    )
    
    buyer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="UUID del usuario comprador que envía la oferta"
    )
    
    seller_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="UUID del usuario vendedor que recibe la oferta"
    )
    
    offer_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        comment="Precio unitario propuesto por el comprador (precisión de 2 decimales)"
    )
    
    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Número de unidades que el comprador desea adquirir"
    )
    
    status: Mapped[OfferStatusEnum] = mapped_column(
        SQLEnum(OfferStatusEnum, name="offer_status_enum", create_constraint=True),
        nullable=False,
        default=OfferStatusEnum.PENDING,
        index=True,
        comment="Estado de la negociación: PENDING, ACCEPTED, REJECTED, COUNTERED, EXPIRED"
    )
    
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp opcional de expiración automática si el vendedor no responde"
    )
    
    counter_offer_price: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(10, 2),
        nullable=True,
        comment="Precio unitario de contraoferta propuesto por el vendedor"
    )
    
    rejection_reason: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        comment="Motivo opcional del rechazo por parte del vendedor"
    )
    
    # RELACIONES
    listing: Mapped["Listing"] = relationship(
        "Listing",
        back_populates="offers",
        foreign_keys=[listing_id]
    )
    
    buyer: Mapped["User"] = relationship(
        "User",
        foreign_keys=[buyer_id],
        back_populates="offers_sent"
    )
    
    seller: Mapped["User"] = relationship(
        "User",
        foreign_keys=[seller_id],
        back_populates="offers_received"
    )
    
    # INDICES COMPUESTOS
    __table_args__ = (
        Index("ix_offers_buyer_status", "buyer_id", "status"),
        Index("ix_offers_seller_status", "seller_id", "status"),
        Index("ix_offers_listing_status", "listing_id", "status"),
    )
    
    # MÉTODOS DE INSTANCIA
    def is_expired(self) -> bool:
        """
        Autor: Arturo Perez Gonzalez
        Descripción: Verifica si la oferta ha expirado según su fecha límite.
        Parámetros:
            Ninguno
        Retorna:
            bool: True si la oferta tiene fecha de expiración y ya pasó, False en caso contrario.
        """
        if self.expires_at is None:
            return False

        from datetime import timezone as tz
        now = datetime.now(tz.utc)
        return now > self.expires_at
    
    def can_be_accepted(self) -> bool:
        """
        Autor: Arturo Perez Gonzalez
        Descripción: Determina si la oferta puede ser aceptada por el vendedor.
        Parámetros:
            Ninguno
        Retorna:
            bool: True si está en estado PENDING o COUNTERED y no ha expirado, False en caso contrario.
        """
        if self.status not in [OfferStatusEnum.PENDING, OfferStatusEnum.COUNTERED]:
            return False

        return not self.is_expired()
    
    def get_current_price(self) -> Decimal:
        """
        Autor: Arturo Perez Gonzalez
        Descripción: Obtiene el precio actual vigente de la negociación.
        Parámetros:
            Ninguno
        Retorna:
            Decimal: Precio de contraoferta del vendedor si existe, sino el precio original de la oferta.
        """
        return self.counter_offer_price if self.counter_offer_price else self.offer_price
    
    def calculate_total(self) -> Decimal:
        """
        Autor: Arturo Perez Gonzalez
        Descripción: Calcula el monto total de la oferta (precio unitario × cantidad).
        Parámetros:
            Ninguno
        Retorna:
            Decimal: Monto total de la oferta basado en el precio actual y cantidad.
        """
        return self.get_current_price() * self.quantity
    
    def get_savings_percentage(self, original_price: Decimal) -> float:
        """
        Autor: Arturo Perez Gonzalez
        Descripción: Calcula el porcentaje de ahorro de la oferta respecto al precio original del listing.
        Parámetros:
            original_price (Decimal): Precio original del listing.
        Retorna:
            float: Porcentaje de descuento (0-100). Retorna 0.0 si original_price es inválido.
        """
        if original_price <= 0:
            return 0.0

        current = float(self.get_current_price())
        original = float(original_price)

        return ((original - current) / original) * 100
    
    def __repr__(self) -> str:
        return (
            f"Offer(offer_id={self.offer_id!r}, "
            f"listing_id={self.listing_id!r}, "
            f"buyer_id={self.buyer_id!r}, seller_id={self.seller_id!r}, "
            f"offer_price={self.offer_price!r}, status={self.status.value!r})"
        )