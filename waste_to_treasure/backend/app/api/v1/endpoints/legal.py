# Autor: Gabriel Florentino Reyes
# Fecha: 08-11-2025
# Descripción: Endpoints para documentos legales
#               Lectura pública de documentos activos
#               Consultar documento por slug
#               CRUD de documentos para administradores
#               Requiere rol ADMIN para endpoints de gestión 

"""
Endpoints de la API para LegalDocument.

Implementa operaciones CRUD sobre documentos legales.
Endpoints públicos para lectura, endpoints admin para gestión.
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db, require_admin
from app.models.user import User
from app.schemas.legal import (
    LegalDocumentRead,
    LegalDocumentCreate,
    LegalDocumentUpdate,
    LegalDocumentList,
    LegalDocumentSummaryList,
    LegalDocumentSummary,
)
from app.services import document_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get(
    "",
    response_model=LegalDocumentSummaryList,
    summary="Listar documentos legales (público)",
    description="Obtiene lista de documentos legales activos disponibles públicamente.",
    responses={
        200: {"description": "Lista obtenida exitosamente"},
    }
)
@router.get(
    "/",
    response_model=LegalDocumentSummaryList,
    include_in_schema=False
)
async def get_legal_documents_public(
    db: AsyncSession = Depends(get_async_db)
) -> LegalDocumentSummaryList:
    
    """
    Autor: Gabriel Florentino Reyes

    Descripción:
        Lista los documentos legales activos disponibles para cualquier usuario.

    Parámetros:
        db (AsyncSession): Sesión de base de datos.

    Retorna:
        LegalDocumentSummaryList: Lista de documentos legales activos (sin contenido).
    """
    
    logger.info("Listando documentos legales públicos")
    
    documents, total = await document_service.get_legal_documents(
        db=db,
        skip=0,
        limit=100,  # Usualmente hay pocos documentos legales
        active_only=True
    )
    
    # Convertir a resumen sin contenido
    summaries = [
        LegalDocumentSummary(
            document_id=doc.document_id,
            title=doc.title,
            slug=doc.slug,
            version=doc.version,
            updated_at=doc.updated_at
        )
        for doc in documents
    ]
    
    return LegalDocumentSummaryList(items=summaries, total=total)


@router.get(
    "/{slug}",
    response_model=LegalDocumentRead,
    summary="Obtener documento legal por slug (público)",
    description="Obtiene el contenido completo de un documento legal específico.",
    responses={
        200: {"description": "Documento encontrado"},
        404: {"description": "Documento no encontrado o inactivo"},
    }
)
async def get_legal_document_public(
    slug: str,
    db: AsyncSession = Depends(get_async_db)
) -> LegalDocumentRead:
    
    """
    Autor: Gabriel Florentino Reyes

    Descripción:
        Obtiene un documento legal público mediante su slug.

    Parámetros:
        slug (str): Identificador URL del documento.
        db (AsyncSession): Sesión de base de datos.

    Retorna:
        LegalDocumentRead: Documento legal completo.
    """
    
    logger.info(f"Obteniendo documento legal público: {slug}")
    
    document = await document_service.get_legal_document_by_slug(
        db=db,
        slug=slug,
        active_only=True
    )
    
    return document

@router.post(
    "/admin/",
    response_model=LegalDocumentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear documento legal (admin)",
    description="Crea un nuevo documento legal.",
    responses={
        201: {"description": "Documento creado exitosamente"},
        400: {"description": "Slug duplicado o datos inválidos"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos de administrador"},
    }
)
async def create_legal_document_admin(
    document_data: LegalDocumentCreate,
    db: AsyncSession = Depends(get_async_db),
    current_admin: User = Depends(require_admin)
) -> LegalDocumentRead:
    
    """
    Autor: Gabriel Florentino Reyes

    Descripción:
        Crea un nuevo documento legal. Solo accesible para administradores.

    Parámetros:
        document_data (LegalDocumentCreate): Datos del nuevo documento.
        db (AsyncSession): Sesión de base de datos.
        current_admin (User): Usuario autenticado con rol ADMIN.

    Retorna:
        LegalDocumentRead: Documento legal creado.
    """
    
    logger.info(f"Admin {current_admin.user_id} creando documento legal")
    
    document = await document_service.create_legal_document(
        db, document_data, current_admin
    )
    
    return document


@router.get(
    "/admin/all",
    response_model=LegalDocumentList,
    summary="Listar todos los documentos (admin)",
    description="Obtiene lista completa de documentos legales incluyendo inactivos.",
    responses={
        200: {"description": "Lista obtenida exitosamente"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos de administrador"},
    }
)
async def get_all_legal_documents_admin(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(50, ge=1, le=100, description="Número máximo de registros"),
    db: AsyncSession = Depends(get_async_db),
    current_admin: User = Depends(require_admin)
) -> LegalDocumentList:
    
    """
    Autor: Gabriel Florentino Reyes

    Descripción:
        Lista todos los documentos legales, incluyendo los inactivos.
        Solo accesible para administradores.

    Parámetros:
        skip (int): Registros a omitir.
        limit (int): Registros máximos a mostrar.
        db (AsyncSession): Sesión de base de datos.
        current_admin (User): Usuario administrador autenticado.

    Retorna:
        LegalDocumentList: Lista paginada de documentos legales.
    """
    
    logger.info(f"Admin {current_admin.user_id} listando todos los documentos")
    
    documents, total = await document_service.get_legal_documents(
        db=db,
        skip=skip,
        limit=limit,
        active_only=False
    )
    
    page = (skip // limit) + 1 if limit > 0 else 1
    
    return LegalDocumentList(
        items=documents,
        total=total,
        page=page,
        page_size=limit
    )


@router.patch(
    "/admin/{slug}",
    response_model=LegalDocumentRead,
    summary="Actualizar documento legal (admin)",
    description="Actualiza un documento legal existente.",
    responses={
        200: {"description": "Documento actualizado exitosamente"},
        400: {"description": "Datos inválidos"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos de administrador"},
        404: {"description": "Documento no encontrado"},
    }
)
async def update_legal_document_admin(
    slug: str,
    document_data: LegalDocumentUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_admin: User = Depends(require_admin)
) -> LegalDocumentRead:
    
    """
    Autor: Gabriel Florentino Reyes

    Descripción:
        Actualiza un documento legal existente. Solo administradores pueden realizar esta acción.

    Parámetros:
        slug (str): Identificador del documento.
        document_data (LegalDocumentUpdate): Nuevos datos del documento.
        db (AsyncSession): Sesión de base de datos.
        current_admin (User): Administrador autenticado.

    Retorna:
        LegalDocumentRead: Documento legal actualizado.
    """
    
    logger.info(f"Admin {current_admin.user_id} actualizando documento: {slug}")
    
    document = await document_service.update_legal_document(
        db, slug, document_data, current_admin
    )
    
    return document


@router.delete(
    "/admin/{slug}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar documento legal (admin)",
    description="Elimina un documento legal.",
    responses={
        204: {"description": "Documento eliminado exitosamente"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos de administrador"},
        404: {"description": "Documento no encontrado"},
    }
)
async def delete_legal_document_admin(
    slug: str,
    db: AsyncSession = Depends(get_async_db),
    current_admin: User = Depends(require_admin)
) -> None:
    
    """
    Autor: Gabriel Florentino Reyes

    Descripción:
        Elimina un documento legal específico.
        Acción exclusiva para administradores.

    Parámetros:
        slug (str): Identificador del documento a eliminar.
        db (AsyncSession): Sesión de base de datos.
        current_admin (User): Administrador autenticado.

    Retorna:
        None: No retorna datos (204 No Content).
    """
    
    logger.info(f"Admin {current_admin.user_id} eliminando documento: {slug}")
    
    await document_service.delete_legal_document(db, slug, current_admin)
    
    return None