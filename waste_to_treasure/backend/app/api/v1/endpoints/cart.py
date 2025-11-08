"""
Endpoints de API para Cart.

Rutas para gestionar el carrito de compras del usuario.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
import uuid

from app.core.database import get_db
from app.schemas.cart import (
    CartRead,
    CartItemCreate,
    CartItemUpdate,
    CartSummary
)
from app.services.cart_service import CartService
# from app.api.deps import get_current_user  # Implementar según tu sistema de auth

router = APIRouter()


@router.get("/me", response_model=CartRead)
def get_my_cart(
    *,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user)  # Descomentar cuando tengas auth
):
    """
    Obtiene el carrito completo del usuario autenticado.
    
    - **Requiere autenticación**
    - Si el usuario no tiene carrito, se crea uno vacío automáticamente
    - Incluye todos los items con sus detalles
    - Calcula subtotales, comisión y total estimado
    """
    # TODO: Reemplazar con user_id real del token de Cognito
    user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")  # TEMPORAL
    
    cart = CartService.get_or_create_cart(db, user_id)
    
    return CartService.convert_cart_to_response(cart)


@router.post("/me/items", response_model=CartRead, status_code=status.HTTP_201_CREATED)
def add_item_to_cart(
    *,
    db: Session = Depends(get_db),
    item_in: CartItemCreate,
    # current_user = Depends(get_current_user)
):
    """
    Agrega un item al carrito del usuario.
    
    - **Requiere autenticación**
    - Si el item ya existe en el carrito, se suma la cantidad
    - Valida que haya stock disponible
    - Solo se pueden agregar listings con estado ACTIVE
    """
    # TODO: Reemplazar con user_id real del token
    user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")  # TEMPORAL
    
    cart = CartService.add_item_to_cart(
        db=db,
        user_id=user_id,
        item_data=item_in
    )
    
    return CartService.convert_cart_to_response(cart)


@router.patch("/me/items/{cart_item_id}", response_model=CartRead)
def update_cart_item(
    *,
    db: Session = Depends(get_db),
    cart_item_id: int,
    update_in: CartItemUpdate,
    # current_user = Depends(get_current_user)
):
    """
    Actualiza la cantidad de un item en el carrito.
    
    - **Requiere autenticación**
    - Solo puede actualizar items de su propio carrito
    - Valida que haya stock disponible para la nueva cantidad
    """
    # TODO: Reemplazar con user_id real del token
    user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")  # TEMPORAL
    
    cart = CartService.update_cart_item_quantity(
        db=db,
        user_id=user_id,
        cart_item_id=cart_item_id,
        update_data=update_in
    )
    
    return CartService.convert_cart_to_response(cart)


@router.delete("/me/items/{cart_item_id}", response_model=CartRead)
def remove_cart_item(
    *,
    db: Session = Depends(get_db),
    cart_item_id: int,
    # current_user = Depends(get_current_user)
):
    """
    Elimina un item del carrito.
    
    - **Requiere autenticación**
    - Solo puede eliminar items de su propio carrito
    """
    # TODO: Reemplazar con user_id real del token
    user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")  # TEMPORAL
    
    cart = CartService.remove_item_from_cart(
        db=db,
        user_id=user_id,
        cart_item_id=cart_item_id
    )
    
    return CartService.convert_cart_to_response(cart)


@router.delete("/me", response_model=CartRead)
def clear_cart(
    *,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user)
):
    """
    Vacía completamente el carrito del usuario.
    
    - **Requiere autenticación**
    - Elimina todos los items del carrito
    - El carrito en sí no se elimina
    """
    # TODO: Reemplazar con user_id real del token
    user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")  # TEMPORAL
    
    cart = CartService.clear_cart(db, user_id)
    
    return CartService.convert_cart_to_response(cart)


@router.get("/me/summary", response_model=CartSummary)
def get_cart_summary(
    *,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user)
):
    """
    Obtiene un resumen simplificado del carrito.
    
    - **Requiere autenticación**
    - Útil para mostrar el contador de items en el header/navbar
    - Más ligero que el endpoint completo
    """
    # TODO: Reemplazar con user_id real del token
    user_id = uuid.UUID("00000000-0000-0000-0000-000000000001")  # TEMPORAL
    
    cart = CartService.get_or_create_cart(db, user_id)
    
    return CartSummary(
        cart_id=cart.cart_id,
        total_items=cart.get_total_items(),
        subtotal=cart.get_subtotal(),
        items_count=len(cart.items)
    )