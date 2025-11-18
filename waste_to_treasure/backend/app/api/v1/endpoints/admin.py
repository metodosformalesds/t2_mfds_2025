# Autor: Gabriel Florentino Reyes
# Fecha: 08-11-2025
# Descripción: Endpoints administrativos de la plataforma
#               Gestión de usuarios, publicaciones, reportes y dashboard
#               Consultas de logs y manejo de excepciones con rol ADMIN

"""
Endpoints de la API para el módulo de Administración.

Implementa operaciones administrativas para moderación de contenido,
gestión de reportes y dashboard de estadísticas.
Todos los endpoints requieren rol ADMIN.
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
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
    UserAdminList,
    UserAdminListItem,
)
from app.schemas.listing import ListingRead
from app.services import admin_service
from app.services.admin_service import AdminService
from app.services import listing_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get(
    "/users",
    response_model=UserAdminList,
    summary="Listar usuarios",
    description="Obtiene lista paginada de todos los usuarios para gestión administrativa.",
    responses={
        200: {"description": "Lista obtenida exitosamente"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos de administrador"},
    }
)
async def get_users_list(
    role: Optional[str] = Query(None, description="Filtrar por rol: USER, ADMIN"),
    status: Optional[str] = Query(None, description="Filtrar por estado: ACTIVE, BLOCKED, PENDING"),
    search: Optional[str] = Query(None, description="Buscar por email o nombre"),
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(50, ge=1, le=100, description="Número máximo de registros"),
    db: AsyncSession = Depends(get_async_db),
    current_admin: User = Depends(require_admin)
) -> UserAdminList:
    
    """
    Autor: Gabriel Florentino Reyes

    Descripción: Obtiene la lista paginada de usuarios para gestión administrativa.

    Parámetros:
        role (str|None): Filtro por rol (USER, ADMIN).
        status (str|None): Filtro por estado del usuario.
        search (str|None): Término de búsqueda por nombre o email.
        skip (int): Registros a omitir.
        limit (int): Registros por página.
        db (AsyncSession): Sesión de base de datos.
        current_admin (User): Usuario administrador autenticado.

    Retorna:
        UserAdminList: Lista paginada de usuarios.
    """
    
    logger.info(
        f"Admin {current_admin.user_id} listando usuarios "
        f"(role={role}, status={status}, search={search}, skip={skip}, limit={limit})"
    )
    
    items, total = await AdminService.get_users_list(
        db=db,
        role_filter=role,
        status_filter=status,
        search_term=search,
        skip=skip,
        limit=limit
    )
    
    page = (skip // limit) + 1 if limit > 0 else 1
    
    return UserAdminList(
        items=items,
        total=total,
        page=page,
        page_size=limit
    )

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
    Autor: Gabriel Florentino Reyes

    Descripción: Obtiene métricas generales del sistema para mostrarlas
                 en el dashboard administrativo.

    Parámetros:
        db (AsyncSession): Sesión de base de datos.
        current_admin (User): Usuario administrador autenticado.

    Retorna:
        StatsDashboard: Estadísticas del sistema.
    """
    
    logger.info(f"Admin {current_admin.user_id} solicitando estadísticas del dashboard")
    
    stats = await AdminService.get_dashboard_stats(db)
    
    return StatsDashboard(**stats)

@router.get(
    "/moderation/listings/{listing_id}",
    response_model=ListingRead,
    summary="Obtener detalles de listing en moderación",
    description="Obtiene los detalles completos de una publicación en cualquier estado (admin only).",
    responses={
        200: {"description": "Listing encontrado"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos de administrador"},
        404: {"description": "Listing no encontrado"},
    }
)
async def get_moderation_listing_detail(
    listing_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_admin: User = Depends(require_admin)
) -> ListingRead:
    
    """
    Autor: Gabriel Florentino Reyes

    Descripción: Obtiene los detalles completos de una publicación,
                 incluyendo estados ocultos para usuarios normales.

    Parámetros:
        listing_id (int): ID del listing.
        db (AsyncSession): Sesión de base de datos.
        current_admin (User): Administrador autenticado.

    Retorna:
        ListingRead: Información detallada del listing.
    """
    
    logger.info(f"Admin {current_admin.user_id} obteniendo detalles de listing {listing_id}")
    
    listing = await listing_service.get_listing_by_id(
        db=db,
        listing_id=listing_id,
        include_inactive=True  # Admin puede ver todos los estados
    )
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Listing {listing_id} no encontrado"
        )
    
    return ListingRead.model_validate(listing)


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
    Autor: Gabriel Florentino Reyes

    Descripción: Lista publicaciones en cola de moderación con filtros
                 opcionales por estado.

    Parámetros:
        status (str|None): Estado del listing.
        skip (int): Registros a omitir.
        limit (int): Registros por página.
        db (AsyncSession): Sesión de base de datos.
        current_admin (User): Administrador autenticado.

    Retorna:
        ModerationListingList: Lista paginada de listings en moderación.
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
    Autor: Gabriel Florentino Reyes

    Descripción: Aprueba una publicación pendiente y registra la acción
                 en los logs administrativos.

    Parámetros:
        listing_id (int): ID del listing.
        action_data (ListingModerationAction): Detalles de la acción.
        db (AsyncSession): Sesión de base de datos.
        current_admin (User): Administrador autenticado.

    Retorna:
        ListingModerationResponse: Resultado de la aprobación.
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
    Autor: Gabriel Florentino Reyes

    Descripción: Rechaza una publicación pendiente especificando la razón,
                 y registra la acción administrativa.

    Parámetros:
        listing_id (int): ID del listing.
        action_data (ListingModerationAction): Razón y detalles del rechazo.
        db (AsyncSession): Sesión de base de datos.
        current_admin (User): Administrador autenticado.

    Retorna:
        ListingModerationResponse: Resultado del rechazo.
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
    Autor: Gabriel Florentino Reyes

    Descripción: Lista reportes enviados por usuarios, filtrados por estado,
                 para revisión administrativa.

    Parámetros:
        status (str|None): Estado del reporte.
        skip (int): Registros a omitir.
        limit (int): Registros por página.
        db (AsyncSession): Sesión de base de datos.
        current_admin (User): Administrador autenticado.

    Retorna:
        ReportList: Lista paginada de reportes.
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
    Autor: Gabriel Florentino Reyes

    Descripción: Procesa un reporte, marcándolo como resuelto o desestimado.

    Parámetros:
        report_id (int): ID del reporte.
        resolution_data (ReportResolution): Acción a ejecutar.
        db (AsyncSession): Sesión de base de datos.
        current_admin (User): Administrador autenticado.

    Retorna:
        ReportResolutionResponse: Resultado de la resolución del reporte.
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
    Autor: Gabriel Florentino Reyes

    Descripción: Obtiene los registros de acciones administrativas para auditoría.

    Parámetros:
        action_type (str|None): Tipo de acción a filtrar.
        skip (int): Registros a omitir.
        limit (int): Registros por página.
        db (AsyncSession): Sesión de base de datos.
        current_admin (User): Administrador autenticado.

    Retorna:
        AdminActionLogList: Lista paginada de logs.
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