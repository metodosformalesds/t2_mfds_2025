"""
Esquemas de Pydantic para el modelo Review.

Define los contratos de entrada y salida para el sistema de reseñas
de productos después de una compra.
"""
from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict, field_validator


class ReviewBase(BaseModel):
    """
    Esquema base con campos comunes para Review.
    
    Contiene los campos que se usan en creación.
    """
    rating: int = Field(
        ...,
        ge=1,
        le=5,
        description="Calificación del 1 al 5",
        examples=[5, 4, 3]
    )
    comment: Optional[str] = Field(
        None,
        max_length=1000,
        description="Comentario de la reseña",
        examples=["Excelente producto, muy buena calidad"]
    )

    @field_validator("comment")
    @classmethod
    def validate_comment_not_empty(cls, v: Optional[str]) -> Optional[str]:
        """Valida que el comentario no sea solo espacios en blanco."""
        if v is not None and v.strip() == "":
            raise ValueError("El comentario no puede estar vacío")
        return v


class ReviewCreate(ReviewBase):
    """
    Esquema para crear una nueva reseña.
    
    Usado en: POST /api/v1/reviews
    Requiere: Usuario autenticado y haber comprado el item
    
    Note:
        - reviewer_id se toma automáticamente del current_user
        - Se valida que el usuario haya comprado el item (via order_item_id)
        - Un usuario solo puede dejar una reseña por order_item
    """
    order_item_id: int = Field(
        ...,
        description="ID del item de orden (compra verificada)",
        examples=[123]
    )


class ReviewInDB(ReviewBase):
    """
    Esquema que representa cómo se almacena Review en la base de datos.
    
    Incluye campos autogenerados como ID, buyer_id, listing_id y timestamps.
    """
    review_id: int = Field(..., description="Identificador único de la reseña")
    buyer_id: UUID = Field(..., description="UUID del usuario que reseña (comprador)", alias="reviewer_id")
    listing_id: int = Field(..., description="ID de la publicación reseñada")
    order_item_id: int = Field(..., description="ID del item de orden")
    created_at: datetime = Field(..., description="Fecha de creación")
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        populate_by_alias=True
    )


class ReviewRead(ReviewInDB):
    """
    Esquema de respuesta simple para Review.
    
    Usado en: POST, GET responses básicas
    """
    pass


class ReviewList(BaseModel):
    """
    Esquema de respuesta paginada para listar reseñas.
    
    Usado en: GET /api/v1/reviews/listing/{listing_id}
    """
    items: list["ReviewWithReviewer"] = Field(..., description="Lista de reseñas")
    total: int = Field(..., ge=0, description="Total de reseñas")
    page: int = Field(..., ge=1, description="Página actual")
    page_size: int = Field(..., ge=1, le=100, description="Items por página")
    average_rating: Optional[float] = Field(
        None,
        ge=1,
        le=5,
        description="Calificación promedio de todas las reseñas",
        examples=[4.5]
    )
    
    model_config = ConfigDict(from_attributes=True)

class ReviewerBasic(BaseModel):
    """Esquema simplificado del usuario que reseña."""
    user_id: UUID = Field(..., description="UUID del usuario")
    full_name: Optional[str] = Field(None, description="Nombre completo del usuario")
    
    model_config = ConfigDict(from_attributes=True)


class ReviewWithReviewer(ReviewInDB):
    """
    Esquema extendido que incluye información básica del reviewer (buyer).

    Usado en: Listados públicos de reseñas de una publicación.

    Note:
        Si usas este schema, asegúrate de hacer eager loading:
        ```python
        stmt = select(Review).options(selectinload(Review.buyer))
        ```
        El campo buyer del modelo se serializa como 'reviewer' en el JSON.
    """
    reviewer: Optional[ReviewerBasic] = Field(
        None,
        description="Información básica del usuario que reseñó",
        validation_alias="buyer",
        serialization_alias="reviewer"
    )

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )


class ListingBasic(BaseModel):
    """Esquema simplificado de Listing para relaciones."""
    listing_id: int = Field(..., description="ID de la publicación")
    title: str = Field(..., description="Título de la publicación")
    price: float = Field(..., description="Precio")
    
    model_config = ConfigDict(from_attributes=True)


class ReviewWithListing(ReviewInDB):
    """
    Esquema extendido que incluye información de la publicación.
    
    Usado en: Historial de reseñas del usuario.
    """
    listing: Optional[ListingBasic] = Field(
        None,
        description="Información básica de la publicación reseñada"
    )


class ReviewWithDetails(ReviewInDB):
    """
    Esquema completo con reviewer y listing.

    Usado en: Endpoints que requieren información completa.
    """
    reviewer: Optional[ReviewerBasic] = Field(
        None,
        description="Información del reviewer",
        alias="buyer"
    )
    listing: Optional[ListingBasic] = Field(
        None,
        description="Información de la publicación"
    )

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        populate_by_alias=True
    )

class ReviewStatistics(BaseModel):
    """
    Esquema para estadísticas de reseñas de una publicación o vendedor.
    
    Usado en: Endpoints de estadísticas.
    """
    total_reviews: int = Field(..., ge=0, description="Total de reseñas")
    average_rating: float = Field(
        ...,
        ge=0,
        le=5,
        description="Calificación promedio"
    )
    rating_distribution: dict = Field(
        ...,
        description="Distribución de calificaciones",
        examples=[{"1": 2, "2": 5, "3": 10, "4": 25, "5": 58}]
    )
    
    model_config = ConfigDict(from_attributes=True)


class SellerReviewSummary(BaseModel):
    """
    Esquema para resumen de reseñas de un vendedor.
    
    Usado en: Perfil de vendedor.
    """
    seller_id: UUID = Field(..., description="UUID del vendedor")
    total_reviews: int = Field(..., ge=0, description="Total de reseñas recibidas")
    average_rating: float = Field(
        ...,
        ge=0,
        le=5,
        description="Calificación promedio"
    )
    total_listings_reviewed: int = Field(
        ...,
        ge=0,
        description="Número de publicaciones con reseñas"
    )
    
    model_config = ConfigDict(from_attributes=True)