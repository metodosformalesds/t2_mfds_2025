"""
Endpoints de la API para Listings.

Implementa operaciones CRUD sobre publicaciones de materiales y productos.
Endpoints de lectura son públicos, endpoints de modificación requieren autenticación.
"""
import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db, get_current_active_user
from app.models.user import User
from app.models.listing import ListingStatusEnum
from app.models.category import ListingTypeEnum
from app.schemas.listing import (
    ListingCreate,
    ListingUpdate,
    ListingRead,
    ListingCardRead,
    ListingListResponse,
    ListingImageRead
)
from app.services import listing_service
from app.services.aws_s3_service import s3_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "",
    response_model=ListingRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva publicación",
    description="Crea una nueva publicación de material o producto. Requiere autenticación.",
    responses={
        201: {"description": "Publicación creada exitosamente"},
        400: {"description": "Datos de entrada inválidos"},
        401: {"description": "No autenticado"},
    }
)
@router.post(
    "/",
    response_model=ListingRead,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False
)
async def create_listing(
    listing_in: ListingCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
) -> ListingRead:
    """
    Crea una nueva publicación.

    **Requiere autenticación**

    - La publicación se crea con estado PENDING (requiere aprobación de admin)
    - La categoría debe coincidir con el listing_type
    - El usuario debe estar activo

    **Ejemplo de request body**:
    ```json
    {
        "title": "Madera reciclada de pallets",
        "description": "Madera de alta calidad proveniente de pallets industriales...",
        "price": 150.00,
        "price_unit": "m3",
        "quantity": 500,
        "category_id": 1,
        "listing_type": "MATERIAL",
        "origin_description": "Pallets de importación europea"
    }
    ```
    """
    logger.info(
        f"Usuario {current_user.user_id} creando listing: {listing_in.title} "
        f"({listing_in.listing_type.value})"
    )

    listing = await listing_service.create_listing(
        db=db,
        listing_data=listing_in,
        seller_id=current_user.user_id
    )

    return listing


# Definir endpoint con y sin trailing slash para evitar redirects 307
@router.get(
    "",  # Sin trailing slash
    response_model=ListingListResponse,
    summary="Listar publicaciones públicas",
    description="Obtiene lista paginada de publicaciones activas con filtros opcionales.",
    responses={
        200: {"description": "Lista de publicaciones obtenida exitosamente"},
    }
)
@router.get(
    "/",  # Con trailing slash (alias)
    response_model=ListingListResponse,
    include_in_schema=False,  # No duplicar en docs
)
async def list_public_listings(
    db: AsyncSession = Depends(get_async_db),
    listing_type: Optional[ListingTypeEnum] = Query(
        None, description="Filtrar por tipo de marketplace"
    ),
    category_id: Optional[int] = Query(None, description="Filtrar por categoría"),
    min_price: Optional[float] = Query(None, ge=0, description="Precio mínimo"),
    max_price: Optional[float] = Query(None, ge=0, description="Precio máximo"),
    search: Optional[str] = Query(
        None, min_length=3, description="Buscar en título y descripción"
    ),
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(20, ge=1, le=100, description="Elementos por página")
) -> ListingListResponse:
    """
    Lista publicaciones activas con filtros y paginación.

    **No requiere autenticación**

    - Solo muestra publicaciones con estado ACTIVE
    - Soporta búsqueda por texto y múltiples filtros

    **Filtros disponibles**:
    - `listing_type`: MATERIAL o PRODUCT
    - `category_id`: ID de categoría
    - `min_price`, `max_price`: Rango de precios
    - `search`: Búsqueda en título y descripción

    **Paginación**:
    - `page`: Número de página (default: 1)
    - `page_size`: Elementos por página (default: 20, max: 100)
    """
    logger.info(
        f"Listando publicaciones: type={listing_type}, category={category_id}, "
        f"page={page}, page_size={page_size}"
    )

    listings, total = await listing_service.get_public_listings(
        db=db,
        listing_type=listing_type,
        category_id=category_id,
        min_price=min_price,
        max_price=max_price,
        search_query=search,
        page=page,
        page_size=page_size
    )

    # Convertir a cards
    items = [
        ListingCardRead(**listing_service.convert_to_card_response(listing))
        for listing in listings
    ]

    return ListingListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=items
    )


@router.get(
    "/me",
    response_model=ListingListResponse,
    summary="Listar mis publicaciones",
    description="Obtiene lista paginada de publicaciones del usuario autenticado.",
    responses={
        200: {"description": "Lista de publicaciones obtenida exitosamente"},
        401: {"description": "No autenticado"},
    }
)
async def list_my_listings(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
    status_filter: Optional[ListingStatusEnum] = Query(
        None, description="Filtrar por estado"
    ),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
) -> ListingListResponse:
    """
    Lista las publicaciones del usuario autenticado.

    **Requiere autenticación**

    - Muestra todas las publicaciones del usuario (cualquier estado)
    - Útil para el dashboard de "Mis Publicaciones"

    **Filtros**:
    - `status_filter`: Filtrar por estado (PENDING, ACTIVE, REJECTED, INACTIVE)
    """
    logger.info(
        f"Usuario {current_user.user_id} listando sus publicaciones "
        f"(status={status_filter}, page={page})"
    )

    listings, total = await listing_service.get_seller_listings(
        db=db,
        seller_id=current_user.user_id,
        status_filter=status_filter,
        page=page,
        page_size=page_size
    )

    # Convertir a cards
    items = [
        ListingCardRead(**listing_service.convert_to_card_response(listing))
        for listing in listings
    ]

    return ListingListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=items
    )


@router.get(
    "/{listing_id}",
    response_model=ListingRead,
    summary="Obtener publicación por ID",
    description="Obtiene los detalles completos de una publicación específica.",
    responses={
        200: {"description": "Publicación encontrada"},
        404: {"description": "Publicación no encontrada o no disponible"},
    }
)
async def get_listing_detail(
    listing_id: int,
    db: AsyncSession = Depends(get_async_db)
) -> ListingRead:
    """
    Obtiene detalles completos de una publicación.

    **No requiere autenticación**

    - Solo muestra publicaciones con estado ACTIVE
    - Incluye todas las imágenes y datos completos

    **Ejemplo de respuesta**:
    ```json
    {
        "listing_id": 1,
        "title": "Madera reciclada de pallets",
        "price": 150.00,
        "status": "ACTIVE",
        "images": [...],
        ...
    }
    ```
    """
    logger.info(f"Obteniendo detalles del listing {listing_id}")

    listing = await listing_service.get_listing_by_id(
        db=db,
        listing_id=listing_id,
        include_inactive=False
    )

    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Publicación no encontrada o no disponible"
        )

    return listing


@router.patch(
    "/{listing_id}",
    response_model=ListingRead,
    summary="Actualizar publicación",
    description="Actualiza una publicación existente. Requiere autenticación y ownership.",
    responses={
        200: {"description": "Publicación actualizada exitosamente"},
        400: {"description": "Datos de entrada inválidos o listing no editable"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos (no es el owner)"},
        404: {"description": "Publicación no encontrada"},
    }
)
async def update_listing(
    listing_id: int,
    listing_in: ListingUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
) -> ListingRead:
    """
    Actualiza una publicación existente (actualización parcial).

    **Requiere autenticación y ser el owner**

    **Validaciones**:
    - La publicación debe existir
    - Solo el vendedor propietario puede actualizar
    - No se puede actualizar si está en estado REJECTED

    **Campos actualizables**:
    - `title`, `description`, `price`, `price_unit`
    - `quantity`, `origin_description`, `location_address_id`

    **Nota**: Todos los campos son opcionales. Solo se actualizan los campos proporcionados.
    """
    logger.info(f"Usuario {current_user.user_id} actualizando listing {listing_id}")

    listing = await listing_service.update_listing(
        db=db,
        listing_id=listing_id,
        seller_id=current_user.user_id,
        listing_data=listing_in
    )

    return listing


@router.delete(
    "/{listing_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar publicación",
    description="Desactiva una publicación (soft delete). Requiere autenticación y ownership.",
    responses={
        204: {"description": "Publicación eliminada exitosamente"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos (no es el owner)"},
        404: {"description": "Publicación no encontrada"},
    }
)
async def delete_listing(
    listing_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
) -> None:
    """
    Desactiva una publicación (soft delete).

    **Requiere autenticación y ser el owner**

    - Solo el vendedor propietario puede eliminar
    - Cambia el estado a INACTIVE
    - La publicación no se elimina físicamente

    **Retorna**: 204 No Content (sin cuerpo de respuesta)
    """
    logger.info(f"Usuario {current_user.user_id} eliminando listing {listing_id}")

    await listing_service.delete_listing(
        db=db,
        listing_id=listing_id,
        seller_id=current_user.user_id
    )

    return None


@router.post(
    "/{listing_id}/images",
    response_model=List[ListingImageRead],
    summary="Agregar imágenes a publicación",
    description="Agrega imágenes adicionales a una publicación. Requiere autenticación y ownership.",
    responses={
        200: {"description": "Imágenes agregadas exitosamente"},
        400: {"description": "Datos inválidos o máximo de imágenes excedido"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos (no es el owner)"},
        404: {"description": "Publicación no encontrada"},
    }
)
async def upload_listing_images(
    listing_id: int,
    image_urls: List[str] = Query(..., description="URLs de imágenes en S3"),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
) -> List[ListingImageRead]:
    """
    Agrega imágenes adicionales a una publicación.

    **Requiere autenticación y ser el owner**

    - Solo el vendedor propietario puede agregar imágenes
    - Máximo 10 imágenes por publicación
    - Las URLs deben apuntar a imágenes ya subidas en S3

    **Flujo recomendado**:
    1. Subir imágenes a S3 usando endpoint de upload
    2. Obtener URLs de S3
    3. Llamar este endpoint con las URLs
    """
    logger.info(
        f"Usuario {current_user.user_id} agregando {len(image_urls)} imágenes "
        f"al listing {listing_id}"
    )

    if not image_urls or len(image_urls) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe proporcionar al menos una URL de imagen"
        )

    images = await listing_service.add_images_to_listing(
        db=db,
        listing_id=listing_id,
        seller_id=current_user.user_id,
        image_urls=image_urls
    )

    return images


@router.post(
    "/upload-image",
    response_model=dict,
    summary="Upload imagen a S3",
    description="Sube una imagen directamente a S3 y retorna la URL. Requiere autenticación.",
    responses={
        200: {"description": "Imagen subida exitosamente"},
        400: {"description": "Archivo inválido o demasiado grande"},
        401: {"description": "No autenticado"},
        500: {"description": "Error al subir imagen"},
    }
)
async def upload_image_to_s3(
    file: UploadFile = File(..., description="Archivo de imagen"),
    listing_id: int = Query(..., description="ID del listing"),
    is_primary: bool = Query(False, description="¿Es imagen principal?"),
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """
    Sube una imagen a S3 y retorna la URL.
    
    **Requiere autenticación**
    
    - Tipos permitidos: JPG, JPEG, PNG, WEBP
    - Tamaño máximo: 5MB
    - Retorna URL pública de la imagen en S3
    
    **Flujo:**
    1. Frontend selecciona imagen
    2. Llama a este endpoint con el archivo
    3. Backend sube a S3
    4. Retorna URL
    5. Frontend puede usar la URL para llamar a `POST /{listing_id}/images`
    """
    logger.info(
        f"Usuario {current_user.user_id} subiendo imagen para listing {listing_id}"
    )
    
    try:
        # Upload a S3 usando el servicio
        file_url = await s3_service.upload_listing_image(
            file=file,
            listing_id=listing_id,
            is_primary=is_primary
        )
        
        logger.info(f"Imagen subida exitosamente: {file_url}")
        
        return {
            "success": True,
            "url": file_url,
            "message": "Imagen subida exitosamente"
        }
        
    except HTTPException:
        # Re-raise HTTPExceptions del servicio S3
        raise
    except Exception as e:
        logger.error(f"Error inesperado al subir imagen: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado al subir imagen: {str(e)}"
        )
