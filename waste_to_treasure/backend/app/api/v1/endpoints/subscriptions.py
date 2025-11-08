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
    Obtiene la suscripción activa del usuario.
    El servicio `get_active_subscription` retorna Optional[Subscription],
    por lo que Pydantic manejará el retorno `None` correctamente.
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
    Llama al servicio para crear la suscripción.
    El servicio ya maneja:
    1. Validación del plan.
    2. Cancelación de la suscripción antigua (si existe).
    3. Simulación de llamada a Stripe con el token.
    4. Creación de la nueva suscripción en BD.
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
    Llama al servicio para cancelar la suscripción.
    El servicio maneja la lógica de:
    1. Encontrar la suscripción activa.
    2. Simular la cancelación en la pasarela de pago.
    3. Actualizar el estado en la BD.
    """
    subscription = await subscription_service.cancel_subscription(db, user)
    # El servicio (get_active_subscription) ya lanza 404 si no hay nada que cancelar
    return subscription