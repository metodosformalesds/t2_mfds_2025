"""
Esquemas de Pydantic para el modelo Report.

Define los contratos de entrada y salida para el sistema de reportes
de usuarios sobre contenido, otros usuarios u órdenes.
"""
from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict, field_validator
from enum import Enum


class ReportReason(str, Enum):
    """Razones predefinidas para reportes."""
    SPAM = "spam"
    INAPPROPRIATE_CONTENT = "inappropriate_content"
    FRAUD = "fraud"
    FAKE_PRODUCT = "fake_product"
    HARASSMENT = "harassment"
    SCAM = "scam"
    INTELLECTUAL_PROPERTY = "intellectual_property"
    OTHER = "other"


class ReportStatus(str, Enum):
    """Estados posibles de un reporte."""
    PENDING = "pending"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class ReportBase(BaseModel):
    """
    Esquema base con campos comunes para Report.

    Contiene los campos que se usan en creación.
    """
    reason: str = Field(
        ...,
        description="Razón del reporte (predefinida)",
        examples=["inappropriate_content", "fraud", "spam"]
    )
    description: Optional[str] = Field(
        None,
        max_length=1000,
        description="Descripción detallada del reporte",
        examples=["Esta publicación contiene imágenes inapropiadas y engañosas"]
    )
    reported_listing_id: Optional[int] = Field(
        None,
        description="ID de la publicación reportada (si aplica)"
    )
    reported_user_id: Optional[UUID] = Field(
        None,
        description="ID del usuario reportado (si aplica)"
    )
    reported_order_id: Optional[int] = Field(
        None,
        description="ID de la orden reportada (si aplica)"
    )

    @field_validator("description")
    @classmethod
    def validate_description_not_empty(cls, v: Optional[str]) -> Optional[str]:
        """Valida que la descripción no sea solo espacios en blanco."""
        if v is not None and v.strip() == "":
            raise ValueError("La descripción no puede estar vacía")
        return v


class ReportCreate(ReportBase):
    """
    Esquema para crear un nuevo reporte.
    
    Usado en: POST /api/v1/reports
    Requiere: Usuario autenticado
    
    Note:
        - reporter_id se toma automáticamente del current_user
        - Debe especificarse al menos uno: reported_listing_id, reported_user_id o reported_order_id
        - La entidad reportada debe existir en la base de datos
    """
    @field_validator("reported_listing_id", "reported_user_id", "reported_order_id")
    @classmethod
    def validate_at_least_one_target(cls, v, info):
        """Valida que se especifique al menos una entidad a reportar."""
        # Esta validación se hace mejor a nivel de servicio
        # ya que necesitamos acceso a todos los campos
        return v


class ReportInDB(ReportBase):
    """
    Esquema que representa cómo se almacena Report en la base de datos.
    
    Incluye campos autogenerados como ID, reporter_id y timestamps.
    """
    report_id: int = Field(..., description="Identificador único del reporte")
    reporter_id: UUID = Field(..., description="UUID del usuario que reporta")
    status: ReportStatus = Field(
        default=ReportStatus.PENDING,
        description="Estado del reporte"
    )
    resolved_by_id: Optional[UUID] = Field(
        None,
        description="UUID del admin que resolvió el reporte"
    )
    resolved_at: Optional[datetime] = Field(
        None,
        description="Fecha de resolución"
    )
    resolution_notes: Optional[str] = Field(
        None,
        description="Notas de resolución del admin"
    )
    created_at: datetime = Field(..., description="Fecha de creación")
    updated_at: datetime = Field(..., description="Última actualización")
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )


class ReportRead(BaseModel):
    """
    Esquema de respuesta simple para Report.

    Este esquema se usa para operaciones que NO necesitan cargar
    relaciones con User, Listing, etc.

    Usado en: POST, GET responses
    """
    report_id: int = Field(..., description="Identificador único del reporte")
    reporter_user_id: UUID = Field(..., description="UUID del usuario que reporta")
    report_type: str = Field(..., description="Tipo de reporte")
    reported_listing_id: Optional[int] = Field(None, description="ID del listing reportado")
    reported_user_id: Optional[UUID] = Field(None, description="ID del usuario reportado")
    reported_order_id: Optional[int] = Field(None, description="ID de la orden reportada")
    reason: str = Field(..., description="Razón del reporte")
    details: Optional[str] = Field(None, description="Detalles adicionales")
    status: str = Field(..., description="Estado del reporte")
    created_at: datetime = Field(..., description="Fecha de creación")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )


class ReportList(BaseModel):
    """
    Esquema de respuesta paginada para listar reportes del usuario.
    
    Usado en: GET /api/v1/reports/my-reports
    """
    items: list[ReportRead] = Field(..., description="Lista de reportes")
    total: int = Field(..., ge=0, description="Total de reportes del usuario")
    page: int = Field(..., ge=1, description="Página actual")
    page_size: int = Field(..., ge=1, le=100, description="Items por página")
    
    model_config = ConfigDict(from_attributes=True)

class ReporterBasic(BaseModel):
    """Esquema simplificado del usuario que reporta."""
    user_id: UUID = Field(..., description="UUID del usuario")
    email: str = Field(..., description="Email del usuario")
    first_name: str = Field(..., description="Nombre")
    last_name: str = Field(..., description="Apellido")
    
    model_config = ConfigDict(from_attributes=True)


class ReportWithReporter(ReportInDB):
    """
    Esquema extendido que incluye información del usuario reportante.
    
    Usado en: Endpoints administrativos que requieren eager loading.
    
    Note:
        Si usas este schema, asegúrate de hacer eager loading:
        ```python
        stmt = select(Report).options(selectinload(Report.reporter))
        ```
    """
    reporter: Optional[ReporterBasic] = Field(
        None,
        description="Información del usuario que reportó"
    )


class ReportStatistics(BaseModel):
    """
    Esquema para estadísticas de reportes (uso administrativo).
    
    Usado en: Dashboard o endpoints de analytics.
    """
    total_reports: int = Field(..., ge=0, description="Total de reportes")
    pending_reports: int = Field(..., ge=0, description="Reportes pendientes")
    resolved_reports: int = Field(..., ge=0, description="Reportes resueltos")
    dismissed_reports: int = Field(..., ge=0, description="Reportes desestimados")
    reports_by_reason: dict = Field(
        ...,
        description="Conteo de reportes por razón",
        examples=[{"spam": 45, "fraud": 23, "inappropriate_content": 12}]
    )
    
    model_config = ConfigDict(from_attributes=True)