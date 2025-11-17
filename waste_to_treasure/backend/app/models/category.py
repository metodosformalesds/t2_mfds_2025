"""
Modelo de base de datos para Category.

Implementa la tabla 'categories'
Almacena la jerarquía de categorías para productos y materiales.
"""
# Autor: Oscar Alonso Nava Rivera
# Fecha: 03/11/2025
# Descripción: Modelos de datos para Category con métodos de jerarquía.
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import String, Integer, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.listing import Listing  

class ListingTypeEnum(str, enum.Enum):
    """
    Enum para tipo de categoría según marketplace.
    Autor: Oscar Alonso Nava Rivera
    Fecha: 03/11/2025
    Descripción: Enum para diferenciar tipos de categorías en marketplaces.
    
    Attributes:
        MATERIAL: Categoría para el marketplace de materiales (B2B).
        PRODUCT: Categoría para el marketplace de productos (B2C).
    """
    MATERIAL = "MATERIAL"
    PRODUCT = "PRODUCT"

class Category(BaseModel):
    """
    Autor: Oscar Alonso Nava Rivera

    Modelo de categoría para organización de listados.
    
    Las categorías organizan y filtran listados en ambos marketplaces.
    Soporta jerarquías mediante relación recursiva (parent_category_id).

     Relationships:
        parent: Referencia a la categoría padre (si existe).
        children: Lista de subcategorías hijas.
        listings: Listados asociados a esta categoría

    Database Constraints:
        - slug debe ser único globalmente.
        - name debe ser único por tipo de categoría.
        - Índice compuesto en (type, parent_category_id) para queries eficientes
    """
    __tablename__ = "categories"

    # COLUMNAS PRINCIPALES
    category_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Identificador único de la categoría"
    )
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="Nombre visible de la categoría"
    )
    slug: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
        comment="Identificador único legible en URLs"
    )
    type: Mapped[ListingTypeEnum] = mapped_column(
        SQLEnum(ListingTypeEnum, name="listing_type_enum", create_constraint=True),
        nullable=False,
        index=True,
        comment="Tipo de categoría: MATERIAL o PRODUCT"
    )

    # Relacion Recursiva (Jerarquia)
    parent_category_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("categories.category_id", ondelete="SET NULL"),
        nullable=True,
        comment="ID de categoría padre para jerarquías"
    )
    
    # RELACIONES
    parent: Mapped[Optional["Category"]] = relationship(
        "Category",
        remote_side=lambda: Category.category_id,
        back_populates="children",
        foreign_keys=[parent_category_id]
    )
    children: Mapped[List["Category"]] = relationship(
        "Category",
        back_populates="parent",
        cascade="all, delete-orphan",
        foreign_keys=[parent_category_id]
    )
    listings: Mapped[List["Listing"]] = relationship(
        "Listing",
        back_populates="category"
    )

    # INDICES COMPUESTOS
    __table_args__ = (
        Index("ix_categories_type_parent", "type", "parent_category_id"),
        Index("ix_categories_name_type", "name", "type", unique=True),
    )

    # MÉTODOS DE INSTANCIA
    def get_full_path(self) -> str:
        """
        Autor: Oscar Alonso Nava Rivera
        Obtiene la ruta completa de la categoría en la jerarquía.
        
        Returns:
            Ruta completa como string, e.g. "Electrónica > Móviles > Smartphones"
        """
        if self.parent:
            return f"{self.parent.get_full_path()} > {self.name}"
        return self.name

    def is_leaf(self) -> bool:
        """
        Autor: Oscar Alonso Nava Rivera
        Determina si la categoria es una hoja (sin subcategorias)
        
        Returns:
            True si no tiene subcategorias
        """
        return len(self.children) == 0
    
    def get_all_descendants(self) -> List["Category"]:
        """
        Autor: Oscar Alonso Nava Rivera
        Obtiene recursivamente todas las subcategorías descendientes.
        
        Returns:
            Lista con todas las categorías descendientes (hijos, nietos, etc.).
        """
        descendants = []
        for child in self.children:
            descendants.append(child)
            descendants.extend(child.get_all_descendants())
        return descendants
    
    def __repr__(self) -> str:
        """
        Autor: Oscar Alonso Nava Rivera
        Representación legible del modelo.
        """
        return (
            f"Category(category_id={self.category_id!r}, "
            f"name={self.name!r}, slug={self.slug!r}, "
            f"type={self.type.value!r}, parent_id={self.parent_category_id!r})"
        )
