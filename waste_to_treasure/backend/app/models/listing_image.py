"""
Modelo de base de datos para ListingImage.

Implementa la tabla 'listing_images'
Almacena las URLs de imágenes asociadas a publicaciones.
"""
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Integer, Boolean, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.listing import Listing


class ListingImage(BaseModel):
    """
    Modelo de imagen de publicación.
    
    Asocia una o más imágenes (almacenadas en S3) con un listing.
    Solo guarda la URL pública; el archivo real está en Amazon S3.
    
    Attributes:
        image_id: Identificador único de la imagen.
        listing_id: Publicación a la que pertenece esta imagen.
        image_url: URL completa del objeto en el bucket S3.
        is_primary: Indica si es la imagen principal/portada.
        
    Relationships:
        listing: Publicación a la que pertenece la imagen.
        
    Database Constraints:
        - Solo puede haber una imagen primaria por listing.
        - La URL debe ser única globalmente.
    """
    __tablename__ = "listing_images"
    
    # COLUMNAS PRINCIPALES
    image_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Identificador único de la imagen"
    )
    
    listing_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("listings.listing_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="ID de la publicación a la que pertenece esta imagen"
    )
    
    image_url: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
        unique=True,
        comment="URL completa y pública del objeto en el bucket S3"
    )
    
    is_primary: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        comment="Indica si esta es la imagen principal/portada del listing"
    )
    
    # RELACIONES
    listing: Mapped["Listing"] = relationship(
        "Listing",
        back_populates="images"
    )
    
    # INDICES COMPUESTOS
    __table_args__ = (
        # Asegura que solo haya una imagen primaria por listing
        Index("ix_listing_images_listing_primary", "listing_id", "is_primary",
              unique=True,
              postgresql_where="is_primary = true"),
    )
    
    # MÉTODOS DE INSTANCIA
    def get_thumbnail_url(self, size: str = "300x300") -> str:
        """
        Genera una URL de thumbnail (miniatura).
        
        Args:
            size: Tamaño deseado en formato 'WIDTHxHEIGHT'.
            
        Returns:
            URL del thumbnail. Por ahora retorna la URL original.
            En producción, implementar transformación con CloudFront.
        """
        # TODO: Implementar transformación de imágenes con CloudFront
        return self.image_url
    
    def __repr__(self) -> str:
        return (
            f"ListingImage(image_id={self.image_id!r}, "
            f"listing_id={self.listing_id!r}, "
            f"is_primary={self.is_primary!r})"
        )