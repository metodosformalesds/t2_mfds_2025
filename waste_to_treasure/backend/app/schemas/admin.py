# Autor: Gabriel Florentino Reyes
# Fecha: 08-11-2025
# Descripción:Esquemas Pydantic para la gestión administrativa y moderación 
#               dentro de la plataforma.

"""
Esquemas de Pydantic para el módulo de Administración.

Define los contratos de entrada y salida para operaciones de moderación
y gestión administrativa de la plataforma.
"""
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum
from app.models.user import UserRoleEnum, UserStatusEnum


class ModerationStatus(str, Enum):
    """Estados posibles de moderación."""
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    REJECTED = "REJECTED"
    INACTIVE = "INACTIVE"

class ReportStatus(str, Enum):
    """Estados posibles de un reporte."""
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


# ==========================================
# USER MANAGEMENT SCHEMAS
# ==========================================

class UserAdminListItem(BaseModel):
    """
    Esquema para listar usuarios en panel administrativo.
    
    Usado en: GET /api/v1/admin/users
    """
    user_id: UUID = Field(..., description="ID del usuario")
    email: str = Field(..., description="Email del usuario")
    full_name: Optional[str] = Field(None, description="Nombre completo")
    role: UserRoleEnum = Field(..., description="Rol del usuario")
    status: UserStatusEnum = Field(..., description="Estado del usuario")
    created_at: datetime = Field(..., description="Fecha de registro")
    
    model_config = ConfigDict(from_attributes=True)


class UserAdminList(BaseModel):
    """
    Esquema de respuesta paginada para lista de usuarios.
    
    Usado en: GET /api/v1/admin/users
    """
    items: List[UserAdminListItem] = Field(..., description="Lista de usuarios")
    total: int = Field(..., ge=0, description="Total de usuarios")
    page: int = Field(..., ge=1, description="Página actual")
    page_size: int = Field(..., ge=1, le=100, description="Items por página")
    
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# DASHBOARD SCHEMAS
# ==========================================

class StatsDashboard(BaseModel):
    """
    Esquema para estadísticas del dashboard administrativo.
    
    Usado en: GET /api/v1/admin/dashboard/stats
    Requiere: Rol ADMIN
    """
    total_users: int = Field(..., ge=0, description="Total de usuarios registrados")
    active_users: int = Field(..., ge=0, description="Usuarios activos")
    total_listings: int = Field(..., ge=0, description="Total de publicaciones")
    pending_listings: int = Field(..., ge=0, description="Publicaciones pendientes de aprobación")
    approved_listings: int = Field(..., ge=0, description="Publicaciones aprobadas")
    rejected_listings: int = Field(..., ge=0, description="Publicaciones rechazadas")
    total_orders: int = Field(..., ge=0, description="Total de órdenes")
    pending_reports: int = Field(..., ge=0, description="Reportes pendientes de revisión")
    total_revenue: float = Field(..., ge=0, description="Ingresos totales de la plataforma")
    
    model_config = ConfigDict(from_attributes=True)

class ModerationQueueItem(BaseModel):
    """
    Esquema para item en cola de moderación de publicaciones.
    
    Usado en: GET /api/v1/admin/moderation/listings
    """
    listing_id: int = Field(..., description="ID de la publicación")
    title: str = Field(..., description="Título de la publicación")
    seller_id: UUID = Field(..., description="ID del vendedor")
    seller_name: str = Field(..., description="Nombre del vendedor")
    category_name: str = Field(..., description="Categoría")
    price: float = Field(..., ge=0, description="Precio")
    status: ModerationStatus = Field(..., description="Estado de moderación")
    created_at: datetime = Field(..., description="Fecha de creación")
    submitted_at: Optional[datetime] = Field(None, description="Fecha de envío a moderación")
    
    model_config = ConfigDict(from_attributes=True)


class ModerationListingList(BaseModel):
    """
    Esquema de respuesta paginada para lista de publicaciones en moderación.
    
    Usado en: GET /api/v1/admin/moderation/listings
    """
    items: List[ModerationQueueItem] = Field(..., description="Lista de publicaciones")
    total: int = Field(..., ge=0, description="Total de publicaciones en moderación")
    page: int = Field(..., ge=1, description="Página actual")
    page_size: int = Field(..., ge=1, le=100, description="Items por página")
    
    model_config = ConfigDict(from_attributes=True)


class ListingModerationAction(BaseModel):
    """
    Esquema para aprobar o rechazar una publicación.
    
    Usado en: POST /api/v1/admin/moderation/listings/{listing_id}/approve|reject
    """
    reason: Optional[str] = Field(
        None,
        max_length=500,
        description="Razón de aprobación/rechazo (requerida para rechazo)",
        examples=["Contenido inapropiado", "Información incompleta", "Cumple con las políticas"]
    )
    notes: Optional[str] = Field(
        None,
        max_length=1000,
        description="Notas adicionales internas para el log",
        examples=["Se verificó la documentación del vendedor"]
    )


class ListingModerationResponse(BaseModel):
    """
    Respuesta al aprobar o rechazar una publicación.
    """
    listing_id: int = Field(..., description="ID de la publicación")
    new_status: ModerationStatus = Field(..., description="Nuevo estado")
    message: str = Field(..., description="Mensaje de confirmación")
    action_log_id: int = Field(..., description="ID del log de acción administrativa")
    
    model_config = ConfigDict(from_attributes=True)

class ReportQueueItem(BaseModel):
    """
    Esquema para item en cola de reportes.
    
    Usado en: GET /api/v1/admin/moderation/reports
    """
    report_id: int = Field(..., description="ID del reporte")
    reporter_id: UUID = Field(..., description="ID del usuario que reportó")
    reporter_name: str = Field(..., description="Nombre del usuario que reportó")
    report_type: str = Field(..., description="Tipo de reporte (listing/user/order)")
    reported_entity_id: int = Field(..., description="ID de la entidad reportada")
    reported_entity_description: str = Field(..., description="Descripción de la entidad")
    reason: str = Field(..., description="Razón del reporte")
    description: Optional[str] = Field(None, description="Descripción detallada")
    status: ReportStatus = Field(..., description="Estado del reporte")
    created_at: datetime = Field(..., description="Fecha de creación")
    
    model_config = ConfigDict(from_attributes=True)


class ReportList(BaseModel):
    """
    Esquema de respuesta paginada para lista de reportes.
    
    Usado en: GET /api/v1/admin/moderation/reports
    """
    items: List[ReportQueueItem] = Field(..., description="Lista de reportes")
    total: int = Field(..., ge=0, description="Total de reportes")
    page: int = Field(..., ge=1, description="Página actual")
    page_size: int = Field(..., ge=1, le=100, description="Items por página")
    
    model_config = ConfigDict(from_attributes=True)


class ReportResolution(BaseModel):
    """
    Esquema para resolver o desestimar un reporte.
    
    Usado en: POST /api/v1/admin/moderation/reports/{report_id}/resolve
    """
    action: str = Field(
        ...,
        description="Acción tomada: 'resolved' o 'dismissed'",
        examples=["resolved", "dismissed"]
    )
    resolution_notes: str = Field(
        ...,
        min_length=10,
        max_length=1000,
        description="Notas sobre la resolución del reporte",
        examples=["Se verificó la publicación y se tomaron acciones correctivas"]
    )
    additional_action_taken: Optional[str] = Field(
        None,
        max_length=500,
        description="Acciones adicionales tomadas (ej: suspensión de usuario)",
        examples=["Usuario suspendido por 7 días", "Publicación eliminada"]
    )


class ReportResolutionResponse(BaseModel):
    """
    Respuesta al resolver un reporte.
    """
    report_id: int = Field(..., description="ID del reporte")
    new_status: ReportStatus = Field(..., description="Nuevo estado del reporte")
    message: str = Field(..., description="Mensaje de confirmación")
    action_log_id: int = Field(..., description="ID del log de acción administrativa")
    
    model_config = ConfigDict(from_attributes=True)

class AdminActionLogRead(BaseModel):
    """
    Esquema para leer logs de acciones administrativas.
    
    Usado en: GET /api/v1/admin/logs (opcional)
    """
    log_id: int = Field(..., description="ID del log")
    admin_id: UUID = Field(..., description="ID del administrador")
    admin_name: str = Field(..., description="Nombre del administrador")
    action_type: str = Field(..., description="Tipo de acción (approve_listing, reject_listing, etc.)")
    target_type: Optional[str] = Field(None, description="Tipo de entidad objetivo")
    target_id: Optional[int] = Field(None, description="ID de la entidad objetivo")
    reason: Optional[str] = Field(None, description="Razón de la acción")
    notes: Optional[str] = Field(None, description="Notas adicionales")
    created_at: datetime = Field(..., description="Fecha de la acción")
    
    model_config = ConfigDict(from_attributes=True)


class AdminActionLogList(BaseModel):
    """
    Esquema de respuesta paginada para logs administrativos.
    """
    items: List[AdminActionLogRead] = Field(..., description="Lista de logs")
    total: int = Field(..., ge=0, description="Total de logs")
    page: int = Field(..., ge=1, description="Página actual")
    page_size: int = Field(..., ge=1, le=100, description="Items por página")
    
    model_config = ConfigDict(from_attributes=True)