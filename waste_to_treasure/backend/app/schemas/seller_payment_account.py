"""
Schemas de Pydantic para SellerPaymentAccount.

Define contratos para gestionar cuentas de pago de vendedores.
"""

# Autor: Oscar Alonso Nava Rivera
# Fecha: 16/11/2025
# Descripción: Esquemas para creación, actualización y lectura de cuentas de pago de vendedores.
from typing import Optional
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict, EmailStr, field_validator

from app.models.payment_enums import PaymentGatewayEnum


class SellerPaymentAccountBase(BaseModel):
    """
    Autor: Oscar Alonso Nava Rivera

    Esquema base para SellerPaymentAccount.
    """
    
    gateway: PaymentGatewayEnum = Field(
        ...,
        description="Pasarela para recibir pagos"
    )
    
    account_holder_name: Optional[str] = Field(
        None,
        min_length=2,
        max_length=255,
        description="Nombre del titular de la cuenta"
    )


class SellerPaymentAccountCreate(SellerPaymentAccountBase):
    """
    Autor: Oscar Alonso Nava Rivera

    Esquema para crear cuenta de pago de vendedor.
    
    Usado en: POST /api/v1/sellers/payment-accounts
    """
    gateway_account_id: str = Field(
        ...,
        min_length=3,
        max_length=255,
        description="Email de PayPal o ID de Stripe Connect",
        examples=["vendedor@example.com"]
    )
    
    is_default: bool = Field(
        default=False,
        description="Marcar como cuenta predeterminada"
    )
    
    @field_validator("gateway_account_id")
    @classmethod
    def validate_gateway_account_id(cls, v: str, info) -> str:
        """
        Autor: Oscar Alonso Nava Rivera

        Valida formato según el gateway.
        """
        gateway = info.data.get("gateway")
        
        if gateway == PaymentGatewayEnum.PAYPAL:
            # Validar que parezca un email
            if "@" not in v or "." not in v:
                raise ValueError("Para PayPal, debe ser un email válido")
        
        return v
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "gateway": "PAYPAL",
                "gateway_account_id": "vendedor@example.com",
                "account_holder_name": "Juan Pérez",
                "is_default": True
            }
        }
    }


class SellerPaymentAccountUpdate(BaseModel):
    """
    Autor: Oscar Alonso Nava Rivera

    Esquema para actualizar cuenta de pago.
    """
    
    account_holder_name: Optional[str] = Field(
        None,
        description="Actualizar nombre del titular"
    )
    
    is_default: Optional[bool] = Field(
        None,
        description="Cambiar si es predeterminada"
    )


class SellerPaymentAccountInDB(SellerPaymentAccountBase):
    """
    Autor: Oscar Alonso Nava Rivera

    Esquema de SellerPaymentAccount en BD.
    """
    
    account_id: int
    user_id: UUID
    gateway_account_id: str
    is_default: bool
    is_verified: bool
    verification_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class SellerPaymentAccountRead(SellerPaymentAccountInDB):
    """
    Autor: Oscar Alonso Nava Rivera

    Esquema de respuesta para SellerPaymentAccount.

    Usado en: GET /sellers/payment-accounts
    """
    masked_account_id: Optional[str] = Field(
        None,
        description="ID de cuenta enmascarado"
    )


class SellerPaymentAccountList(BaseModel):
    """
    Autor: Oscar Alonso Nava Rivera

    Lista de cuentas de pago del vendedor.
    """
    
    items: list[SellerPaymentAccountRead] = Field(
        ...,
        description="Cuentas de pago"
    )
    
    total: int = Field(
        ...,
        ge=0,
        description="Total de cuentas"
    )
    
    model_config = ConfigDict(from_attributes=True)


class SellerPaymentAccountAdmin(SellerPaymentAccountRead):
    """
    Autor: Oscar Alonso Nava Rivera

    Esquema extendido para admin.

    Incluye información completa sin enmascarar.
    Usado en: Admin endpoints
    """
    # Admin puede ver el ID completo
    full_account_id: str = Field(
        ...,
        description="ID de cuenta completo (solo admin)"
    )