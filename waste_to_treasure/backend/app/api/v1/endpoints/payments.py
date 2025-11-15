"""
Endpoints de la API para Pagos con Stripe.

Implementa:
- POST /customers: Crear/obtener customer de Stripe
- POST /checkout: Crear sesión de Stripe Checkout  
- POST /process: Procesar pago directo con Payment Intent
- POST /{transaction_id}/refund: Procesar reembolso
- GET /methods: Listar métodos de pago guardados
"""
import logging
from typing import Annotated, Optional, List
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from stripe import StripeError

from app.api.deps import get_async_db, get_current_active_user
from app.models.user import User
from app.models.payment_customer import PaymentCustomer
from app.schemas.checkout import (
    CheckoutRequest,
    CheckoutSessionResponse,
    PaymentIntentRequest,
    PaymentIntentResponse,
)
from app.schemas.webhook import RefundRequest, RefundResponse
from app.schemas.payment_customer import (
    PaymentCustomerRead
)
from app.services.stripe_service import stripe_service
from app.services.payment_service import payment_service

logger = logging.getLogger(__name__)

router = APIRouter()


# ==========================================
# SCHEMAS ESPECÍFICOS DEL ENDPOINT
# ==========================================

class CustomerCreateRequest(BaseModel):
    """
    Request para crear customer de Stripe.
    
    Schema simplificado porque el user_id se obtiene del usuario autenticado.
    Si no se proporciona email/name, se usan los del usuario.
    """
    email: Optional[str] = Field(
        None,
        description="Email del customer (opcional, usa el del usuario si no se provee)"
    )
    name: Optional[str] = Field(
        None,
        description="Nombre del customer (opcional, usa el del usuario si no se provee)"
    )


# ==========================================
# GESTIÓN DE CUSTOMERS
# ==========================================

@router.post(
    "/customers",
    response_model=PaymentCustomerRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear customer en Stripe",
    description="""
    Crea un customer en Stripe asociado al usuario autenticado.
    
    **Funcionalidad:**
    - Si el usuario ya tiene un customer en Stripe, retorna el existente
    - Si no existe, crea uno nuevo en Stripe y lo guarda en BD
    - El customer_id de Stripe se almacena para futuros pagos
    
    **Uso:**
    ```bash
    curl -X POST http://localhost:8000/api/v1/payments/customers \\
      -H "Authorization: Bearer YOUR_TOKEN" \\
      -H "Content-Type: application/json" \\
      -d '{"email": "test@example.com", "name": "Juan Test"}'
    ```
    """,
    responses={
        201: {"description": "Customer creado exitosamente"},
        200: {"description": "Customer ya existente retornado"},
        401: {"description": "No autenticado"},
        500: {"description": "Error creando customer en Stripe"}
    }
)
async def create_customer(
    customer_data: CustomerCreateRequest,
    db: Annotated[AsyncSession, Depends(get_async_db)],
    user: Annotated[User, Depends(get_current_active_user)]
) -> PaymentCustomerRead:
    """
    Crea o retorna customer existente de Stripe.
    """
    try:
        # Verificar si ya existe customer para este usuario
        existing_customer = await payment_service.get_customer_by_user_id(
            db, user.user_id
        )
        
        if existing_customer:
            logger.info(f"Customer existente encontrado: {existing_customer.gateway_customer_id}")
            return PaymentCustomerRead.model_validate(existing_customer)
        
        # Crear customer en Stripe
        stripe_customer = await stripe_service.create_customer(
            email=customer_data.email or user.email,
            name=customer_data.name or user.full_name,
            metadata={"user_id": str(user.user_id)}
        )
        
        # Guardar en BD
        customer = await payment_service.create_customer(
            db=db,
            user_id=user.user_id,
            gateway_customer_id=stripe_customer.id,
            gateway="STRIPE",
            email=stripe_customer.email
        )
        
        logger.info(f"Customer creado: {customer.gateway_customer_id} para usuario {user.user_id}")
        return PaymentCustomerRead.model_validate(customer)
        
    except StripeError as e:
        logger.error(f"Error en Stripe creando customer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creando customer en Stripe: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error creando customer: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno creando customer"
        )


@router.get(
    "/customers/me",
    response_model=PaymentCustomerRead,
    summary="Obtener mi customer de Stripe",
    description="Retorna el customer de Stripe asociado al usuario autenticado.",
    responses={
        200: {"description": "Customer encontrado"},
        404: {"description": "Customer no existe"},
        401: {"description": "No autenticado"}
    }
)
async def get_my_customer(
    db: Annotated[AsyncSession, Depends(get_async_db)],
    user: Annotated[User, Depends(get_current_active_user)]
) -> PaymentCustomerRead:
    """
    Obtiene el customer de Stripe del usuario.
    """
    customer = await payment_service.get_customer_by_user_id(db, user.user_id)
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tienes un customer de Stripe. Créalo primero con POST /customers"
        )
    
    return PaymentCustomerRead.model_validate(customer)


# ==========================================
# CHECKOUT SESSION (Stripe Hosted)
# ==========================================

@router.post(
    "/checkout",
    response_model=CheckoutSessionResponse,
    summary="Crear sesión de Stripe Checkout",
    description="""
    Crea una sesión de Stripe Checkout (página de pago hospedada).
    
    **Flujo:**
    1. Usuario crea orden en el frontend
    2. Llama a este endpoint con order_id
    3. Se crea sesión de Stripe Checkout
    4. Frontend redirige a la URL de Stripe
    5. Usuario paga en la página de Stripe
    6. Stripe redirige a success_url o cancel_url
    7. Webhook procesa el pago y actualiza la orden
    
    **Ventajas:**
    - Stripe maneja el formulario de pago
    - Compatible con múltiples métodos (tarjetas, OXXO, etc)
    - Sin PCI compliance requerido
    """,
    responses={
        200: {"description": "Sesión creada exitosamente"},
        400: {"description": "Datos inválidos o orden no encontrada"},
        401: {"description": "No autenticado"},
        500: {"description": "Error creando sesión en Stripe"}
    }
)
async def create_checkout_session(
    checkout_request: CheckoutRequest,
    db: Annotated[AsyncSession, Depends(get_async_db)],
    user: Annotated[User, Depends(get_current_active_user)]
) -> CheckoutSessionResponse:
    """
    Crea sesión de Stripe Checkout.
    """
    try:
        # Obtener orden y validar propiedad
        order = await payment_service.get_order_for_payment(
            db, checkout_request.order_id, user.user_id
        )
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Orden {checkout_request.order_id} no encontrada"
            )
        
        # Obtener o crear customer
        customer = await payment_service.get_or_create_stripe_customer(
            db, user
        )
        
        # Preparar line items para Stripe
        line_items = []
        for item in order.items:
            line_items.append({
                "price_data": {
                    "currency": "mxn",
                    "unit_amount": int(item.price * 100),  # Convertir a centavos
                    "product_data": {
                        "name": item.listing.title,
                        "description": f"Cantidad: {item.quantity}",
                    }
                },
                "quantity": item.quantity
            })
        
        # Crear sesión de Stripe Checkout
        session = await stripe_service.create_checkout_session(
            line_items=line_items,
            success_url=str(checkout_request.success_url),
            cancel_url=str(checkout_request.cancel_url),
            customer_id=customer.gateway_customer_id,
            metadata={
                "order_id": str(order.order_id),
                "user_id": str(user.user_id)
            },
            mode="payment"
        )
        
        logger.info(f"Checkout session creada: {session.id} para orden {order.order_id}")
        
        return CheckoutSessionResponse(
            session_id=session.id,
            url=session.url,
            expires_at=session.expires_at
        )
        
    except HTTPException:
        raise
    except StripeError as e:
        logger.error(f"Error en Stripe creando checkout session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creando sesión de pago: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error creando checkout session: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno creando sesión de pago"
        )


# ==========================================
# PAYMENT INTENT (Pago directo)
# ==========================================

@router.post(
    "/process",
    response_model=PaymentIntentResponse,
    summary="Procesar pago con Payment Intent",
    description="""
    Procesa un pago directo usando Payment Intent de Stripe.
    
    **Uso:**
    - Frontend usa Stripe Elements para capturar payment_method_id
    - Envía ese ID a este endpoint junto con order_id
    - Backend crea y confirma el Payment Intent
    - Retorna client_secret para confirmar en frontend (si requiere 3D Secure)
    
    **Flujo 3D Secure:**
    Si el pago requiere autenticación (3D Secure), el status será 
    'requires_action' y deberás usar el client_secret en el frontend
    con stripe.confirmCardPayment().
    """,
    responses={
        200: {"description": "Payment Intent creado"},
        400: {"description": "Datos inválidos"},
        401: {"description": "No autenticado"},
        500: {"description": "Error procesando pago"}
    }
)
async def process_payment(
    payment_request: PaymentIntentRequest,
    db: Annotated[AsyncSession, Depends(get_async_db)],
    user: Annotated[User, Depends(get_current_active_user)]
) -> PaymentIntentResponse:
    """
    Procesa pago directo con Payment Intent.
    """
    try:
        # Obtener orden y validar
        order = await payment_service.get_order_for_payment(
            db, payment_request.order_id, user.user_id
        )
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Orden {payment_request.order_id} no encontrada"
            )
        
        # Obtener o crear customer
        customer = await payment_service.get_or_create_stripe_customer(db, user)

        # FIX: Asociar el método de pago al customer para poder reutilizarlo.
        # Stripe requiere esto para usar un PaymentMethod más de una vez.
        # Esta llamada es idempotente, no falla si ya está asociado al mismo customer.
        try:
            if payment_request.payment_method_id:
                await stripe_service.attach_payment_method(
                    customer_id=customer.gateway_customer_id,
                    payment_method_id=payment_request.payment_method_id
                )
        except StripeError as e:
            # Si el método de pago ya está asociado a OTRO customer, Stripe da error.
            # Lo ignoramos para que el create_payment_intent falle con un mensaje más claro.
            if "already been attached" in str(e):
                logger.warning(
                    f"Intento de asociar un PaymentMethod ya usado por otro customer. "
                    f"PM: {payment_request.payment_method_id}, Customer: {customer.gateway_customer_id}"
                )
            else:
                # Relanzar otros errores de Stripe que sí son problemáticos
                raise
        
        # Crear Payment Intent
        payment_intent = await stripe_service.create_payment_intent(
            amount=order.total_amount,
            currency="mxn",
            customer_id=customer.gateway_customer_id,
            payment_method_id=payment_request.payment_method_id,
            metadata={
                "order_id": str(order.order_id),
                "user_id": str(user.user_id)
            },
            description=f"Orden #{order.order_id}",
            return_url=payment_request.return_url  # Pasar return_url si se proporciona
        )
        
        logger.info(
            f"Payment Intent creado: {payment_intent.id} "
            f"para orden {order.order_id} - Status: {payment_intent.status}"
        )
        
        # Construir respuesta
        next_action = None
        if payment_intent.next_action:
            next_action = {
                "type": payment_intent.next_action.type,
                "redirect_to_url": getattr(
                    payment_intent.next_action.redirect_to_url, 
                    "url", 
                    None
                )
            }
        
        return PaymentIntentResponse(
            payment_intent_id=payment_intent.id,
            client_secret=payment_intent.client_secret,
            status=payment_intent.status,
            next_action=next_action
        )
        
    except HTTPException:
        raise
    except StripeError as e:
        logger.error(f"Error en Stripe procesando pago: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error procesando pago: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error procesando pago: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno procesando pago"
        )


# ==========================================
# REEMBOLSOS
# ==========================================

@router.post(
    "/{transaction_id}/refund",
    response_model=RefundResponse,
    summary="Procesar reembolso",
    description="""
    Procesa un reembolso total o parcial de una transacción.
    
    **Requisitos:**
    - El usuario debe ser el vendedor del item o admin
    - La transacción debe estar completada
    - El monto no puede exceder el monto original
    
    **Nota:** Los reembolsos tardan 5-10 días en reflejarse.
    """,
    responses={
        200: {"description": "Reembolso procesado"},
        400: {"description": "Transacción no válida para reembolso"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos para reembolsar"},
        404: {"description": "Transacción no encontrada"}
    }
)
async def process_refund(
    transaction_id: int,
    refund_request: RefundRequest,
    db: Annotated[AsyncSession, Depends(get_async_db)],
    user: Annotated[User, Depends(get_current_active_user)]
) -> RefundResponse:
    """
    Procesa reembolso de transacción.
    """
    try:
        # Obtener transacción y validar permisos
        transaction = await payment_service.get_transaction_for_refund(
            db, transaction_id, user
        )
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transacción {transaction_id} no encontrada"
            )
        
        # Validar que se puede reembolsar
        if transaction.status != "COMPLETED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se pueden reembolsar transacciones completadas"
            )
        
        # Procesar reembolso en Stripe
        refund = await stripe_service.create_refund(
            payment_intent_id=transaction.gateway_transaction_id,
            amount=refund_request.amount,
            reason=refund_request.reason
        )
        
        # Actualizar transacción en BD
        await payment_service.mark_transaction_refunded(
            db, transaction_id, refund.id
        )
        
        logger.info(f"Reembolso procesado: {refund.id} para transacción {transaction_id}")
        
        return RefundResponse(
            success=True,
            refund_id=refund.id,
            transaction_id=transaction_id,
            amount=Decimal(refund.amount) / 100,  # Convertir de centavos
            currency=refund.currency.upper(),
            status=refund.status,
            message="Reembolso procesado exitosamente. Se reflejará en 5-10 días hábiles."
        )
        
    except HTTPException:
        raise
    except StripeError as e:
        logger.error(f"Error en Stripe procesando reembolso: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error procesando reembolso: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error procesando reembolso: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno procesando reembolso"
        )
