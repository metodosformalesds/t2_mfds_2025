"""
Capa de servicio para Offer.

Implementa la lógica de negocio para operaciones sobre ofertas B2B,
incluyendo validaciones, negociaciones y gestión de estados.

Este servicio está completamente asíncrono para aprovechar la arquitectura
de FastAPI y SQLAlchemy 2.0 async, mejorando el rendimiento y escalabilidad.
"""
import logging
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.offer import Offer, OfferStatusEnum
from app.models.listing import Listing, ListingStatusEnum
from app.models.category import ListingTypeEnum
from app.schemas.offer import OfferCreate, OfferUpdateStatus

logger = logging.getLogger(__name__)


async def create_offer(
    db: AsyncSession,
    offer_data: OfferCreate,
    buyer_id: UUID
) -> Offer:
    """
    Crea una nueva oferta de negociación.

    Args:
        db: Sesión asíncrona de base de datos.
        offer_data: Datos de la oferta.
        buyer_id: UUID del comprador.

    Returns:
        Offer creada.

    Raises:
        HTTPException: Si el listing no existe, no es MATERIAL,
                      o el comprador es el mismo vendedor.
    """
    # Obtener el listing
    result = await db.execute(
        select(Listing).where(Listing.listing_id == offer_data.listing_id)
    )
    listing = result.scalar_one_or_none()

    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Publicación no encontrada"
        )

    # Validar que sea un material (B2B)
    if listing.listing_type != ListingTypeEnum.MATERIAL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las ofertas solo están disponibles para materiales (B2B)"
        )

    # Validar que el listing esté activo
    if listing.status != ListingStatusEnum.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta publicación no está disponible para ofertas"
        )

    # Validar que el comprador no sea el vendedor
    if listing.seller_id == buyer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes hacer una oferta en tu propia publicación"
        )

    # Validar cantidad disponible
    if offer_data.quantity > listing.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cantidad solicitada excede el stock disponible: {listing.quantity}"
        )

    # Crear la oferta
    db_offer = Offer(
        listing_id=offer_data.listing_id,
        buyer_id=buyer_id,
        seller_id=listing.seller_id,
        offer_price=offer_data.offer_price,
        quantity=offer_data.quantity,
        expires_at=offer_data.expires_at,
        status=OfferStatusEnum.PENDING
    )

    db.add(db_offer)
    await db.commit()
    await db.refresh(db_offer)

    logger.info(
        f"Oferta {db_offer.offer_id} creada por comprador {buyer_id} "
        f"en listing {offer_data.listing_id}"
    )

    # TODO: Crear notificación para el vendedor
    # await create_notification(
    #     db, user_id=listing.seller_id, type="OFFER",
    #     content=f"Recibiste una oferta de ${offer_data.offer_price} por {listing.title}"
    # )

    return db_offer


async def get_sent_offers(
    db: AsyncSession,
    buyer_id: UUID,
    status_filter: Optional[OfferStatusEnum] = None,
    page: int = 1,
    page_size: int = 20
) -> Tuple[List[Offer], int]:
    """
    Obtiene ofertas enviadas por un comprador.

    Args:
        db: Sesión asíncrona de base de datos.
        buyer_id: UUID del comprador.
        status_filter: Filtro opcional por estado.
        page: Número de página.
        page_size: Elementos por página.

    Returns:
        Tupla con (lista de ofertas, total de registros).
    """
    stmt = (
        select(Offer)
        .options(
            selectinload(Offer.listing),
            selectinload(Offer.seller)
        )
        .where(Offer.buyer_id == buyer_id)
    )

    if status_filter:
        stmt = stmt.where(Offer.status == status_filter)

    # Obtener total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar()

    # Paginación
    skip = (page - 1) * page_size
    stmt = stmt.order_by(desc(Offer.created_at)).offset(skip).limit(page_size)

    result = await db.execute(stmt)
    offers = result.scalars().all()

    return list(offers), total


async def get_received_offers(
    db: AsyncSession,
    seller_id: UUID,
    status_filter: Optional[OfferStatusEnum] = None,
    page: int = 1,
    page_size: int = 20
) -> Tuple[List[Offer], int]:
    """
    Obtiene ofertas recibidas por un vendedor.

    Args:
        db: Sesión asíncrona de base de datos.
        seller_id: UUID del vendedor.
        status_filter: Filtro opcional por estado.
        page: Número de página.
        page_size: Elementos por página.

    Returns:
        Tupla con (lista de ofertas, total de registros).
    """
    stmt = (
        select(Offer)
        .options(
            selectinload(Offer.listing),
            selectinload(Offer.buyer)
        )
        .where(Offer.seller_id == seller_id)
    )

    if status_filter:
        stmt = stmt.where(Offer.status == status_filter)

    # Obtener total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar()

    # Paginación
    skip = (page - 1) * page_size
    stmt = stmt.order_by(desc(Offer.created_at)).offset(skip).limit(page_size)

    result = await db.execute(stmt)
    offers = result.scalars().all()

    return list(offers), total


async def get_offer_by_id(
    db: AsyncSession,
    offer_id: int,
    user_id: UUID
) -> Optional[Offer]:
    """
    Obtiene una oferta por su ID.

    Args:
        db: Sesión asíncrona de base de datos.
        offer_id: ID de la oferta.
        user_id: UUID del usuario (para validar acceso).

    Returns:
        Offer encontrada o None.

    Raises:
        HTTPException: Si el usuario no tiene permiso para ver la oferta.
    """
    result = await db.execute(
        select(Offer)
        .options(
            selectinload(Offer.listing),
            selectinload(Offer.buyer),
            selectinload(Offer.seller)
        )
        .where(Offer.offer_id == offer_id)
    )
    offer = result.scalar_one_or_none()

    if not offer:
        return None

    # Validar que el usuario sea el comprador o el vendedor
    if offer.buyer_id != user_id and offer.seller_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver esta oferta"
        )

    return offer


async def update_offer_status(
    db: AsyncSession,
    offer_id: int,
    seller_id: UUID,
    update_data: OfferUpdateStatus
) -> Offer:
    """
    Actualiza el estado de una oferta (aceptar/rechazar/contraofertar).

    Args:
        db: Sesión asíncrona de base de datos.
        offer_id: ID de la oferta.
        seller_id: UUID del vendedor (para validación).
        update_data: Datos de la actualización.

    Returns:
        Offer actualizada.

    Raises:
        HTTPException: Si la oferta no existe, no pertenece al vendedor,
                      o no puede ser modificada.
    """
    result = await db.execute(
        select(Offer)
        .options(selectinload(Offer.listing))
        .where(Offer.offer_id == offer_id)
    )
    offer = result.scalar_one_or_none()

    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Oferta no encontrada"
        )

    if offer.seller_id != seller_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para modificar esta oferta"
        )

    if offer.status not in [OfferStatusEnum.PENDING, OfferStatusEnum.COUNTERED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede modificar una oferta con estado {offer.status.value}"
        )

    if offer.is_expired():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta oferta ha expirado"
        )

    # Ejecutar la acción correspondiente
    if update_data.action == 'accept':
        offer.status = OfferStatusEnum.ACCEPTED
        logger.info(f"Oferta {offer_id} aceptada por vendedor {seller_id}")
        # TODO: Crear notificación para el comprador

    elif update_data.action == 'reject':
        offer.status = OfferStatusEnum.REJECTED
        offer.rejection_reason = update_data.rejection_reason
        logger.info(f"Oferta {offer_id} rechazada por vendedor {seller_id}")
        # TODO: Crear notificación para el comprador

    elif update_data.action == 'counter':
        offer.status = OfferStatusEnum.COUNTERED
        offer.counter_offer_price = update_data.counter_offer_price
        logger.info(
            f"Contraoferta realizada en oferta {offer_id} por vendedor {seller_id}: "
            f"${update_data.counter_offer_price}"
        )
        # TODO: Crear notificación para el comprador

    await db.commit()
    await db.refresh(offer)

    return offer


def convert_to_card_response(offer: Offer, current_user_id: UUID) -> dict:
    """
    Convierte un Offer a formato OfferCardRead.

    Args:
        offer: Objeto Offer de SQLAlchemy.
        current_user_id: UUID del usuario actual (para contexto).

    Returns:
        Diccionario con datos para OfferCardRead.
    """
    # Determinar el "otro participante" según el contexto
    if current_user_id == offer.buyer_id:
        other_party_name = (
            offer.seller.full_name
            if hasattr(offer.seller, 'full_name')
            else "Vendedor"
        )
    else:
        other_party_name = (
            offer.buyer.full_name
            if hasattr(offer.buyer, 'full_name')
            else "Comprador"
        )

    return {
        "offer_id": offer.offer_id,
        "listing_id": offer.listing_id,
        "listing_title": (
            offer.listing.title
            if offer.listing
            else "Listing no disponible"
        ),
        "offer_price": offer.offer_price,
        "counter_offer_price": offer.counter_offer_price,
        "quantity": offer.quantity,
        "status": offer.status,
        "created_at": offer.created_at,
        "expires_at": offer.expires_at,
        "other_party_name": other_party_name
    }


def convert_to_full_response(offer: Offer) -> dict:
    """
    Convierte un Offer a formato OfferRead completo.

    Args:
        offer: Objeto Offer de SQLAlchemy.

    Returns:
        Diccionario con datos para OfferRead.
    """
    return {
        "offer_id": offer.offer_id,
        "listing_id": offer.listing_id,
        "buyer_id": offer.buyer_id,
        "seller_id": offer.seller_id,
        "offer_price": offer.offer_price,
        "quantity": offer.quantity,
        "status": offer.status,
        "counter_offer_price": offer.counter_offer_price,
        "rejection_reason": offer.rejection_reason,
        "expires_at": offer.expires_at,
        "created_at": offer.created_at,
        "updated_at": offer.updated_at,
        "current_price": offer.get_current_price(),
        "total_amount": offer.calculate_total(),
        "is_expired": offer.is_expired(),
        "listing_title": offer.listing.title if offer.listing else None,
        "listing_original_price": offer.listing.price if offer.listing else None
    }
