"""
Endpoints para webhooks de stripe

Procesa eventos de stripe (pagos, cancelaciones, reembolsos)
"""
# Autor: Oscar Alonso Nava Rivera
# Fecha: 08/11/2025
# Descripción: Recibir y procesar webhooks de Stripe
import logging
from fastapi import APIRouter, Request, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

import stripe
from app.api.deps import get_async_db
from app.services.stripe_service import stripe_service
from app.schemas.webhook import WebhookResponse

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post(
    "/stripe",
    response_model=WebhookResponse,
    summary="Webhook de Stripe",
    description="""
    Endpoint para recibir eventos de Stripe.
    
    **Eventos procesados:**
    - payment_intent.succeeded: Pago exitoso
    - payment_intent.payment_failed: Pago fallido
    - checkout.session.completed: Checkout completado
    - charge.refunded: Reembolso procesado
    
    **Seguridad:**
    - La firma del webhook es verificada con el secret
    - Solo eventos con firma válida son procesados
    """,
   responses={
        200: {"description": "Webhook procesado exitosamente"},
        400: {"description": "Firma inválida o evento malformado"},
        500: {"description": "Error interno procesando webhook"}
    }
)
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Autor: Oscar Alonso Nava Rivera
    Procesa eventos de webhook de Stripe.
    
    IMPORTANTE:
    - El body debe ser leído como bytes RAW (no JSON)
    - La firma debe verificarse antes de confiar en el evento
    """
    # leer payload crudo (bytes)
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        logger.warning("Webhook sin header Stripe-Signature")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
             detail="Missing Stripe-Signature header"
        )
    # Verificar firma y construir evento
    try:
        event = stripe_service.construct_webhook_event(payload, sig_header)
    except Exception as e:
        # Capturar cualquier error de verificación de firma
        if "signature" in str(e).lower() or "verify" in str(e).lower():
            logger.error(f"Firma de webhook inválida: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid signature"
            )
        logger.error(f"Error construyendo evento de webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid event"
        )
    
    # 3. Procesar según tipo de evento
    try:
        logger.info(f"Procesando webhook: {event.type} ({event.id})")
        
        if event.type == "payment_intent.succeeded":
            await _handle_payment_intent_succeeded(event, db)
        
        elif event.type == "payment_intent.payment_failed":
            await _handle_payment_intent_failed(event, db)
        
        elif event.type == "checkout.session.completed":
            await _handle_checkout_session_completed(event, db)
        
        elif event.type == "charge.refunded":
            await _handle_charge_refunded(event, db)
        
        else:
            logger.info(f"Evento no manejado: {event.type}")
        
        return WebhookResponse(
            received=True,
            message=f"Webhook {event.type} processed"
        )
        
    except Exception as e:
        logger.error(f"Error procesando webhook {event.type}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing webhook"
        )
    
# HANDLERS DE EVENTOS

async def _handle_payment_intent_succeeded(
    event: stripe.Event,
    db: AsyncSession
):
    """Autor: Oscar Alonso Nava Rivera
    Maneja pago exitoso de Payment Intent.
    """
    payment_intent = event.data.object
    
    logger.info(
        f"Payment Intent succeeded: {payment_intent.id} "
        f"({payment_intent.amount / 100} {payment_intent.currency.upper()})"
    )
    
    # TODO: Actualizar PaymentTransaction en BD
    # transaction = await db.execute(
    #     select(PaymentTransaction).where(
    #         PaymentTransaction.gateway_transaction_id == payment_intent.id
    #     )
    # )
    # if transaction:
    #     transaction.status = PaymentStatusEnum.COMPLETED
    #     transaction.completed_at = datetime.utcnow()
    #     await db.commit()


async def _handle_payment_intent_failed(
    event: stripe.Event,
    db: AsyncSession
):
    """Autor: Oscar Alonso Nava Rivera
    Maneja pago fallido.
    """
    payment_intent = event.data.object
    
    logger.warning(
        f"Payment Intent failed: {payment_intent.id} "
        f"- Error: {payment_intent.last_payment_error}"
    )
    
    # TODO: Crear Order en BD si no existe
    # El session.metadata puede contener order_id o user_id

async def _handle_checkout_session_completed(
    event: stripe.Event,
    db: AsyncSession
):
    """Autor: Oscar Alonso Nava Rivera
    Maneja Checkout Session completada.
    """
    session = event.data.object
    
    logger.info(f"Checkout Session completed: {session.id}")
    
    # TODO: Crear Order en BD si no existe
    # El session.metadata puede contener order_id o user_id

async def _handle_charge_refunded(
    event: stripe.Event,
    db: AsyncSession
):
    """Autor: Oscar Alonso Nava Rivera
    Maneja reembolso de cargo.
    """
    charge = event.data.object
    
    logger.info(f"Charge refunded: {charge.id}")
    
    # TODO: Actualizar PaymentTransaction y Order status
    # Marcar como REFUNDED