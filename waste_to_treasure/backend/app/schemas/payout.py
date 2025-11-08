"""
Schemas de Pydantic para Payout.

Define contratos para gestionar pagos a vendedores.
"""
from typing import Optional
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

from app.models.payment_enums import PayoutStatusEnum


class PayoutBase(BaseModel):
    """Esquema base para Payout."""
    
    amount: Decimal = Field(
        ...,
        gt=0,
        decimal_places=2,
        description="Monto a transferir"
    )
    
    currency: str = Field(
        default="MXN",
        min_length=3,
        max_length=3,
        description="Moneda del payout"
    )


class PayoutCreate(PayoutBase):
    """
    Esquema para crear payout.
    
    Usado internamente por el sistema.
    """
    seller_id: UUID = Field(
        ...,
        description="UUID del vendedor"
    )
    
    seller_account_id: int = Field(
        ...,
        gt=0,
        description="ID de la cuenta de pago del vendedor"
    )


class PayoutApprove(BaseModel):
    """
    Request para aprobar payout (admin).
    
    Usado en: POST /api/v1/admin/payouts/{payout_id}/approve
    """
    approval_notes: Optional[str] = Field(
        None,
        max_length=500,
        description="Notas del admin sobre la aprobación"
    )


class PayoutReject(BaseModel):
    """
    Request para rechazar payout (admin).
    
    Usado en: POST /api/v1/admin/payouts/{payout_id}/reject
    """
    rejection_reason: str = Field(
        ...,
        min_length=10,
        max_length=500,
        description="Razón del rechazo"
    )


class PayoutInDB(PayoutBase):
    """Esquema de Payout en BD."""
    
    payout_id: int
    seller_id: UUID
    seller_account_id: int
    status: PayoutStatusEnum
    gateway_transaction_id: Optional[str] = None
    approved_by_admin_id: Optional[UUID] = None
    approval_notes: Optional[str] = None
    initiated_at: datetime
    approved_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class PayoutRead(PayoutInDB):
    """
    Esquema de respuesta para Payout.
    
    Usado en: GET /sellers/payouts, GET /admin/payouts
    """
    formatted_amount: Optional[str] = Field(
        None,
        description="Monto formateado"
    )
    
    days_pending: Optional[int] = Field(
        None,
        description="Días desde solicitud"
    )
    
    can_be_approved: bool = Field(
        default=False,
        description="Si puede ser aprobado"
    )


class PayoutList(BaseModel):
    """Lista paginada de payouts."""
    
    items: list[PayoutRead] = Field(
        ...,
        description="Lista de payouts"
    )
    
    total: int = Field(
        ...,
        ge=0,
        description="Total de payouts"
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
    
    # Estadísticas agregadas
    total_pending_amount: Optional[Decimal] = Field(
        None,
        description="Monto total pendiente"
    )
    
    total_completed_amount: Optional[Decimal] = Field(
        None,
        description="Monto total pagado"
    )
    
    model_config = ConfigDict(from_attributes=True)


class PayoutStats(BaseModel):
    """
    Estadísticas de payouts para vendedor.
    
    Usado en: GET /sellers/payouts/stats
    """
    total_payouts: int = Field(
        ...,
        description="Total de payouts"
    )
    
    pending_payouts: int = Field(
        ...,
        description="Payouts pendientes"
    )
    
    completed_payouts: int = Field(
        ...,
        description="Payouts completados"
    )
    
    pending_amount: Decimal = Field(
        ...,
        description="Monto pendiente"
    )
    
    completed_amount: Decimal = Field(
        ...,
        description="Monto ya pagado"
    )
    
    next_payout_date: Optional[datetime] = Field(
        None,
        description="Fecha estimada del próximo payout"
    )