# Autor: Gabriel Florentino Reyes
# Fecha: 06-11-2025
# Descripción: # Descripción: Modelo que gestiona los documentos legales de la plataforma, 
#                               como términos y políticas.

"""
Modelo de base de datos para Documentos Legales.
Implementa la tabla 'legal_documents'    
"""

from datetime import datetime
from sqlalchemy import func, String, Float, Text, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import BaseModel

class LegalDocument(BaseModel):
    """
    Los legal documents almacenan documentos legales de la plataforma
    como terminos y condiciones, politicas de privacidad, etc.
    
    Relationships:
        -Ninguna. Esta tabla es independiente.
        
    Database constraints:
        -slug: debe ser unico para identificar el documento por URL.
        -title: titulo descriptivo del documento legal.
        -content: contenido completo del documento en formato TEXT.
        -version: numero de version del documento (ej: 1.0, 1.1).
        -last_updated: timestamp de la ultima actualizacion del documento.
    """
    __tablename__="legal_documents"
    
    #Columnas principales
    document_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Identificador unico del documento legal"
    )
    
    slug: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        comment="Indentificador amigable para URLs (ej: 'terms-of-service)"
    )
    
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Titulo del documento legal"
    )
    
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Contenido completo del documento legal"
    )
    
    version: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        server_default="1.0",
        comment="Numero de version del documento (ej: 1.0, 1.1)"
    )
    
    last_updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default= func.now(),
        comment="Fecha y hora de la ultima actualizacion del documento"
    )
    
    def __repr__(self) -> str:
        return (
            f"LegalDocument(document_id={self.document_id!r}, "
            f"slug={self.slug!r}, "
            f"tittle={self.title!r}, "
            f"version={self.version!r})"
        )