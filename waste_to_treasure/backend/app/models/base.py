"""
Modelos base y miximins para SQLAlchemy.

Este modulo define las clases bvase y miximins reutilziables que proporcionan
funcionalidad comun a todo los modelos de la abse de datos.

Autor: Oscar Alonso Nava Rivera
Fecha: 03/11/2025
Descripción: Clases base y mixins comunes para modelos SQLAlchemy.
"""
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

class TimestampMixin:
    """
    Mixin que propociona campos de auditoria temporal automaticos

    Autor: Oscar Alonso Nava Rivera
    Descripción: Proporciona campos created_at/updated_at para modelos.

    Attributes:
        created_at: Timestamp de creación del registro (UTC).
        updated_at: Timestamp de última actualización (UTC), se actualiza automáticamente.
    
    Note:
        Utiliza timezone-aware datetimes con UTC para consistencia global.
    """
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="Fecha y hora de creacion del registro"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="Fecha y hora de la ultima actualizacion del registro"
    )

class BaseModel(Base, TimestampMixin):
    """
    Modelo base abstracto que combina Base y TimestampMixin.
    
    Autor: Oscar Alonso Nava Rivera
    Descripción: Clase base abstracta usada por todos los modelos de la app.

    Todos los modelos de la aplicación deben heredar de esta clase
    para obtener funcionalidad de timestamps automaticos y metodos utiles.
    
    Note:
        Esta clase es abstracta y no se mapeará a una tabla específica
    """
    __abstract__ = True

    def to_dict(self) -> dict[str, Any]:
        """
        Convierte el modelo a un diccionario.

        Autor: Oscar Alonso Nava Rivera
        Descripción: Serializa el modelo a dict usando las columnas SQLAlchemy.

        Returns:
            Diccionario con todos los atributos del modelo, excluyendo
            atributos privados y métodos internos de SQLAlchemy.
            
        Example:
            >>> category = Category(name="Wood", slug="wood")
            >>> category.to_dict()
            {'category_id': 1, 'name': 'Wood', 'slug': 'wood', ...}
        """
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }

    def __repr__(self) -> str:
        """
        Representacion legible del modelo

        Autor: Oscar Alonso Nava Rivera
        Descripción: Representación en string del modelo con sus atributos.

        Returns:
            String con el nombre de la clase y sus atributos principales.
        """
        attrs = ", ".join(
            f"{k}={v!r}"
            for k, v in self.to_dict().items()
            if not k.startswith("_")
        )
        return f"{self.__class__.__name__}({attrs})"
        
