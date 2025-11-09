"""
Endpoints de la API para el módulo de Administración.

Implementa operaciones administrativas para moderación de contenido,
gestión de reportes y dashboard de estadísticas.
Todos los endpoints requieren rol ADMIN.
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db, require_admin
from app.models.user import User
from app.schemas.admin import (
    StatsDashboard,
    ModerationListingList,
    ListingModerationAction,
    ListingModerationResponse,
    ReportList,
    ReportResolution,
    ReportResolutionResponse,
    AdminActionLogList,
)
from app.services import admin_service
from app.services.admin_service import AdminService

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get(
    "/dashboard/stats",
    response_model=StatsDashboard,
    summary="Obtener estadísticas del dashboard",
    description="Obtiene métricas generales de la plataforma para el dashboard administrativo.",
    responses={
        200: {"description": "Estadísticas obtenidas exitosamente"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos de administrador"},
    }
)

async def get_dashboard_stats(
    db: AsyncSession = Depends(get_async_db),
    current_admin: User = Depends(require_admin)
) -> StatsDashboard:
    """
    Obtiene estadísticas generales de la plataforma.
    """
    logger.info(f"Admin {current_admin.user_id} solicitando estadísticas del dashboard")
    
    stats = await AdminService.get_dashboard_stats(db)
    
    return StatsDashboard(**stats)

@router.get(
    "/moderation/listings",
    response_model=ModerationListingList,
    summary="Listar publicaciones en moderación",
    description="Obtiene lista paginada de publicaciones pendientes de aprobación.",
    responses={
        200: {"description": "Lista obtenida exitosamente"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos de administrador"},
    }
)
async def get_moderation_listings(
    status: Optional[str] = Query(
        None,
        description="Filtrar por estado: pending, approved, rejected"
    ),
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(50, ge=1, le=100, description="Número máximo de registros"),
    db: AsyncSession = Depends(get_async_db),
    current_admin: User = Depends(require_admin)
) -> ModerationListingList:
    """
    Lista las publicaciones en cola de moderación.
    
    **Requiere**: Rol ADMIN
    """
    logger.info(
        f"Admin {current_admin.user_id} listando publicaciones en moderación "
        f"(status={status}, skip={skip}, limit={limit})"
    )
    
    items, total = await AdminService.get_moderation_queue(
        db=db,
        status_filter=status,
        skip=skip,
        limit=limit
    )
    
    page = (skip // limit) + 1 if limit > 0 else 1
    
    return ModerationListingList(
        items=items,
        total=total,
        page=page,
        page_size=limit
    )


@router.post(
    "/moderation/listings/{listing_id}/approve",
    response_model=ListingModerationResponse,
    summary="Aprobar publicación",
    description="Aprueba una publicación pendiente y registra la acción.",
    responses={
        200: {"description": "Publicación aprobada exitosamente"},
        400: {"description": "Estado inválido o datos incorrectos"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos de administrador"},
        404: {"description": "Publicación no encontrada"},
    }
)
async def approve_listing(
    listing_id: int,
    action_data: ListingModerationAction,
    db: AsyncSession = Depends(get_async_db),
    current_admin: User = Depends(require_admin)
) -> ListingModerationResponse:
    """
    Aprueba una publicación pendiente de moderación.
    
    **Requiere**: Rol ADMIN
    """
    logger.info(f"Admin {current_admin.user_id} aprobando listing {listing_id}")
    
    result = await AdminService.approve_listing(
        db=db,
        listing_id=listing_id,
        admin_user=current_admin,
        action_data=action_data
    )
    
    return ListingModerationResponse(**result)


@router.post(
    "/moderation/listings/{listing_id}/reject",
    response_model=ListingModerationResponse,
    summary="Rechazar publicación",
    description="Rechaza una publicación pendiente y registra la acción.",
    responses={
        200: {"description": "Publicación rechazada exitosamente"},
        400: {"description": "Estado inválido, razón faltante o datos incorrectos"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos de administrador"},
        404: {"description": "Publicación no encontrada"},
    }
)
async def reject_listing(
    listing_id: int,
    action_data: ListingModerationAction,
    db: AsyncSession = Depends(get_async_db),
    current_admin: User = Depends(require_admin)
) -> ListingModerationResponse:
    """
    Rechaza una publicación pendiente de moderación.
    
    **Requiere**: Rol ADMIN
    """
    logger.info(f"Admin {current_admin.user_id} rechazando listing {listing_id}")
    
    result = await AdminService.reject_listing(
        db=db,
        listing_id=listing_id,
        admin_user=current_admin,
        action_data=action_data
    )
    
    return ListingModerationResponse(**result)

@router.get(
    "/moderation/reports",
    response_model=ReportList,
    summary="Listar reportes pendientes",
    description="Obtiene lista paginada de reportes de usuarios.",
    responses={
        200: {"description": "Lista obtenida exitosamente"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos de administrador"},
    }
)
async def get_moderation_reports(
    status: Optional[str] = Query(
        None,
        description="Filtrar por estado: pending, resolved, dismissed"
    ),
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(50, ge=1, le=100, description="Número máximo de registros"),
    db: AsyncSession = Depends(get_async_db),
    current_admin: User = Depends(require_admin)
) -> ReportList:
    """
    Lista los reportes de usuarios para revisión administrativa.
    
    **Requiere**: Rol ADMIN
    """
    logger.info(
        f"Admin {current_admin.user_id} listando reportes "
        f"(status={status}, skip={skip}, limit={limit})"
    )
    
    items, total = await AdminService.get_reports_queue(
        db=db,
        status_filter=status,
        skip=skip,
        limit=limit
    )
    
    page = (skip // limit) + 1 if limit > 0 else 1
    
    return ReportList(
        items=items,
        total=total,
        page=page,
        page_size=limit
    )


@router.post(
    "/moderation/reports/{report_id}/resolve",
    response_model=ReportResolutionResponse,
    summary="Resolver reporte",
    description="Resuelve o desestima un reporte de usuario.",
    responses={
        200: {"description": "Reporte procesado exitosamente"},
        400: {"description": "Estado inválido o datos incorrectos"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos de administrador"},
        404: {"description": "Reporte no encontrado"},
    }
)
async def resolve_report(
    report_id: int,
    resolution_data: ReportResolution,
    db: AsyncSession = Depends(get_async_db),
    current_admin: User = Depends(require_admin)
) -> ReportResolutionResponse:
    """
    Resuelve o desestima un reporte pendiente.
    
    **Requiere**: Rol ADMIN
    """
    logger.info(f"Admin {current_admin.user_id} resolviendo reporte {report_id}")
    
    result = await AdminService.resolve_report(
        db=db,
        report_id=report_id,
        admin_user=current_admin,
        resolution_data=resolution_data
    )
    
    return ReportResolutionResponse(**result)

@router.get(
    "/logs",
    response_model=AdminActionLogList,
    summary="Listar logs administrativos",
    description="Obtiene logs de acciones administrativas para auditoría.",
    responses={
        200: {"description": "Logs obtenidos exitosamente"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos de administrador"},
    }
)
async def get_admin_logs(
    action_type: Optional[str] = Query(
        None,
        description="Filtrar por tipo de acción"
    ),
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(50, ge=1, le=100, description="Número máximo de registros"),
    db: AsyncSession = Depends(get_async_db),
    current_admin: User = Depends(require_admin)
) -> AdminActionLogList:
    """
    Lista los logs de acciones administrativas (auditoría).
    
    **Requiere**: Rol ADMIN
    """
    logger.info(
        f"Admin {current_admin.user_id} consultando logs administrativos "
        f"(action_type={action_type}, skip={skip}, limit={limit})"
    )
    
    items, total = await AdminService.get_admin_logs(
        db=db,
        action_type_filter=action_type,
        skip=skip,
        limit=limit
    )
    
    page = (skip // limit) + 1 if limit > 0 else 1
    
    return AdminActionLogList(
        items=items,
        total=total,
        page=page,
        page_size=limit
    )