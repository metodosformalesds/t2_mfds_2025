"""
Capa de servicio para Report.

Implementa la lógica de negocio para el sistema de reportes,
incluyendo validaciones de entidades reportadas y gestión del
ciclo de vida de los reportes.
"""
import logging
from typing import List, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from uuid import UUID

from app.models.reports import Report, ModerationStatus, ReportType
from app.models.user import User
from app.models.listing import Listing
from app.models.order import Order
from app.schemas.report import ReportCreate

logger = logging.getLogger(__name__)


async def create_report(
    db: AsyncSession,
    report_data: ReportCreate,
    current_user: User
) -> Report:
    """
    Crea un nuevo reporte de usuario.
    
    Args:
        db: Sesión asíncrona de base de datos.
        report_data: Datos del reporte a crear.
        current_user: Usuario autenticado que crea el reporte.
        
    Returns:
        Reporte creado.
        
    Raises:
        HTTPException 400: Si no se especifica ninguna entidad a reportar
                          o si la entidad no existe.
        
    Note:
        - reporter_id se asigna automáticamente del current_user
        - Al menos una entidad debe ser especificada (listing/user/order)
        - Se valida que la entidad reportada exista
    """
    logger.info(
        f"Usuario {current_user.user_id} creando reporte de publicación: "
        f"listing_id={report_data.reported_listing_id}, razón={report_data.reason}"
    )

    # Validar que se especifique la publicación
    if not report_data.reported_listing_id:
        logger.warning("Intento de crear reporte sin especificar publicación")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe especificar el ID de la publicación a reportar"
        )

    # Validar existencia de la publicación
    await validate_listing_exists(db, report_data.reported_listing_id)

    # Crear instancia del modelo - solo para listings
    db_report = Report(
        reporter_user_id=current_user.user_id,
        report_type=ReportType.LISTING,
        reported_listing_id=report_data.reported_listing_id,
        reason=report_data.reason,  # Ya es string del schema
        details=report_data.description,
        status=ModerationStatus.PENDING
    )
    
    try:
        db.add(db_report)
        await db.commit()
        await db.refresh(db_report)
        logger.info(
            f"Reporte creado exitosamente: ID {db_report.report_id} "
            f"por usuario {current_user.user_id}"
        )
        return db_report
    except Exception as e:
        await db.rollback()
        logger.error(f"Error al crear reporte: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear el reporte"
        )


async def get_user_reports(
    db: AsyncSession,
    user_id: UUID,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[Report], int]:
    """
    Obtiene lista paginada de reportes creados por un usuario.
    
    Args:
        db: Sesión asíncrona de base de datos.
        user_id: UUID del usuario.
        skip: Número de registros a omitir.
        limit: Número máximo de registros.
        
    Returns:
        Tupla (lista de reportes, total).
        
    Note:
        Los reportes se ordenan por fecha (más recientes primero).
    """
    logger.info(f"Obteniendo reportes del usuario {user_id}")
    
    # Query base
    stmt = select(Report).where(Report.reporter_user_id == user_id)
    
    # Contar total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    count_result = await db.execute(count_stmt)
    total = count_result.scalar() or 0
    
    # Aplicar ordenamiento y paginación
    stmt = stmt.order_by(Report.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    reports = result.scalars().all()
    
    logger.info(f"Encontrados {len(reports)} de {total} reportes del usuario")
    return list(reports), total


async def get_report_by_id(
    db: AsyncSession,
    report_id: int,
    current_user: User
) -> Report:
    """
    Obtiene un reporte por su ID.
    
    Args:
        db: Sesión asíncrona de base de datos.
        report_id: ID del reporte.
        current_user: Usuario autenticado.
        
    Returns:
        Reporte encontrado.
        
    Raises:
        HTTPException 404: Si el reporte no existe.
        HTTPException 403: Si el usuario no es el creador ni admin.
        
    Note:
        Solo el creador del reporte o un admin pueden verlo.
    """
    logger.info(f"Usuario {current_user.user_id} solicitando reporte {report_id}")
    
    stmt = select(Report).where(Report.report_id == report_id)
    result = await db.execute(stmt)
    report = result.scalar_one_or_none()
    
    if not report:
        logger.warning(f"Reporte {report_id} no encontrado")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reporte con ID {report_id} no encontrado"
        )
    
    # Validar permisos: solo el reporter o admin pueden ver el reporte
    if report.reporter_user_id != current_user.user_id and current_user.role != "ADMIN":
        logger.warning(
            f"Usuario {current_user.user_id} sin permisos para ver reporte {report_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver este reporte"
        )
    
    return report


async def get_report_statistics(db: AsyncSession) -> dict:
    """
    Obtiene estadísticas de reportes (uso administrativo).
    
    Args:
        db: Sesión asíncrona de base de datos.
        
    Returns:
        Diccionario con estadísticas de reportes.
        
    Note:
        Este endpoint es típicamente usado por admins en el dashboard.
    """
    logger.info("Obteniendo estadísticas de reportes")
    
    # Total de reportes
    total_stmt = select(func.count()).select_from(Report)
    total = (await db.execute(total_stmt)).scalar() or 0
    
    # Reportes por estado
    pending_stmt = select(func.count()).select_from(Report).where(
        Report.status == ModerationStatus.PENDING
    )
    pending = (await db.execute(pending_stmt)).scalar() or 0
    
    resolved_stmt = select(func.count()).select_from(Report).where(
        Report.status == ModerationStatus.RESOLVED
    )
    resolved = (await db.execute(resolved_stmt)).scalar() or 0
    
    dismissed_stmt = select(func.count()).select_from(Report).where(
        Report.status == ModerationStatus.DISMISSED
    )
    dismissed = (await db.execute(dismissed_stmt)).scalar() or 0
    
    # Reportes por razón
    # Nota: Esta query puede optimizarse según el motor SQL
    reasons_stmt = select(Report.reason, func.count(Report.report_id)).group_by(Report.reason)
    reasons_result = await db.execute(reasons_stmt)
    reports_by_reason = {reason: count for reason, count in reasons_result.all()}
    
    stats = {
        "total_reports": total,
        "pending_reports": pending,
        "resolved_reports": resolved,
        "dismissed_reports": dismissed,
        "reports_by_reason": reports_by_reason,
    }
    
    logger.info(f"Estadísticas de reportes: {stats}")
    return stats

async def validate_listing_exists(db: AsyncSession, listing_id: int) -> None:
    """
    Valida que una publicación exista.
    
    Args:
        db: Sesión asíncrona de base de datos.
        listing_id: ID de la publicación.
        
    Raises:
        HTTPException 404: Si la publicación no existe.
    """
    stmt = select(Listing).where(Listing.listing_id == listing_id)
    result = await db.execute(stmt)
    listing = result.scalar_one_or_none()
    
    if not listing:
        logger.warning(f"Publicación {listing_id} no encontrada para reporte")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La publicación con ID {listing_id} no existe"
        )


async def validate_user_exists(db: AsyncSession, user_id: UUID) -> None:
    """
    Valida que un usuario exista.
    
    Args:
        db: Sesión asíncrona de base de datos.
        user_id: UUID del usuario.
        
    Raises:
        HTTPException 404: Si el usuario no existe.
    """
    stmt = select(User).where(User.user_id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        logger.warning(f"Usuario {user_id} no encontrado para reporte")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El usuario con ID {user_id} no existe"
        )


async def validate_order_exists(db: AsyncSession, order_id: int) -> None:
    """
    Valida que una orden exista.
    
    Args:
        db: Sesión asíncrona de base de datos.
        order_id: ID de la orden.
        
    Raises:
        HTTPException 404: Si la orden no existe.
    """
    stmt = select(Order).where(Order.order_id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        logger.warning(f"Orden {order_id} no encontrada para reporte")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La orden con ID {order_id} no existe"
        )