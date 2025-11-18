"""
Modelo de base de datos para Cart y CartItem.

Implementa las tablas 'carts' y 'cart_items'
Gestiona el carrito de compras temporal de usuarios autenticados.

Autor: Oscar Alonso Nava Rivera
Fecha: 05/11/2025
Descripción: Modelos de datos para carritos de compra y sus items.
"""
import uuid
from typing import TYPE_CHECKING, List, Optional
from decimal import Decimal

from sqlalchemy import (
    ForeignKey, Integer, UniqueConstraint, CheckConstraint, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.listing import Listing


class Cart(BaseModel):
    """
    Modelo de carrito de compras.
    
    Representa el carrito temporal de un usuario autenticado.
    Cada usuario tiene exactamente un carrito activo que persiste entre sesiones.
    
    Attributes:
        cart_id: Identificador único del carrito.
        user_id: Usuario propietario del carrito (relación 1:1).
        
    Relationships:
        owner: Usuario propietario del carrito.
        items: Colección de CartItem asociados (composición).
        
    Database Constraints:
        - user_id debe ser UNIQUE (un usuario = un carrito)
        - Cascada de eliminación: si se elimina el user, se elimina el cart
        
    Business Rules:
        - Un usuario solo puede tener un carrito activo
        - El carrito se crea automáticamente al agregar el primer item
        - El carrito persiste entre sesiones (no se elimina al logout)
        - Al completar una orden (checkout), el carrito se vacía pero no se elimina
    """
    __tablename__ = "carts"
    
    # COLUMNAS PRINCIPALES
    cart_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Identificador único del carrito"
    )
    
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
        comment="UUID del usuario propietario del carrito (relación 1:1)"
    )
    
    # RELACIONES
    owner: Mapped["User"] = relationship(
        "User",
        back_populates="cart",
        lazy="joined"
    )
    
    items: Mapped[List["CartItem"]] = relationship(
        "CartItem",
        back_populates="cart",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="selectin",
        order_by="CartItem.created_at.desc()"  # Más recientes primero
    )
    
    # MÉTODOS DE INSTANCIA
    def get_total_items(self) -> int:
        """
        Obtiene el número total de items en el carrito.

        Autor: Oscar Alonso Nava Rivera
        Descripción: Suma las cantidades de todos los CartItem asociados.

        Returns:
            Suma de las cantidades de todos los items.

        Example:
            >>> cart.items = [CartItem(quantity=2), CartItem(quantity=3)]
            >>> cart.get_total_items()
            5
        """
        return sum(item.quantity for item in self.items)
    
    def get_subtotal(self) -> Decimal:
        """
        Calcula el subtotal del carrito (sin comisión).

        Autor: Oscar Alonso Nava Rivera
        Descripción: Suma (price * quantity) para cada item válido del carrito.

        Returns:
            Suma de (precio * cantidad) de todos los items.

        Note:
            Requiere que los items tengan sus listings cargados (lazy='selectin').
        """
        total = Decimal("0.00")
        for item in self.items:
            if item.listing and item.listing.is_available():
                total += item.listing.price * item.quantity
        return total
    
    def get_estimated_total(self, commission_rate: float = 0.10) -> Decimal:
        """
        Calcula el total estimado incluyendo comisión.

        Autor: Oscar Alonso Nava Rivera
        Descripción: Calcula subtotal y aplica la comisión proporcionada.

        Args:
            commission_rate: Tasa de comisión (default: 10% según SRS).
            
        Returns:
            Subtotal + comisión calculada.
        """
        subtotal = self.get_subtotal()
        commission = subtotal * Decimal(str(commission_rate))
        return subtotal + commission
    
    def clear(self) -> None:
        """
        Vacía el carrito eliminando todos los items.

        Autor: Oscar Alonso Nava Rivera
        Descripción: Remueve todos los CartItem del carrito (vaciar).

        Note:
            Utilizado después de completar una orden exitosa.
            El carrito en sí no se elimina, solo sus items.
        """
        self.items.clear()
    
    def has_unavailable_items(self) -> bool:
        """
        Verifica si hay items no disponibles en el carrito.

        Autor: Oscar Alonso Nava Rivera
        Descripción: Retorna True si algún CartItem refiere a un listing no disponible.

        Returns:
            True si algún item referencia un listing inactivo o sin stock.

        Note:
            Útil para validar antes del checkout.
        """
        for item in self.items:
            if not item.listing or not item.listing.is_available():
                return True
        return False
    
    def remove_unavailable_items(self) -> int:
        """
        Elimina items que referencian listings no disponibles.

        Autor: Oscar Alonso Nava Rivera
        Descripción: Filtra items inválidos y devuelve la cantidad eliminada.

        Returns:
            Número de items eliminados.

        Note:
            Debe llamarse en una sesión activa de SQLAlchemy.
        """
        initial_count = len(self.items)
        self.items = [
            item for item in self.items 
            if item.listing and item.listing.is_available()
        ]
        return initial_count - len(self.items)
    
    def __repr__(self) -> str:
        """
        Autor: Oscar Alonso Nava Rivera
        Descripción: Representación legible del objeto Cart.
        """
        return (
            f"Cart(cart_id={self.cart_id!r}, user_id={self.user_id!r}, "
            f"items_count={len(self.items)})"
        )


class CartItem(BaseModel):
    """
    Modelo de ítem individual del carrito.
    
    Representa un listing específico agregado al carrito con su cantidad.
    Previene duplicados mediante constraint compuesto (cart_id, listing_id).
    
    Attributes:
        cart_item_id: Identificador único del item.
        cart_id: Carrito al que pertenece este item.
        listing_id: Listing (producto/material) agregado.
        quantity: Cantidad de unidades seleccionadas.
        
    Relationships:
        cart: Carrito contenedor.
        listing: Listing referenciado (producto o material).
        
    Database Constraints:
        - Composite unique: (cart_id, listing_id) - un listing solo una vez por carrito
        - Check: quantity > 0
        - ON DELETE RESTRICT en listing: no permitir eliminar listing si está en carritos
        
    Business Rules:
        - Si el usuario intenta agregar un listing ya existente, se actualiza la cantidad
        - La cantidad no puede exceder el stock disponible del listing
        - Si el listing se desactiva, el item debe ser removido o marcado como inválido
    """
    __tablename__ = "cart_items"
    
    # COLUMNAS PRINCIPALES
    cart_item_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Identificador único del item del carrito"
    )
    
    cart_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("carts.cart_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Carrito al que pertenece este item"
    )
    
    listing_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("listings.listing_id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        comment="Listing (producto/material) agregado al carrito"
    )
    
    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        comment="Cantidad de unidades seleccionadas"
    )
    
    # RELACIONES
    cart: Mapped["Cart"] = relationship(
        "Cart",
        back_populates="items"
    )
    
    listing: Mapped["Listing"] = relationship(
        "Listing",
        lazy="joined"  # Cargar listing automáticamente con el item
    )
    
    # CONSTRAINTS E ÍNDICES
    __table_args__ = (
        UniqueConstraint(
            "cart_id", 
            "listing_id",
            name="uq_cart_item_cart_listing"
        ),
        CheckConstraint(
            "quantity > 0",
            name="ck_cart_item_quantity_positive"
        ),
        Index("ix_cart_items_cart_listing", "cart_id", "listing_id"),
    )
    
    # MÉTODOS DE INSTANCIA
    def get_item_subtotal(self) -> Decimal:
        """
        Calcula el subtotal de este item (precio * cantidad).

        Autor: Oscar Alonso Nava Rivera
        Descripción: Calcula precio * cantidad si el listing está disponible.

        Returns:
            Subtotal del item o 0 si el listing no está disponible.
        """
        if self.listing and self.listing.is_available():
            return self.listing.price * self.quantity
        return Decimal("0.00")
    
    def is_valid(self) -> bool:
        """
        Verifica si el item es válido para checkout.

        Autor: Oscar Alonso Nava Rivera
        Descripción: Comprueba existencia del listing, disponibilidad y stock.

        Returns:
            True si el listing existe, está activo y tiene stock suficiente.
        """
        if not self.listing:
            return False
        
        return (
            self.listing.is_available() and 
            self.listing.quantity >= self.quantity
        )
    
    def update_quantity(self, new_quantity: int) -> bool:
        """
        Actualiza la cantidad del item con validación de stock.

        Autor: Oscar Alonso Nava Rivera
        Descripción: Intenta actualizar la cantidad respetando el stock disponible.

        Args:
            new_quantity: Nueva cantidad deseada.
            
        Returns:
            True si se pudo actualizar, False si excede el stock disponible.
        """
        if new_quantity <= 0:
            return False
        
        if not self.listing:
            return False
        
        if new_quantity > self.listing.quantity:
            return False
        
        self.quantity = new_quantity
        return True
    
    def increase_quantity(self, amount: int = 1) -> bool:
        """
        Incrementa la cantidad del item.

        Autor: Oscar Alonso Nava Rivera
        Descripción: Incrementa la cantidad en una cantidad dada, validando stock.

        Args:
            amount: Cantidad a incrementar (default: 1).
            
        Returns:
            True si se pudo incrementar, False si excede el stock.
        """
        return self.update_quantity(self.quantity + amount)
    
    def decrease_quantity(self, amount: int = 1) -> bool:
        """
        Decrementa la cantidad del item.

        Autor: Oscar Alonso Nava Rivera
        Descripción: Decrementa la cantidad validando que quede > 0.

        Args:
            amount: Cantidad a decrementar (default: 1).
            
        Returns:
            True si se pudo decrementar, False si resultaría en cantidad <= 0.
        """
        new_quantity = self.quantity - amount
        if new_quantity <= 0:
            return False
        self.quantity = new_quantity
        return True
    
    def __repr__(self) -> str:
        """
        Autor: Oscar Alonso Nava Rivera
        Descripción: Representación legible del objeto CartItem.
        """
        return (
            f"CartItem(cart_item_id={self.cart_item_id!r}, "
            f"listing_id={self.listing_id!r}, quantity={self.quantity!r}, "
            f"subtotal={self.get_item_subtotal()!r})"
        )