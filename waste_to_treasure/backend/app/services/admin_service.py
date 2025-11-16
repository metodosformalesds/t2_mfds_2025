"""
Servicio para funcionalidades de administración.
Contiene la lógica de negocio para moderación y estadísticas.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Tuple
import uuid

from app.models.user import User, UserRoleEnum, UserStatusEnum
from app.models.listing import Listing, ListingStatusEnum
from app.models.order import Order, OrderStatusEnum
from app.models.reports import Report, ModerationStatus, ReportType
from app.models.admin_action_logs import AdminActionLog
from app.models.category import Category
from app.schemas.admin import (
    ListingModerationAction,
    ReportResolution
)


class AdminService:
    """Servicio para operaciones administrativas"""
    
    # ========== USER MANAGEMENT ==========
    
    @staticmethod
    async def get_users_list(
        db: AsyncSession,
        role_filter: Optional[str] = None,
        status_filter: Optional[str] = None,
        search_term: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Dict], int]:
        """Obtener lista de usuarios con filtros"""
        from sqlalchemy import or_
        
        # Query base
        stmt = select(User)
        count_stmt = select(func.count(User.user_id))
        
        # Filtro por rol
        if role_filter:
            try:
                role_enum = UserRoleEnum(role_filter.upper())
                stmt = stmt.where(User.role == role_enum)
                count_stmt = count_stmt.where(User.role == role_enum)
            except ValueError:
                pass
        
        # Filtro por estado
        if status_filter:
            try:
                status_enum = UserStatusEnum(status_filter.upper())
                stmt = stmt.where(User.status == status_enum)
                count_stmt = count_stmt.where(User.status == status_enum)
            except ValueError:
                pass
        
        # Búsqueda por email o nombre
        if search_term:
            search_pattern = f"%{search_term}%"
            search_filter = or_(
                User.email.ilike(search_pattern),
                User.full_name.ilike(search_pattern)
            )
            stmt = stmt.where(search_filter)
            count_stmt = count_stmt.where(search_filter)
        
        # Contar total
        total = await db.scalar(count_stmt) or 0
        
        # Aplicar paginación y ordenamiento
        stmt = stmt.order_by(User.created_at.desc()).offset(skip).limit(limit)
        
        result = await db.execute(stmt)
        users = result.scalars().all()
        
        # Formatear respuesta
        items = []
        for user in users:
            items.append({
                "user_id": user.user_id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "status": user.status,
                "created_at": user.created_at
            })
        
        return items, total
    
    # ========== STATISTICS ==========
    
    @staticmethod
    async def get_dashboard_stats(db: AsyncSession) -> Dict:
        """Obtener estadísticas generales del dashboard"""
        
        # Total usuarios
        total_users_stmt = select(func.count(User.user_id))
        total_users = await db.scalar(total_users_stmt) or 0
        
        # Usuarios activos
        active_users_stmt = select(func.count(User.user_id)).where(
            User.status == UserStatusEnum.ACTIVE
        )
        active_users = await db.scalar(active_users_stmt) or 0
        
        # Total listings
        total_listings_stmt = select(func.count(Listing.listing_id))
        total_listings = await db.scalar(total_listings_stmt) or 0
        
        # Listings por estado
        pending_listings_stmt = select(func.count(Listing.listing_id)).where(
            Listing.status == ListingStatusEnum.PENDING
        )
        pending_listings = await db.scalar(pending_listings_stmt) or 0
        
        approved_listings_stmt = select(func.count(Listing.listing_id)).where(
            Listing.status == ListingStatusEnum.ACTIVE
        )
        approved_listings = await db.scalar(approved_listings_stmt) or 0
        
        rejected_listings_stmt = select(func.count(Listing.listing_id)).where(
            Listing.status == ListingStatusEnum.REJECTED
        )
        rejected_listings = await db.scalar(rejected_listings_stmt) or 0
        
        # Total órdenes
        total_orders_stmt = select(func.count(Order.order_id))
        total_orders = await db.scalar(total_orders_stmt) or 0
        
        # Reportes pendientes
        pending_reports_stmt = select(func.count(Report.report_id)).where(
            Report.status == ModerationStatus.PENDING
        )
        pending_reports = await db.scalar(pending_reports_stmt) or 0
        
        # Revenue total (órdenes pagadas, enviadas y entregadas - excluyendo canceladas y reembolsadas)
        total_revenue_stmt = select(func.sum(Order.total_amount)).where(
            Order.order_status.in_([
                OrderStatusEnum.PAID,
                OrderStatusEnum.SHIPPED,
                OrderStatusEnum.DELIVERED
            ])
        )
        total_revenue = await db.scalar(total_revenue_stmt) or 0.0
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "total_listings": total_listings,
            "pending_listings": pending_listings,
            "approved_listings": approved_listings,
            "rejected_listings": rejected_listings,
            "total_orders": total_orders,
            "pending_reports": pending_reports,
            "total_revenue": float(total_revenue)
        }
    
    @staticmethod
    async def get_user_statistics(db: AsyncSession) -> Dict:
        """Obtener estadísticas de usuarios"""
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=now.weekday())
        month_start = today_start.replace(day=1)
        
        # Nuevos usuarios
        new_today_stmt = select(func.count(User.user_id)).where(
            User.created_at >= today_start
        )
        new_today = await db.scalar(new_today_stmt) or 0
        
        new_week_stmt = select(func.count(User.user_id)).where(
            User.created_at >= week_start
        )
        new_this_week = await db.scalar(new_week_stmt) or 0
        
        new_month_stmt = select(func.count(User.user_id)).where(
            User.created_at >= month_start
        )
        new_this_month = await db.scalar(new_month_stmt) or 0
        
        # Por rol
        by_role_stmt = select(User.role, func.count(User.user_id)).group_by(User.role)
        by_role_result = await db.execute(by_role_stmt)
        by_role = {role.value: count for role, count in by_role_result.all()}
        
        # Por status
        by_status_stmt = select(User.status, func.count(User.user_id)).group_by(User.status)
        by_status_result = await db.execute(by_status_stmt)
        by_status = {stat.value: count for stat, count in by_status_result.all()}
        
        return {
            "new_today": new_today,
            "new_this_week": new_this_week,
            "new_this_month": new_this_month,
            "by_role": by_role,
            "by_status": by_status
        }
    
    @staticmethod
    async def get_listing_statistics(db: AsyncSession) -> Dict:
        """Obtener estadísticas de listings"""
        
        # Active listings
        active_stmt = select(func.count(Listing.listing_id)).where(
            Listing.status == ListingStatusEnum.ACTIVE
        )
        active = await db.scalar(active_stmt) or 0
        
        # Pending listings
        pending_stmt = select(func.count(Listing.listing_id)).where(
            Listing.status == ListingStatusEnum.PENDING
        )
        pending_approval = await db.scalar(pending_stmt) or 0
        
        # Rejected listings
        rejected_stmt = select(func.count(Listing.listing_id)).where(
            Listing.status == ListingStatusEnum.REJECTED
        )
        rejected = await db.scalar(rejected_stmt) or 0
        
        # Por categoría
        by_category_stmt = select(
            Category.name,
            func.count(Listing.listing_id)
        ).join(Listing).group_by(Category.name)
        by_category_result = await db.execute(by_category_stmt)
        by_category = {name: count for name, count in by_category_result.all()}
        
        return {
            "active": active,
            "pending_approval": pending_approval,
            "rejected": rejected,
            "by_category": by_category
        }
    
    @staticmethod
    async def get_order_statistics(db: AsyncSession) -> Dict:
        """Obtener estadísticas de órdenes"""
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=now.weekday())
        month_start = today_start.replace(day=1)
        
        # Órdenes por período
        today_stmt = select(func.count(Order.order_id)).where(
            Order.created_at >= today_start
        )
        today = await db.scalar(today_stmt) or 0
        
        week_stmt = select(func.count(Order.order_id)).where(
            Order.created_at >= week_start
        )
        this_week = await db.scalar(week_stmt) or 0
        
        month_stmt = select(func.count(Order.order_id)).where(
            Order.created_at >= month_start
        )
        this_month = await db.scalar(month_stmt) or 0
        
        # Revenue por período
        revenue_today_stmt = select(func.sum(Order.total_amount)).where(
            Order.created_at >= today_start,
            Order.order_status == OrderStatusEnum.DELIVERED
        )
        revenue_today = await db.scalar(revenue_today_stmt) or 0.0
        
        revenue_week_stmt = select(func.sum(Order.total_amount)).where(
            Order.created_at >= week_start,
            Order.order_status == OrderStatusEnum.DELIVERED
        )
        revenue_this_week = await db.scalar(revenue_week_stmt) or 0.0
        
        revenue_month_stmt = select(func.sum(Order.total_amount)).where(
            Order.created_at >= month_start,
            Order.order_status == OrderStatusEnum.DELIVERED
        )
        revenue_this_month = await db.scalar(revenue_month_stmt) or 0.0
        
        # Por status
        by_status_stmt = select(
            Order.order_status,
            func.count(Order.order_id)
        ).group_by(Order.order_status)
        by_status_result = await db.execute(by_status_stmt)
        by_status = {status.value: count for status, count in by_status_result.all()}
        
        return {
            "today": today,
            "this_week": this_week,
            "this_month": this_month,
            "revenue_today": float(revenue_today),
            "revenue_this_week": float(revenue_this_week),
            "revenue_this_month": float(revenue_this_month),
            "by_status": by_status
        }
    
    @staticmethod
    async def get_report_statistics(db: AsyncSession) -> Dict:
        """Obtener estadísticas de reportes"""
        
        # Por estado
        pending_stmt = select(func.count(Report.report_id)).where(
            Report.status == ModerationStatus.PENDING
        )
        pending = await db.scalar(pending_stmt) or 0
        
        under_review_stmt = select(func.count(Report.report_id)).where(
            Report.status == ModerationStatus.UNDER_REVIEW
        )
        under_review = await db.scalar(under_review_stmt) or 0
        
        resolved_stmt = select(func.count(Report.report_id)).where(
            Report.status == ModerationStatus.RESOLVED
        )
        resolved = await db.scalar(resolved_stmt) or 0
        
        dismissed_stmt = select(func.count(Report.report_id)).where(
            Report.status == ModerationStatus.DISMISSED
        )
        dismissed = await db.scalar(dismissed_stmt) or 0
        
        # Por tipo
        by_type_stmt = select(
            Report.report_type,
            func.count(Report.report_id)
        ).group_by(Report.report_type)
        by_type_result = await db.execute(by_type_stmt)
        by_type = {report_type.value: count for report_type, count in by_type_result.all()}
        
        return {
            "pending": pending,
            "under_review": under_review,
            "resolved": resolved,
            "dismissed": dismissed,
            "by_type": by_type
        }
    
    # ========== LISTING MODERATION ==========
    
    @staticmethod
    async def get_moderation_queue(
        db: AsyncSession,
        status_filter: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Dict], int]:
        """Obtener cola de moderación de listings"""
        
        # Query base con eager loading
        stmt = select(Listing).options(
            selectinload(Listing.seller),
            selectinload(Listing.category)
        )
        
        # Filtro por estado
        if status_filter:
            try:
                status_enum = ListingStatusEnum(status_filter.upper())
                stmt = stmt.where(Listing.status == status_enum)
            except ValueError:
                pass
        
        # Contar total
        count_stmt = select(func.count()).select_from(Listing)
        if status_filter:
            try:
                status_enum = ListingStatusEnum(status_filter.upper())
                count_stmt = count_stmt.where(Listing.status == status_enum)
            except ValueError:
                pass
        
        total = await db.scalar(count_stmt) or 0
        
        # Aplicar paginación y ordenamiento
        stmt = stmt.order_by(Listing.created_at.desc()).offset(skip).limit(limit)
        
        result = await db.execute(stmt)
        listings = result.scalars().all()
        
        # Formatear respuesta
        items = []
        for listing in listings:
            # Mapear status del modelo al schema (usar MAYÚSCULAS para ModerationStatus enum)
            schema_status = "PENDING"
            if listing.status == ListingStatusEnum.ACTIVE:
                schema_status = "ACTIVE"
            elif listing.status == ListingStatusEnum.REJECTED:
                schema_status = "REJECTED"
            elif listing.status == ListingStatusEnum.INACTIVE:
                schema_status = "INACTIVE"
            
            items.append({
                "listing_id": listing.listing_id,
                "title": listing.title,
                "seller_id": listing.seller_id,
                "seller_name": listing.seller.full_name or listing.seller.email,
                "category_name": listing.category.name if listing.category else "Sin categoría",
                "price": float(listing.price),
                "status": schema_status,
                "created_at": listing.created_at,
                "submitted_at": listing.updated_at
            })
        
        return items, total
    
    @staticmethod
    async def approve_listing(
        db: AsyncSession,
        listing_id: int,
        admin_user: User,
        action_data: ListingModerationAction
    ) -> Dict:
        """Aprobar una publicación"""
        
        # Obtener listing
        stmt = select(Listing).where(Listing.listing_id == listing_id)
        result = await db.execute(stmt)
        listing = result.scalar_one_or_none()
        
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Listing with ID {listing_id} not found"
            )
        
        if listing.status != ListingStatusEnum.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Listing is not pending approval (current: {listing.status.value})"
            )
        
        # Actualizar estado
        listing.status = ListingStatusEnum.ACTIVE
        listing.approved_by_admin_id = admin_user.user_id
        
        # Registrar acción
        action_log = AdminActionLog(
            admin_id=admin_user.user_id,
            action_type="approve_listing",
            target_entity_type="listing",
            target_entity_id=listing_id,
            reason=action_data.reason or "Listing approved"
        )
        db.add(action_log)
        
        await db.commit()
        await db.refresh(listing)
        await db.refresh(action_log)
        
        return {
            "listing_id": listing_id,
            "new_status": "ACTIVE",
            "message": "Listing approved successfully",
            "action_log_id": action_log.log_id
        }
    
    @staticmethod
    async def reject_listing(
        db: AsyncSession,
        listing_id: int,
        admin_user: User,
        action_data: ListingModerationAction
    ) -> Dict:
        """Rechazar una publicación"""
        
        if not action_data.reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reason is required for rejection"
            )
        
        # Obtener listing
        stmt = select(Listing).where(Listing.listing_id == listing_id)
        result = await db.execute(stmt)
        listing = result.scalar_one_or_none()
        
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Listing with ID {listing_id} not found"
            )
        
        if listing.status != ListingStatusEnum.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Listing is not pending approval (current: {listing.status.value})"
            )
        
        # Actualizar estado y guardar razón de rechazo
        listing.status = ListingStatusEnum.REJECTED
        listing.rejection_reason = action_data.reason

        # Registrar acción
        action_log = AdminActionLog(
            admin_id=admin_user.user_id,
            action_type="reject_listing",
            target_entity_type="listing",
            target_entity_id=listing_id,
            reason=action_data.reason
        )
        db.add(action_log)
        
        await db.commit()
        await db.refresh(listing)
        await db.refresh(action_log)
        
        return {
            "listing_id": listing_id,
            "new_status": "REJECTED",
            "message": "Listing rejected",
            "action_log_id": action_log.log_id
        }
    
    # ========== REPORT MODERATION ==========
    
    @staticmethod
    async def get_reports_queue(
        db: AsyncSession,
        status_filter: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Dict], int]:
        """Obtener cola de reportes"""
        
        # Query base con eager loading
        stmt = select(Report).options(
            selectinload(Report.reporter)
        )
        
        # Filtro por estado
        if status_filter:
            try:
                status_enum = ModerationStatus(status_filter.lower())
                stmt = stmt.where(Report.status == status_enum)
            except ValueError:
                pass
        
        # Contar total
        count_stmt = select(func.count()).select_from(Report)
        if status_filter:
            try:
                status_enum = ModerationStatus(status_filter.lower())
                count_stmt = count_stmt.where(Report.status == status_enum)
            except ValueError:
                pass
        
        total = await db.scalar(count_stmt) or 0
        
        # Aplicar paginación
        stmt = stmt.order_by(Report.created_at.desc()).offset(skip).limit(limit)
        
        result = await db.execute(stmt)
        reports = result.scalars().all()
        
        # Formatear respuesta
        items = []
        for report in reports:
            # Determinar entidad reportada
            entity_id = report.reported_listing_id or report.reported_order_id or 0
            if report.reported_user_id:
                entity_id = 0  # User IDs son UUID, no int
            
            entity_type = report.report_type.value
            entity_desc = f"{entity_type.capitalize()} ID: {entity_id}"
            
            items.append({
                "report_id": report.report_id,
                "reporter_id": report.reporter_user_id,
                "reporter_name": report.reporter.full_name or report.reporter.email,
                "report_type": entity_type,
                "reported_entity_id": entity_id,
                "reported_entity_description": entity_desc,
                "reason": report.reason,
                "description": report.details,
                "status": report.status.value,
                "created_at": report.created_at
            })
        
        return items, total
    
    @staticmethod
    async def resolve_report(
        db: AsyncSession,
        report_id: int,
        admin_user: User,
        resolution_data: ReportResolution
    ) -> Dict:
        """Resolver o desestimar un reporte"""
        
        if resolution_data.action not in ["resolved", "dismissed"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Action must be 'resolved' or 'dismissed'"
            )
        
        # Obtener reporte
        stmt = select(Report).where(Report.report_id == report_id)
        result = await db.execute(stmt)
        report = result.scalar_one_or_none()
        
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report with ID {report_id} not found"
            )
        
        if report.status != ModerationStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only pending reports can be processed"
            )
        
        # Actualizar estado
        new_status = ModerationStatus.RESOLVED if resolution_data.action == "resolved" else ModerationStatus.DISMISSED
        report.status = new_status
        report.resolved_by_admin_id = admin_user.user_id
        
        # Registrar acción
        action_log = AdminActionLog(
            admin_id=admin_user.user_id,
            action_type=f"{resolution_data.action}_report",
            target_entity_type="report",
            target_entity_id=report_id,
            reason=resolution_data.resolution_notes
        )
        db.add(action_log)
        
        await db.commit()
        await db.refresh(report)
        await db.refresh(action_log)
        
        return {
            "report_id": report_id,
            "new_status": new_status.value,
            "message": f"Report {resolution_data.action} successfully",
            "action_log_id": action_log.log_id
        }
    
    # ========== ADMIN ACTION LOGS ==========
    
    @staticmethod
    async def get_admin_logs(
        db: AsyncSession,
        action_type_filter: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Dict], int]:
        """Obtener logs de acciones administrativas"""
        
        # Query base con eager loading
        stmt = select(AdminActionLog).options(
            selectinload(AdminActionLog.admin)
        )
        
        # Filtro por tipo de acción
        if action_type_filter:
            stmt = stmt.where(AdminActionLog.action_type == action_type_filter)
        
        # Contar total
        count_stmt = select(func.count()).select_from(AdminActionLog)
        if action_type_filter:
            count_stmt = count_stmt.where(AdminActionLog.action_type == action_type_filter)
        
        total = await db.scalar(count_stmt) or 0
        
        # Aplicar paginación
        stmt = stmt.order_by(AdminActionLog.created_at.desc()).offset(skip).limit(limit)
        
        result = await db.execute(stmt)
        logs = result.scalars().all()
        
        # Formatear respuesta
        items = []
        for log in logs:
            items.append({
                "log_id": log.log_id,
                "admin_id": log.admin_id,
                "admin_name": log.admin.full_name or log.admin.email if log.admin else "System",
                "action_type": log.action_type,
                "target_type": log.target_entity_type,
                "target_id": log.target_entity_id,
                "reason": log.reason,
                "created_at": log.created_at
            })
        
        return items, total