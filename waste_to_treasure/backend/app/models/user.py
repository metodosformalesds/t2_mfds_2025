"""
Modelo de base de datos para User.

Implementa la tabla 'users'
Almacena la información de los usuarios de la plataforma.
"""
import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Integer, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.listing import Listing
    from app.models.order import Order
    from app.models.reviews import Review
    from app.models.address import Address
    from app.models.cart import Cart
    from app.models.reports import Report
    from app.models.offer import Offer
    from app.models.notification import Notification
    from app.models.admin_action_logs import AdminActionLog
    from app.models.subscriptions import Subscription
    from app.models.payment_customer import PaymentCustomer

class UserRoleEnum(str, enum.Enum):
    """
    Enum para los roles de usuario.
    """
    USER = "USER"
    ADMIN = "ADMIN"

class UserStatusEnum(str, enum.Enum):
    """
    Enum para el estado del usuario.
    """
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    BLOCKED = "BLOCKED"

class User(BaseModel):
    """
    Modelo de usuario para la autenticación y autorización.

   La clave primaria (id) ahora es un UUID que corresponde al
    'sub' (Subject) claim del token JWT de Cognito.

    La autenticación (contraseñas) es manejada 100% por Cognito,
    por lo que los campos 'hashed_password' y 'cognito_sub' se eliminan.
    """
    __tablename__ = "users"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="UUID del usuario (cognito sub claim)"
    )
    # --- CAMBIO: Campo 'cognito_sub' ELIMINADO ---
    #
    # POR QUÉ: El campo 'id' AHORA ES el 'cognito_sub'.
    # Tener un campo separado para el 'sub' sería redundante.
    # cognito_sub: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True) # <-- ELIMINADO
   
    # CAMBIO: Campo de Email ---
    # Mantenemos el email, pero ahora su principal fuente de verdad
    # será el token de Cognito. Es único porque Cognito lo requiere.
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        comment="Correo electrónico del usuario (debe ser normalizado)"
    )
    full_name: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="Nombre completo o visible del usuario"
    )
    profile_image_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        comment="URL de la imagen de perfil del usuario en S3"
    )
    role: Mapped[UserRoleEnum] = mapped_column(
        SQLEnum(UserRoleEnum, name="user_role_enum", create_constraint=True),
        nullable=False,
        default=UserRoleEnum.USER,
        comment="Rol del usuario en la plataforma"
    )
    status: Mapped[UserStatusEnum] = mapped_column(
        SQLEnum(UserStatusEnum, name="user_status_enum", create_constraint=True),
        nullable=False,
        default=UserStatusEnum.PENDING,
        comment="Estado actual del usuario"
    )

    # RELACIONES
    
    # Como vendedor: publicaciones creadas por este usuario
    listings: Mapped[List["Listing"]] = relationship(
        "Listing",
        foreign_keys="Listing.seller_id",
        back_populates="seller",
        cascade="all, delete-orphan"
    )
    
    # Como comprador: órdenes realizadas por este usuario
    orders: Mapped[List["Order"]] = relationship(
        "Order",
        foreign_keys="Order.buyer_id",
        back_populates="buyer",
        cascade="all, delete-orphan"
    )
    
    # Como comprador: reviews escritas por este usuario
    reviews_as_buyer: Mapped[List["Review"]] = relationship(
        "Review",
        foreign_keys="Review.buyer_id",
        back_populates="buyer"
    )
    
    # Como vendedor: reviews recibidas en sus publicaciones
    reviews_as_seller: Mapped[List["Review"]] = relationship(
        "Review",
        foreign_keys="Review.seller_id",
        back_populates="seller"
    )
    
    # Como admin: publicaciones aprobadas por este usuario (si es admin)
    approved_listings: Mapped[List["Listing"]] = relationship(
        "Listing",
        foreign_keys="Listing.approved_by_admin_id",
        back_populates="approved_by"
    )
    
    # Carrito de compras (relación 1:1)
    cart: Mapped[Optional["Cart"]] = relationship(
        "Cart",
        back_populates="owner",
        uselist=False,
        cascade="all, delete-orphan"
    )
    
    # Direcciones del usuario (address book)
    addresses: Mapped[List["Address"]] = relationship(
        "Address",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    # Reportes realizados por este usuario
    reports_made: Mapped[List["Report"]] = relationship(
        "Report",
        foreign_keys="Report.reporter_user_id",
        back_populates="reporter"
    )
    
    # Reportes recibidos (cuando este usuario es reportado)
    reports_received: Mapped[List["Report"]] = relationship(
        "Report",
        foreign_keys="Report.reported_user_id",
        back_populates="reported_user"
    )
    
    # Reportes resueltos (como admin)
    reports_resolved: Mapped[List["Report"]] = relationship(
        "Report",
        foreign_keys="Report.resolved_by_admin_id",
        back_populates="resolved_by_admin"
    )

    # Relación con ofertas enviadas (como comprador)
    offers_sent: Mapped[List["Offer"]] = relationship(
        "Offer",
        foreign_keys="Offer.buyer_id",
        back_populates="buyer",
        cascade="all, delete-orphan"
    )
    
    # Relación con ofertas recibidas (como vendedor)
    offers_received: Mapped[List["Offer"]] = relationship(
        "Offer",
        foreign_keys="Offer.seller_id",
        back_populates="seller",
        cascade="all, delete-orphan"
    )
    
    # Relación con Notifications
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="Notification.created_at.desc()"
    )
    
    # Relación con AdminActionLog (acciones administrativas realizadas)
    admin_actions: Mapped[List["AdminActionLog"]] = relationship(
        "AdminActionLog",
        back_populates="admin",
        cascade="all, delete-orphan"
    )
    
    # Relación con Subscriptions
    subscriptions: Mapped[List["Subscription"]] = relationship(
        "Subscription",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    # Relación con PaymentCustomers (Stripe/PayPal customer IDs)
    payment_customers: Mapped[List["PaymentCustomer"]] = relationship(
        "PaymentCustomer",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return (
            f"User(user_id={self.user_id!r}, email={self.email!r}, "
            f"full_name={self.full_name!r}, role={self.role.value!r}, "
            f"status={self.status.value!r})"
        )
