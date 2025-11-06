"""
Modelo de base de datos para Address.

Implementa la tabla 'addresses'
Almacena direcciones físicas para usuarios, listings y orders.
"""
import uuid
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Integer, Boolean, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class Address(BaseModel):
    """
    Modelo de dirección física.
    
    Almacena direcciones para múltiples propósitos:
    - Address Book de usuarios (múltiples direcciones por usuario)
    - Ubicación de listings (donde se encuentra el material/producto)
    - Dirección de envío en orders
    
    Relationships:
        user: Usuario propietario de la dirección (si aplica).
        
    Database Constraints:
        - user_id puede ser NULL (para direcciones de listings sin usuario)
        - postal_code debe tener al menos 4 caracteres
        - country debe ser código ISO de 2 letras mayúsculas
        - Solo una dirección puede ser default por usuario (manejado en lógica de negocio)
        
    Business Rules:
        - Un usuario puede tener múltiples direcciones guardadas
        - Solo una dirección puede ser is_default=True por usuario
        - Las direcciones de listings pueden no tener user_id asociado
        - Las direcciones de orders se copian/referencian desde el address book del usuario
    """
    __tablename__ = "addresses"
    
    # COLUMNAS PRINCIPALES
    address_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Identificador único de la dirección"
    )
    
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=True,
        index=True,
        comment="UUID del usuario propietario (NULL para direcciones de listings sin usuario)"
    )
    
    street: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Calle y número"
    )
    
    city: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        comment="Ciudad o municipio"
    )
    
    state: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        comment="Estado, provincia o región"
    )
    
    postal_code: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="Código postal"
    )
    
    country: Mapped[str] = mapped_column(
        String(2),
        nullable=False,
        default="MX",
        comment="Código de país ISO 3166-1 alpha-2 (ej: MX, US, CA)"
    )
    
    notes: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        comment="Referencias adicionales, indicaciones de ubicación"
    )
    
    is_default: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        comment="Indica si es la dirección predeterminada del usuario"
    )
    
    # RELACIONES
    user: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="addresses",
        lazy="joined"
    )
    
    # CONSTRAINTS
    __table_args__ = (
        CheckConstraint(
            "length(postal_code) >= 4",
            name="ck_address_postal_code_length"
        ),
        CheckConstraint(
            "country ~ '^[A-Z]{2}$'",
            name="ck_address_country_iso_format"
        ),
    )
    
    # MÉTODOS DE INSTANCIA
    def get_full_address(self) -> str:
        """
        Retorna la dirección completa formateada.
        
        Returns:
            Dirección completa en formato legible.
            
        """
        parts = [
            self.street,
            self.city,
            self.state,
            self.postal_code,
            self.country
        ]
        return ", ".join(filter(None, parts))
    
    def validate_postal_code_format(self) -> bool:
        """
        Valida el formato del código postal según el país.
        
        Returns:
            True si el formato es válido para el país especificado.
            
        Note:
            Implementación básica. Expandir según países soportados.
            Actualmente valida: MX (México), US (Estados Unidos).
        """
        import re
        
        patterns = {
            "MX": r"^\d{5}$",                # México: 5 dígitos (ej: 32500)
            "US": r"^\d{5}(-\d{4})?$",       # USA: 12345 o 12345-6789
            "CA": r"^[A-Z]\d[A-Z] \d[A-Z]\d$" # Canadá: A1A 1A1
        }
        
        pattern = patterns.get(self.country, r"^.{4,20}$")  # Fallback genérico
        return bool(re.match(pattern, self.postal_code))
    
    def get_short_address(self) -> str:
        """
        Retorna una versión corta de la dirección (ciudad, estado).
        
        Returns:
            Dirección abreviada.
        """
        return f"{self.city}, {self.state}"
    
    def __repr__(self) -> str:
        return (
            f"Address(address_id={self.address_id!r}, "
            f"city='{self.city}', state='{self.state}', "
            f"user_id={self.user_id!r}, is_default={self.is_default!r})"
        )