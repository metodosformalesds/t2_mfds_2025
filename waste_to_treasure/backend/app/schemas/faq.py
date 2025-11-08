"""
Esquemas de Pydantic para el modelo FAQItem.

Define los contratos de entrada y salida para preguntas frecuentes (FAQ).
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator


class FAQItemBase(BaseModel):
    """
    Esquema base con campos comunes para FAQItem.
    
    Contiene los campos que se usan tanto en creación como actualización.
    """
    question: str = Field(
        ...,
        min_length=10,
        max_length=500,
        description="Pregunta frecuente",
        examples=["¿Cómo puedo vender en la plataforma?", "¿Cuáles son los métodos de pago?"]
    )
    answer: str = Field(
        ...,
        min_length=20,
        description="Respuesta a la pregunta (puede incluir markdown)",
        examples=["Para vender en la plataforma, primero debes crear una cuenta..."]
    )
    category: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Categoría de la FAQ",
        examples=["Ventas", "Compras", "Cuenta", "Pagos", "Envíos"]
    )
    display_order: int = Field(
        default=0,
        ge=0,
        description="Orden de visualización (menor valor = mayor prioridad)"
    )
    is_active: bool = Field(
        default=True,
        description="Indica si la FAQ está activa y visible"
    )

    @field_validator("question", "answer")
    @classmethod
    def validate_not_empty(cls, v: str, info) -> str:
        """Valida que los campos no sean solo espacios."""
        if v.strip() == "":
            field_name = info.field_name
            raise ValueError(f"El campo {field_name} no puede estar vacío")
        return v


class FAQItemCreate(FAQItemBase):
    """
    Esquema para crear una nueva FAQ.
    
    Usado en: POST /api/v1/faq (Admin only)
    Requiere: Rol ADMIN
    
    Note:
        - created_by_id se asigna automáticamente del current_admin
    """
    pass


class FAQItemUpdate(BaseModel):
    """
    Esquema para actualizar una FAQ existente.
    
    Todos los campos son opcionales para permitir actualizaciones parciales.
    
    Usado en: PATCH /api/v1/faq/{faq_id} (Admin only)
    Requiere: Rol ADMIN
    """
    question: Optional[str] = Field(
        None,
        min_length=10,
        max_length=500,
        description="Pregunta"
    )
    answer: Optional[str] = Field(
        None,
        min_length=20,
        description="Respuesta"
    )
    category: Optional[str] = Field(
        None,
        min_length=2,
        max_length=100,
        description="Categoría"
    )
    display_order: Optional[int] = Field(
        None,
        ge=0,
        description="Orden de visualización"
    )
    is_active: Optional[bool] = Field(
        None,
        description="Estado de activación"
    )

    @field_validator("question", "answer")
    @classmethod
    def validate_not_empty(cls, v: Optional[str], info) -> Optional[str]:
        """Valida que los campos no sean solo espacios."""
        if v is not None and v.strip() == "":
            field_name = info.field_name
            raise ValueError(f"El campo {field_name} no puede estar vacío")
        return v


class FAQItemInDB(FAQItemBase):
    """
    Esquema que representa cómo se almacena FAQItem en la base de datos.
    
    Incluye campos autogenerados como ID, created_by_id y timestamps.
    """
    faq_id: int = Field(..., description="Identificador único")
    created_by_id: Optional[int] = Field(
        None,
        description="ID del admin que creó la FAQ"
    )
    created_at: datetime = Field(..., description="Fecha de creación")
    updated_at: datetime = Field(..., description="Última actualización")
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )


class FAQItemRead(FAQItemInDB):
    """
    Esquema de respuesta para FAQItem.
    
    Usado en: GET endpoints (público y admin).
    """
    pass


class FAQItemList(BaseModel):
    """
    Esquema de respuesta paginada para listar FAQs.
    
    Usado en: GET /api/v1/faq (público y admin)
    """
    items: list[FAQItemRead] = Field(..., description="Lista de FAQs")
    total: int = Field(..., ge=0, description="Total de FAQs")
    page: int = Field(..., ge=1, description="Página actual")
    page_size: int = Field(..., ge=1, le=100, description="Items por página")
    
    model_config = ConfigDict(from_attributes=True)

class FAQCategory(BaseModel):
    """
    Esquema para representar una categoría con sus FAQs.
    
    Usado en: Endpoint de FAQs agrupadas por categoría.
    """
    category: str = Field(..., description="Nombre de la categoría")
    items: list[FAQItemRead] = Field(..., description="FAQs de la categoría")
    count: int = Field(..., ge=0, description="Número de FAQs en la categoría")
    
    model_config = ConfigDict(from_attributes=True)


class FAQCategoryList(BaseModel):
    """
    Esquema de respuesta para FAQs agrupadas por categoría.
    
    Usado en: GET /api/v1/faq/grouped
    """
    categories: list[FAQCategory] = Field(..., description="Lista de categorías con FAQs")
    total_faqs: int = Field(..., ge=0, description="Total de FAQs activas")
    total_categories: int = Field(..., ge=0, description="Número de categorías")
    
    model_config = ConfigDict(from_attributes=True)