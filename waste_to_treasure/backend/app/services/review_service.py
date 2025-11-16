"""
Capa de servicio para Review.

Implementa la lógica de negocio para el sistema de reseñas,
incluyendo validaciones de compra verificada y prevención de
reseñas duplicadas.
"""
import logging
from typing import List, Tuple, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.reviews import Review
from app.models.user import User
from app.models.listing import Listing
from app.models.order import Order, OrderStatusEnum 
from app.models.order_item import OrderItem
from app.schemas.reviews import ReviewCreate

logger = logging.getLogger(__name__)


async def create_review(
    db: AsyncSession,
    review_data: ReviewCreate,
    current_user: User
) -> Review:
    """
    Crea una nueva reseña para un item comprado.
    
    Args:
        db: Sesión asíncrona de base de datos.
        review_data: Datos de la reseña a crear.
        current_user: Usuario autenticado (reviewer).
        
    Returns:
        Reseña creada.
        
    Raises:
        HTTPException 404: Si el order_item no existe.
        HTTPException 403: Si el usuario no compró el item.
        HTTPException 400: Si ya existe una reseña para ese order_item.
        
    Note:
        - Valida que el current_user sea el comprador del order_item
        - Previene reseñas duplicadas (solo una por order_item)
        - Extrae el listing_id del order_item automáticamente
    """
    logger.info(
        f"Usuario {current_user.user_id} creando reseña para "
        f"order_item {review_data.order_item_id}"
    )
    
    # Obtener order_item con relaciones
    stmt = select(OrderItem).options(
        selectinload(OrderItem.order),
        selectinload(OrderItem.listing)
    ).where(OrderItem.order_item_id == review_data.order_item_id)
    
    result = await db.execute(stmt)
    order_item = result.scalar_one_or_none()
    
    if not order_item:
        logger.warning(f"OrderItem {review_data.order_item_id} no encontrado")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item de orden con ID {review_data.order_item_id} no encontrado"
        )
    
    # Validar que el usuario actual sea el comprador
    if order_item.order.buyer_id != current_user.user_id:
        logger.warning(
            f"Usuario {current_user.user_id} no es el comprador del "
            f"order_item {review_data.order_item_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes reseñar items que hayas comprado"
        )
    
    # Validar que la orden esté completada
    if order_item.order.order_status != OrderStatusEnum.PAID:
        logger.warning(f"Orden {order_item.order_id} no está completada")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo puedes reseñar items de órdenes completadas"
        )
    
    # Verificar que no exista ya una reseña para este order_item
    existing_review_stmt = select(Review).where(
        Review.order_item_id == review_data.order_item_id
    )
    existing_result = await db.execute(existing_review_stmt)
    existing_review = existing_result.scalar_one_or_none()
    
    if existing_review:
        logger.warning(
            f"Ya existe reseña para order_item {review_data.order_item_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya has dejado una reseña para este item"
        )
    
    # Crear la reseña
    db_review = Review(
        buyer_id=current_user.user_id,
        seller_id=order_item.listing.seller_id,
        listing_id=order_item.listing_id,
        order_item_id=review_data.order_item_id,
        rating=review_data.rating,
        comment=review_data.comment
    )
    
    try:
        db.add(db_review)
        await db.commit()
        await db.refresh(db_review)
        logger.info(
            f"Reseña creada exitosamente: ID {db_review.review_id} "
            f"para listing {order_item.listing_id}"
        )
        return db_review
    except Exception as e:
        await db.rollback()
        logger.error(f"Error al crear reseña: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear la reseña"
        )


async def get_listing_reviews(
    db: AsyncSession,
    listing_id: int,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[Review], int, Optional[float]]:
    """
    Obtiene lista paginada de reseñas de una publicación.
    
    Args:
        db: Sesión asíncrona de base de datos.
        listing_id: ID de la publicación.
        skip: Número de registros a omitir.
        limit: Número máximo de registros.
        
    Returns:
        Tupla (lista de reseñas, total, calificación promedio).
        
    Note:
        Las reseñas se ordenan por fecha (más recientes primero).
        Se incluye eager loading del reviewer para mostrar nombres.
    """
    logger.info(f"Obteniendo reseñas del listing {listing_id}")
    
    # Validar que el listing exista
    listing_stmt = select(Listing).where(Listing.listing_id == listing_id)
    listing_result = await db.execute(listing_stmt)
    listing = listing_result.scalar_one_or_none()
    
    if not listing:
        logger.warning(f"Listing {listing_id} no encontrado")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Publicación con ID {listing_id} no encontrada"
        )
    
    # Query base con eager loading del buyer (reviewer)
    stmt = select(Review).options(
        selectinload(Review.buyer)
    ).where(Review.listing_id == listing_id)
    
    # Contar total
    count_stmt = select(func.count()).select_from(
        select(Review).where(Review.listing_id == listing_id).subquery()
    )
    total = (await db.execute(count_stmt)).scalar() or 0
    
    # Calcular promedio de rating
    avg_stmt = select(func.avg(Review.rating)).where(Review.listing_id == listing_id)
    average_rating = (await db.execute(avg_stmt)).scalar()
    
    # Aplicar ordenamiento y paginación
    stmt = stmt.order_by(Review.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    reviews = result.scalars().all()
    
    logger.info(
        f"Encontradas {len(reviews)} de {total} reseñas "
        f"(promedio: {average_rating or 0})"
    )
    return list(reviews), total, float(average_rating) if average_rating else None


async def get_seller_reviews(
    db: AsyncSession,
    seller_id: UUID,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[Review], int, Optional[float]]:
    """
    Obtiene lista paginada de reseñas recibidas por un vendedor.
    
    Args:
        db: Sesión asíncrona de base de datos.
        seller_id: UUID del vendedor.
        skip: Número de registros a omitir.
        limit: Número máximo de registros.
        
    Returns:
        Tupla (lista de reseñas, total, calificación promedio).
        
    Note:
        Se obtienen reseñas de todas las publicaciones del vendedor.
    """
    logger.info(f"Obteniendo reseñas del vendedor {seller_id}")
    
    # Validar que el vendedor exista
    seller_stmt = select(User).where(User.user_id == seller_id)
    seller_result = await db.execute(seller_stmt)
    seller = seller_result.scalar_one_or_none()
    
    if not seller:
        logger.warning(f"Vendedor {seller_id} no encontrado")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario con ID {seller_id} no encontrado"
        )
    
    # Subquery para obtener listings del vendedor
    seller_listings_subquery = select(Listing.listing_id).where(
        Listing.seller_id == seller_id
    ).subquery()
    
    # Query base con eager loading
    stmt = select(Review).options(
        selectinload(Review.buyer),
        selectinload(Review.listing)
    ).where(Review.listing_id.in_(select(seller_listings_subquery)))
    
    # Contar total
    count_stmt = select(func.count()).select_from(
        select(Review).where(
            Review.listing_id.in_(select(seller_listings_subquery))
        ).subquery()
    )
    total = (await db.execute(count_stmt)).scalar() or 0
    
    # Calcular promedio de rating
    avg_stmt = select(func.avg(Review.rating)).where(
        Review.listing_id.in_(select(seller_listings_subquery))
    )
    average_rating = (await db.execute(avg_stmt)).scalar()
    
    # Aplicar ordenamiento y paginación
    stmt = stmt.order_by(Review.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    reviews = result.scalars().all()
    
    logger.info(
        f"Encontradas {len(reviews)} de {total} reseñas del vendedor "
        f"(promedio: {average_rating or 0})"
    )
    return list(reviews), total, float(average_rating) if average_rating else None


async def get_user_reviews(
    db: AsyncSession,
    user_id: UUID,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[Review], int]:
    """
    Obtiene lista paginada de reseñas creadas por un usuario.
    
    Args:
        db: Sesión asíncrona de base de datos.
        user_id: UUID del usuario.
        skip: Número de registros a omitir.
        limit: Número máximo de registros.
        
    Returns:
        Tupla (lista de reseñas, total).
        
    Note:
        Útil para ver el historial de reseñas del usuario.
    """
    logger.info(f"Obteniendo reseñas creadas por usuario {user_id}")
    
    # Query base con eager loading
    stmt = select(Review).options(
        selectinload(Review.listing)
    ).where(Review.buyer_id == user_id)
    
    # Contar total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0
    
    # Aplicar ordenamiento y paginación
    stmt = stmt.order_by(Review.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    reviews = result.scalars().all()
    
    logger.info(f"Encontradas {len(reviews)} de {total} reseñas del usuario")
    return list(reviews), total


async def get_review_statistics(
    db: AsyncSession,
    listing_id: int
) -> dict:
    """
    Obtiene estadísticas de reseñas de una publicación.
    
    Args:
        db: Sesión asíncrona de base de datos.
        listing_id: ID de la publicación.
        
    Returns:
        Diccionario con estadísticas.
        
    Note:
        Incluye distribución de ratings y promedio.
    """
    logger.info(f"Obteniendo estadísticas de reseñas para listing {listing_id}")
    
    # Total de reseñas
    total_stmt = select(func.count()).select_from(Review).where(
        Review.listing_id == listing_id
    )
    total = (await db.execute(total_stmt)).scalar() or 0
    
    # Promedio
    avg_stmt = select(func.avg(Review.rating)).where(Review.listing_id == listing_id)
    average_rating = (await db.execute(avg_stmt)).scalar() or 0.0
    
    # Distribución de ratings
    distribution_stmt = select(
        Review.rating,
        func.count(Review.review_id)
    ).where(Review.listing_id == listing_id).group_by(Review.rating)
    
    distribution_result = await db.execute(distribution_stmt)
    rating_distribution = {
        str(rating): count for rating, count in distribution_result.all()
    }
    
    # Asegurar que todos los ratings estén presentes
    for i in range(1, 6):
        if str(i) not in rating_distribution:
            rating_distribution[str(i)] = 0
    
    stats = {
        "total_reviews": total,
        "average_rating": float(average_rating),
        "rating_distribution": rating_distribution,
    }
    
    logger.info(f"Estadísticas calculadas: {stats}")
    return stats


async def get_seller_review_summary(
    db: AsyncSession,
    seller_id: UUID
) -> dict:
    """
    Obtiene resumen de reseñas de un vendedor.
    
    Args:
        db: Sesión asíncrona de base de datos.
        seller_id: UUID del vendedor.
        
    Returns:
        Diccionario con resumen.
    """
    logger.info(f"Obteniendo resumen de reseñas del vendedor {seller_id}")
    
    # Subquery de listings del vendedor
    seller_listings_subquery = select(Listing.listing_id).where(
        Listing.seller_id == seller_id
    ).subquery()
    
    # Total de reseñas
    total_stmt = select(func.count()).select_from(Review).where(
        Review.listing_id.in_(select(seller_listings_subquery))
    )
    total = (await db.execute(total_stmt)).scalar() or 0
    
    # Promedio
    avg_stmt = select(func.avg(Review.rating)).where(
        Review.listing_id.in_(select(seller_listings_subquery))
    )
    average_rating = (await db.execute(avg_stmt)).scalar() or 0.0
    
    # Total de listings con reseñas
    listings_with_reviews_stmt = select(
        func.count(func.distinct(Review.listing_id))
    ).where(Review.listing_id.in_(select(seller_listings_subquery)))
    
    total_listings_reviewed = (await db.execute(listings_with_reviews_stmt)).scalar() or 0
    
    summary = {
        "seller_id": seller_id,
        "total_reviews": total,
        "average_rating": float(average_rating),
        "total_listings_reviewed": total_listings_reviewed,
    }
    
    logger.info(f"Resumen calculado: {summary}")
    return summary