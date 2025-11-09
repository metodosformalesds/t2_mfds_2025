"""
Capa de servicio para Cart.

Implementa la lógica de negocio para operaciones sobre el carrito de compras,
incluyendo validaciones de stock y cálculos de totales.

Este servicio está completamente asíncrono para aprovechar la arquitectura
de FastAPI y SQLAlchemy 2.0 async, mejorando el rendimiento y escalabilidad.
"""
from typing import Optional, Tuple
from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.cart import Cart, CartItem
from app.models.listing import Listing, ListingStatusEnum
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartItemRead


async def get_or_create_cart(db: AsyncSession, user_id: UUID) -> Cart:
    """
    Obtiene el carrito del usuario o lo crea si no existe.

    Args:
        db: Sesión asíncrona de base de datos.
        user_id: UUID del usuario.

    Returns:
        Cart del usuario.
    """
    result = await db.execute(
        select(Cart)
        .options(
            selectinload(Cart.items).selectinload(CartItem.listing)
        )
        .where(Cart.user_id == user_id)
    )
    cart = result.scalar_one_or_none()

    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        await db.commit()
        await db.refresh(cart)

    return cart


async def add_item_to_cart(
    db: AsyncSession,
    user_id: UUID,
    item_data: CartItemCreate
) -> Cart:
    """
    Agrega un item al carrito o actualiza su cantidad si ya existe.

    Args:
        db: Sesión asíncrona de base de datos.
        user_id: UUID del usuario.
        item_data: Datos del item a agregar.

    Returns:
        Cart actualizado.

    Raises:
        HTTPException: Si el listing no existe, no está disponible,
                      o no hay stock suficiente.
    """
    # Validar que el listing existe y está disponible
    result = await db.execute(
        select(Listing).where(Listing.listing_id == item_data.listing_id)
    )
    listing = result.scalar_one_or_none()

    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Publicación no encontrada"
        )

    if not listing.is_available():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta publicación no está disponible para compra"
        )

    if listing.quantity < item_data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stock insuficiente. Disponible: {listing.quantity}"
        )

    # Obtener o crear el carrito
    cart = await get_or_create_cart(db, user_id)

    # Verificar si el item ya existe en el carrito
    result = await db.execute(
        select(CartItem).where(
            CartItem.cart_id == cart.cart_id,
            CartItem.listing_id == item_data.listing_id
        )
    )
    existing_item = result.scalar_one_or_none()

    if existing_item:
        # Actualizar cantidad del item existente
        new_quantity = existing_item.quantity + item_data.quantity

        if new_quantity > listing.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"No se puede agregar más. Stock disponible: {listing.quantity}, "
                    f"ya en carrito: {existing_item.quantity}"
                )
            )

        existing_item.quantity = new_quantity
    else:
        # Crear nuevo item
        new_item = CartItem(
            cart_id=cart.cart_id,
            listing_id=item_data.listing_id,
            quantity=item_data.quantity
        )
        db.add(new_item)

    await db.commit()
    await db.refresh(cart)

    return cart


async def update_cart_item_quantity(
    db: AsyncSession,
    user_id: UUID,
    cart_item_id: int,
    update_data: CartItemUpdate
) -> Cart:
    """
    Actualiza la cantidad de un item en el carrito.

    Args:
        db: Sesión asíncrona de base de datos.
        user_id: UUID del usuario.
        cart_item_id: ID del item a actualizar.
        update_data: Nueva cantidad.

    Returns:
        Cart actualizado.

    Raises:
        HTTPException: Si el item no existe, no pertenece al usuario,
                      o no hay stock suficiente.
    """
    # Obtener el carrito del usuario
    cart = await get_or_create_cart(db, user_id)

    # Buscar el item en el carrito
    result = await db.execute(
        select(CartItem)
        .options(selectinload(CartItem.listing))
        .where(
            CartItem.cart_item_id == cart_item_id,
            CartItem.cart_id == cart.cart_id
        )
    )
    cart_item = result.scalar_one_or_none()

    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item no encontrado en tu carrito"
        )

    # Validar stock disponible
    if not cart_item.listing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El producto ya no está disponible"
        )

    if update_data.quantity > cart_item.listing.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stock insuficiente. Disponible: {cart_item.listing.quantity}"
        )

    # Actualizar cantidad
    cart_item.quantity = update_data.quantity

    await db.commit()
    await db.refresh(cart)

    return cart


async def remove_item_from_cart(
    db: AsyncSession,
    user_id: UUID,
    cart_item_id: int
) -> Cart:
    """
    Elimina un item del carrito.

    Args:
        db: Sesión asíncrona de base de datos.
        user_id: UUID del usuario.
        cart_item_id: ID del item a eliminar.

    Returns:
        Cart actualizado.

    Raises:
        HTTPException: Si el item no existe o no pertenece al usuario.
    """
    # Obtener el carrito del usuario
    cart = await get_or_create_cart(db, user_id)

    # Buscar el item en el carrito
    result = await db.execute(
        select(CartItem).where(
            CartItem.cart_item_id == cart_item_id,
            CartItem.cart_id == cart.cart_id
        )
    )
    cart_item = result.scalar_one_or_none()

    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item no encontrado en tu carrito"
        )

    # Eliminar el item
    await db.delete(cart_item)
    await db.commit()
    await db.refresh(cart)

    return cart


async def clear_cart(db: AsyncSession, user_id: UUID) -> Cart:
    """
    Vacía completamente el carrito del usuario.

    Args:
        db: Sesión asíncrona de base de datos.
        user_id: UUID del usuario.

    Returns:
        Cart vacío.
    """
    cart = await get_or_create_cart(db, user_id)

    # Eliminar todos los items
    await db.execute(
        delete(CartItem).where(CartItem.cart_id == cart.cart_id)
    )

    await db.commit()
    await db.refresh(cart)

    return cart


async def validate_cart_for_checkout(
    db: AsyncSession,
    cart: Cart
) -> Tuple[bool, Optional[str]]:
    """
    Valida que el carrito esté listo para checkout.

    Args:
        db: Sesión asíncrona de base de datos.
        cart: Carrito a validar.

    Returns:
        Tupla (es_válido, mensaje_error).
    """
    if not cart.items or len(cart.items) == 0:
        return False, "El carrito está vacío"

    # Verificar cada item
    for item in cart.items:
        if not item.listing:
            return False, f"Item {item.cart_item_id} ya no está disponible"

        if not item.listing.is_available():
            return False, f"'{item.listing.title}' ya no está disponible"

        if item.quantity > item.listing.quantity:
            return False, f"Stock insuficiente para '{item.listing.title}'"

    return True, None


def convert_cart_to_response(cart: Cart) -> dict:
    """
    Convierte un Cart a formato CartRead con cálculos.

    Args:
        cart: Objeto Cart de SQLAlchemy.

    Returns:
        Diccionario con datos para CartRead.
    """
    items_data = []

    for item in cart.items:
        listing = item.listing

        # Obtener imagen principal del listing
        listing_image = None
        if listing and listing.get_primary_image():
            listing_image = listing.get_primary_image().image_url

        item_data = {
            "cart_item_id": item.cart_item_id,
            "cart_id": item.cart_id,
            "listing_id": item.listing_id,
            "quantity": item.quantity,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
            "listing_title": listing.title if listing else None,
            "listing_price": listing.price if listing else None,
            "listing_price_unit": listing.price_unit if listing else None,
            "listing_image_url": str(listing_image) if listing_image else None,
            "listing_available_quantity": listing.quantity if listing else None,
            "listing_is_available": listing.is_available() if listing else False,
            "item_subtotal": item.get_item_subtotal()
        }

        items_data.append(CartItemRead(**item_data))

    subtotal = cart.get_subtotal()
    commission_rate = Decimal("0.10")  # 10% según SRS
    estimated_commission = subtotal * commission_rate
    estimated_total = subtotal + estimated_commission

    return {
        "cart_id": cart.cart_id,
        "user_id": cart.user_id,
        "created_at": cart.created_at,
        "updated_at": cart.updated_at,
        "items": items_data,
        "total_items": cart.get_total_items(),
        "subtotal": subtotal,
        "estimated_commission": estimated_commission,
        "estimated_total": estimated_total,
        "has_unavailable_items": cart.has_unavailable_items()
    }
