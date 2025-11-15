"""
Endpoints de la API para Offers.

Implementa operaciones sobre ofertas y negociaciones B2B.
Todos los endpoints requieren autenticación.
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db, get_current_active_user
from app.models.user import User
from app.models.offer import OfferStatusEnum
from app.schemas.offer import (
    OfferCreate,
    OfferRead,
    OfferCardRead,
    OfferListResponse,
    OfferUpdateStatus
)
from app.services import offer_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "",
    response_model=OfferRead,
    status_code=status.HTTP_201_CREATED,
    summary="Enviar oferta de compra",
    description="Envía una nueva oferta de compra para un material (B2B).",
    responses={
        201: {"description": "Oferta enviada exitosamente"},
        400: {"description": "Datos inválidos o listing no disponible para ofertas"},
        401: {"description": "No autenticado"},
        404: {"description": "Publicación no encontrada"},
    }
)
@router.post(
    "/",
    response_model=OfferRead,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False
)
async def create_offer(
    offer_in: OfferCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
) -> OfferRead:
    """
    Envía una nueva oferta de compra (comprador).

    **Requiere autenticación**

    - Solo disponible para listings de tipo MATERIAL (B2B)
    - El comprador no puede ofertar en sus propias publicaciones
    - Valida stock disponible

    **Ejemplo de request body**:
    ```json
    {
        "listing_id": 1,
        "offer_price": 120.00,
        "quantity": 100,
        "expires_at": "2025-12-31T23:59:59Z",
        "message": "Estoy interesado en comprar este material..."
    }
    ```
    """
    logger.info(
        f"Usuario {current_user.user_id} creando oferta para listing {offer_in.listing_id}"
    )

    offer = await offer_service.create_offer(
        db=db,
        offer_data=offer_in,
        buyer_id=current_user.user_id
    )

    return offer_service.convert_to_full_response(offer)


@router.get(
    "/sent",
    response_model=OfferListResponse,
    summary="Listar ofertas enviadas",
    description="Lista las ofertas enviadas por el usuario (como comprador).",
    responses={
        200: {"description": "Lista de ofertas obtenida exitosamente"},
        401: {"description": "No autenticado"},
    }
)
async def list_sent_offers(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
    status_filter: Optional[OfferStatusEnum] = Query(
        None, description="Filtrar por estado"
    ),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
) -> OfferListResponse:
    """
    Lista las ofertas enviadas por el usuario (como comprador).

    **Requiere autenticación**

    - Muestra todas las ofertas que el usuario ha enviado
    - Útil para el dashboard de "Mis Ofertas Enviadas"

    **Filtros**:
    - `status_filter`: Filtrar por estado (PENDING, ACCEPTED, REJECTED, COUNTERED, EXPIRED)
    """
    logger.info(
        f"Usuario {current_user.user_id} listando ofertas enviadas "
        f"(status={status_filter}, page={page})"
    )

    offers, total = await offer_service.get_sent_offers(
        db=db,
        buyer_id=current_user.user_id,
        status_filter=status_filter,
        page=page,
        page_size=page_size
    )

    items = [
        OfferCardRead(**offer_service.convert_to_card_response(offer, current_user.user_id))
        for offer in offers
    ]

    return OfferListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=items
    )


@router.get(
    "/received",
    response_model=OfferListResponse,
    summary="Listar ofertas recibidas",
    description="Lista las ofertas recibidas por el usuario (como vendedor).",
    responses={
        200: {"description": "Lista de ofertas obtenida exitosamente"},
        401: {"description": "No autenticado"},
    }
)
async def list_received_offers(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
    status_filter: Optional[OfferStatusEnum] = Query(
        None, description="Filtrar por estado"
    ),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
) -> OfferListResponse:
    """
    Lista las ofertas recibidas por el usuario (como vendedor).

    **Requiere autenticación**

    - Muestra todas las ofertas que el usuario ha recibido en sus publicaciones
    - Útil para el dashboard de "Ofertas Recibidas"

    **Filtros**:
    - `status_filter`: Filtrar por estado (PENDING, ACCEPTED, REJECTED, COUNTERED, EXPIRED)
    """
    logger.info(
        f"Usuario {current_user.user_id} listando ofertas recibidas "
        f"(status={status_filter}, page={page})"
    )

    offers, total = await offer_service.get_received_offers(
        db=db,
        seller_id=current_user.user_id,
        status_filter=status_filter,
        page=page,
        page_size=page_size
    )

    items = [
        OfferCardRead(**offer_service.convert_to_card_response(offer, current_user.user_id))
        for offer in offers
    ]

    return OfferListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=items
    )


@router.get(
    "/{offer_id}",
    response_model=OfferRead,
    summary="Obtener oferta por ID",
    description="Obtiene los detalles completos de una oferta específica.",
    responses={
        200: {"description": "Oferta encontrada"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos (no es comprador ni vendedor)"},
        404: {"description": "Oferta no encontrada"},
    }
)
async def get_offer_detail(
    offer_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
) -> OfferRead:
    """
    Obtiene detalles completos de una oferta.

    **Requiere autenticación**

    - Solo el comprador o vendedor pueden ver la oferta

    **Ejemplo de respuesta**:
    ```json
    {
        "offer_id": 1,
        "listing_id": 1,
        "buyer_id": "uuid...",
        "seller_id": "uuid...",
        "offer_price": 120.00,
        "quantity": 100,
        "status": "PENDING",
        "current_price": 120.00,
        "total_amount": 12000.00,
        "is_expired": false,
        ...
    }
    ```
    """
    logger.info(f"Usuario {current_user.user_id} obteniendo oferta {offer_id}")

    offer = await offer_service.get_offer_by_id(
        db=db,
        offer_id=offer_id,
        user_id=current_user.user_id
    )

    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Oferta no encontrada"
        )

    return offer_service.convert_to_full_response(offer)


@router.patch(
    "/{offer_id}",
    response_model=OfferRead,
    summary="Actualizar estado de oferta",
    description="Actualiza el estado de una oferta (vendedor). Permite aceptar, rechazar o contraofertar.",
    responses={
        200: {"description": "Oferta actualizada exitosamente"},
        400: {"description": "Datos inválidos o oferta no modificable"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos (no es el vendedor)"},
        404: {"description": "Oferta no encontrada"},
    }
)
async def update_offer(
    offer_id: int,
    update_in: OfferUpdateStatus,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
) -> OfferRead:
    """
    Actualiza el estado de una oferta (vendedor).

    **Requiere autenticación y ser el vendedor**

    - Acciones disponibles: 'accept', 'reject', 'counter'
    - No se puede modificar una oferta aceptada, rechazada o expirada

    **Ejemplo de request body (aceptar)**:
    ```json
    {
        "action": "accept"
    }
    ```

    **Ejemplo de request body (rechazar)**:
    ```json
    {
        "action": "reject",
        "rejection_reason": "Precio muy bajo para la calidad del material"
    }
    ```

    **Ejemplo de request body (contraofertar)**:
    ```json
    {
        "action": "counter",
        "counter_offer_price": 135.00
    }
    ```
    """
    logger.info(
        f"Usuario {current_user.user_id} actualizando oferta {offer_id} "
        f"(acción: {update_in.action})"
    )

    offer = await offer_service.update_offer_status(
        db=db,
        offer_id=offer_id,
        seller_id=current_user.user_id,
        update_data=update_in
    )

    return offer_service.convert_to_full_response(offer)
