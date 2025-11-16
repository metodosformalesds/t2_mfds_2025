"""
# Autor: Alejandro Campa Alonso 215833

# Fecha: 2025-11-06

# Descripción: Modelo de base de datos para Notification.
Implementa la tabla 'notifications' que almacena alertas in-app (campanita) para los usuarios.
Cada notificación tiene un tipo, contenido, prioridad, estado de lectura y URL de destino.
"""
import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, Integer, Text, Boolean, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User

class Notification(BaseModel):
    """
    Modelo de notificación in-app para usuarios.
    
    Almacena alertas dentro de la aplicación que aparecen en el ícono de campanita.
    Ejemplos: "Venta completada", "Nueva oferta recibida", "Reporte resuelto", etc.
    
    Attributes:
        notification_id: Identificador único de la notificación.
        user_id: Usuario que recibe la notificación.
        content: Texto del mensaje de la notificación.
        type: Categoría de la notificación (ORDER, OFFER, REPORT, etc.).
        link_url: URL relativa a la que redirige al hacer clic.
        is_read: Indica si el usuario ya vio la notificación.
        priority: Nivel de prioridad (LOW, MEDIUM, HIGH).
        
    Relationships:
        user: Usuario receptor de la notificación.
        
    Database Constraints:
        - user_id debe existir en users.
        - Índices en user_id e is_read para queries eficientes.
        - Índice compuesto en (user_id, is_read) para filtros comunes.
    """
    __tablename__ = "notifications"
    
    # COLUMNAS PRINCIPALES
    notification_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Identificador único de la notificación"
    )
    
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="UUID del usuario que recibe la notificación"
    )
    
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Texto del mensaje de la notificación"
    )
    
    type: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        index=True,
        comment="Categoría de la notificación (ORDER, REPORT_RESOLVED, OFFER, etc.)"
    )
    
    link_url: Mapped[Optional[str]] = mapped_column(
        String(512),
        nullable=True,
        comment="URL relativa de destino al hacer clic (ej. '/my-offers/123')"
    )
    
    is_read: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
        comment="Indica si el usuario ya vio/leyó esta notificación"
    )
    
    priority: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="MEDIUM",
        comment="Nivel de prioridad: LOW, MEDIUM, HIGH"
    )
    
    # RELACIONES
    user: Mapped["User"] = relationship(
        "User",
        back_populates="notifications"
    )
    
    # INDICES COMPUESTOS
    __table_args__ = (
        Index("ix_notifications_user_read", "user_id", "is_read"),
        Index("ix_notifications_user_created", "user_id", "created_at"),
    )
    
    # MÉTODOS DE INSTANCIA
    def mark_as_read(self) -> None:
        """
        Autor: Alejandro Campa Alonso 215833
        
        Descripción: Marca la notificación como leída.
        
        Parámetros:
            self: Instancia de la notificación.
        
        Retorna:
            None. Modifica el atributo is_read a True.
        """
        self.is_read = True
    
    def mark_as_unread(self) -> None:
        """
        Autor: Alejandro Campa Alonso 215833
        
        Descripción: Marca la notificación como no leída.
        
        Parámetros:
            self: Instancia de la notificación.
        
        Retorna:
            None. Modifica el atributo is_read a False.
        """
        self.is_read = False
    
    def get_icon_class(self) -> str:
        """
        Autor: Alejandro Campa Alonso 215833
        
        Descripción: Obtiene la clase CSS del ícono según el tipo de notificación.
        
        Parámetros:
            self: Instancia de la notificación.
        
        Retorna:
            str: Nombre de clase de ícono para el frontend (ej. 'shopping-cart', 'handshake').
        """
        icon_map = {
            "ORDER": "shopping-cart",
            "OFFER": "handshake",
            "REPORT_RESOLVED": "check-circle",
            "LISTING_APPROVED": "thumbs-up",
            "LISTING_REJECTED": "x-circle",
            "NEW_REVIEW": "star",
            "PAYMENT": "credit-card",
            "MESSAGE": "message-circle",
            "SYSTEM": "bell"
        }
        return icon_map.get(self.type, "bell")
    
    def get_priority_badge(self) -> str:
        """
        Autor: Alejandro Campa Alonso 215833
        
        Descripción: Obtiene el badge (etiqueta) de prioridad para la interfaz de usuario.
        
        Parámetros:
            self: Instancia de la notificación.
        
        Retorna:
            str: Clase CSS para el badge de prioridad (ej. 'badge-warning', 'badge-secondary').
        """
        badge_map = {
            "LOW": "badge-secondary",
            "MEDIUM": "badge-info",
            "HIGH": "badge-warning"
        }
        return badge_map.get(self.priority, "badge-info")
    
    def truncate_content(self, max_length: int = 100) -> str:
        """
        Autor: Alejandro Campa Alonso 215833
        
        Descripción: Trunca el contenido de la notificación para vista previa.
        
        Parámetros:
            self: Instancia de la notificación.
            max_length (int): Longitud máxima del texto. Por defecto 100 caracteres.
        
        Retorna:
            str: Contenido truncado con elipsis (...) al final si fue necesario truncar.
        """
        if len(self.content) <= max_length:
            return self.content
        
        return self.content[:max_length - 3] + "..."
    
    def __repr__(self) -> str:
        return (
            f"Notification(notification_id={self.notification_id!r}, "
            f"user_id={self.user_id!r}, type={self.type!r}, "
            f"is_read={self.is_read!r})"
        )