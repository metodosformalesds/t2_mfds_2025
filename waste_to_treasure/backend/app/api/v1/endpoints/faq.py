# Autor: Gabriel Florentino Reyes
# Fecha: 08-11-2025
# Descripción: Endpoints para preguntas frecuentes
#               Lectura pública de FAQs
#               Listar FAQs agrupadas por categoría
#               Consultar FAQ por ID
#               CRUD de FAQs para administradores
#               Requiere rol ADMIN para endpoints de gestión

"""
Endpoints de la API para FAQItem.

Implementa operaciones CRUD sobre preguntas frecuentes (FAQ).
Endpoints públicos para lectura, endpoints admin para gestión.
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db, require_admin
from app.models.user import User
from app.schemas.faq import (
    FAQItemRead,
    FAQItemCreate,
    FAQItemUpdate,
    FAQItemList,
    FAQCategoryList,
    FAQCategory,
)
from app.services import document_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get(
    "",
    response_model=FAQItemList,
    summary="Listar FAQs (público)",
    description="Obtiene lista paginada de preguntas frecuentes activas.",
    responses={
        200: {"description": "Lista obtenida exitosamente"},
    }
)
@router.get(
    "/",
    response_model=FAQItemList,
    include_in_schema=False
)
async def get_faqs_public(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=100, description="Número máximo de registros"),
    category: Optional[str] = Query(
        None,
        description="Filtrar por categoría",
        examples=["Ventas", "Compras", "Cuenta"]
    ),
    db: AsyncSession = Depends(get_async_db)
) -> FAQItemList:
    
    """
    Autor: Gabriel Florentino Reyes
    Descripción: Obtiene la lista paginada de FAQs activas para lectura pública.
    Parámetros:
        skip (int): Cantidad de elementos a omitir.
        limit (int): Máximo de elementos a devolver.
        category (str|None): Filtro opcional por categoría.
        db (AsyncSession): Sesión asíncrona de base de datos.
    Retorna:
        FAQItemList: Lista de FAQs activas.
    """
    
    logger.info(f"Listando FAQs públicas (category={category})")
    
    faqs, total = await document_service.get_faq_items(
        db=db,
        skip=skip,
        limit=limit,
        active_only=True,
        category=category
    )
    
    page = (skip // limit) + 1 if limit > 0 else 1
    
    return FAQItemList(
        items=faqs,
        total=total,
        page=page,
        page_size=limit
    )


@router.get(
    "/grouped",
    response_model=FAQCategoryList,
    summary="Listar FAQs agrupadas por categoría (público)",
    description="Obtiene todas las FAQs organizadas por categorías.",
    responses={
        200: {"description": "FAQs agrupadas obtenidas exitosamente"},
    }
)
async def get_faqs_grouped_public(
    db: AsyncSession = Depends(get_async_db)
) -> FAQCategoryList:
    
    """
    Autor: Gabriel Florentino Reyes
    Descripción: Obtiene todas las FAQs agrupadas por categoría (público).
    Parámetros:
        db (AsyncSession): Sesión de base de datos.
    Retorna:
        FAQCategoryList: Categorías con sus FAQs correspondientes.
    """
    
    logger.info("Obteniendo FAQs agrupadas por categoría")
    
    grouped_faqs = await document_service.get_faqs_grouped_by_category(
        db=db,
        active_only=True
    )
    
    # Formatear respuesta
    categories = [
        FAQCategory(
            category=category,
            items=faqs,
            count=len(faqs)
        )
        for category, faqs in grouped_faqs.items()
    ]
    
    total_faqs = sum(cat.count for cat in categories)
    
    return FAQCategoryList(
        categories=categories,
        total_faqs=total_faqs,
        total_categories=len(categories)
    )


@router.get(
    "/{faq_id}",
    response_model=FAQItemRead,
    summary="Obtener FAQ por ID (público)",
    description="Obtiene una pregunta frecuente específica.",
    responses={
        200: {"description": "FAQ encontrada"},
        404: {"description": "FAQ no encontrada o inactiva"},
    }
)
async def get_faq_public(
    faq_id: int,
    db: AsyncSession = Depends(get_async_db)
) -> FAQItemRead:
    
    """
    Autor: Gabriel Florentino Reyes
    Descripción: Retorna una FAQ en específico usando su ID (público).
    Parámetros:
        faq_id (int): ID de la FAQ.
        db (AsyncSession): Sesión de base de datos.
    Retorna:
        FAQItemRead: FAQ encontrada.
    """
    
    logger.info(f"Obteniendo FAQ pública: {faq_id}")
    
    faq = await document_service.get_faq_by_id(
        db=db,
        faq_id=faq_id,
        active_only=True
    )
    
    return faq

@router.post(
    "/admin/",
    response_model=FAQItemRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear FAQ (admin)",
    description="Crea una nueva pregunta frecuente.",
    responses={
        201: {"description": "FAQ creada exitosamente"},
        400: {"description": "Datos inválidos"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos de administrador"},
    }
)
async def create_faq_admin(
    faq_data: FAQItemCreate,
    db: AsyncSession = Depends(get_async_db),
    current_admin: User = Depends(require_admin)
) -> FAQItemRead:
    
    """
    Autor: Gabriel Florentino Reyes
    Descripción: Crea una nueva FAQ (solo ADMIN).
    Parámetros:
        faq_data (FAQItemCreate): Datos de la nueva FAQ.
        db (AsyncSession): Sesión asíncrona.
        current_admin (User): Usuario administrador autenticado.
    Retorna:
        FAQItemRead: FAQ creada.
    """
    
    logger.info(f"Admin {current_admin.user_id} creando FAQ")
    
    faq = await document_service.create_faq_item(db, faq_data, current_admin)
    
    return faq


@router.get(
    "/admin/all",
    response_model=FAQItemList,
    summary="Listar todas las FAQs (admin)",
    description="Obtiene lista completa de FAQs incluyendo inactivas.",
    responses={
        200: {"description": "Lista obtenida exitosamente"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos de administrador"},
    }
)
async def get_all_faqs_admin(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=100, description="Número máximo de registros"),
    category: Optional[str] = Query(None, description="Filtrar por categoría"),
    db: AsyncSession = Depends(get_async_db),
    current_admin: User = Depends(require_admin)
) -> FAQItemList:
    
    """
    Autor: Gabriel Florentino Reyes
    Descripción: Lista todas las FAQs, incluyendo inactivas (solo ADMIN).
    Parámetros:
        skip (int): Elementos a omitir.
        limit (int): Máximos elementos a mostrar.
        category (str|None): Filtro opcional por categoría.
        db (AsyncSession): Sesión de base de datos.
        current_admin (User): Administrador autenticado.
    Retorna:
        FAQItemList: Lista completa de FAQs.
    """
    
    logger.info(f"Admin {current_admin.user_id} listando todas las FAQs")
    
    faqs, total = await document_service.get_faq_items(
        db=db,
        skip=skip,
        limit=limit,
        active_only=False,
        category=category
    )
    
    page = (skip // limit) + 1 if limit > 0 else 1
    
    return FAQItemList(
        items=faqs,
        total=total,
        page=page,
        page_size=limit
    )


@router.patch(
    "/admin/{faq_id}",
    response_model=FAQItemRead,
    summary="Actualizar FAQ (admin)",
    description="Actualiza una FAQ existente.",
    responses={
        200: {"description": "FAQ actualizada exitosamente"},
        400: {"description": "Datos inválidos"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos de administrador"},
        404: {"description": "FAQ no encontrada"},
    }
)
async def update_faq_admin(
    faq_id: int,
    faq_data: FAQItemUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_admin: User = Depends(require_admin)
) -> FAQItemRead:
    
    """
    Autor: Gabriel Florentino Reyes
    Descripción: Actualiza una FAQ existente (solo ADMIN).
    Parámetros:
        faq_id (int): ID de la FAQ a actualizar.
        faq_data (FAQItemUpdate): Datos nuevos.
        db (AsyncSession): Sesión de BD.
        current_admin (User): Admin autenticado.
    Retorna:
        FAQItemRead: FAQ actualizada.
    """
    
    logger.info(f"Admin {current_admin.user_id} actualizando FAQ: {faq_id}")
    
    faq = await document_service.update_faq_item(db, faq_id, faq_data, current_admin)
    
    return faq


@router.delete(
    "/admin/{faq_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar FAQ (admin)",
    description="Elimina una FAQ.",
    responses={
        204: {"description": "FAQ eliminada exitosamente"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos de administrador"},
        404: {"description": "FAQ no encontrada"},
    }
)
async def delete_faq_admin(
    faq_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_admin: User = Depends(require_admin)
) -> None:
    
    """
    Autor: Gabriel Florentino Reyes
    Descripción: Elimina una FAQ existente (solo ADMIN).
    Parámetros:
        faq_id (int): ID de la FAQ a eliminar.
        db (AsyncSession): Sesión de BD.
        current_admin (User): Admin autenticado.
    Retorna:
        None: No retorna contenido.
    """
    
    logger.info(f"Admin {current_admin.user_id} eliminando FAQ: {faq_id}")
    
    await document_service.delete_faq_item(db, faq_id, current_admin)
    
    return None