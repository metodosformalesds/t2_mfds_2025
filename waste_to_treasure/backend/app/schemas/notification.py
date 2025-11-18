# Autor: Alejandro Campa Alonso 215833
# Fecha: 2025-11-08
# Descripción: Schemas Pydantic para el modelo Notification.
#              Define los contratos de salida (response) para las operaciones
#              sobre las notificaciones "in-app" del usuario.

"""
Schemas Pydantic para el modelo Notification.

Define los contratos de salida (response) para las operaciones
sobre las notificaciones "in-app" del usuario.
"""
import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class NotificationRead(BaseModel):
    """
    Schema para leer una notificación individual.
    """
    notification_id: int
    user_id: uuid.UUID
    content: str
    type: Optional[str] = Field(
        None, 
        examples=["ORDER", "OFFER", "REPORT_RESOLVED"]
    )
    link_url: Optional[str] = Field(
        None, 
        description="URL relativa a la que redirige al hacer clic",
        examples=["/my-purchases/123"]
    )
    is_read: bool
    priority: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class NotificationList(BaseModel):
    """
    Schema para respuestas paginadas de listas de notificaciones.
    """
    items: List[NotificationRead]
    total: int = Field(..., ge=0, description="Total de notificaciones encontradas")
    page: int = Field(..., ge=1, description="Página actual")
    page_size: int = Field(..., ge=1, description="Items por página")
    unread_count: int = Field(..., ge=0, description="Total de notificaciones no leídas")