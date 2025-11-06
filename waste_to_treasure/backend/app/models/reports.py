"""
Modelo de base de datos para Reports.
Implementa la tabla 'reports'
"""
import uuid
from typing import Optional, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import func, String, Integer, ForeignKey, DateTime, Text, Enum, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import BaseModel
import enum

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.listing import Listing
    from app.models.order import Order


class ReportType(enum.Enum):
    """Tipos de reportes disponibles en el sistema"""
    LISTING = "listing"
    USER = "user"
    ORDER = "order"


class ModerationStatus(enum.Enum):
    """Estados de moderación para los reportes"""
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class Report(BaseModel):
    """
    Los reports guardan las denuncias que los usuarios hacen sobre listings,
    otros usuarios u órdenes que consideren inapropiados o problemáticos.
    
    Relationships:
        - reporter: Relación muchos a uno con User (usuario que reporta).
        - reported_user: Relación muchos a uno con User (usuario reportado, opcional).
        - reported_listing: Relación muchos a uno con Listing (listing reportado, opcional).
        - reported_order: Relación muchos a uno con Order (orden reportada, opcional).
        - resolved_by_admin: Relación muchos a uno con User (admin que resuelve, opcional).
    
    Database constraints:
        - Al menos uno de los campos reported_listing_id, reported_user_id, 
          o reported_order_id debe estar presente según el report_type.
        - status: usa el enum moderation_status_enum.
        - reason: campo VARCHAR(255) obligatorio.
        - details: campo TEXT opcional para información adicional.
    """
    __tablename__ = "reports"
    
    # COLUMNAS PRINCIPALES
    report_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Identificador único del reporte"
    )
    
    reporter_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="NO ACTION"),
        nullable=False,
        comment="UUID del usuario que reporta"
    )
    
    report_type: Mapped[ReportType] = mapped_column(
        Enum(ReportType, name="report_type_enum"),
        nullable=False,
        comment="Tipo de reporte: listing, user u order"
    )
    
    reported_listing_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("listings.listing_id", ondelete="CASCADE"),
        nullable=True,
        comment="Llave foránea a listings (si se reporta un listing)"
    )
    
    reported_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="NO ACTION"),
        nullable=True,
        comment="UUID del usuario reportado (si se reporta un usuario)"
    )
    
    reported_order_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("orders.order_id", ondelete="CASCADE"),
        nullable=True,
        comment="Llave foránea a orders (si se reporta una orden)"
    )
    
    reason: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Razón o motivo del reporte"
    )
    
    details: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Detalles adicionales opcionales sobre el reporte"
    )
    
    status: Mapped[ModerationStatus] = mapped_column(
        Enum(ModerationStatus, name="moderation_status_enum"),
        nullable=False,
        server_default=text("'PENDING'"),
        comment="Estado de moderación del reporte"
    )
    
    resolved_by_admin_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
        comment="UUID del admin que resolvió el reporte"
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="Fecha y hora de creación del registro"
    )
    
    # RELATIONSHIPS
    reporter = relationship("User",foreign_keys=[reporter_user_id],back_populates="reports_made")
    reported_user = relationship("User",foreign_keys=[reported_user_id],back_populates="reports_received")
    reported_listing = relationship("Listing",back_populates="reports")
    reported_order = relationship("Order",back_populates="reports")
    resolved_by_admin = relationship("User",foreign_keys=[resolved_by_admin_id],back_populates="reports_resolved")
    
    def __repr__(self) -> str:
        return (
            f"Report(report_id={self.report_id!r}, "
            f"reporter_user_id={self.reporter_user_id!r}, "
            f"report_type={self.report_type!r}, "
            f"status={self.status!r}, "
            f"reason={self.reason!r})"
        )