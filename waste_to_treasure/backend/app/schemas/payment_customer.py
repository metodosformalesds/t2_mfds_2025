# app/schemas/payment_customer.py
"""
Schemas de Pydantic para PaymentCustomer.

Define contratos para gestionar customers en pasarelas de pago.
"""
from typing import Optional
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

from app.models.payment_enums import PaymentGatewayEnum


class PaymentCustomerBase(BaseModel):
    """Esquema base para PaymentCustomer."""
    
    gateway: PaymentGatewayEnum = Field(
        ...,
        description="Pasarela de pago"
    )
    
    gateway_customer_id: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="ID del customer en la pasarela"
    )


class PaymentCustomerCreate(PaymentCustomerBase):
    """
    Esquema para crear PaymentCustomer.
    
    Usado internamente por el servicio de pagos.
    """
    user_id: UUID = Field(
        ...,
        description="UUID del usuario"
    )
    
    default_payment_method_id: Optional[str] = Field(
        None,
        max_length=255,
        description="ID del método de pago predeterminado"
    )


class PaymentCustomerUpdate(BaseModel):
    """Esquema para actualizar PaymentCustomer."""
    
    default_payment_method_id: Optional[str] = Field(
        None,
        description="Nuevo método de pago predeterminado"
    )


class PaymentCustomerInDB(PaymentCustomerBase):
    """Esquema de PaymentCustomer en BD."""
    
    payment_customer_id: int
    user_id: UUID
    default_payment_method_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class PaymentCustomerRead(PaymentCustomerInDB):
    """
    Esquema de respuesta para PaymentCustomer.
    
    Usado en: GET /payments/customer
    """
    pass


class PaymentMethodCreate(BaseModel):
    """
    Request para guardar nuevo método de pago.
    
    Usado en: POST /api/v1/payments/methods
    """
    gateway: PaymentGatewayEnum = Field(
        default=PaymentGatewayEnum.STRIPE,
        description="Pasarela de pago"
    )
    
    payment_method_id: str = Field(
        ...,
        min_length=1,
        description="ID del método de pago de Stripe",
        examples=["pm_1AbCdEfGhIjKlMnO"]
    )
    
    set_as_default: bool = Field(
        default=False,
        description="Marcar como método predeterminado"
    )


class PaymentMethodRead(BaseModel):
    """
    Información de método de pago guardado.
    
    Usado en: GET /payments/methods
    """
    payment_method_id: str = Field(
        ...,
        description="ID del método de pago"
    )
    
    type: str = Field(
        ...,
        description="Tipo de método",
        examples=["card", "oxxo"]
    )
    
    card_brand: Optional[str] = Field(
        None,
        description="Marca de tarjeta",
        examples=["visa", "mastercard"]
    )
    
    card_last4: Optional[str] = Field(
        None,
        description="Últimos 4 dígitos"
    )
    
    card_exp_month: Optional[int] = Field(
        None,
        description="Mes de expiración"
    )
    
    card_exp_year: Optional[int] = Field(
        None,
        description="Año de expiración"
    )
    
    is_default: bool = Field(
        default=False,
        description="Si es el método predeterminado"
    )
    
    created_at: datetime = Field(
        ...,
        description="Fecha de creación"
    )


class PaymentMethodList(BaseModel):
    """Lista de métodos de pago del usuario."""
    
    items: list[PaymentMethodRead] = Field(
        ...,
        description="Métodos de pago guardados"
    )
    
    total: int = Field(
        ...,
        ge=0,
        description="Total de métodos"
    )
    
    model_config = ConfigDict(from_attributes=True)