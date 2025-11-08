"""
Endpoints de la API para Métodos de Envío (Shipping).

Permite a los vendedores (usuarios autenticados) gestionar
su propio catálogo de métodos de envío.
"""
import logging
from typing import Annotated, List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db, get_current_active_user
from app.models.user import User
# Importamos los nuevos schemas añadidos
from app.schemas.shipping import (
    ShippingMethodRead, 
    ShippingMethodCreate, 
    ShippingMethodUpdate,
    ListingShippingOptionRead,
    ListingShippingOptionCreate
)
from app.services.shipping_service import shipping_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/me/shipping_methods",
    response_model=ShippingMethodRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un método de envío",
    description="Crea un nuevo método de envío (ej. 'Envío Estándar') "
                "para el vendedor autenticado."
)
async def create_shipping_method(
    shipping_data: ShippingMethodCreate,
    db: Annotated[AsyncSession, Depends(get_async_db)],
    user: Annotated[User, Depends(get_current_active_user)]
) -> ShippingMethodRead:
    
    return await shipping_service.create_shipping_method(db, shipping_data, user)


@router.get(
    "/me/shipping_methods",
    response_model=List[ShippingMethodRead],
    summary="Listar mis métodos de envío",
    description="Obtiene una lista de todos los métodos de envío "
                "creados por el vendedor autenticado."
)
async def get_my_shipping_methods(
    db: Annotated[AsyncSession, Depends(get_async_db)],
    user: Annotated[User, Depends(get_current_active_user)]
) -> List[ShippingMethodRead]:
    
    return await shipping_service.get_seller_shipping_methods(db, user)


@router.patch(
    "/me/shipping_methods/{method_id}",
    response_model=ShippingMethodRead,
    summary="Actualizar un método de envío",
    description="Actualiza un método de envío existente que pertenece "
                "al vendedor autenticado."
)
async def update_my_shipping_method(
    method_id: int,
    shipping_data: ShippingMethodUpdate,
    db: Annotated[AsyncSession, Depends(get_async_db)],
    user: Annotated[User, Depends(get_current_active_user)]
) -> ShippingMethodRead:
    
    return await shipping_service.update_shipping_method(
        db, method_id, shipping_data, user
    )


@router.delete(
    "/me/shipping_methods/{method_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar un método de envío",
    description="Elimina un método de envío del vendedor. "
                "Esto lo desasociará de todas las publicaciones."
)
async def delete_my_shipping_method(
    method_id: int,
    db: Annotated[AsyncSession, Depends(get_async_db)],
    user: Annotated[User, Depends(get_current_active_user)]
):
    
    await shipping_service.delete_shipping_method(db, method_id, user)
    return None # Retorna 204 No Content


# --- (MEJORA AÑADIDA) ---
# Endpoints para Asociar Métodos de Envío a Publicaciones (Listings)
# Esto completa la funcionalidad del Módulo 9.

@router.post(
    "/me/listings/{listing_id}/shipping_methods",
    response_model=ListingShippingOptionRead,
    status_code=status.HTTP_201_CREATED,
    summary="Asociar un método de envío a una publicación",
    description="Permite al vendedor asociar uno de sus métodos de envío "
                "existentes a una de sus publicaciones (listings)."
)
async def add_shipping_to_listing(
    listing_id: int,
    option_data: ListingShippingOptionCreate,
    db: Annotated[AsyncSession, Depends(get_async_db)],
    user: Annotated[User, Depends(get_current_active_user)]
) -> ListingShippingOptionRead:
    """
    Crea la asociación entre un Listing y un ShippingMethod.
    El servicio valida que el usuario sea propietario de ambos.
    """
    association = await shipping_service.add_shipping_option_to_listing(
        db=db,
        listing_id=listing_id,
        method_id=option_data.method_id,
        user=user
    )
    return association


@router.delete(
    "/me/listings/{listing_id}/shipping_methods/{method_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Desasociar un método de envío de una publicación",
    description="Elimina la asociación entre un método de envío y una publicación."
)
async def remove_shipping_from_listing(
    listing_id: int,
    method_id: int,
    db: Annotated[AsyncSession, Depends(get_async_db)],
    user: Annotated[User, Depends(get_current_active_user)]
):
    """
    Elimina la asociación (ListingShippingOption).
    El servicio valida que el usuario sea propietario del listing.
    """
    await shipping_service.remove_shipping_option_from_listing(
        db=db,
        listing_id=listing_id,
        method_id=method_id,
        user=user
    )
    return None # Retorna 204 No Content