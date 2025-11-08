"""
Capa de servicio para Notificaciones.

Implementa la lógica de negocio para:
- Crear notificaciones (para uso interno de otros servicios).
- Listar notificaciones de un usuario.
- Marcar notificaciones como leídas.
"""
import logging
import uuid
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, func
from fastapi import HTTPException, status

from app.models.user import User
from app.models.notification import Notification

logger = logging.getLogger(__name__)

class NotificationService:

    async def create_notification(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        content: str,
        type: Optional[str] = None,
        link_url: Optional[str] = None,
        priority: str = "MEDIUM"
    ) -> Notification:
        """
        Crea una nueva notificación para un usuario.
        
        IMPORTANTE: Esta función NO comitea la sesión (db.commit()).
        Está diseñada para ser llamada desde otro servicio (ej. OrderService)
        que ya está manejando una transacción. El servicio llamador
        es responsable de comitear.
        
        Args:
            db: Sesión asíncrona de base de datos.
            user_id: ID del usuario que recibirá la notificación.
            content: Mensaje de la notificación.
            type: Tipo (ej. "ORDER", "OFFER").
            link_url: URL relativa de destino (ej. "/my-orders/123").
            priority: "LOW", "MEDIUM", "HIGH".
            
        Returns:
            La instancia de Notification creada (aún no comiteada).
        """
        try:
            notification = Notification(
                user_id=user_id,
                content=content,
                type=type,
                link_url=link_url,
                priority=priority
            )
            db.add(notification)
            await db.flush() # Para que el objeto tenga sus datos
            return notification
        except Exception as e:
            logger.error(f"Error al crear notificación en memoria: {e}", exc_info=True)
            # El rollback será manejado por el servicio llamador
            raise

    async def get_user_notifications(
        self,
        db: AsyncSession,
        user: User,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[Notification], int, int]:
        """
        Obtiene las notificaciones de un usuario (no leídas primero).
        
        Returns:
            Tupla (lista_de_notificaciones, total_items, total_no_leidas)
        """
        
        # Query base para filtros
        base_stmt = select(Notification).where(Notification.user_id == user.user_id)
        
        # 1. Contar total de items
        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total_result = await db.execute(count_stmt)
        total = total_result.scalar() or 0
        
        # 2. Contar total no leído
        unread_count_stmt = select(func.count()).select_from(
            base_stmt.where(Notification.is_read == False).subquery()
        )
        unread_result = await db.execute(unread_count_stmt)
        unread_count = unread_result.scalar() or 0
        
        # 3. Obtener items paginados
        stmt = (
            base_stmt
            .order_by(
                Notification.is_read.asc(), # No leídas (False) primero
                Notification.created_at.desc() # Más recientes primero
            )
            .offset(skip)
            .limit(limit)
        )
        
        result = await db.execute(stmt)
        notifications = result.scalars().all()
        
        return list(notifications), total, unread_count

    async def mark_as_read(
        self,
        db: AsyncSession,
        notification_id: int,
        user: User
    ) -> Notification:
        """Marca una notificación específica como leída."""
        
        stmt = select(Notification).where(Notification.notification_id == notification_id)
        result = await db.execute(stmt)
        notification = result.scalar_one_or_none()
        
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notificación no encontrada"
            )
        
        # Validar ownership
        if notification.user_id != user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para modificar esta notificación"
            )
        
        if not notification.is_read:
            notification.is_read = True
            await db.commit()
            await db.refresh(notification)
        
        return notification

    async def mark_all_as_read(
        self,
        db: AsyncSession,
        user: User
    ) -> int:
        """
        Marca todas las notificaciones no leídas de un usuario como leídas.
        
        Returns:
            El número de notificaciones actualizadas.
        """
        stmt = (
            update(Notification)
            .where(
                Notification.user_id == user.user_id,
                Notification.is_read == False
            )
            .values(is_read=True)
        )
        
        result = await db.execute(stmt)
        await db.commit()
        
        return result.rowcount

# Singleton del servicio
notification_service = NotificationService()