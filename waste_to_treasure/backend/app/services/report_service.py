# Autor: Gabriel Florentino Reyes
# Fecha: 08-11-2025
# Descripción: Servicio de reportes de la plataforma.
#              Contiene la lógica de negocio para:
#               - Crear reportes de listings, usuarios u órdenes.
#               - Validar existencia de entidades reportadas.
#               - Consultar reportes por usuario o por ID.
#               - Obtener estadísticas de reportes para administración.
#               - Manejar excepciones y logging de acciones.

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
    Autor: Gabriel Florentino Reyes

    Descripción: Crea un nuevo reporte sobre una publicación, usuario u orden.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        report_data (ReportCreate): Datos del reporte a crear.
        current_user (User): Usuario que realiza el reporte.

    Retorna:
        Report: Reporte creado.
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
    Autor: Gabriel Florentino Reyes

    Descripción: Obtiene la lista paginada de reportes creados por un usuario.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        user_id (UUID): ID del usuario.
        skip (int): Número de registros a omitir.
        limit (int): Número máximo de registros a retornar.

    Retorna:
        Tuple[List[Report], int]: Lista de reportes y total.
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
    Autor: Gabriel Florentino Reyes

    Descripción: Obtiene un reporte por su ID, solo si el usuario es el creador o un administrador.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        report_id (int): ID del reporte.
        current_user (User): Usuario autenticado que solicita el reporte.

    Retorna:
        Report: Reporte encontrado.
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
    Autor: Gabriel Florentino Reyes

    Descripción: Obtiene estadísticas generales de reportes para uso administrativo.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.

    Retorna:
        dict: Estadísticas de reportes (totales, pendientes, resueltos, descartados y por razón).
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
    Autor: Gabriel Florentino Reyes

    Descripción: Valida que una publicación exista en la base de datos.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        listing_id (int): ID de la publicación a validar.

    Retorna:
        None
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
    Autor: Gabriel Florentino Reyes

    Descripción: Valida que un usuario exista en la base de datos.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        user_id (UUID): ID del usuario a validar.

    Retorna:
        None
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
    Autor: Gabriel Florentino Reyes

    Descripción: Valida que una orden exista en la base de datos.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        order_id (int): ID de la orden a validar.

    Retorna:
        None
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