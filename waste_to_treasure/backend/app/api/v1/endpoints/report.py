"""
Endpoints de la API para Report.

Implementa operaciones para el sistema de reportes de usuarios
sobre contenido, otros usuarios u órdenes.
Todos los endpoints requieren autenticación.
"""
import logging
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db, get_current_active_user
from app.models.user import User
from app.schemas.report import (
    ReportRead,
    ReportCreate,
    ReportList,
)
from app.services import report_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "",
    response_model=ReportRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nuevo reporte",
    description="Crea un reporte sobre una publicación, usuario u orden.",
    responses={
        201: {"description": "Reporte creado exitosamente"},
        400: {"description": "Datos inválidos o entidad no existe"},
        401: {"description": "No autenticado"},
        404: {"description": "Entidad reportada no encontrada"},
    }
)
@router.post(
    "/",
    response_model=ReportRead,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False
)
async def create_report(
    report_data: ReportCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
) -> ReportRead:
    """
    Crea un nuevo reporte de contenido, usuario u orden.
    
    **Requiere**: Usuario autenticado
    """
    logger.info(
        f"Usuario {current_user.user_id} creando reporte: "
        f"razón={report_data.reason}"
    )
    
    report = await report_service.create_report(db, report_data, current_user)
    
    return report


@router.get(
    "/my-reports",
    response_model=ReportList,
    summary="Listar mis reportes",
    description="Obtiene lista paginada de reportes creados por el usuario autenticado.",
    responses={
        200: {"description": "Lista de reportes obtenida exitosamente"},
        401: {"description": "No autenticado"},
    }
)
async def get_my_reports(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(50, ge=1, le=100, description="Número máximo de registros"),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
) -> ReportList:
    """
    Lista los reportes creados por el usuario actual.
    
    **Requiere**: Usuario autenticado
    """
    logger.info(
        f"Usuario {current_user.user_id} listando sus reportes "
        f"(skip={skip}, limit={limit})"
    )
    
    reports, total = await report_service.get_user_reports(
        db=db,
        user_id=current_user.user_id,
        skip=skip,
        limit=limit
    )
    
    # Calcular página actual
    page = (skip // limit) + 1 if limit > 0 else 1
    
    return ReportList(
        items=reports,
        total=total,
        page=page,
        page_size=limit
    )


@router.get(
    "/{report_id}",
    response_model=ReportRead,
    summary="Obtener reporte por ID",
    description="Obtiene los detalles completos de un reporte específico.",
    responses={
        200: {"description": "Reporte encontrado"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos (no es el creador ni admin)"},
        404: {"description": "Reporte no encontrado"},
    }
)
async def get_report(
    report_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
) -> ReportRead:
    """
    Obtiene un reporte específico por su ID.
    
    **Requiere**: Usuario autenticado (creador del reporte o admin)
    """
    logger.info(f"Usuario {current_user.user_id} obteniendo reporte {report_id}")
    
    report = await report_service.get_report_by_id(db, report_id, current_user)
    
    return report