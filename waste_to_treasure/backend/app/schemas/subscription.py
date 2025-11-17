"""
Schemas Pydantic para el modelo Subscription.

Define los contratos de entrada (request) y salida (response)
para las operaciones de suscripción.
"""
import uuid
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from app.models.subscriptions import SubscriptionStatus
from app.schemas.plan import PlanRead # Importamos PlanRead para anidarlo

# --- Schemas de Suscripción (Request) ---

class SubscriptionCreate(BaseModel):
    """
    Schema para el body del request POST /subscriptions/subscribe.
    El cliente debe proveer el ID del plan y un token de pago o PaymentMethod ID.
    """
    plan_id: int = Field(..., description="ID del plan al que se desea suscribir")
    payment_token: str = Field(
        ...,
        description="Token de pago (tok_) o PaymentMethod ID (pm_) de Stripe",
        examples=["pm_1PbHi9P9qA9gV3T9aBcDEfG", "tok_visa"]
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "plan_id": 1,
                "payment_token": "pm_1PbHi9P9qA9gV3T9aBcDEfG"
            }
        }
    )

# --- Schemas de Suscripción (Response) ---

class SubscriptionRead(BaseModel):
    """
    Schema de respuesta para una suscripción activa.
    Usado en: GET /subscriptions/me
    """
    subscription_id: int
    user_id: uuid.UUID
    status: SubscriptionStatus
    start_date: datetime
    next_billing_date: datetime
    gateway_sub_id: str = Field(
        ...,
        description="ID de la suscripción en la pasarela de pago (Stripe)"
    )

    # Relación anidada: Muestra los detalles del plan asociado
    plan: PlanRead = Field(..., description="Detalles del plan asociado")

    model_config = ConfigDict(from_attributes=True)