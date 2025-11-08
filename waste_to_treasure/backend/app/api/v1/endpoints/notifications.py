"""
Endpoints de la API para Notificaciones.

Implementa:
- GET /me: Listar mis notificaciones (paginadas, no leídas primero).
- PATCH /me/{notification_id}/read: Marcar una notificación como leída.
- POST /me/read-all: Marcar todas las notificaciones como leídas.
"""
import logging
from typing import Annotated, Dict
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db, get_current_active_user
from app.models.user import User
from app.schemas.notification import NotificationRead, NotificationList
from app.services.notification_service import notification_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/me",
    response_model=NotificationList,
    summary="Listar mis notificaciones",
    description="Obtiene una lista paginada de las notificaciones del usuario, "
                "ordenadas por no leídas primero."
)
async def get_my_notifications(
    db: Annotated[AsyncSession, Depends(get_async_db)],
    user: Annotated[User, Depends(get_current_active_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50), # Límite más bajo para notificaciones
) -> NotificationList:
    
    notifications, total, unread_count = (
        await notification_service.get_user_notifications(db, user, skip, limit)
    )
    
    page = (skip // limit) + 1
    
    return NotificationList(
        items=[NotificationRead.model_validate(n) for n in notifications],
        total=total,
        page=page,
        page_size=limit,
        unread_count=unread_count
    )


@router.patch(
    "/me/{notification_id}/read",
    response_model=NotificationRead,
    summary="Marcar notificación como leída",
    description="Marca una notificación específica como leída."
)
async def mark_notification_as_read(
    notification_id: int,
    db: Annotated[AsyncSession, Depends(get_async_db)],
    user: Annotated[User, Depends(get_current_active_user)]
) -> NotificationRead:
    
    notification = await notification_service.mark_as_read(
        db, notification_id, user
    )
    return NotificationRead.model_validate(notification)


@router.post(
    "/me/read-all",
    response_model=Dict[str, int],
    summary="Marcar todas como leídas",
    description="Marca todas las notificaciones no leídas del usuario como leídas."
)
async def mark_all_notifications_as_read(
    db: Annotated[AsyncSession, Depends(get_async_db)],
    user: Annotated[User, Depends(get_current_active_user)]
) -> Dict[str, int]:
    
    updated_count = await notification_service.mark_all_as_read(db, user)
    return {"updated_count": updated_count}