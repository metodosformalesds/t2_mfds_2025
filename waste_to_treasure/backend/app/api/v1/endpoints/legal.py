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
    Lista los documentos legales activos (endpoint público).
    
    **No requiere autenticación**
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
    Obtiene un documento legal específico por su slug (endpoint público).
    
    **No requiere autenticación**
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
    Crea un nuevo documento legal (solo administradores).
    
    **Requiere**: Rol ADMIN
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
    Lista todos los documentos legales, incluyendo inactivos (solo administradores).
    
    **Requiere**: Rol ADMIN
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
    Actualiza un documento legal existente (solo administradores).
    
    **Requiere**: Rol ADMIN
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
    Elimina un documento legal (solo administradores).
    
    **Requiere**: Rol ADMIN
    """
    logger.info(f"Admin {current_admin.user_id} eliminando documento: {slug}")
    
    await document_service.delete_legal_document(db, slug, current_admin)
    
    return None