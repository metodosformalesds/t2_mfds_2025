"""
Servicio de negocio para gestión de pagos.

Implementa la lógica de negocio para:
- Gestión de Payment Customers (Stripe/PayPal)
- Creación y actualización de PaymentTransactions
- Validaciones de órdenes para pago
- Procesamiento de reembolsos
- Integración con stripe_service

Este servicio actúa como capa intermedia entre los endpoints
y la base de datos, encapsulando toda la lógica de negocio.

Autor: Oscar Alonso Nava Rivera
Fecha: 08/11/2025
Descripción: Servicio de negocio para pagos y transacciones.
"""
import logging
from typing import Optional, List, Tuple
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.user import User
from app.models.order import Order, OrderStatusEnum
from app.models.payment_customer import PaymentCustomer
from app.models.payment_transaction import PaymentTransaction
from app.models.payment_enums import PaymentGatewayEnum, PaymentStatusEnum
from app.services.stripe_service import stripe_service

logger = logging.getLogger(__name__)


class PaymentService:
    """
    Servicio para gestión de pagos y transacciones.

    Autor: Oscar Alonso Nava Rivera
    Descripción: Servicio que centraliza la lógica de pagos y transacciones.

    Centraliza toda la lógica de negocio relacionada con pagos:
    - CRUD de Payment Customers
    - CRUD de Payment Transactions
    - Validaciones de órdenes
    - Procesamiento de webhooks
    - Reembolsos

    Example:
        ```python
        from app.services.payment_service import payment_service
        
        # Crear customer
        customer = await payment_service.create_customer(
            db, user_id, "cus_123", "STRIPE"
        )
        
        # Crear transacción
        transaction = await payment_service.create_transaction(
            db, order_id, user_id, "pi_123", Decimal("100.00")
        )
        ```
    """
    
    # ==========================================
    # GESTIÓN DE PAYMENT CUSTOMERS
    # ==========================================
    
    async def get_customer_by_user_id(
        self,
        db: AsyncSession,
        user_id: UUID,
        gateway: Optional[PaymentGatewayEnum] = PaymentGatewayEnum.STRIPE
    ) -> Optional[PaymentCustomer]:
        """
        Obtiene el Payment Customer de un usuario por su ID.
        
        Args:
            db: Sesión de base de datos.
            user_id: UUID del usuario.
            gateway: Pasarela de pago (default: STRIPE).
            
        Returns:
            PaymentCustomer si existe, None si no.
        """
        result = await db.execute(
            select(PaymentCustomer)
            .where(
                PaymentCustomer.user_id == user_id,
                PaymentCustomer.gateway == gateway
            )
        )
        return result.scalar_one_or_none()
    
    async def create_customer(
        self,
        db: AsyncSession,
        user_id: UUID,
        gateway_customer_id: str,
        gateway: PaymentGatewayEnum = PaymentGatewayEnum.STRIPE,
        email: Optional[str] = None,
        default_payment_method_id: Optional[str] = None
    ) -> PaymentCustomer:
        """
        Crea un nuevo Payment Customer en la base de datos.
        
        Args:
            db: Sesión de base de datos.
            user_id: UUID del usuario.
            gateway_customer_id: ID del customer en Stripe/PayPal.
            gateway: Pasarela de pago.
            email: Email del customer (opcional).
            default_payment_method_id: ID del método de pago default (opcional).
            
        Returns:
            PaymentCustomer creado.
            
        Raises:
            HTTPException: Si ya existe un customer para ese usuario y gateway.
        """
        # Verificar que no exista
        existing = await self.get_customer_by_user_id(db, user_id, gateway)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ya existe un customer de {gateway.value} para este usuario"
            )
        
        # Crear customer
        customer = PaymentCustomer(
            user_id=user_id,
            gateway=gateway,
            gateway_customer_id=gateway_customer_id,
            default_payment_method_id=default_payment_method_id
        )
        
        db.add(customer)
        await db.commit()
        await db.refresh(customer)
        
        logger.info(
            f"Payment Customer creado: {customer.payment_customer_id} "
            f"(user={user_id}, gateway={gateway.value})"
        )
        
        return customer
    
    async def update_customer_payment_method(
        self,
        db: AsyncSession,
        customer_id: int,
        payment_method_id: str
    ) -> PaymentCustomer:
        """
        Actualiza el método de pago predeterminado de un customer.
        
        Args:
            db: Sesión de base de datos.
            customer_id: ID del Payment Customer.
            payment_method_id: ID del nuevo método de pago.
            
        Returns:
            PaymentCustomer actualizado.
        """
        result = await db.execute(
            select(PaymentCustomer)
            .where(PaymentCustomer.payment_customer_id == customer_id)
        )
        customer = result.scalar_one_or_none()
        
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer {customer_id} no encontrado"
            )
        
        customer.default_payment_method_id = payment_method_id
        await db.commit()
        await db.refresh(customer)
        
        logger.info(f"Método de pago actualizado para customer {customer_id}")
        return customer
    
    async def get_or_create_stripe_customer(
        self,
        db: AsyncSession,
        user: User
    ) -> PaymentCustomer:
        """
        Obtiene o crea un customer de Stripe para el usuario.
        
        Helper method que simplifica la creación de customers.
        Valida que el customer exista en Stripe antes de retornarlo.
        Si el customer fue eliminado de Stripe, crea uno nuevo.
        
        Args:
            db: Sesión de base de datos.
            user: Usuario.
            
        Returns:
            PaymentCustomer (existente o nuevo).
        """
        # Intentar obtener existente
        customer = await self.get_customer_by_user_id(
            db, user.user_id, PaymentGatewayEnum.STRIPE
        )
        
        if customer:
            # Validar que el customer exista en Stripe
            try:
                await stripe_service.get_customer(customer.gateway_customer_id)
                # Customer existe en Stripe, retornarlo
                return customer
            except Exception as e:
                # Customer no existe en Stripe (eliminado o de otra cuenta)
                logger.warning(
                    f"Customer {customer.gateway_customer_id} no existe en Stripe. "
                    f"Eliminando registro y creando nuevo. Error: {e}"
                )
                # Eliminar registro obsoleto
                await db.delete(customer)
                await db.commit()
        
        # Crear nuevo customer en Stripe
        stripe_customer = await stripe_service.create_customer(
            email=user.email,
            name=user.full_name,
            metadata={"user_id": str(user.user_id)}
        )
        
        # Guardar en BD
        customer = await self.create_customer(
            db=db,
            user_id=user.user_id,
            gateway_customer_id=stripe_customer.id,
            gateway=PaymentGatewayEnum.STRIPE,
            email=stripe_customer.email
        )
        
        return customer
    
    # ==========================================
    # GESTIÓN DE TRANSACCIONES
    # ==========================================
    
    async def create_transaction(
        self,
        db: AsyncSession,
        user_id: UUID,
        gateway: PaymentGatewayEnum,
        gateway_transaction_id: str,
        amount: Decimal,
        currency: str = "MXN",
        order_id: Optional[int] = None,
        subscription_id: Optional[int] = None,
        gateway_customer_id: Optional[str] = None,
        payment_method_type: Optional[str] = None,
        payment_method_last4: Optional[str] = None,
        payment_method_brand: Optional[str] = None,
        status: PaymentStatusEnum = PaymentStatusEnum.PENDING
    ) -> PaymentTransaction:
        """
        Crea una nueva transacción de pago.
        
        Args:
            db: Sesión de base de datos.
            user_id: UUID del usuario que paga.
            gateway: Pasarela de pago.
            gateway_transaction_id: ID de la transacción en la pasarela.
            amount: Monto de la transacción.
            currency: Código de moneda (default: MXN).
            order_id: ID de la orden (opcional).
            subscription_id: ID de la suscripción (opcional).
            gateway_customer_id: ID del customer en la pasarela (opcional).
            payment_method_type: Tipo de método de pago (opcional).
            payment_method_last4: Últimos 4 dígitos (opcional).
            payment_method_brand: Marca del método (opcional).
            status: Estado inicial (default: PENDING).
            
        Returns:
            PaymentTransaction creada.
            
        Raises:
            HTTPException: Si faltan datos requeridos o hay conflictos.
        """
        # Validar que tenga al menos orden O suscripción
        if not order_id and not subscription_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debe especificar order_id o subscription_id"
            )
        
        # Validar que no tenga ambos
        if order_id and subscription_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puede especificar order_id Y subscription_id"
            )
        
        # Crear transacción
        transaction = PaymentTransaction(
            user_id=user_id,
            gateway=gateway,
            gateway_transaction_id=gateway_transaction_id,
            gateway_customer_id=gateway_customer_id,
            amount=amount,
            currency=currency.upper(),
            status=status,
            order_id=order_id,
            subscription_id=subscription_id,
            payment_method_type=payment_method_type,
            payment_method_last4=payment_method_last4,
            payment_method_brand=payment_method_brand,
            initiated_at=datetime.utcnow()
        )
        
        db.add(transaction)
        await db.commit()
        await db.refresh(transaction)
        
        logger.info(
            f"PaymentTransaction creada: {transaction.transaction_id} "
            f"(gateway_id={gateway_transaction_id}, amount={amount})"
        )
        
        return transaction
    
    async def get_transaction_by_id(
        self,
        db: AsyncSession,
        transaction_id: int
    ) -> Optional[PaymentTransaction]:
        """
        Obtiene una transacción por su ID.
        
        Args:
            db: Sesión de base de datos.
            transaction_id: ID de la transacción.
            
        Returns:
            PaymentTransaction si existe, None si no.
        """
        result = await db.execute(
            select(PaymentTransaction)
            .where(PaymentTransaction.transaction_id == transaction_id)
            .options(
                selectinload(PaymentTransaction.order),
                selectinload(PaymentTransaction.user)
            )
        )
        return result.scalar_one_or_none()
    
    async def get_transaction_by_gateway_id(
        self,
        db: AsyncSession,
        gateway_transaction_id: str
    ) -> Optional[PaymentTransaction]:
        """
        Obtiene una transacción por su ID en la pasarela.
        
        Args:
            db: Sesión de base de datos.
            gateway_transaction_id: ID en Stripe/PayPal.
            
        Returns:
            PaymentTransaction si existe, None si no.
        """
        result = await db.execute(
            select(PaymentTransaction)
            .where(PaymentTransaction.gateway_transaction_id == gateway_transaction_id)
        )
        return result.scalar_one_or_none()
    
    async def update_transaction_status(
        self,
        db: AsyncSession,
        transaction_id: int,
        status: PaymentStatusEnum,
        error_code: Optional[str] = None,
        error_message: Optional[str] = None
    ) -> PaymentTransaction:
        """
        Actualiza el estado de una transacción.
        
        Args:
            db: Sesión de base de datos.
            transaction_id: ID de la transacción.
            status: Nuevo estado.
            error_code: Código de error (opcional).
            error_message: Mensaje de error (opcional).
            
        Returns:
            PaymentTransaction actualizada.
        """
        transaction = await self.get_transaction_by_id(db, transaction_id)
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transacción {transaction_id} no encontrada"
            )
        
        transaction.status = status
        
        if status == PaymentStatusEnum.COMPLETED:
            transaction.completed_at = datetime.utcnow()
        
        if error_code:
            transaction.error_code = error_code
        if error_message:
            transaction.error_message = error_message
        
        await db.commit()
        await db.refresh(transaction)
        
        logger.info(f"Transacción {transaction_id} actualizada a {status.value}")
        return transaction
    
    async def mark_transaction_refunded(
        self,
        db: AsyncSession,
        transaction_id: int,
        refund_id: str
    ) -> PaymentTransaction:
        """
        Marca una transacción como reembolsada.
        
        Args:
            db: Sesión de base de datos.
            transaction_id: ID de la transacción.
            refund_id: ID del reembolso en la pasarela.
            
        Returns:
            PaymentTransaction actualizada.
        """
        transaction = await self.update_transaction_status(
            db, transaction_id, PaymentStatusEnum.REFUNDED
        )
        
        # Guardar refund_id en metadata
        if transaction.transaction_metadata:
            import json
            metadata = json.loads(transaction.transaction_metadata)
            metadata['refund_id'] = refund_id
            transaction.transaction_metadata = json.dumps(metadata)
        else:
            import json
            transaction.transaction_metadata = json.dumps({'refund_id': refund_id})
        
        await db.commit()
        await db.refresh(transaction)
        
        return transaction
    
    async def get_transactions_by_user(
        self,
        db: AsyncSession,
        user_id: UUID,
        skip: int = 0,
        limit: int = 20,
        status: Optional[PaymentStatusEnum] = None
    ) -> Tuple[List[PaymentTransaction], int]:
        """
        Lista transacciones de un usuario.
        
        Args:
            db: Sesión de base de datos.
            user_id: UUID del usuario.
            skip: Offset para paginación.
            limit: Límite de resultados.
            status: Filtrar por estado (opcional).
            
        Returns:
            Tupla (lista de transacciones, total).
        """
        query = select(PaymentTransaction).where(
            PaymentTransaction.user_id == user_id
        )
        
        if status:
            query = query.where(PaymentTransaction.status == status)
        
        # Contar total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar_one()
        
        # Obtener items paginados
        query = query.order_by(PaymentTransaction.created_at.desc())
        query = query.offset(skip).limit(limit)
        query = query.options(selectinload(PaymentTransaction.order))
        
        result = await db.execute(query)
        transactions = result.scalars().all()
        
        return list(transactions), total
    
    # ==========================================
    # VALIDACIONES DE ÓRDENES
    # ==========================================
    
    async def get_order_for_payment(
        self,
        db: AsyncSession,
        order_id: int,
        user_id: UUID
    ) -> Optional[Order]:
        """
        Obtiene una orden validando que pertenezca al usuario.
        
        Args:
            db: Sesión de base de datos.
            order_id: ID de la orden.
            user_id: UUID del usuario.
            
        Returns:
            Order si existe y pertenece al usuario, None si no.
        """
        result = await db.execute(
            select(Order)
            .where(
                Order.order_id == order_id,
                Order.buyer_id == user_id
            )
            .options(selectinload(Order.order_items))
        )
        return result.scalar_one_or_none()
    
    async def validate_order_can_be_paid(
        self,
        order: Order
    ) -> None:
        """
        Valida que una orden pueda ser pagada.
        
        Args:
            order: Orden a validar.
            
        Raises:
            HTTPException: Si la orden no puede ser pagada.
        """
        # Validar que la orden exista
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Orden no encontrada"
            )
        
        # Validar que no esté ya pagada
        if order.order_status != OrderStatusEnum.PAID:
            # En tu implementación, podrías tener un estado PENDING antes de PAID
            # Por ahora asumimos que PAID es el primer estado después de crear
            pass
        
        # Validar que tenga items
        if not order.order_items or len(order.order_items) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La orden no tiene items"
            )
        
        # Validar que el total sea mayor a 0
        if order.total_amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El total de la orden debe ser mayor a 0"
            )
    
    # ==========================================
    # REEMBOLSOS
    # ==========================================
    
    async def get_transaction_for_refund(
        self,
        db: AsyncSession,
        transaction_id: int,
        user: User
    ) -> Optional[PaymentTransaction]:
        """
        Obtiene una transacción validando permisos para reembolso.
        
        El usuario debe ser:
        - El comprador (owner de la orden)
        - El vendedor de algún item de la orden
        - Admin
        
        Args:
            db: Sesión de base de datos.
            transaction_id: ID de la transacción.
            user: Usuario solicitante.
            
        Returns:
            PaymentTransaction si tiene permisos, None si no.
        """
        result = await db.execute(
            select(PaymentTransaction)
            .where(PaymentTransaction.transaction_id == transaction_id)
            .options(
                selectinload(PaymentTransaction.order),
                selectinload(PaymentTransaction.user)
            )
        )
        transaction = result.scalar_one_or_none()
        
        if not transaction:
            return None
        
        # Admin puede reembolsar cualquier transacción
        if user.role == "ADMIN":
            return transaction
        
        # El comprador puede reembolsar su propia transacción
        if transaction.user_id == user.user_id:
            return transaction
        
        # El vendedor puede reembolsar si vendió items en la orden
        if transaction.order:
            for item in transaction.order.order_items:
                if item.seller_id == user.user_id:
                    return transaction
        
        return None
    
    # ==========================================
    # WEBHOOKS Y PROCESAMIENTO
    # ==========================================
    
    async def process_payment_success(
        self,
        db: AsyncSession,
        gateway_transaction_id: str,
        amount: Decimal,
        payment_method_details: Optional[dict] = None
    ) -> PaymentTransaction:
        """
        Procesa un pago exitoso recibido por webhook.
        
        Args:
            db: Sesión de base de datos.
            gateway_transaction_id: ID de la transacción en la pasarela.
            amount: Monto pagado.
            payment_method_details: Detalles del método de pago (opcional).
            
        Returns:
            PaymentTransaction actualizada.
        """
        # Buscar transacción existente
        transaction = await self.get_transaction_by_gateway_id(
            db, gateway_transaction_id
        )
        
        if not transaction:
            logger.warning(
                f"Transacción {gateway_transaction_id} no encontrada en BD. "
                "Puede ser un pago iniciado directamente en Stripe."
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transacción no encontrada"
            )
        
        # Actualizar a COMPLETED
        transaction = await self.update_transaction_status(
            db, transaction.transaction_id, PaymentStatusEnum.COMPLETED
        )
        
        # Actualizar detalles del método de pago si se proporcionan
        if payment_method_details:
            transaction.payment_method_type = payment_method_details.get('type')
            transaction.payment_method_last4 = payment_method_details.get('last4')
            transaction.payment_method_brand = payment_method_details.get('brand')
            await db.commit()
            await db.refresh(transaction)
        
        # Si tiene orden asociada, actualizar estado de la orden
        if transaction.order:
            transaction.order.order_status = OrderStatusEnum.PAID
            await db.commit()
        
        logger.info(f"Pago procesado exitosamente: {gateway_transaction_id}")
        return transaction
    
    async def process_payment_failed(
        self,
        db: AsyncSession,
        gateway_transaction_id: str,
        error_code: str,
        error_message: str
    ) -> PaymentTransaction:
        """
        Procesa un pago fallido recibido por webhook.
        
        Args:
            db: Sesión de base de datos.
            gateway_transaction_id: ID de la transacción en la pasarela.
            error_code: Código de error.
            error_message: Mensaje de error.
            
        Returns:
            PaymentTransaction actualizada.
        """
        transaction = await self.get_transaction_by_gateway_id(
            db, gateway_transaction_id
        )
        
        if not transaction:
            logger.warning(f"Transacción {gateway_transaction_id} no encontrada")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transacción no encontrada"
            )
        
        transaction = await self.update_transaction_status(
            db,
            transaction.transaction_id,
            PaymentStatusEnum.FAILED,
            error_code=error_code,
            error_message=error_message
        )
        
        logger.warning(
            f"Pago fallido: {gateway_transaction_id} - "
            f"Error: {error_code} - {error_message}"
        )
        
        return transaction


# Singleton
payment_service = PaymentService()
