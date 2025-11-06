"""
Modelo de base de datos para Order.

Implementa la tabla 'orders'
Almacena las órdenes de compra completadas (transacciones).
"""
import uuid
from typing import Optional, List, TYPE_CHECKING
from decimal import Decimal

from sqlalchemy import String, Integer, Numeric, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.models.base import BaseModel
if TYPE_CHECKING:
    from app.models.user import User
    from app.models.order_item import OrderItem
    from app.models.reports import Report


class OrderStatusEnum(str, enum.Enum):
    """
    Enum para el estado de una orden de compra.
    
    Attributes:
        PAID: Orden pagada, pendiente de envío.
        SHIPPED: Orden enviada, en tránsito.
        DELIVERED: Orden entregada al comprador.
        CANCELLED: Orden cancelada.
        REFUNDED: Orden reembolsada.
    """
    PAID = "PAID"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"


class Order(BaseModel):
    """
    Modelo de orden de compra.
    
    Representa una transacción completada en la plataforma.
    Actúa como "cabecera" de una orden que contiene uno o más OrderItems.
    
    Attributes:
        order_id: Identificador único de la orden.
        buyer_id: Usuario que realizó la compra.
        subtotal: Suma de los precios de todos los items (sin comisión).
        commission_amount: Comisión de la plataforma (10% según GEMINI.md).
        total_amount: Monto total pagado (subtotal + commission_amount).
        order_status: Estado actual de la orden.
        payment_charge_id: ID de la transacción en Stripe/PayPal.
        payment_method: Método de pago utilizado (stripe/paypal).
        
    Relationships:
        buyer: Usuario que realizó la compra.
        order_items: Lista de items incluidos en la orden.
        
    Database Constraints:
        - buyer_id debe existir en users.
        - subtotal, commission_amount y total_amount deben ser >= 0.
        - payment_charge_id debe ser único.
        - Índices en buyer_id y order_status para queries eficientes.
        
    Notes:
        - La comisión de la plataforma es del 10% según GEMINI.md (RF-25).
        - payment_charge_id vincula con el ID de transacción de Stripe o PayPal.
        - Los items individuales se almacenan en OrderItem con precios históricos.
    """
    __tablename__ = "orders"

    # COLUMNAS PRINCIPALES
    order_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Identificador único de la orden"
    )
    
    buyer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="NO ACTION"),
        nullable=False,
        index=True,
        comment="UUID del usuario comprador que realizó la orden"
    )
    
    subtotal: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        comment="Suma de los precios de todos los items sin comisión (precisión de 2 decimales)"
    )
    
    commission_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        comment="Comisión de la plataforma, 10% del subtotal (precisión de 2 decimales)"
    )
    
    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        comment="Monto total pagado: subtotal + commission_amount (precisión de 2 decimales)"
    )
    
    order_status: Mapped[OrderStatusEnum] = mapped_column(
        SQLEnum(OrderStatusEnum, name="order_status_enum", create_constraint=True),
        nullable=False,
        default=OrderStatusEnum.PAID,
        index=True,
        comment="Estado actual de la orden: PAID, SHIPPED, DELIVERED, CANCELLED, REFUNDED"
    )
    
    payment_charge_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        unique=True,
        nullable=True,
        comment="ID de la transacción en la pasarela de pago (Stripe/PayPal)"
    )
    
    payment_method: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="Método de pago utilizado: 'stripe' o 'paypal'"
    )
    
    # RELACIONES
    buyer: Mapped["User"] = relationship(
        "User",
        foreign_keys=[buyer_id],
        back_populates="orders"
    )
    
    order_items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderItem.order_item_id"
    )
    
    reports: Mapped[List["Report"]] = relationship(
        "Report",
        back_populates="reported_order",
        cascade="all, delete-orphan"
    )
    
    # INDICES COMPUESTOS
    __table_args__ = (
        Index("ix_orders_buyer_status", "buyer_id", "order_status"),
        Index("ix_orders_created_at", "created_at"),
    )
    
    # MÉTODOS DE INSTANCIA
    def calculate_totals(self) -> None:
        """
        Calcula y actualiza subtotal, comisión y total basándose en los order_items.
        
        Note:
            Este método debe llamarse después de agregar/modificar items.
            La comisión es del 10% según especificación GEMINI.md (RF-25).
        """
        if not self.order_items:
            self.subtotal = Decimal("0.00")
            self.commission_amount = Decimal("0.00")
            self.total_amount = Decimal("0.00")
            return
        
        # Calcular subtotal
        self.subtotal = sum(
            item.price_at_purchase * item.quantity 
            for item in self.order_items
        )
        
        # Calcular comisión (10%)
        self.commission_amount = self.subtotal * Decimal("0.10")
        
        # Calcular total
        self.total_amount = self.subtotal + self.commission_amount
    
    def get_item_count(self) -> int:
        """
        Obtiene el número total de items en la orden.
        
        Returns:
            Cantidad total de items (sumando las cantidades de cada OrderItem).
        """
        return sum(item.quantity for item in self.order_items)
    
    def can_be_cancelled(self) -> bool:
        """
        Verifica si la orden puede ser cancelada.
        
        Returns:
            True si la orden está en estado PAID (aún no enviada).
        """
        return self.order_status == OrderStatusEnum.PAID
    
    def can_be_reviewed(self) -> bool:
        """
        Verifica si la orden puede ser reseñada.
        
        Returns:
            True si la orden está en estado DELIVERED.
        """
        return self.order_status == OrderStatusEnum.DELIVERED
    
    def get_status_display(self) -> str:
        """
        Obtiene el estado de la orden en formato legible.
        
        Returns:
            String con el estado traducido al español.
        """
        status_map = {
            OrderStatusEnum.PAID: "Pagada",
            OrderStatusEnum.SHIPPED: "Enviada",
            OrderStatusEnum.DELIVERED: "Entregada",
            OrderStatusEnum.CANCELLED: "Cancelada",
            OrderStatusEnum.REFUNDED: "Reembolsada"
        }
        return status_map.get(self.order_status, self.order_status.value)
    
    def __repr__(self) -> str:
        return (
            f"Order(order_id={self.order_id!r}, "
            f"buyer_id={self.buyer_id!r}, "
            f"total_amount={self.total_amount!r}, "
            f"order_status={self.order_status.value!r}, "
            f"item_count={len(self.order_items)})"
        )
