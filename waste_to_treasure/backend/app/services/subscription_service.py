"""
Capa de servicio para Planes y Suscripciones.

Implementa la lógica de negocio para:
- Listar planes.
- Obtener la suscripción activa de un usuario.
- Crear, cambiar y cancelar suscripciones.
- Simular llamadas a la pasarela de pago (Stripe).
"""
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.user import User
from app.models.plans import Plan, BillingCycle
from app.models.subscriptions import Subscription, SubscriptionStatus

logger = logging.getLogger(__name__)

class SubscriptionService:

    async def list_available_plans(self, db: AsyncSession) -> List[Plan]:
        """Lista todos los planes disponibles."""
        result = await db.execute(
            select(Plan).order_by(Plan.price.asc())
        )
        return list(result.scalars().all())

    async def get_active_subscription(
        self, 
        db: AsyncSession, 
        user: User
    ) -> Optional[Subscription]:
        """Obtiene la suscripción activa del usuario, si existe."""
        result = await db.execute(
            select(Subscription)
            .where(
                Subscription.user_id == user.user_id,
                Subscription.status == SubscriptionStatus.ACTIVE
            )
            .options(selectinload(Subscription.plan)) # Eager load plan details
        )
        return result.scalar_one_or_none()

    async def create_subscription(
        self,
        db: AsyncSession,
        user: User,
        plan_id: int,
        payment_token: str
    ) -> Subscription:
        """Crea una nueva suscripción o cambia una existente."""
        
        # 1. Validar el plan
        plan_result = await db.execute(select(Plan).where(Plan.plan_id == plan_id))
        plan = plan_result.scalar_one_or_none()
        if not plan:
            raise HTTPException(status_code=404, detail="Plan no encontrado")

        # 2. Verificar si existe una suscripción previa con el mismo plan
        existing_sub_result = await db.execute(
            select(Subscription).where(
                Subscription.user_id == user.user_id,
                Subscription.plan_id == plan_id
            )
        )
        existing_sub_same_plan = existing_sub_result.scalar_one_or_none()

        # 3. Cancelar cualquier suscripción activa de otros planes
        active_sub = await self.get_active_subscription(db, user)
        if active_sub and active_sub.plan_id != plan_id:
            logger.info(f"Cancelando suscripción de otro plan {active_sub.gateway_sub_id} para usuario {user.user_id}")
            # (SIMULADO) Llamar a Stripe para cancelar la sub anterior
            # payment_service.cancel_gateway_subscription(active_sub.gateway_sub_id)
            active_sub.status = SubscriptionStatus.CANCELLED

        # 4. (SIMULADO) Procesar pago con Stripe
        if not payment_token.startswith("tok_"):
            raise HTTPException(status_code=400, detail="Token de pago inválido (simulación)")
        
        # (SIMULADO) Stripe devuelve un ID de suscripción
        simulated_gateway_sub_id = f"sub_sim_{uuid.uuid4().hex[:12]}"
        logger.info(f"Suscripción (simulada) creada en pasarela: {simulated_gateway_sub_id}")

        # 5. Calcular fechas
        start_date = datetime.now(timezone.utc)
        if plan.billing_cycle == BillingCycle.MONTHLY:
            next_billing_date = start_date + timedelta(days=30)
        elif plan.billing_cycle == BillingCycle.QUARTERLY:
            next_billing_date = start_date + timedelta(days=90)
        elif plan.billing_cycle == BillingCycle.YEARLY:
            next_billing_date = start_date + timedelta(days=365)
        else:
            next_billing_date = start_date + timedelta(days=30) # Fallback

        # 6. Si existe una suscripción con el mismo plan, actualizarla
        if existing_sub_same_plan:
            logger.info(f"Reactivando suscripción existente {existing_sub_same_plan.subscription_id} para usuario {user.user_id}")
            existing_sub_same_plan.status = SubscriptionStatus.ACTIVE
            existing_sub_same_plan.start_date = start_date
            existing_sub_same_plan.next_billing_date = next_billing_date
            existing_sub_same_plan.gateway_sub_id = simulated_gateway_sub_id
            
            await db.commit()
            await db.refresh(existing_sub_same_plan)
            await db.refresh(existing_sub_same_plan, attribute_names=["plan"])
            
            return existing_sub_same_plan
        else:
            # 7. Crear una nueva suscripción si no existe una con el mismo plan
            new_subscription = Subscription(
                user_id=user.user_id,
                plan_id=plan.plan_id,
                status=SubscriptionStatus.ACTIVE,
                start_date=start_date,
                next_billing_date=next_billing_date,
                gateway_sub_id=simulated_gateway_sub_id
            )
            db.add(new_subscription)
            
            await db.commit()
            await db.refresh(new_subscription)
            await db.refresh(new_subscription, attribute_names=["plan"])
            
            return new_subscription

    async def cancel_subscription(
        self,
        db: AsyncSession,
        user: User
    ) -> Subscription:
        """Cancela la suscripción activa del usuario."""
        
        active_sub = await self.get_active_subscription(db, user)
        if not active_sub:
            raise HTTPException(status_code=404, detail="No se encontró una suscripción activa para cancelar")

        # (SIMULADO) Llamar a Stripe para cancelar
        # payment_service.cancel_gateway_subscription(active_sub.gateway_sub_id)
        logger.info(f"Cancelando suscripción (simulada) {active_sub.gateway_sub_id} en pasarela")

        # Actualizar estado en la BD
        active_sub.status = SubscriptionStatus.CANCELLED
        # Opcional: ajustar next_billing_date según la lógica de Stripe
        # (ej. si permanece activa hasta el final del ciclo de pago)

        await db.commit()
        await db.refresh(active_sub)

        return active_sub

    async def check_user_subscription_tier(
        self,
        db: AsyncSession,
        user: User
    ) -> Optional[str]:
        """
        Helper: Devuelve el nombre (tier) del plan activo del usuario.
        """
        active_sub = await self.get_active_subscription(db, user)
        if active_sub:
            return active_sub.plan.name # Devuelve "Pro", "Premium", etc.
        
        return None # Representa el tier "Gratis"

# Singleton del servicio
subscription_service = SubscriptionService()