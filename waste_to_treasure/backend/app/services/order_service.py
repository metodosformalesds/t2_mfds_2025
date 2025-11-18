"""
Capa de servicio para Órdenes (Orders).

Implementa la lógica de negocio para:
- Creación de órdenes (checkout)
- Validación de carrito y stock (con bloqueo de filas)
- Listado de compras y ventas
- Consulta de detalles de órdenes
"""
# Autor: Alejandro Campa Alonso 215833
# Fecha: 2025-11-08T00:48:30-07:00
# Descripción: Servicio que implementa la lógica de negocio para checkout,
# validaciones de carrito/stock, creación de órdenes, notificaciones y
# consultas de compras/ventas.
import logging
import uuid
from decimal import Decimal
from typing import List, Tuple, Dict
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload, joinedload
from fastapi import HTTPException, status

from app.models.user import User, UserRoleEnum
from app.models.cart import Cart, CartItem
from app.models.listing import Listing
from app.models.order import Order, OrderStatusEnum
from app.models.order_item import OrderItem
from app.services.aws_ses_service import ses_service
from app.services.notification_service import notification_service # <-- 2. IMPORTAR NOTIFICATION_SERVICE

logger = logging.getLogger(__name__)

class OrderService:

    async def get_cart_for_checkout(
        self, 
        db: AsyncSession, 
        user: User
    ) -> Tuple[Cart, Dict[int, Listing]]:
        """
        Autor: Alejandro Campa Alonso 215833
        Obtiene el carrito del usuario y bloquea los listings asociados
        para una validación de stock segura (previene race conditions).

        Args:
            db: Sesión de base de datos (transacción).
            user: Usuario autenticado.

        Returns:
            Tupla (Cart, Dict[listing_id, Listing])

        Raises:
            HTTPException 404: Si el carrito está vacío.
            HTTPException 400: Si hay items no disponibles o sin stock.
        """
        logger.info(f"Iniciando checkout para usuario {user.user_id}")
        
        # 1. Obtener carrito con items y listings (usando selectinload con eager loading completo)
        cart_result = await db.execute(
            select(Cart)
            .where(Cart.user_id == user.user_id)
            .options(
                selectinload(Cart.items).selectinload(CartItem.listing).selectinload(Listing.images)
            )
        )
        cart = cart_result.scalar_one_or_none()

        if not cart or not cart.items:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El carrito está vacío."
            )

        # 2. Obtener y bloquear (FOR UPDATE) los listings del carrito
        listing_ids = [item.listing_id for item in cart.items]
        
        try:
            listings_stmt = (
                select(Listing)
                .where(Listing.listing_id.in_(listing_ids))
                .with_for_update() # Bloquea las filas para esta transacción
            )
            listings_result = await db.execute(listings_stmt)
            listings_map = {l.listing_id: l for l in listings_result.scalars()}
        except Exception as e:
            logger.error(f"Error al bloquear listings: {e}")
            raise HTTPException(status_code=500, detail="Error al preparar checkout")

        # 3. Validar stock y disponibilidad
        for item in cart.items:
            listing = listings_map.get(item.listing_id)
            
            if not listing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El item '{item.listing.title}' ya no está disponible."
                )
            if not listing.is_available():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El item '{listing.title}' no está activo."
                )
            if listing.quantity < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stock insuficiente para '{listing.title}'. "
                           f"Disponible: {listing.quantity}, Solicitado: {item.quantity}"
                )
            if listing.seller_id == user.user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"No puedes comprar tus propios items ('{listing.title}')."
                )

        logger.info("Carrito validado y listings bloqueados exitosamente.")
        return cart, listings_map

    async def create_order_from_cart(
        self,
        db: AsyncSession,
        user: User,
        cart: Cart,
        listings_map: Dict[int, Listing],
        payment_charge_id: str,
        payment_method: str
    ) -> Order:
        """
        Autor: Alejandro Campa Alonso 215833
        Crea una orden a partir del carrito del usuario. Este método:
        - Crea la cabecera `Order` y los `OrderItem` asociados.
        - Reduce el stock de los listings involucrados.
        - Vacía el carrito del usuario.
        - Crea notificaciones in-app para comprador y vendedores.
        - Intenta enviar un email de confirmación (no crítico si falla).

        Args:
            db: Sesión asíncrona de la base de datos (transacción).
            user: Usuario que realiza la compra.
            cart: Instancia de `Cart` con los items.
            listings_map: Mapa de `listing_id` a `Listing` bloqueados.
            payment_charge_id: ID de la transacción en la pasarela de pago.
            payment_method: Método de pago usado.

        Returns:
            La instancia de `Order` recién creada (con relaciones cargadas).

        Raises:
            HTTPException 500: Si ocurre un error crítico al persistir la orden.
        """
        try:
            # ... (Pasos 1 al 4: Crear Order, OrderItems, reducir stock, vaciar carrito) ...
            
            # 1. Crear la Orden (cabecera)
            new_order = Order(
                buyer_id=user.user_id,
                order_status=OrderStatusEnum.PAID,
                payment_charge_id=payment_charge_id,
                payment_method=payment_method,
                subtotal=Decimal("0.00"),
                commission_amount=Decimal("0.00"),
                total_amount=Decimal("0.00")
            )
            db.add(new_order)
            
            order_items_for_email = []
            seller_notifications_map = {} # {seller_id: [item_title, ...]}

            # 2. Crear OrderItems y reducir stock
            for item in cart.items:
                listing = listings_map[item.listing_id]
                
                listing.reduce_stock(item.quantity)
                
                order_item = OrderItem(
                    order=new_order,
                    listing_id=listing.listing_id,
                    quantity=item.quantity,
                    price_at_purchase=listing.price
                )
                db.add(order_item)
                
                # Preparar datos para email
                order_items_for_email.append({
                    "listing_title": listing.title,
                    "unit_price": listing.price,
                    "quantity": item.quantity,
                    "subtotal": listing.price * item.quantity
                })
                
                # --- 3. (AÑADIDO) Preparar datos para notificación al vendedor ---
                if listing.seller_id not in seller_notifications_map:
                    seller_notifications_map[listing.seller_id] = []
                seller_notifications_map[listing.seller_id].append(listing.title)
                # -----------------------------------------------------------

            # 4. Calcular totales
            new_order.calculate_totals() 

            # 5. Vaciar el carrito
            for item in cart.items:
                await db.delete(item)

            await db.flush()
            await db.commit()
            await db.refresh(new_order)

            logger.info(f"✅ Orden {new_order.order_id} creada y guardada exitosamente.")

            # --- 6. (AÑADIDO) Crear notificaciones in-app ---
            try:
                # 6a. Notificar al comprador
                await notification_service.create_notification(
                    db=db,
                    user_id=user.user_id,
                    content=f"Tu orden #{new_order.order_id} ha sido confirmada con éxito.",
                    type="ORDER",
                    link_url=f"/dashboard/purchases/{new_order.order_id}"
                )
                
                # 6b. Notificar a los vendedores
                for seller_id, titles in seller_notifications_map.items():
                    item_count = len(titles)
                    content = (
                        f"¡Buena noticia! Has vendido {item_count} item(s): "
                        f"{', '.join(titles[:2])}"
                    )
                    if item_count > 2:
                        content += f" y {item_count - 2} más."
                    
                    await notification_service.create_notification(
                        db=db,
                        user_id=seller_id,
                        content=content,
                        type="SALE", # Un tipo "SALE" para el vendedor
                        link_url=f"/dashboard/sales/{new_order.order_id}"
                    )
                
                logger.info(f"Notificaciones in-app creadas para orden {new_order.order_id}")

                # Commit de las notificaciones
                await db.commit()

            except Exception as notify_error:
                # No revertir la transacción si solo falla la notificación
                logger.error(
                    f"Error creando notificaciones in-app para orden {new_order.order_id}: {notify_error}",
                    exc_info=True
                )
                await db.rollback()
            # ---------------------------------------------------

            # 7. Enviar email de confirmación (Lógica anterior)
            try:
                await ses_service.send_order_confirmation(
                    to_email=user.email,
                    order_id=new_order.order_id,
                    total_amount=float(new_order.total_amount),
                    order_items=order_items_for_email
                )
            except Exception as email_error:
                logger.error(f"Error enviando email de confirmación para orden {new_order.order_id}: {email_error}")

            # Eager load relationships to avoid MissingGreenlet error
            stmt = (
                select(Order)
                .where(Order.order_id == new_order.order_id)
                .options(
                    selectinload(Order.order_items)
                    .selectinload(OrderItem.listing)
                    .selectinload(Listing.images)
                )
            )
            result = await db.execute(stmt)
            new_order = result.scalar_one()

            return new_order
            
        except Exception as e:
            logger.error(f"Error crítico al crear orden desde carrito: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al guardar la orden en la base de datos."
            )
        
    async def get_my_purchases(
        self,
        db: AsyncSession,
        user: User,
        skip: int,
        limit: int
    ) -> Tuple[List[Order], int]:
        """
        Autor: Alejandro Campa Alonso 215833
        Obtiene las órdenes de compra (comprador).

        Args:
            db: Sesión asíncrona de la base de datos.
            user: Usuario comprador.
            skip: Offset para paginación.
            limit: Límite de items.

        Returns:
            Tupla (lista_de_orders, total)
        """

        logger.info(f"🛒 get_my_purchases - Buscando compras para user_id: {user.user_id}, email: {user.email}")

        stmt_base = select(Order).where(Order.buyer_id == user.user_id)

        # Contar total
        count_stmt = select(func.count()).select_from(stmt_base.subquery())
        total_result = await db.execute(count_stmt)
        total = total_result.scalar() or 0

        logger.info(f"🛒 get_my_purchases - Total de compras encontradas: {total}")

        # Obtener órdenes con items y listings
        stmt = (
            stmt_base
            .options(
                selectinload(Order.order_items).selectinload(OrderItem.listing).selectinload(Listing.images)
            )
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        result = await db.execute(stmt)
        orders = result.scalars().all()

        logger.info(f"🛒 get_my_purchases - Retornando {len(orders)} órdenes en esta página (skip={skip}, limit={limit})")
        return list(orders), total

    async def get_my_sales(
        self, 
        db: AsyncSession, 
        user: User, 
        skip: int, 
        limit: int
    ) -> Tuple[List[Order], int]:
        """
        Autor: Alejandro Campa Alonso 215833
        Obtiene las órdenes de venta (vendedor).

        Args:
            db: Sesión asíncrona de la base de datos.
            user: Usuario vendedor.
            skip: Offset para paginación.
            limit: Límite de items.

        Returns:
            Tupla (lista_de_orders, total)
        """
        
        # Query base para encontrar IDs de órdenes que contienen items del vendedor
        stmt_base = (
            select(Order.order_id)
            .distinct()
            .join(Order.order_items)
            .join(OrderItem.listing)
            .where(Listing.seller_id == user.user_id)
        )
        
        # Contar total
        count_stmt = select(func.count()).select_from(stmt_base.subquery())
        total_result = await db.execute(count_stmt)
        total = total_result.scalar() or 0
        
        # Obtener órdenes completas (con todos sus items)
        stmt = (
            select(Order)
            .where(Order.order_id.in_(stmt_base))
            .options(
                selectinload(Order.order_items).selectinload(OrderItem.listing).selectinload(Listing.images),
                joinedload(Order.buyer)  # Cargar comprador para mostrar en la lista
            )
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        
        result = await db.execute(stmt)
        orders = result.scalars().all()
        return list(orders), total

    async def get_order_details(
        self, 
        db: AsyncSession, 
        order_id: int, 
        user: User
    ) -> Order:
        """
        Autor: Alejandro Campa Alonso 215833
        Obtiene el detalle de una orden, validando que el usuario
        sea el comprador, el vendedor de al menos un item, o admin.

        Args:
            db: Sesión asíncrona de la base de datos.
            order_id: ID de la orden a consultar.
            user: Usuario que solicita el detalle.

        Returns:
            La instancia `Order` si el usuario tiene permisos.

        Raises:
            HTTPException 404: Si la orden no existe.
            HTTPException 403: Si el usuario no tiene permisos.
        """
        stmt = (
            select(Order)
            .where(Order.order_id == order_id)
            .options(
                selectinload(Order.order_items).selectinload(OrderItem.listing).selectinload(Listing.images),
                joinedload(Order.buyer) # Cargar comprador
            )
        )
        
        result = await db.execute(stmt)
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Orden no encontrada"
            )
        
        # 1. Verificar si es admin
        if user.role == UserRoleEnum.ADMIN:
            return order
            
        # 2. Verificar si es el comprador
        if order.buyer_id == user.user_id:
            return order
            
        # 3. Verificar si es vendedor de algún item en la orden
        is_seller = any(
            item.listing and item.listing.seller_id == user.user_id
            for item in order.order_items
        )
        
        if is_seller:
            return order
            
        # 4. Si no es ninguno, denegar acceso
        logger.warning(
            f"Acceso denegado: Usuario {user.user_id} intentó ver orden {order_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver esta orden"
        )

# Singleton del servicio
order_service = OrderService()