# Autor: Gabriel Florentino Reyes
# Fecha: 06-11-2025
# Descripción: Descripción: Modelo que registra las acciones administrativas 
#               realizadas por los administradores para auditoría.

"""
Modelo de base de datos para Registros de acciones de administrador.
Implementa la tabla 'admin_action_logs'
"""
import uuid
from typing import Optional, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import func, String, Integer, ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User
    
class AdminActionLog(BaseModel):
    """
    Los admin action logs, registran todas las acciones administrativas
    realizadas en la plataforma para auditoria y trazabilidad.
    
    Relationships: 
        -admin: relacion muchos a uno o cero con User(el admnistrador que realizo la accion)
        
    Database contraints:
        - admin_id: clave foranea a users (admnistrador que ejecuto la accion)
        - action_type: tipo de accion realizada (ej. LISTING_REJECTED, REPORT_RESOLVED, USER_BLOCKED)
        - target_entity_type: ID de la entidad afectada (ej: LISTING, USER, REPORTED)
        - target_entity_id: ID de la entidad afectada.
        - reason: razon o descripcion opcional de la accion.
    """
    
    __tablename__= "admin_action_logs"
    
    #Columnas principales
    log_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Identificador unico del log de accion administrativa"
    )
    
    admin_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
        comment="UUID del administrador que ejecutó la acción"
    )
    
    action_type:Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="Tipo de accion admnistrativa realizada"
    )
    
    target_entity_type:Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable = True,
        comment="Tipo de entidad afectada por la accion (ej. LISTING_REJECTED, REPORT_RESOLVED, USR_BLOCKED)"
    )
    
    target_entity_id:Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="ID de la entidad afectada"
    )
    
    reason:Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Razon o descripcion detallada de la accion admnistrativa"
    )
    
    created_at:Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="Fecha y hora en que se registro la accion"
    )
    
    #Relationships
    admin:Mapped[Optional["User"]] = relationship("User", back_populates="admin_actions")
    
    def __repr__(self) -> str:
        return (
            f"AdminActionLog(log_id={self.log_id!r}, "
            f"admin_id={self.admin_id!r}, "
            f"action_type={self.action_type!r}, "
            f"target_entity_type={self.target_entity_type!r}, "
            f"target_entity_id={self.target_entity_id!r})"
        )