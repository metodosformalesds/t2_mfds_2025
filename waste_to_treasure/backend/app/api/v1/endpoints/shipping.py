# Autor: Alejandro Campa Alonso 215833
# Fecha: 2025-11-08
# Descripción: Endpoints de la API para Métodos de Envío (Shipping). Permite a vendedores gestionar
# su catálogo de métodos de envío y asociarlos a sus publicaciones (listings). Incluye CRUD completo
# para métodos de envío y operaciones de asociación/desasociación con listings.

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
    """
    Crea un nuevo método de envío para el vendedor autenticado.
    
    El método de envío puede ser usado en múltiples publicaciones.
    
    Autor: Alejandro Campa Alonso 215833
    
    Args:
        shipping_data: Datos del método de envío (nombre, descripción, costo)
        db: Sesión asincrónica de la base de datos
        user: Usuario vendedor autenticado
    
    Returns:
        ShippingMethodRead: Método de envío creado con ID asignado
    """
    
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
    """
    Obtiene una lista de todos los métodos de envío creados por el vendedor autenticado.
    
    Autor: Alejandro Campa Alonso 215833
    
    Args:
        db: Sesión asincrónica de la base de datos
        user: Usuario vendedor autenticado
    
    Returns:
        List[ShippingMethodRead]: Lista de métodos de envío del vendedor
    """
    
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
    """
    Actualiza un método de envío existente que pertenece al vendedor autenticado.
    
    Solo el propietario del método de envío puede actualizarlo.
    
    Autor: Alejandro Campa Alonso 215833
    
    Args:
        method_id: ID del método de envío a actualizar
        shipping_data: Datos a actualizar (parciales o completos)
        db: Sesión asincrónica de la base de datos
        user: Usuario vendedor autenticado
    
    Returns:
        ShippingMethodRead: Método de envío actualizado
    
    Raises:
        HTTPException: Si el método no existe o no pertenece al usuario
    """
    
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
    """
    Elimina un método de envío del vendedor autenticado.
    
    Desasociará automáticamente el método de todas las publicaciones.
    
    Autor: Alejandro Campa Alonso 215833
    
    Args:
        method_id: ID del método de envío a eliminar
        db: Sesión asincrónica de la base de datos
        user: Usuario vendedor autenticado
    
    Returns:
        None (Retorna 204 No Content)
    
    Raises:
        HTTPException: Si el método no existe o no pertenece al usuario
    """
    
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
    Asocia un método de envío existente del vendedor a una de sus publicaciones (listings).
    
    El servicio valida que el usuario sea propietario de tanto el método como la publicación.
    
    Autor: Alejandro Campa Alonso 215833
    
    Args:
        listing_id: ID de la publicación
        option_data: Datos con el ID del método de envío a asociar
        db: Sesión asincrónica de la base de datos
        user: Usuario vendedor autenticado
    
    Returns:
        ListingShippingOptionRead: Asociación creada
    
    Raises:
        HTTPException: Si el listing o método no existen o no pertenecen al usuario
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
    Desasocia un método de envío de una publicación específica.
    
    Elimina la relación entre el ListingShippingOption del listing y el método.
    
    Autor: Alejandro Campa Alonso 215833
    
    Args:
        listing_id: ID de la publicación
        method_id: ID del método de envío a desasociar
        db: Sesión asincrónica de la base de datos
        user: Usuario vendedor autenticado
    
    Returns:
        None (Retorna 204 No Content)
    
    Raises:
        HTTPException: Si el listing no existe o no pertenece al usuario
    """
    await shipping_service.remove_shipping_option_from_listing(
        db=db,
        listing_id=listing_id,
        method_id=method_id,
        user=user
    )
    return None # Retorna 204 No Content