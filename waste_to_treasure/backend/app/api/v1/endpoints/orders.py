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
import stripe
from stripe import CardError, StripeError

from app.api.deps import get_async_db, get_current_active_user
from app.models.user import User
from app.schemas.order import OrderRead, OrderList, CheckoutCreate
from app.services.order_service import order_service
from app.services.stripe_service import stripe_service

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
    
    # 3. Procesar pago con Stripe (INTEGRACIÓN REAL)
    try:
        # Crear Payment Intent en Stripe
        payment_intent = await stripe_service.create_payment_intent(
            amount=total_a_pagar,
            currency="mxn",
            metadata={
                "user_id": str(user.user_id),
                "cart_items": str(len(cart.items))
            },
            description=f"Orden de {user.full_name or user.email}"
        )
        
        # Confirmar el pago con el token proporcionado
        # Nota: Los tokens de prueba (tok_visa, tok_chargeDeclined, etc) 
        # se procesan directamente sin confirmación adicional
        if checkout_data.payment_token.startswith("tok_"):
            # Para tokens de prueba, crear un cargo directo
            try:
                charge = stripe.Charge.create(
                    amount=int(total_a_pagar * 100),  # centavos
                    currency="mxn",
                    source=checkout_data.payment_token,
                    description=f"Orden de {user.full_name or user.email}",
                    metadata={
                        "user_id": str(user.user_id),
                        "payment_intent_id": payment_intent.id
                    }
                )
                payment_charge_id = charge.id
                logger.info(f"Pago exitoso con token {checkout_data.payment_token}: {payment_charge_id}")
            except CardError as e:
                # Card was declined
                await db.rollback()
                logger.warning(f"Tarjeta declinada: {e.user_message}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Pago rechazado: {e.user_message or 'Tarjeta declinada'}"
                )
            except StripeError as e:
                await db.rollback()
                logger.error(f"Error de Stripe: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Error procesando pago: {str(e)}"
                )
        else:
            # Para payment methods normales
            confirmed_intent = await stripe_service.confirm_payment_intent(
                payment_intent_id=payment_intent.id,
                payment_method_id=checkout_data.payment_token
            )
            
            if confirmed_intent.status != "succeeded":
                await db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Pago no exitoso. Status: {confirmed_intent.status}"
                )
            
            payment_charge_id = confirmed_intent.id
            logger.info(f"Payment Intent confirmado exitosamente: {payment_charge_id}")
        
    except HTTPException:
        raise  # Re-raise para que FastAPI lo maneje
    except StripeError as e:
        logger.error(f"Error de Stripe en checkout: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error procesando pago con Stripe: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error inesperado procesando pago: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error inesperado procesando el pago"
        )

    # 4. Crear la orden (transaccional)
    order = await order_service.create_order_from_cart(
        db=db,
        user=user,
        cart=cart,
        listings_map=listings_map,
        payment_charge_id=payment_charge_id,
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