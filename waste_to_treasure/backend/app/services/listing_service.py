# Autor: Arturo Perez Gonzalez
# Fecha: 08/11/2024
# Descripción: Servicio de lógica de negocio para publicaciones (listings).
#              Implementa operaciones CRUD asíncronas, validaciones de categorías,
#              manejo de imágenes, filtros de búsqueda y moderación por administradores.

"""
Capa de servicio para Listing.

Implementa la lógica de negocio para operaciones CRUD sobre listings,
incluyendo validaciones, manejo de imágenes y moderación.

Este servicio está completamente asíncrono para aprovechar la arquitectura
de FastAPI y SQLAlchemy 2.0 async, mejorando el rendimiento y escalabilidad.
"""
import logging
from typing import List, Optional, Tuple
from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from fastapi import UploadFile, HTTPException, status

from app.models.listing import Listing, ListingStatusEnum
from app.models.listing_image import ListingImage
from app.models.category import Category, ListingTypeEnum
from app.models.user import User, UserStatusEnum
from app.schemas.listing import (
    ListingCreate, ListingUpdate, ListingStatusUpdate
)
from app.services.aws_s3_service import S3Service

logger = logging.getLogger(__name__)


async def create_listing(
    db: AsyncSession,
    listing_data: ListingCreate,
    seller_id: UUID
) -> Listing:
    """
    Autor: Arturo Perez Gonzalez
    Descripción: Crea una nueva publicación con validaciones de negocio y manejo de imágenes.
    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        listing_data (ListingCreate): Datos de la publicación a crear.
        seller_id (UUID): UUID del vendedor que crea la publicación.
    Retorna:
        Listing: Publicación creada con estado PENDING.
    Raises:
        HTTPException: Si la categoría no existe, no coincide el tipo o el vendedor no está activo.
    """
    # Validar que la categoría existe y coincide con el tipo
    await _validate_category(db, listing_data.category_id, listing_data.listing_type)

    # Validar que el usuario existe y está activo
    await _validate_seller(db, seller_id)

    # Crear el listing
    db_listing = Listing(
        seller_id=seller_id,
        category_id=listing_data.category_id,
        listing_type=listing_data.listing_type,
        title=listing_data.title,
        description=listing_data.description,
        price=listing_data.price,
        price_unit=listing_data.price_unit,
        quantity=listing_data.quantity,
        origin_description=listing_data.origin_description,
        location_address_id=listing_data.location_address_id,
        status=ListingStatusEnum.PENDING  # Siempre inicia en PENDING
    )

    db.add(db_listing)
    await db.commit()
    await db.refresh(db_listing)
    
    # Si se proporcionaron URLs de imágenes, crearlas
    if listing_data.images and len(listing_data.images) > 0:
        logger.info(f"Agregando {len(listing_data.images)} imágenes al listing {db_listing.listing_id}")
        for idx, image_url in enumerate(listing_data.images):
            db_image = ListingImage(
                listing_id=db_listing.listing_id,
                image_url=image_url,
                is_primary=(idx == 0)  # La primera imagen es la principal
            )
            db.add(db_image)
        
        await db.commit()
        logger.info(f"Imágenes agregadas correctamente al listing {db_listing.listing_id}")
    
    # Cargar las relaciones explícitamente para evitar lazy loading
    stmt = (
        select(Listing)
        .options(selectinload(Listing.images))
        .where(Listing.listing_id == db_listing.listing_id)
    )
    result = await db.execute(stmt)
    db_listing = result.scalar_one()

    logger.info(f"Listing {db_listing.listing_id} creado por seller {seller_id}")

    return db_listing


async def get_listing_by_id(
    db: AsyncSession,
    listing_id: int,
    include_inactive: bool = False
) -> Optional[Listing]:
    """
    Autor: Arturo Perez Gonzalez
    Descripción: Obtiene una publicación por ID con sus imágenes, categoría y vendedor.
    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        listing_id (int): ID del listing a buscar.
        include_inactive (bool): Si True, incluye listings inactivos (default: False).
    Retorna:
        Optional[Listing]: Listing encontrado con relaciones cargadas, o None si no existe.
    """
    stmt = (
        select(Listing)
        .options(
            selectinload(Listing.images),
            selectinload(Listing.category),
            selectinload(Listing.seller)
        )
        .where(Listing.listing_id == listing_id)
    )

    if not include_inactive:
        stmt = stmt.where(Listing.status == ListingStatusEnum.ACTIVE)

    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_public_listings(
    db: AsyncSession,
    listing_type: Optional[ListingTypeEnum] = None,
    category_id: Optional[int] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
    search_query: Optional[str] = None,
    page: int = 1,
    page_size: int = 20
) -> Tuple[List[Listing], int]:
    """
    Autor: Arturo Perez Gonzalez
    Descripción: Obtiene listado público de listings activos con filtros y paginación.
    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        listing_type (Optional[ListingTypeEnum]): Filtro opcional por tipo (MATERIAL o PRODUCT).
        category_id (Optional[int]): Filtro opcional por categoría.
        min_price (Optional[Decimal]): Precio mínimo.
        max_price (Optional[Decimal]): Precio máximo.
        search_query (Optional[str]): Búsqueda en título y descripción.
        page (int): Número de página (default: 1).
        page_size (int): Tamaño de página (default: 20).
    Retorna:
        Tuple[List[Listing], int]: Tupla con (lista de listings, total de registros).
    """
    # Query base: solo listings activos
    stmt = (
        select(Listing)
        .options(
            selectinload(Listing.images),
            selectinload(Listing.category),
            selectinload(Listing.seller)
        )
        .where(Listing.status == ListingStatusEnum.ACTIVE)
    )

    # Aplicar filtros
    if listing_type:
        stmt = stmt.where(Listing.listing_type == listing_type)

    if category_id:
        stmt = stmt.where(Listing.category_id == category_id)

    if min_price is not None:
        stmt = stmt.where(Listing.price >= min_price)

    if max_price is not None:
        stmt = stmt.where(Listing.price <= max_price)

    if search_query:
        search_filter = or_(
            Listing.title.ilike(f"%{search_query}%"),
            Listing.description.ilike(f"%{search_query}%")
        )
        stmt = stmt.where(search_filter)

    # Obtener total de registros
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar()

    # Aplicar paginación y ordenamiento
    skip = (page - 1) * page_size
    stmt = stmt.order_by(Listing.created_at.desc()).offset(skip).limit(page_size)

    result = await db.execute(stmt)
    listings = result.scalars().all()

    return list(listings), total


async def get_seller_listings(
    db: AsyncSession,
    seller_id: UUID,
    status_filter: Optional[ListingStatusEnum] = None,
    page: int = 1,
    page_size: int = 20
) -> Tuple[List[Listing], int]:
    """
    Obtiene listings de un vendedor específico.

    Args:
        db: Sesión asíncrona de base de datos.
        seller_id: UUID del vendedor.
        status_filter: Filtro opcional por estado.
        page: Número de página.
        page_size: Tamaño de página.

    Returns:
        Tupla con (lista de listings, total de registros).
    """
    stmt = (
        select(Listing)
        .options(
            selectinload(Listing.images),
            selectinload(Listing.category),
            selectinload(Listing.seller)
        )
        .where(Listing.seller_id == seller_id)
    )

    if status_filter:
        stmt = stmt.where(Listing.status == status_filter)

    # Obtener total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar()

    # Paginación
    skip = (page - 1) * page_size
    stmt = stmt.order_by(Listing.created_at.desc()).offset(skip).limit(page_size)

    result = await db.execute(stmt)
    listings = result.scalars().all()

    return list(listings), total


async def update_listing(
    db: AsyncSession,
    listing_id: int,
    seller_id: UUID,
    listing_data: ListingUpdate
) -> Listing:
    """
    Autor: Arturo Perez Gonzalez
    Descripción: Actualiza un listing existente y lo envía a revisión si estaba activo.
    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        listing_id (int): ID del listing a actualizar.
        seller_id (UUID): UUID del vendedor (para validación de permisos).
        listing_data (ListingUpdate): Datos actualizados de la publicación.
    Retorna:
        Listing: Listing actualizado.
    Raises:
        HTTPException: Si el listing no existe o el vendedor no tiene permisos.
    """
    db_listing = await get_listing_by_id(db, listing_id, include_inactive=True)

    if not db_listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing no encontrado"
        )

    # Verificar permisos
    if db_listing.seller_id != seller_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para actualizar este listing"
        )

    # Actualizar campos
    update_data = listing_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_listing, field, value)

    # Si el listing estaba ACTIVE o REJECTED, cambiar a PENDING para nueva revisión
    if db_listing.status in [ListingStatusEnum.ACTIVE, ListingStatusEnum.REJECTED]:
        db_listing.status = ListingStatusEnum.PENDING
        db_listing.approved_by_admin_id = None
        db_listing.rejection_reason = None  # Limpiar razón de rechazo anterior
        logger.info(f"Listing {listing_id} movido a PENDING para nueva revisión (estado anterior: {db_listing.status})")

    await db.commit()
    await db.refresh(db_listing)

    logger.info(f"Listing {listing_id} actualizado por seller {seller_id}")

    return db_listing


async def delete_listing(
    db: AsyncSession,
    listing_id: int,
    seller_id: UUID
) -> bool:
    """
    Autor: Arturo Perez Gonzalez
    Descripción: Desactiva un listing (soft delete) cambiando su estado a INACTIVE.
    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        listing_id (int): ID del listing a desactivar.
        seller_id (UUID): UUID del vendedor (para validación de permisos).
    Retorna:
        bool: True si se desactivó correctamente.
    Raises:
        HTTPException: Si el listing no existe o el vendedor no tiene permisos.
    """
    db_listing = await get_listing_by_id(db, listing_id, include_inactive=True)

    if not db_listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing no encontrado"
        )

    if db_listing.seller_id != seller_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para eliminar este listing"
        )

    db_listing.status = ListingStatusEnum.INACTIVE
    await db.commit()

    logger.info(f"Listing {listing_id} desactivado por seller {seller_id}")

    return True


async def add_images_to_listing(
    db: AsyncSession,
    listing_id: int,
    seller_id: UUID,
    image_urls: List[str]
) -> List[ListingImage]:
    """
    Agrega imágenes ya subidas a S3 al listing.

    Args:
        db: Sesión asíncrona de base de datos.
        listing_id: ID del listing.
        seller_id: UUID del vendedor (para validación).
        image_urls: Lista de URLs de imágenes en S3.

    Returns:
        Lista de ListingImage creados.

    Raises:
        HTTPException: Si hay errores de validación.
    """
    # Validar que el listing existe y pertenece al seller
    db_listing = await get_listing_by_id(db, listing_id, include_inactive=True)

    if not db_listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing no encontrado"
        )

    if db_listing.seller_id != seller_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para agregar imágenes a este listing"
        )

    # Validar número de imágenes (máximo 10)
    current_images = len(db_listing.images)
    if current_images + len(image_urls) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Máximo 10 imágenes por listing. Ya tienes {current_images}"
        )

    # Crear registros de imágenes
    created_images = []

    for idx, image_url in enumerate(image_urls):
        # La primera imagen es la principal si no hay imágenes previas
        is_primary = (idx == 0) and (current_images == 0)

        db_image = ListingImage(
            listing_id=listing_id,
            image_url=image_url,
            is_primary=is_primary
        )

        db.add(db_image)
        created_images.append(db_image)

    await db.commit()

    # Refrescar las imágenes para obtener sus IDs
    for img in created_images:
        await db.refresh(img)

    logger.info(f"{len(created_images)} imágenes agregadas al listing {listing_id}")

    return created_images


async def update_listing_status(
    db: AsyncSession,
    listing_id: int,
    status_update: ListingStatusUpdate,
    admin_id: UUID
) -> Listing:
    """
    Actualiza el estado de un listing (moderación por admin).

    Args:
        db: Sesión asíncrona de base de datos.
        listing_id: ID del listing.
        status_update: Nuevo estado y motivo.
        admin_id: UUID del administrador.

    Returns:
        Listing actualizado.

    Raises:
        HTTPException: Si el listing no existe.
    """
    db_listing = await get_listing_by_id(db, listing_id, include_inactive=True)

    if not db_listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing no encontrado"
        )

    db_listing.status = status_update.status

    if status_update.status == ListingStatusEnum.ACTIVE:
        db_listing.approved_by_admin_id = admin_id

    await db.commit()
    await db.refresh(db_listing)

    logger.info(
        f"Listing {listing_id} cambió a estado {status_update.status} "
        f"por admin {admin_id}"
    )

    return db_listing


def convert_to_card_response(listing: Listing) -> dict:
    """
    Convierte un Listing a formato de tarjeta para respuestas de listado.

    Args:
        listing: Objeto Listing de SQLAlchemy.

    Returns:
        Diccionario con formato para ListingCardRead.
    """
    # Obtener imagen principal
    primary_image = None
    if listing.images:
        for img in listing.images:
            if img.is_primary:
                primary_image = str(img.image_url)
                break
        # Si no hay imagen marcada como principal, usar la primera
        if not primary_image:
            primary_image = str(listing.images[0].image_url)

    return {
        "listing_id": listing.listing_id,
        "title": listing.title,
        "price": listing.price,
        "price_unit": listing.price_unit,
        "listing_type": listing.listing_type,
        "status": listing.status,
        "primary_image_url": primary_image,
        "seller_id": listing.seller_id,
        "seller": listing.seller,
        "seller_name": listing.seller.full_name if listing.seller else None,
        "category_name": listing.category.name if listing.category else None,
        "quantity": listing.quantity,
        "created_at": listing.created_at
    }


# ========== FUNCIONES PRIVADAS DE VALIDACIÓN ==========

async def _validate_category(
    db: AsyncSession,
    category_id: int,
    listing_type: ListingTypeEnum
) -> None:
    """
    Valida que la categoría existe y coincide con el tipo.

    Args:
        db: Sesión asíncrona de base de datos.
        category_id: ID de la categoría.
        listing_type: Tipo de listing esperado.

    Raises:
        HTTPException: Si la categoría no existe o no coincide el tipo.
    """
    result = await db.execute(
        select(Category).where(Category.category_id == category_id)
    )
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Categoría no encontrada"
        )

    if category.type != listing_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La categoría debe ser de tipo {listing_type.value}"
        )


async def _validate_seller(db: AsyncSession, seller_id: UUID) -> None:
    """
    Valida que el vendedor existe y está activo.

    Args:
        db: Sesión asíncrona de base de datos.
        seller_id: UUID del vendedor.

    Raises:
        HTTPException: Si el usuario no existe o no está activo.
    """
    result = await db.execute(
        select(User).where(User.user_id == seller_id)
    )
    seller = result.scalar_one_or_none()

    if not seller:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario no encontrado"
        )

    if seller.status != UserStatusEnum.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta debe estar activa para crear listings"
        )
