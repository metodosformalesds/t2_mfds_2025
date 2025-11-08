"""
Schemas de Pydantic para Webhooks de pasarelas de pago.

Define contratos para procesar eventos de Stripe/PayPal.
"""
from typing import Optional, Dict, Any, Literal
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict


class StripeWebhookEvent(BaseModel):
    """
    Estructura de evento de webhook de Stripe.
    
    Docs: https://stripe.com/docs/api/events/object
    """
    id: str = Field(
        ...,
        description="ID único del evento",
        examples=["evt_1AbCdEfGhIjKlMnO"]
    )
    
    object: Literal["event"] = Field(
        default="event",
        description="Tipo de objeto (siempre 'event')"
    )
    
    type: str = Field(
        ...,
        description="Tipo de evento",
        examples=[
            "payment_intent.succeeded",
            "payment_intent.payment_failed",
            "checkout.session.completed",
            "charge.refunded"
        ]
    )
    
    data: Dict[str, Any] = Field(
        ...,
        description="Datos del evento (contiene el objeto afectado)"
    )
    
    created: int = Field(
        ...,
        description="Timestamp Unix de creación del evento"
    )
    
    livemode: bool = Field(
        ...,
        description="Si el evento es de producción (true) o test (false)"
    )
    
    pending_webhooks: int = Field(
        ...,
        description="Número de webhooks pendientes de este evento"
    )
    
    request: Optional[Dict[str, Any]] = Field(
        None,
        description="Información de la request que causó el evento"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "evt_1AbCdEfGhIjKlMnO",
                "object": "event",
                "type": "payment_intent.succeeded",
                "data": {
                    "object": {
                        "id": "pi_3AbCdEfGhIjKlMnO",
                        "amount": 11000,
                        "currency": "mxn",
                        "status": "succeeded"
                    }
                },
                "created": 1699488000,
                "livemode": False
            }
        }
    )


class WebhookProcessingResult(BaseModel):
    """
    Resultado del procesamiento de webhook.
    
    Respuesta interna del servicio de webhooks.
    """
    success: bool = Field(
        ...,
        description="Si el webhook se procesó exitosamente"
    )
    
    event_type: str = Field(
        ...,
        description="Tipo de evento procesado"
    )
    
    event_id: str = Field(
        ...,
        description="ID del evento"
    )
    
    transaction_id: Optional[int] = Field(
        None,
        description="ID de la transacción afectada en nuestra BD"
    )
    
    order_id: Optional[int] = Field(
        None,
        description="ID de la orden afectada"
    )
    
    message: str = Field(
        ...,
        description="Mensaje descriptivo del resultado"
    )
    
    processed_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp del procesamiento"
    )


class WebhookResponse(BaseModel):
    """
    Respuesta pública del endpoint de webhook.
    
    Usado en: POST /api/v1/webhooks/stripe
    """
    received: bool = Field(
        default=True,
        description="Confirmación de recepción"
    )
    
    message: str = Field(
        default="Webhook received",
        description="Mensaje de confirmación"
    )


class PayPalWebhookEvent(BaseModel):
    """
    Estructura de evento de webhook de PayPal.
    
    Docs: https://developer.paypal.com/docs/api-basics/notifications/webhooks/event-names/
    """
    id: str = Field(
        ...,
        description="ID único del evento",
        examples=["WH-2W7266697Y4262238-67J55073NY7741434"]
    )
    
    event_type: str = Field(
        ...,
        description="Tipo de evento",
        examples=[
            "PAYMENT.CAPTURE.COMPLETED",
            "PAYMENT.CAPTURE.DENIED",
            "CHECKOUT.ORDER.APPROVED"
        ]
    )
    
    resource_type: str = Field(
        ...,
        description="Tipo de recurso afectado",
        examples=["capture", "order", "refund"]
    )
    
    resource: Dict[str, Any] = Field(
        ...,
        description="Datos del recurso afectado"
    )
    
    create_time: str = Field(
        ...,
        description="Timestamp ISO 8601 de creación"
    )
    
    summary: Optional[str] = Field(
        None,
        description="Resumen del evento"
    )


class RefundRequest(BaseModel):
    """
    Request para crear reembolso.
    
    Usado en: POST /api/v1/payments/{transaction_id}/refund
    """
    transaction_id: int = Field(
        ...,
        gt=0,
        description="ID de la transacción a reembolsar"
    )
    
    amount: Optional[Decimal] = Field(
        None,
        gt=0,
        decimal_places=2,
        description="Monto a reembolsar (NULL = reembolso total)"
    )
    
    reason: str = Field(
        ...,
        min_length=10,
        max_length=500,
        description="Razón del reembolso",
        examples=["Producto dañado", "No llegó el pedido"]
    )
    
    notify_customer: bool = Field(
        default=True,
        description="Si notificar al cliente por email"
    )

class RefundResponse(BaseModel):
    """
    Respuesta de reembolso procesado.
    """
    success: bool = Field(..., description="Si el reembolso fue exitoso")
    
    refund_id: str = Field(
        ...,
        description="ID del reembolso en la pasarela"
    )
    
    transaction_id: int = Field(
        ...,
        description="ID de la transacción original"
    )
    
    amount: Decimal = Field(
        ...,
        description="Monto reembolsado"
    )
    
    currency: str = Field(..., description="Moneda")
    
    status: str = Field(
        ...,
        description="Estado del reembolso",
        examples=["succeeded", "pending", "failed"]
    )
    
    message: str = Field(
        ...,
        description="Mensaje para el usuario"
    )