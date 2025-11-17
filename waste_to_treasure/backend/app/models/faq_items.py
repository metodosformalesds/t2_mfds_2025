# Autor: Gabriel Florentino Reyes
# Fecha: 06-11-2025
# Descripción: Descripción: Modelo que almacena preguntas frecuentes y sus 
#               respuestas para la plataforma.

"""
Modelo de base de datos para los iteams de Preguntas Frecuentes.
Implementa la tabla 'faq_items'
"""
from typing import Optional
from sqlalchemy import String, Integer, Text, SmallInteger, text
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import BaseModel


class FAQItem(BaseModel):
    """
    Los FAQ items almacenan preguntas frecuentes y sus respuestas
    para ayudar a los usuarios de la plataforma.
    
    Relationships:
        - Ninguna. Esta tabla es independiente.
    
    Database constraints:
        - question: debe ser no nulo.
        - answer: debe ser no nulo.
        - category: campo opcional para agrupar preguntas por tema.
        - display_order: determina el orden de visualización de las preguntas.
    """
    __tablename__ = "faq_items"

    # COLUMNAS PRINCIPALES
    faq_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Identificador único del item de FAQ"
    )
    
    category: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        server_default=text("'General'"),
        comment="Categoría o tema de la pregunta frecuente"
    )
    
    question: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Texto de la pregunta frecuente"
    )
    
    answer: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Texto de la respuesta a la pregunta"
    )
    
    display_order: Mapped[Optional[int]] = mapped_column(
        SmallInteger,
        nullable=True,
        comment="Orden de visualización del item en la lista de FAQs"
    )

    def __repr__(self) -> str:
        return (
            f"FAQItem(faq_id={self.faq_id!r}, "
            f"category={self.category!r}, "
            f"question={self.question[:50]!r}...)"
        )