# Autor: Alejandro Campa Alonso 215833
# Fecha: 2025-11-09
# Descripción: Endpoints de la API para Suscripciones (SaaS). Gestiona el ciclo completo de
# suscripciones incluyendo visualización de suscripción activa, creación/cambio de plan y
# cancelación. Integra con Stripe simulado para pagos de suscripción.

"""
Endpoints de la API para Suscripciones (SaaS).

- GET /me: Ver mi suscripción activa.
- POST /subscribe: Crear o cambiar suscripción.
- POST /cancel: Cancelar suscripción.
"""
import logging
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db, get_current_active_user
from app.models.user import User
# Importamos los nuevos schemas de suscripción
from app.schemas.subscription import SubscriptionRead, SubscriptionCreate
from app.services.subscription_service import subscription_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/me",
    response_model=Optional[SubscriptionRead],
    summary="Ver mi suscripción activa",
    description="Obtiene los detalles de la suscripción activa del usuario autenticado. "
                "Retorna null si no hay ninguna suscripción activa.",
    responses={
        200: {"description": "Suscripción activa encontrada (o null si no existe)"},
        401: {"description": "No autenticado"},
    }
)
async def get_my_subscription(
    db: Annotated[AsyncSession, Depends(get_async_db)],
    user: Annotated[User, Depends(get_current_active_user)]
) -> Optional[SubscriptionRead]:
    """
    Obtiene los detalles de la suscripción activa del usuario autenticado.
    
    Retorna null si el usuario no tiene ninguna suscripción activa.
    
    Autor: Alejandro Campa Alonso 215833
    
    Args:
        db: Sesión asincrónica de la base de datos
        user: Usuario autenticado
    
    Returns:
        Optional[SubscriptionRead]: Suscripción activa del usuario, o None si no existe
    """
    subscription = await subscription_service.get_active_subscription(db, user)
    return subscription


@router.post(
    "/subscribe",
    response_model=SubscriptionRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear o cambiar suscripción",
    description="Crea una nueva suscripción o actualiza la existente a un nuevo plan. "
                "El servicio maneja la simulación de pago con el token."
)
async def create_or_change_subscription(
    sub_data: SubscriptionCreate,
    db: Annotated[AsyncSession, Depends(get_async_db)],
    user: Annotated[User, Depends(get_current_active_user)]
) -> SubscriptionRead:
    """
    Crea una nueva suscripción o actualiza la existente a un nuevo plan.
    
    El servicio maneja:
    1. Validación del plan solicitado
    2. Cancelación de la suscripción anterior (si existe)
    3. Simulación de llamada a Stripe con el token de pago
    4. Creación de la nueva suscripción en base de datos
    
    Autor: Alejandro Campa Alonso 215833
    
    Args:
        sub_data: Datos de suscripción incluyendo plan_id y payment_token
        db: Sesión asincrónica de la base de datos
        user: Usuario autenticado
    
    Returns:
        SubscriptionRead: Suscripción creada o actualizada
    
    Raises:
        HTTPException: Si el plan no existe o hay error en el pago
    """
    subscription = await subscription_service.create_subscription(
        db=db,
        user=user,
        plan_id=sub_data.plan_id,
        payment_token=sub_data.payment_token
    )
    return subscription


@router.post(
    "/cancel",
    response_model=SubscriptionRead,
    summary="Cancelar suscripción activa",
    description="Cancela la suscripción activa del usuario. "
                "La suscripción se marcará como CANCELLED."
)
async def cancel_subscription(
    db: Annotated[AsyncSession, Depends(get_async_db)],
    user: Annotated[User, Depends(get_current_active_user)]
) -> SubscriptionRead:
    """
    Cancela la suscripción activa del usuario autenticado.
    
    El servicio maneja:
    1. Búsqueda de la suscripción activa
    2. Simulación de la cancelación en la pasarela de pago
    3. Actualización del estado a CANCELLED en la base de datos
    
    Autor: Alejandro Campa Alonso 215833
    
    Args:
        db: Sesión asincrónica de la base de datos
        user: Usuario autenticado
    
    Returns:
        SubscriptionRead: Suscripción cancelada (con estado CANCELLED)
    
    Raises:
        HTTPException: Si no hay suscripción activa para cancelar
    """
    subscription = await subscription_service.cancel_subscription(db, user)
    # El servicio (get_active_subscription) ya lanza 404 si no hay nada que cancelar
    return subscription