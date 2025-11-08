"""
Schemas de Pydantic para PaymentTransaction.

Define los contratos de entrada y salida para operaciones de pago.
"""
from typing import Optional
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict, field_validator

from app.models.payment_enums import PaymentGatewayEnum, PaymentStatusEnum


class PaymentTransactionBase(BaseModel):
    """
    Esquema base con campos comunes para PaymentTransaction.
    
    Contiene los campos que se usan en múltiples operaciones.
    """
    gateway: PaymentGatewayEnum = Field(
        ...,
        description="Pasarela de pago utilizada"
    )
    
    amount: Decimal = Field(
        ...,
        gt=0,
        decimal_places=2,
        description="Monto total del pago",
        examples=[Decimal("110.00")]
    )
    
    currency: str = Field(
        default="MXN",
        min_length=3,
        max_length=3,
        description="Código de moneda ISO 4217",
        examples=["MXN", "USD"]
    )
    
    @field_validator("currency")
    @classmethod
    def validate_currency_uppercase(cls, v: str) -> str:
        """Valida que la moneda esté en mayúsculas."""
        return v.upper()


class PaymentTransactionCreate(PaymentTransactionBase):
    """
    Esquema para crear una transacción de pago.
    
    Usado internamente por el servicio de pagos.
    No expuesto directamente en endpoints públicos.
    """
    order_id: Optional[int] = Field(
        None,
        description="ID de la orden asociada"
    )
    
    subscription_id: Optional[int] = Field(
        None,
        description="ID de la suscripción asociada"
    )
    
    user_id: UUID = Field(
        ...,
        description="UUID del usuario que realiza el pago"
    )
    
    gateway_transaction_id: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="ID de transacción en la pasarela"
    )
    
    gateway_customer_id: Optional[str] = Field(
        None,
        max_length=255,
        description="ID del customer en la pasarela"
    )
    
    payment_method_type: Optional[str] = Field(
        None,
        max_length=50,
        description="Tipo de método de pago",
        examples=["card", "oxxo", "spei"]
    )
    
    payment_method_last4: Optional[str] = Field(
        None,
        min_length=4,
        max_length=4,
        description="Últimos 4 dígitos del método de pago"
    )
    
    payment_method_brand: Optional[str] = Field(
        None,
        max_length=50,
        description="Marca del método de pago",
        examples=["visa", "mastercard", "amex"]
    )


class PaymentTransactionUpdate(BaseModel):
    """
    Esquema para actualizar una transacción de pago.
    
    Usado por webhooks y procesos internos.
    """
    status: Optional[PaymentStatusEnum] = Field(
        None,
        description="Nuevo estado de la transacción"
    )
    
    gateway_transaction_id: Optional[str] = Field(
        None,
        description="ID de transacción (si cambió)"
    )
    
    completed_at: Optional[datetime] = Field(
        None,
        description="Timestamp de completado"
    )
    
    error_code: Optional[str] = Field(
        None,
        max_length=100,
        description="Código de error"
    )
    
    error_message: Optional[str] = Field(
        None,
        description="Mensaje de error"
    )
    
    metadata: Optional[str] = Field(
        None,
        description="Metadata adicional en JSON"
    )


class PaymentTransactionInDB(PaymentTransactionBase):
    """
    Esquema que representa cómo se almacena en la base de datos.
    
    Incluye campos autogenerados y timestamps.
    """
    transaction_id: int = Field(..., description="ID único de la transacción")
    order_id: Optional[int] = Field(None, description="ID de la orden")
    subscription_id: Optional[int] = Field(None, description="ID de la suscripción")
    user_id: UUID = Field(..., description="UUID del usuario")
    
    gateway_transaction_id: str = Field(..., description="ID en la pasarela")
    gateway_customer_id: Optional[str] = Field(None, description="ID del customer")
    
    status: PaymentStatusEnum = Field(..., description="Estado actual")
    
    payment_method_type: Optional[str] = None
    payment_method_last4: Optional[str] = None
    payment_method_brand: Optional[str] = None
    
    initiated_at: datetime = Field(..., description="Timestamp de inicio")
    completed_at: Optional[datetime] = Field(None, description="Timestamp de completado")
    
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    metadata: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "transaction_id": 1,
                "order_id": 123,
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "gateway": "STRIPE",
                "gateway_transaction_id": "ch_3AbCdEfGhIjKlMnO",
                "amount": "110.00",
                "currency": "MXN",
                "status": "COMPLETED",
                "payment_method_type": "card",
                "payment_method_last4": "4242",
                "payment_method_brand": "visa",
                "initiated_at": "2025-11-08T10:30:00Z",
                "completed_at": "2025-11-08T10:30:15Z"
            }
        }
    )


class PaymentTransactionRead(PaymentTransactionInDB):
    """
    Esquema de respuesta para PaymentTransaction.
    
    Usado en: GET endpoints
    """
    # Campos computados opcionales
    formatted_amount: Optional[str] = Field(
        None,
        description="Monto formateado con moneda"
    )
    
    masked_payment_method: Optional[str] = Field(
        None,
        description="Método de pago enmascarado"
    )
    
    is_successful: bool = Field(
        default=False,
        description="Si la transacción fue exitosa"
    )


class PaymentTransactionList(BaseModel):
    """
    Esquema de respuesta paginada para listar transacciones.
    
    Usado en: GET /payments/transactions
    """
    items: list[PaymentTransactionRead] = Field(
        ...,
        description="Lista de transacciones"
    )
    
    total: int = Field(
        ...,
        ge=0,
        description="Total de transacciones"
    )
    
    page: int = Field(
        ...,
        ge=1,
        description="Página actual"
    )
    
    page_size: int = Field(
        ...,
        ge=1,
        le=100,
        description="Items por página"
    )
    
    model_config = ConfigDict(from_attributes=True)


class PaymentTransactionPublic(BaseModel):
    """
    Esquema público simplificado de transacción.
    
    Usado para mostrar info básica sin datos sensibles.
    """
    transaction_id: int
    amount: Decimal
    currency: str
    status: PaymentStatusEnum
    gateway: PaymentGatewayEnum
    masked_payment_method: Optional[str] = None
    initiated_at: datetime
    completed_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)