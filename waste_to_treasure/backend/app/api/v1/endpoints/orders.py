"""
Endpoints de la API para Órdenes y Checkout.

Implementa:
- POST /checkout: Iniciar el proceso de pago y creación de orden.
- GET /my-purchases: Listar compras del usuario autenticado.
- GET /my-sales: Listar ventas del usuario autenticado.
- GET /{order_id}: Ver detalle de una orden (comprador o vendedor).
"""
import logging
import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db, get_current_active_user
from app.models.user import User
from app.schemas.order import OrderRead, OrderList, CheckoutCreate
from app.services.order_service import order_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post(
    "/checkout",
    response_model=OrderRead,
    status_code=status.HTTP_201_CREATED,
    summary="Procesar checkout",
    description="""
    Inicia el proceso de checkout a partir del carrito del usuario.
    
    **Proceso (Transaccional):**
    1.  Valida el carrito (stock, disponibilidad).
    2.  Bloquea el stock de los listings.
    3.  **(SIMULADO)** Llama al servicio de pago (Stripe) con el token.
    4.  Si el pago es exitoso:
        - Crea la `Order` y `OrderItems`.
        - Reduce el stock de los `Listings`.
        - Vacía el `Cart`.
        - Envía email de confirmación.
    5.  Retorna la orden creada.
    
    Si cualquier paso falla (ej. falta de stock, pago rechazado),
    la transacción se revierte (rollback).
    """
)
async def process_checkout(
    checkout_data: CheckoutCreate,
    db: Annotated[AsyncSession, Depends(get_async_db)],
    user: Annotated[User, Depends(get_current_active_user)]
) -> OrderRead:
    
    # 1. Validar carrito y bloquear stock (transaccional)
    try:
        cart, listings_map = await order_service.get_cart_for_checkout(db, user)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error inesperado en validación de checkout: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error al validar el carrito")

    # 2. Calcular total (a enviar a Stripe)
    total_a_pagar = cart.get_estimated_total() # Incluye comisión
    
    # 3. Procesar pago (SIMULACIÓN)
    # En un caso real, aquí llamarías a Stripe
    # =============================================================
    # try:
    #     payment_service = StripeService()
    #     charge = await payment_service.create_charge(
    #         token=checkout_data.payment_token,
    #         amount_cents=int(total_a_pagar * 100) # Stripe usa centavos
    #     )
    #     simulated_charge_id = charge.id
    # except StripeError as e:
    #     raise HTTPException(status_code=400, detail=f"Pago fallido: {e.user_message}")
    # =============================================================
    
    # Simulación de pago exitoso
    if not checkout_data.payment_token.startswith("tok_"):
        raise HTTPException(status_code=400, detail="Token de pago inválido (simulación).")
    
    simulated_charge_id = f"ch_sim_{uuid.uuid4()}"
    logger.info(f"Pago (simulado) exitoso: {simulated_charge_id} por {total_a_pagar}")

    # 4. Crear la orden (transaccional)
    order = await order_service.create_order_from_cart(
        db=db,
        user=user,
        cart=cart,
        listings_map=listings_map,
        payment_charge_id=simulated_charge_id,
        payment_method="stripe"
    )
    
    return OrderRead.model_validate(order)


@router.get(
    "/my-purchases",
    response_model=OrderList,
    summary="Listar mis compras",
    description="Obtiene una lista paginada de las órdenes de compra del usuario."
)
async def get_my_purchases(
    db: Annotated[AsyncSession, Depends(get_async_db)],
    user: Annotated[User, Depends(get_current_active_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> OrderList:
    
    orders, total = await order_service.get_my_purchases(db, user, skip, limit)
    page = (skip // limit) + 1
    
    return OrderList(
        items=[OrderRead.model_validate(o) for o in orders],
        total=total,
        page=page,
        page_size=limit
    )


@router.get(
    "/my-sales",
    response_model=OrderList,
    summary="Listar mis ventas",
    description="Obtiene una lista paginada de las órdenes que contienen items vendidos por el usuario."
)
async def get_my_sales(
    db: Annotated[AsyncSession, Depends(get_async_db)],
    user: Annotated[User, Depends(get_current_active_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> OrderList:
    
    orders, total = await order_service.get_my_sales(db, user, skip, limit)
    page = (skip // limit) + 1
    
    return OrderList(
        items=[OrderRead.model_validate(o) for o in orders],
        total=total,
        page=page,
        page_size=limit
    )


@router.get(
    "/{order_id}",
    response_model=OrderRead,
    summary="Obtener detalle de la orden",
    description="Obtiene los detalles de una orden específica. "
                "Requiere ser el comprador, el vendedor de un item, o admin."
)
async def get_order_details(
    order_id: int,
    db: Annotated[AsyncSession, Depends(get_async_db)],
    user: Annotated[User, Depends(get_current_active_user)]
) -> OrderRead:
    
    order = await order_service.get_order_details(db, order_id, user)
    return OrderRead.model_validate(order)