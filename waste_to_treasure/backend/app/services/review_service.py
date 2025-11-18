# Autor: Gabriel Florentino Reyes
# Fecha: 08-11-2025
# Descripción: Servicio de reseñas de la plataforma.
#              Contiene la lógica de negocio para:
#               - Crear reseñas verificadas por compra.
#               - Validar existencia de entidades.
#               - Consultar reseñas por listing, vendedor o usuario.
#               - Obtener estadísticas y resúmenes.
#               - Manejar excepciones y logging de acciones.

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
    Autor: Gabriel Florentino Reyes

    Descripción: Crea una nueva reseña para un item comprado, validando
                 que el usuario haya comprado el item y evitando reseñas duplicadas.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        review_data (ReviewCreate): Datos de la reseña a crear.
        current_user (User): Usuario autenticado que realiza la reseña.

    Retorna:
        Review: Reseña creada.
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
    Autor: Gabriel Florentino Reyes

    Descripción: Obtiene reseñas de un listing específico con paginación
                 y cálculo del rating promedio.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        listing_id (int): ID del listing.
        skip (int): Número de registros a omitir.
        limit (int): Número máximo de registros a retornar.

    Retorna:
        Tuple[List[Review], int, Optional[float]]: Lista de reseñas, total y promedio de rating.
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
    Autor: Gabriel Florentino Reyes

    Descripción: Obtiene reseñas recibidas por un vendedor con paginación
                 y cálculo del rating promedio.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        seller_id (UUID): ID del vendedor.
        skip (int): Número de registros a omitir.
        limit (int): Número máximo de registros a retornar.

    Retorna:
        Tuple[List[Review], int, Optional[float]]: Lista de reseñas, total y promedio de rating.
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
    Autor: Gabriel Florentino Reyes

    Descripción: Obtiene reseñas creadas por un usuario con paginación.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        user_id (UUID): ID del usuario.
        skip (int): Número de registros a omitir.
        limit (int): Número máximo de registros a retornar.

    Retorna:
        Tuple[List[Review], int]: Lista de reseñas y total de reseñas.
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
    Autor: Gabriel Florentino Reyes

    Descripción: Obtiene estadísticas de reseñas de un listing, incluyendo
                 promedio de rating y distribución de ratings.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        listing_id (int): ID del listing.

    Retorna:
        dict: Estadísticas de reseñas.
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
    Autor: Gabriel Florentino Reyes

    Descripción: Obtiene un resumen de reseñas de un vendedor, incluyendo
                 total de reseñas, promedio de rating y total de listings con reseñas.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        seller_id (UUID): ID del vendedor.

    Retorna:
        dict: Resumen de reseñas del vendedor.
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