"""
Schemas de Pydantic para proceso de checkout.

Define los contratos para crear sesiones de pago con Stripe.
"""
from typing import Optional, List, Dict, Any
from decimal import Decimal

from pydantic import BaseModel, Field, HttpUrl, field_validator

from app.models.payment_enums import PaymentGatewayEnum


class CheckoutLineItem(BaseModel):
    """
    Autor: Oscar Alonso Nava Rivera
    Descripción: Item de línea para Stripe Checkout.

    Representa un producto/material en el checkout.
    """
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Nombre del producto/material",
        examples=["Madera Reciclada Premium"]
    )
    
    description: Optional[str] = Field(
        None,
        max_length=500,
        description="Descripción breve del item"
    )
    
    quantity: int = Field(
        ...,
        gt=0,
        description="Cantidad de unidades",
        examples=[2]
    )
    
    unit_amount: Decimal = Field(
        ...,
        gt=0,
        decimal_places=2,
        description="Precio unitario",
        examples=[Decimal("50.00")]
    )
    
    currency: str = Field(
        default="MXN",
        min_length=3,
        max_length=3,
        description="Moneda del precio"
    )
    
    images: Optional[List[HttpUrl]] = Field(
        None,
        max_length=8,
        description="URLs de imágenes del producto"
    )


class CheckoutRequest(BaseModel):
    """
    Autor: Oscar Alonso Nava Rivera
    Descripción: Request para crear sesión de checkout.

    Usado en: POST /api/v1/payments/checkout
    """
    order_id: int = Field(
        ...,
        gt=0,
        description="ID de la orden a pagar"
    )
    
    gateway: PaymentGatewayEnum = Field(
        default=PaymentGatewayEnum.STRIPE,
        description="Pasarela de pago a utilizar"
    )
    
    success_url: HttpUrl = Field(
        ...,
        description="URL de redirección tras pago exitoso",
        examples=["https://waste-to-treasure.com/orders/123/success"]
    )
    
    cancel_url: HttpUrl = Field(
        ...,
        description="URL de redirección si usuario cancela",
        examples=["https://waste-to-treasure.com/orders/123/cancel"]
    )
    
    save_payment_method: bool = Field(
        default=False,
        description="Si guardar método de pago para futuros usos"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "order_id": 123,
                "gateway": "STRIPE",
                "success_url": "https://waste-to-treasure.com/orders/123/success",
                "cancel_url": "https://waste-to-treasure.com/cart",
                "save_payment_method": True
            }
        }
    }


class CheckoutSessionResponse(BaseModel):
    """
    Autor: Oscar Alonso Nava Rivera
    Descripción: Respuesta con sesión de checkout creada.

    Contiene la URL de Stripe Checkout donde redirigir al usuario.
    """
    session_id: str = Field(
        ...,
        description="ID de la sesión de checkout en Stripe",
        examples=["cs_test_a1b2c3d4e5f6g7h8i9j0"]
    )
    
    url: HttpUrl = Field(
        ...,
        description="URL de Stripe Checkout para redirigir al usuario",
        examples=["https://checkout.stripe.com/c/pay/cs_test_a1b2c3d4e5f6g7h8i9j0"]
    )
    
    expires_at: Optional[int] = Field(
        None,
        description="Timestamp Unix de expiración de la sesión"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "session_id": "cs_test_a1b2c3d4e5f6g7h8i9j0",
                "url": "https://checkout.stripe.com/c/pay/cs_test_a1b2c3d4e5f6g7h8i9j0",
                "expires_at": 1699488000
            }
        }
    }


class PaymentIntentRequest(BaseModel):
    """
    Autor: Oscar Alonso Nava Rivera
    Descripción: Request para crear Payment Intent (pago directo).

    Usado cuando el frontend ya capturó payment_method_id con Stripe Elements.
    Usado en: POST /api/v1/payments/process
    """
    order_id: int = Field(
        ...,
        gt=0,
        description="ID de la orden a pagar"
    )
    
    payment_method_id: str = Field(
        ...,
        min_length=1,
        description="ID del método de pago de Stripe Elements",
        examples=["pm_1AbCdEfGhIjKlMnO"]
    )
    
    gateway: PaymentGatewayEnum = Field(
        default=PaymentGatewayEnum.STRIPE,
        description="Pasarela de pago"
    )
    
    save_payment_method: bool = Field(
        default=False,
        description="Si guardar método de pago para futuros usos"
    )
    
    return_url: Optional[HttpUrl] = Field(
        None,
        description="URL de retorno para métodos que requieren redirect (OXXO, SPEI)"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "order_id": 123,
                "payment_method_id": "pm_1AbCdEfGhIjKlMnO",
                "gateway": "STRIPE",
                "save_payment_method": True
            }
        }
    }


class PaymentIntentResponse(BaseModel):
    """
    Autor: Oscar Alonso Nava Rivera
    Descripción: Respuesta con Payment Intent creado.
    """
    payment_intent_id: str = Field(
        ...,
        description="ID del Payment Intent en Stripe",
        examples=["pi_3AbCdEfGhIjKlMnO"]
    )
    
    client_secret: str = Field(
        ...,
        description="Client secret para confirmar pago en frontend",
        examples=["pi_3AbCdEfGhIjKlMnO_secret_xyz123"]
    )
    
    status: str = Field(
        ...,
        description="Estado del Payment Intent",
        examples=["requires_confirmation", "succeeded"]
    )
    
    next_action: Optional[Dict[str, Any]] = Field(
        None,
        description="Siguiente acción requerida (redirect, etc)"
    )


class PaymentConfirmation(BaseModel):
    """
    Autor: Oscar Alonso Nava Rivera
    Descripción: Confirmación de pago exitoso.

    Respuesta final tras completar el pago.
    """
    success: bool = Field(..., description="Si el pago fue exitoso")
    
    transaction_id: int = Field(
        ...,
        description="ID de la transacción en nuestra BD"
    )
    
    order_id: int = Field(..., description="ID de la orden pagada")
    
    amount: Decimal = Field(..., description="Monto pagado")
    
    currency: str = Field(..., description="Moneda del pago")
    
    gateway_transaction_id: str = Field(
        ...,
        description="ID de transacción en la pasarela"
    )
    
    message: str = Field(
        default="Pago procesado exitosamente",
        description="Mensaje para el usuario"
    )


class PaymentError(BaseModel):
    """
    Autor: Oscar Alonso Nava Rivera
    Descripción: Esquema de error de pago.

    Respuesta cuando el pago falla.
    """
    success: bool = Field(default=False, description="Siempre False")
    
    error_code: str = Field(
        ...,
        description="Código de error",
        examples=["card_declined", "insufficient_funds"]
    )
    
    error_message: str = Field(
        ...,
        description="Mensaje de error legible",
        examples=["Tu tarjeta fue declinada"]
    )
    
    decline_code: Optional[str] = Field(
        None,
        description="Código de decline de la tarjeta"
    )
    
    can_retry: bool = Field(
        default=True,
        description="Si el usuario puede reintentar"
    )