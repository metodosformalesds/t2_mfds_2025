"""
Endpoints de la API para Review.

Implementa operaciones para el sistema de reseñas de productos.
Permite a los compradores dejar calificaciones después de una compra.
"""
import logging
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.api.deps import get_async_db, get_current_active_user
from app.models.user import User
from app.schemas.reviews import (
    ReviewRead,
    ReviewCreate,
    ReviewList,
    ReviewStatistics,
    SellerReviewSummary,
)
from app.services import review_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post(
    "/",
    response_model=ReviewRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva reseña",
    description="Crea una reseña para un producto comprado.",
    responses={
        201: {"description": "Reseña creada exitosamente"},
        400: {"description": "Ya existe reseña o datos inválidos"},
        401: {"description": "No autenticado"},
        403: {"description": "No ha comprado el item"},
        404: {"description": "Item de orden no encontrado"},
    }
)
async def create_review(
    review_data: ReviewCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
) -> ReviewRead:
    """
    Crea una nueva reseña para un item comprado.
    
    **Requiere**: Usuario autenticado y haber comprado el item
    """
    logger.info(
        f"Usuario {current_user.user_id} creando reseña para "
        f"order_item {review_data.order_item_id}"
    )
    
    review = await review_service.create_review(db, review_data, current_user)
    
    return review


@router.get(
    "/listing/{listing_id}",
    response_model=ReviewList,
    summary="Listar reseñas de una publicación",
    description="Obtiene lista paginada de reseñas de una publicación específica.",
    responses={
        200: {"description": "Lista de reseñas obtenida exitosamente"},
        404: {"description": "Publicación no encontrada"},
    }
)
async def get_listing_reviews(
    listing_id: int,
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(50, ge=1, le=100, description="Número máximo de registros"),
    db: AsyncSession = Depends(get_async_db)
) -> ReviewList:
    """
    Lista las reseñas de una publicación específica.
    
    **No requiere autenticación** (endpoint público)
    """
    logger.info(
        f"Listando reseñas del listing {listing_id} "
        f"(skip={skip}, limit={limit})"
    )
    
    reviews, total, avg_rating = await review_service.get_listing_reviews(
        db=db,
        listing_id=listing_id,
        skip=skip,
        limit=limit
    )
    
    page = (skip // limit) + 1 if limit > 0 else 1
    
    return ReviewList(
        items=reviews,
        total=total,
        page=page,
        page_size=limit,
        average_rating=avg_rating
    )


@router.get(
    "/user/{user_id}",
    response_model=ReviewList,
    summary="Listar reseñas de un vendedor",
    description="Obtiene lista paginada de reseñas recibidas por un vendedor.",
    responses={
        200: {"description": "Lista de reseñas obtenida exitosamente"},
        404: {"description": "Usuario no encontrado"},
    }
)
async def get_seller_reviews(
    user_id: str,  # UUID como string en path
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(50, ge=1, le=100, description="Número máximo de registros"),
    db: AsyncSession = Depends(get_async_db)
) -> ReviewList:
    """
    Lista las reseñas recibidas por un vendedor.
    
    **No requiere autenticación** (endpoint público)
    """
    logger.info(
        f"Listando reseñas del vendedor {user_id} "
        f"(skip={skip}, limit={limit})"
    )
    
    from uuid import UUID
    try:
        seller_uuid = UUID(user_id)
    except ValueError:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de usuario inválido"
        )
    
    reviews, total, avg_rating = await review_service.get_seller_reviews(
        db=db,
        seller_id=seller_uuid,
        skip=skip,
        limit=limit
    )
    
    page = (skip // limit) + 1 if limit > 0 else 1
    
    return ReviewList(
        items=reviews,
        total=total,
        page=page,
        page_size=limit,
        average_rating=avg_rating
    )


@router.get(
    "/my-reviews",
    response_model=ReviewList,
    summary="Listar mis reseñas",
    description="Obtiene lista paginada de reseñas creadas por el usuario autenticado.",
    responses={
        200: {"description": "Lista de reseñas obtenida exitosamente"},
        401: {"description": "No autenticado"},
    }
)
async def get_my_reviews(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(50, ge=1, le=100, description="Número máximo de registros"),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
) -> ReviewList:
    """
    Lista las reseñas creadas por el usuario actual.
    
    **Requiere**: Usuario autenticado
    """
    logger.info(
        f"Usuario {current_user.user_id} listando sus reseñas "
        f"(skip={skip}, limit={limit})"
    )
    
    reviews, total = await review_service.get_user_reviews(
        db=db,
        user_id=current_user.user_id,
        skip=skip,
        limit=limit
    )
    
    page = (skip // limit) + 1 if limit > 0 else 1
    
    return ReviewList(
        items=reviews,
        total=total,
        page=page,
        page_size=limit,
        average_rating=None  # No calculamos promedio para reseñas del usuario
    )


@router.get(
    "/listing/{listing_id}/statistics",
    response_model=ReviewStatistics,
    summary="Obtener estadísticas de reseñas de una publicación",
    description="Obtiene estadísticas detalladas de las reseñas de una publicación.",
    responses={
        200: {"description": "Estadísticas obtenidas exitosamente"},
        404: {"description": "Publicación no encontrada"},
    }
)
async def get_listing_review_statistics(
    listing_id: int,
    db: AsyncSession = Depends(get_async_db)
) -> ReviewStatistics:
    """
    Obtiene estadísticas de reseñas de una publicación.
    
    **No requiere autenticación** (endpoint público)
    """
    logger.info(f"Obteniendo estadísticas de reseñas para listing {listing_id}")
    
    stats = await review_service.get_review_statistics(db, listing_id)
    
    return ReviewStatistics(**stats)


@router.get(
    "/seller/{user_id}/summary",
    response_model=SellerReviewSummary,
    summary="Obtener resumen de reseñas de un vendedor",
    description="Obtiene resumen consolidado de todas las reseñas de un vendedor.",
    responses={
        200: {"description": "Resumen obtenido exitosamente"},
        404: {"description": "Usuario no encontrado"},
    }
)
async def get_seller_review_summary(
    user_id: str,  # UUID como string en path
    db: AsyncSession = Depends(get_async_db)
) -> SellerReviewSummary:
    """
    Obtiene resumen de reseñas de un vendedor.
    """
    logger.info(f"Obteniendo resumen de reseñas del vendedor {user_id}")
    
    try:
        seller_uuid = UUID(user_id)
    except ValueError:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de usuario inválido"
        )
    
    summary = await review_service.get_seller_review_summary(db, seller_uuid)
    
    return SellerReviewSummary(**summary)