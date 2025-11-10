"""
Schemas Pydantic para Listing.

Define los modelos de validación para requests y responses de la API.
"""
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, HttpUrl, computed_field, field_serializer

from app.models.listing import ListingStatusEnum
from app.models.category import ListingTypeEnum


# SCHEMAS DE LISTING IMAGE
class ListingImageBase(BaseModel):
    """Schema base para imágenes de listing."""
    image_url: HttpUrl = Field(..., description="URL de la imagen en S3")
    is_primary: bool = Field(False, description="Indica si es la imagen principal")


class ListingImageCreate(ListingImageBase):
    """Schema para crear una imagen de listing."""
    pass


class ListingImageRead(ListingImageBase):
    """Schema de respuesta para imágenes."""
    image_id: int
    listing_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# SCHEMAS BASE DE LISTING
class ListingBase(BaseModel):
    """Schema base con campos comunes de Listing."""
    
    title: str = Field(..., min_length=10, max_length=255, description="Título de la publicación")
    description: str = Field(..., min_length=50, description="Descripción detallada")
    price: Decimal = Field(..., gt=0, decimal_places=2, description="Precio del ítem")
    price_unit: Optional[str] = Field(None, max_length=50, description="Unidad de precio (Kg, Unidad, etc)")
    quantity: int = Field(..., gt=0, description="Cantidad disponible en stock")
    category_id: int = Field(..., gt=0, description="ID de la categoría")
    listing_type: ListingTypeEnum = Field(..., description="Tipo: MATERIAL o PRODUCT")
    origin_description: Optional[str] = Field(None, max_length=1000, description="Origen reciclado del material")
    location_address_id: Optional[int] = Field(None, description="ID de la ubicación física")


# SCHEMAS PARA REQUESTS
class ListingCreate(ListingBase):
    """Schema para crear una nueva publicación."""
    
    # No incluimos images aquí, se subirán por separado
    
    @field_validator('listing_type')
    def validate_listing_type(cls, v):
        """Valida que el tipo de listing sea válido."""
        if v not in [ListingTypeEnum.MATERIAL, ListingTypeEnum.PRODUCT]:
            raise ValueError('listing_type debe ser MATERIAL o PRODUCT')
        return v


class ListingUpdate(BaseModel):
    """Schema para actualizar una publicación existente."""
    
    title: Optional[str] = Field(None, min_length=10, max_length=255)
    description: Optional[str] = Field(None, min_length=50)
    price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    price_unit: Optional[str] = Field(None, max_length=50)
    quantity: Optional[int] = Field(None, gt=0)
    origin_description: Optional[str] = Field(None, max_length=1000)
    location_address_id: Optional[int] = None


class ListingStatusUpdate(BaseModel):
    """Schema para actualizar el estado (moderación)."""
    status: ListingStatusEnum = Field(..., description="Nuevo estado")
    rejection_reason: Optional[str] = Field(None, description="Motivo si se rechaza")


# SCHEMAS PARA RESPONSES
class ListingRead(ListingBase):
    """Schema de respuesta completo para una publicación."""
    
    listing_id: int
    seller_id: UUID  # Cambiar a UUID, usaremos field_serializer para convertir a string
    status: ListingStatusEnum
    approved_by_admin_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    
    # Relaciones
    images: List[ListingImageRead] = []
    
    class Config:
        from_attributes = True
    
    @field_serializer('seller_id', 'approved_by_admin_id')
    def serialize_uuid(self, value: Optional[UUID], _info) -> Optional[str]:
        """Convierte UUID a string para la respuesta JSON."""
        return str(value) if value else None
    
    @computed_field
    @property
    def is_available(self) -> bool:
        """Verifica si el listing está disponible."""
        return self.status == ListingStatusEnum.ACTIVE and self.quantity > 0
    
    @computed_field
    @property
    def primary_image_url(self) -> Optional[str]:
        """Obtiene la URL de la imagen principal."""
        if not self.images:
            return None
        for img in self.images:
            if img.is_primary:
                return str(img.image_url)
        return str(self.images[0].image_url) if self.images else None


class ListingCardRead(BaseModel):
    """Schema simplificado para tarjetas en el catálogo."""
    
    listing_id: int
    title: str
    price: Decimal
    price_unit: Optional[str]
    listing_type: ListingTypeEnum
    primary_image_url: Optional[str]
    seller_id: UUID
    quantity: int
    created_at: datetime
    
    class Config:
        from_attributes = True
    
    @field_serializer('seller_id')
    def serialize_seller_uuid(self, value: UUID, _info) -> str:
        """Convierte seller_id UUID a string."""
        return str(value)


class ListingListResponse(BaseModel):
    """Schema para listado paginado."""
    
    total: int = Field(..., description="Total de resultados")
    page: int = Field(..., description="Página actual")
    page_size: int = Field(..., description="Tamaño de página")
    items: List[ListingCardRead] = Field(..., description="Lista de publicaciones")


# SCHEMAS PARA UPLOAD DE IMÁGENES
class ImageUploadResponse(BaseModel):
    """Schema de respuesta después de subir una imagen."""
    image_url: str = Field(..., description="URL pública de la imagen en S3")
    image_id: int = Field(..., description="ID de la imagen en BD")
    is_primary: bool = Field(..., description="Si es la imagen principal")


class BulkImageUploadResponse(BaseModel):
    """Schema de respuesta para múltiples imágenes."""
    images: List[ImageUploadResponse]
    primary_image_url: str


# SCHEMAS PARA FILTROS
class ListingFilters(BaseModel):
    """Schema para filtros de búsqueda."""

    listing_type: Optional[ListingTypeEnum] = None
    category_id: Optional[int] = None
    min_price: Optional[Decimal] = Field(None, ge=0)
    max_price: Optional[Decimal] = Field(None, ge=0)
    search: Optional[str] = Field(None, min_length=3, max_length=100)
    status: Optional[ListingStatusEnum] = None
    seller_id: Optional[int] = None