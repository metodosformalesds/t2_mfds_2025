"""
Esquemas de Pydantic para el modelo LegalDocument.

Define los contratos de entrada y salida para documentos legales
como términos de servicio, políticas de privacidad, etc.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator
import re


class LegalDocumentBase(BaseModel):
    """
    Esquema base con campos comunes para LegalDocument.
    
    Contiene los campos que se usan tanto en creación como actualización.
    """
    title: str = Field(
        ...,
        min_length=5,
        max_length=200,
        description="Título del documento legal",
        examples=["Términos y Condiciones de Servicio", "Política de Privacidad"]
    )
    slug: str = Field(
        ...,
        min_length=3,
        max_length=100,
        pattern="^[a-z0-9-]+$",
        description="Identificador único URL-friendly",
        examples=["terms-of-service", "privacy-policy", "refund-policy"]
    )
    content: str = Field(
        ...,
        min_length=100,
        description="Contenido completo del documento (puede incluir markdown)",
        examples=["# Términos y Condiciones\n\n## 1. Aceptación de términos..."]
    )
    version: str = Field(
        default="1.0",
        max_length=20,
        description="Versión del documento",
        examples=["1.0", "2.1", "3.0.1"]
    )
    is_active: bool = Field(
        default=True,
        description="Indica si el documento está activo y visible"
    )

    @field_validator("slug")
    @classmethod
    def validate_slug_format(cls, v: str) -> str:
        """Valida que el slug tenga formato válido."""
        if not re.match(r"^[a-z0-9-]+$", v):
            raise ValueError(
                "El slug solo puede contener letras minúsculas, números y guiones"
            )
        return v


class LegalDocumentCreate(LegalDocumentBase):
    """
    Esquema para crear un nuevo documento legal.
    
    Usado en: POST /api/v1/legal (Admin only)
    Requiere: Rol ADMIN
    
    Note:
        - El slug debe ser único
        - created_by_id se asigna automáticamente del current_admin
    """
    pass


class LegalDocumentUpdate(BaseModel):
    """
    Esquema para actualizar un documento legal existente.
    
    Todos los campos son opcionales para permitir actualizaciones parciales.
    
    Usado en: PATCH /api/v1/legal/{slug} (Admin only)
    Requiere: Rol ADMIN
    """
    title: Optional[str] = Field(
        None,
        min_length=5,
        max_length=200,
        description="Título del documento"
    )
    content: Optional[str] = Field(
        None,
        min_length=100,
        description="Contenido del documento"
    )
    version: Optional[str] = Field(
        None,
        max_length=20,
        description="Versión del documento"
    )
    is_active: Optional[bool] = Field(
        None,
        description="Estado de activación"
    )

    @field_validator("content")
    @classmethod
    def validate_content_not_empty(cls, v: Optional[str]) -> Optional[str]:
        """Valida que el contenido no sea solo espacios."""
        if v is not None and v.strip() == "":
            raise ValueError("El contenido no puede estar vacío")
        return v


class LegalDocumentInDB(LegalDocumentBase):
    """
    Esquema que representa cómo se almacena LegalDocument en la base de datos.
    
    Incluye campos autogenerados como ID, created_by_id y timestamps.
    """
    document_id: int = Field(..., description="Identificador único")
    created_by_id: Optional[int] = Field(
        None,
        description="ID del admin que creó el documento"
    )
    created_at: datetime = Field(..., description="Fecha de creación")
    updated_at: datetime = Field(..., description="Última actualización")
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )


class LegalDocumentRead(LegalDocumentInDB):
    """
    Esquema de respuesta para LegalDocument.
    
    Usado en: GET endpoints (público y admin).
    """
    pass


class LegalDocumentList(BaseModel):
    """
    Esquema de respuesta paginada para listar documentos legales.
    
    Usado en: GET /api/v1/legal (público y admin)
    """
    items: list[LegalDocumentRead] = Field(..., description="Lista de documentos")
    total: int = Field(..., ge=0, description="Total de documentos")
    page: int = Field(..., ge=1, description="Página actual")
    page_size: int = Field(..., ge=1, le=100, description="Items por página")
    
    model_config = ConfigDict(from_attributes=True)

class LegalDocumentSummary(BaseModel):
    """
    Esquema simplificado para listados públicos.
    
    Solo incluye información básica sin el contenido completo.
    """
    document_id: int = Field(..., description="ID del documento")
    title: str = Field(..., description="Título")
    slug: str = Field(..., description="Slug URL-friendly")
    version: str = Field(..., description="Versión")
    updated_at: datetime = Field(..., description="Última actualización")
    
    model_config = ConfigDict(from_attributes=True)


class LegalDocumentSummaryList(BaseModel):
    """
    Esquema de respuesta para listados públicos simplificados.
    """
    items: list[LegalDocumentSummary] = Field(..., description="Lista de documentos")
    total: int = Field(..., ge=0, description="Total de documentos activos")
    
    model_config = ConfigDict(from_attributes=True)