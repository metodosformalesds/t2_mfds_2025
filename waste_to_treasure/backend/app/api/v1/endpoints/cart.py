"""
Endpoints de la API para Cart.

Implementa operaciones sobre el carrito de compras del usuario autenticado.
Todos los endpoints requieren autenticación.
"""
import logging
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db, get_current_active_user
from app.models.user import User
from app.schemas.cart import (
    CartRead,
    CartItemCreate,
    CartItemUpdate,
    CartSummary
)
from app.services import cart_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/me",
    response_model=CartRead,
    summary="Obtener mi carrito",
    description="Obtiene el carrito completo del usuario autenticado.",
    responses={
        200: {"description": "Carrito obtenido exitosamente"},
        401: {"description": "No autenticado"},
    }
)
async def get_my_cart(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
) -> CartRead:
    """
    Obtiene el carrito completo del usuario autenticado.

    **Requiere autenticación**

    - Si el usuario no tiene carrito, se crea uno vacío automáticamente
    - Incluye todos los items con sus detalles
    - Calcula subtotales, comisión y total estimado

    **Ejemplo de respuesta**:
    ```json
    {
        "cart_id": 1,
        "items": [...],
        "total_items": 5,
        "subtotal": 1500.00,
        "estimated_commission": 150.00,
        "estimated_total": 1650.00
    }
    ```
    """
    logger.info(f"Usuario {current_user.user_id} obteniendo su carrito")

    cart = await cart_service.get_or_create_cart(db, current_user.user_id)

    return cart_service.convert_cart_to_response(cart)


@router.post(
    "/me/items",
    response_model=CartRead,
    status_code=status.HTTP_201_CREATED,
    summary="Agregar item al carrito",
    description="Agrega un item al carrito del usuario autenticado.",
    responses={
        201: {"description": "Item agregado exitosamente"},
        400: {"description": "Datos inválidos o stock insuficiente"},
        401: {"description": "No autenticado"},
        404: {"description": "Publicación no encontrada"},
    }
)
async def add_item_to_cart(
    item_in: CartItemCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
) -> CartRead:
    """
    Agrega un item al carrito del usuario.

    **Requiere autenticación**

    - Si el item ya existe en el carrito, se suma la cantidad
    - Valida que haya stock disponible
    - Solo se pueden agregar listings con estado ACTIVE

    **Ejemplo de request body**:
    ```json
    {
        "listing_id": 1,
        "quantity": 2
    }
    ```
    """
    logger.info(
        f"Usuario {current_user.user_id} agregando item {item_in.listing_id} "
        f"al carrito (cantidad: {item_in.quantity})"
    )

    cart = await cart_service.add_item_to_cart(
        db=db,
        user_id=current_user.user_id,
        item_data=item_in
    )

    return cart_service.convert_cart_to_response(cart)


@router.patch(
    "/me/items/{cart_item_id}",
    response_model=CartRead,
    summary="Actualizar cantidad de item",
    description="Actualiza la cantidad de un item en el carrito.",
    responses={
        200: {"description": "Item actualizado exitosamente"},
        400: {"description": "Datos inválidos o stock insuficiente"},
        401: {"description": "No autenticado"},
        404: {"description": "Item no encontrado en carrito"},
    }
)
async def update_cart_item(
    cart_item_id: int,
    update_in: CartItemUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
) -> CartRead:
    """
    Actualiza la cantidad de un item en el carrito.

    **Requiere autenticación**

    - Solo puede actualizar items de su propio carrito
    - Valida que haya stock disponible para la nueva cantidad

    **Ejemplo de request body**:
    ```json
    {
        "quantity": 5
    }
    ```
    """
    logger.info(
        f"Usuario {current_user.user_id} actualizando item {cart_item_id} "
        f"(nueva cantidad: {update_in.quantity})"
    )

    cart = await cart_service.update_cart_item_quantity(
        db=db,
        user_id=current_user.user_id,
        cart_item_id=cart_item_id,
        update_data=update_in
    )

    return cart_service.convert_cart_to_response(cart)


@router.delete(
    "/me/items/{cart_item_id}",
    response_model=CartRead,
    summary="Eliminar item del carrito",
    description="Elimina un item del carrito.",
    responses={
        200: {"description": "Item eliminado exitosamente"},
        401: {"description": "No autenticado"},
        404: {"description": "Item no encontrado en carrito"},
    }
)
async def remove_cart_item(
    cart_item_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
) -> CartRead:
    """
    Elimina un item del carrito.

    **Requiere autenticación**

    - Solo puede eliminar items de su propio carrito

    **Retorna**: Carrito actualizado
    """
    logger.info(
        f"Usuario {current_user.user_id} eliminando item {cart_item_id} del carrito"
    )

    cart = await cart_service.remove_item_from_cart(
        db=db,
        user_id=current_user.user_id,
        cart_item_id=cart_item_id
    )

    return cart_service.convert_cart_to_response(cart)


@router.delete(
    "/me",
    response_model=CartRead,
    summary="Vaciar carrito",
    description="Vacía completamente el carrito del usuario.",
    responses={
        200: {"description": "Carrito vaciado exitosamente"},
        401: {"description": "No autenticado"},
    }
)
async def clear_cart(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
) -> CartRead:
    """
    Vacía completamente el carrito del usuario.

    **Requiere autenticación**

    - Elimina todos los items del carrito
    - El carrito en sí no se elimina

    **Retorna**: Carrito vacío
    """
    logger.info(f"Usuario {current_user.user_id} vaciando su carrito")

    cart = await cart_service.clear_cart(db, current_user.user_id)

    return cart_service.convert_cart_to_response(cart)


@router.get(
    "/me/summary",
    response_model=CartSummary,
    summary="Obtener resumen del carrito",
    description="Obtiene un resumen simplificado del carrito.",
    responses={
        200: {"description": "Resumen obtenido exitosamente"},
        401: {"description": "No autenticado"},
    }
)
async def get_cart_summary(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
) -> CartSummary:
    """
    Obtiene un resumen simplificado del carrito.

    **Requiere autenticación**

    - Útil para mostrar el contador de items en el header/navbar
    - Más ligero que el endpoint completo

    **Ejemplo de respuesta**:
    ```json
    {
        "cart_id": 1,
        "total_items": 5,
        "subtotal": 1500.00,
        "items_count": 3
    }
    ```
    """
    logger.info(f"Usuario {current_user.user_id} obteniendo resumen de carrito")

    cart = await cart_service.get_or_create_cart(db, current_user.user_id)

    return CartSummary(
        cart_id=cart.cart_id,
        total_items=cart.get_total_items(),
        subtotal=cart.get_subtotal(),
        items_count=len(cart.items)
    )
