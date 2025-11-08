"""
Capa de servicio para documentos (Legal y FAQ).

Implementa la lógica de negocio para operaciones CRUD sobre
documentos legales y FAQs.
"""
import logging
from typing import List, Tuple, Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from fastapi import HTTPException, status

from app.models.legal_documents import LegalDocument
from app.models.faq_items import FAQItem
from app.models.user import User
from app.schemas.legal import LegalDocumentCreate, LegalDocumentUpdate
from app.schemas.faq import FAQItemCreate, FAQItemUpdate

logger = logging.getLogger(__name__)

async def create_legal_document(
    db: AsyncSession,
    document_data: LegalDocumentCreate,
    current_admin: User
) -> LegalDocument:
    """
    Crea un nuevo documento legal.
    
    Args:
        db: Sesión asíncrona de base de datos.
        document_data: Datos del documento a crear.
        current_admin: Usuario admin que crea el documento.
        
    Returns:
        Documento creado.
        
    Raises:
        HTTPException 400: Si el slug ya existe.
    """
    logger.info(
        f"Admin {current_admin.user_id} creando documento legal: {document_data.slug}"
    )
    
    # Verificar que el slug no exista
    existing_stmt = select(LegalDocument).where(
        LegalDocument.slug == document_data.slug
    )
    existing_result = await db.execute(existing_stmt)
    existing_doc = existing_result.scalar_one_or_none()
    
    if existing_doc:
        logger.warning(f"Slug {document_data.slug} ya existe")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un documento con el slug '{document_data.slug}'"
        )
    
    # Crear documento
    db_document = LegalDocument(
        **document_data.model_dump(),
        created_by_id=current_admin.user_id
    )
    
    try:
        db.add(db_document)
        await db.commit()
        await db.refresh(db_document)
        logger.info(f"Documento legal creado: ID {db_document.document_id}")
        return db_document
    except Exception as e:
        await db.rollback()
        logger.error(f"Error al crear documento legal: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear el documento legal"
        )


async def get_legal_documents(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True
) -> Tuple[List[LegalDocument], int]:
    """
    Obtiene lista paginada de documentos legales.
    
    Args:
        db: Sesión asíncrona de base de datos.
        skip: Offset para paginación.
        limit: Límite de resultados.
        active_only: Si True, solo retorna documentos activos.
        
    Returns:
        Tupla (lista de documentos, total).
    """
    logger.info(f"Obteniendo documentos legales (active_only={active_only})")
    
    stmt = select(LegalDocument)
    
    if active_only:
        stmt = stmt.where(LegalDocument.is_active == True)
    
    # Contar total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0
    
    # Ordenar por fecha de actualización
    stmt = stmt.order_by(LegalDocument.updated_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    documents = result.scalars().all()
    
    logger.info(f"Encontrados {len(documents)} de {total} documentos legales")
    return list(documents), total


async def get_legal_document_by_slug(
    db: AsyncSession,
    slug: str,
    active_only: bool = True
) -> LegalDocument:
    """
    Obtiene un documento legal por su slug.
    
    Args:
        db: Sesión asíncrona de base de datos.
        slug: Slug del documento.
        active_only: Si True, solo retorna si está activo.
        
    Returns:
        Documento encontrado.
        
    Raises:
        HTTPException 404: Si el documento no existe o no está activo.
    """
    logger.info(f"Obteniendo documento legal por slug: {slug}")
    
    stmt = select(LegalDocument).where(LegalDocument.slug == slug)
    
    if active_only:
        stmt = stmt.where(LegalDocument.is_active == True)
    
    result = await db.execute(stmt)
    document = result.scalar_one_or_none()
    
    if not document:
        logger.warning(f"Documento con slug {slug} no encontrado")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documento con slug '{slug}' no encontrado"
        )
    
    return document


async def update_legal_document(
    db: AsyncSession,
    slug: str,
    document_data: LegalDocumentUpdate,
    current_admin: User
) -> LegalDocument:
    """
    Actualiza un documento legal existente.
    
    Args:
        db: Sesión asíncrona de base de datos.
        slug: Slug del documento.
        document_data: Datos a actualizar.
        current_admin: Usuario admin.
        
    Returns:
        Documento actualizado.
    """
    logger.info(f"Admin {current_admin.user_id} actualizando documento: {slug}")
    
    document = await get_legal_document_by_slug(db, slug, active_only=False)
    
    update_data = document_data.model_dump(exclude_unset=True)
    
    if not update_data:
        logger.info("No hay campos para actualizar")
        return document
    
    for field, value in update_data.items():
        setattr(document, field, value)
    
    try:
        await db.commit()
        await db.refresh(document)
        logger.info(f"Documento {slug} actualizado exitosamente")
        return document
    except Exception as e:
        await db.rollback()
        logger.error(f"Error al actualizar documento: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar el documento"
        )


async def delete_legal_document(
    db: AsyncSession,
    slug: str,
    current_admin: User
) -> None:
    """
    Elimina un documento legal.
    
    Args:
        db: Sesión asíncrona de base de datos.
        slug: Slug del documento.
        current_admin: Usuario admin.
    """
    logger.info(f"Admin {current_admin.user_id} eliminando documento: {slug}")
    
    document = await get_legal_document_by_slug(db, slug, active_only=False)
    
    try:
        await db.delete(document)
        await db.commit()
        logger.info(f"Documento {slug} eliminado exitosamente")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error al eliminar documento: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar el documento"
        )

async def create_faq_item(
    db: AsyncSession,
    faq_data: FAQItemCreate,
    current_admin: User
) -> FAQItem:
    """
    Crea un nuevo item de FAQ.
    
    Args:
        db: Sesión asíncrona de base de datos.
        faq_data: Datos de la FAQ a crear.
        current_admin: Usuario admin que crea la FAQ.
        
    Returns:
        FAQ creada.
    """
    logger.info(
        f"Admin {current_admin.user_id} creando FAQ: {faq_data.question[:50]}..."
    )
    
    db_faq = FAQItem(
        **faq_data.model_dump(),
        created_by_id=current_admin.user_id
    )
    
    try:
        db.add(db_faq)
        await db.commit()
        await db.refresh(db_faq)
        logger.info(f"FAQ creada: ID {db_faq.faq_id}")
        return db_faq
    except Exception as e:
        await db.rollback()
        logger.error(f"Error al crear FAQ: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear la FAQ"
        )


async def get_faq_items(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    category: Optional[str] = None
) -> Tuple[List[FAQItem], int]:
    """
    Obtiene lista paginada de FAQs.
    
    Args:
        db: Sesión asíncrona de base de datos.
        skip: Offset para paginación.
        limit: Límite de resultados.
        active_only: Si True, solo retorna FAQs activas.
        category: Filtro opcional por categoría.
        
    Returns:
        Tupla (lista de FAQs, total).
    """
    logger.info(
        f"Obteniendo FAQs (active_only={active_only}, category={category})"
    )
    
    stmt = select(FAQItem)
    
    if active_only:
        stmt = stmt.where(FAQItem.is_active == True)
    
    if category:
        stmt = stmt.where(FAQItem.category == category)
    
    # Contar total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0
    
    # Ordenar por display_order y luego por fecha
    stmt = stmt.order_by(
        FAQItem.display_order.asc(),
        FAQItem.created_at.desc()
    ).offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    faqs = result.scalars().all()
    
    logger.info(f"Encontradas {len(faqs)} de {total} FAQs")
    return list(faqs), total


async def get_faq_by_id(
    db: AsyncSession,
    faq_id: int,
    active_only: bool = True
) -> FAQItem:
    """
    Obtiene una FAQ por su ID.
    
    Args:
        db: Sesión asíncrona de base de datos.
        faq_id: ID de la FAQ.
        active_only: Si True, solo retorna si está activa.
        
    Returns:
        FAQ encontrada.
        
    Raises:
        HTTPException 404: Si la FAQ no existe o no está activa.
    """
    logger.info(f"Obteniendo FAQ por ID: {faq_id}")
    
    stmt = select(FAQItem).where(FAQItem.faq_id == faq_id)
    
    if active_only:
        stmt = stmt.where(FAQItem.is_active == True)
    
    result = await db.execute(stmt)
    faq = result.scalar_one_or_none()
    
    if not faq:
        logger.warning(f"FAQ {faq_id} no encontrada")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"FAQ con ID {faq_id} no encontrada"
        )
    
    return faq


async def update_faq_item(
    db: AsyncSession,
    faq_id: int,
    faq_data: FAQItemUpdate,
    current_admin: User
) -> FAQItem:
    """
    Actualiza una FAQ existente.
    
    Args:
        db: Sesión asíncrona de base de datos.
        faq_id: ID de la FAQ.
        faq_data: Datos a actualizar.
        current_admin: Usuario admin.
        
    Returns:
        FAQ actualizada.
    """
    logger.info(f"Admin {current_admin.user_id} actualizando FAQ: {faq_id}")
    
    faq = await get_faq_by_id(db, faq_id, active_only=False)
    
    update_data = faq_data.model_dump(exclude_unset=True)
    
    if not update_data:
        logger.info("No hay campos para actualizar")
        return faq
    
    for field, value in update_data.items():
        setattr(faq, field, value)
    
    try:
        await db.commit()
        await db.refresh(faq)
        logger.info(f"FAQ {faq_id} actualizada exitosamente")
        return faq
    except Exception as e:
        await db.rollback()
        logger.error(f"Error al actualizar FAQ: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar la FAQ"
        )


async def delete_faq_item(
    db: AsyncSession,
    faq_id: int,
    current_admin: User
) -> None:
    """
    Elimina una FAQ.
    
    Args:
        db: Sesión asíncrona de base de datos.
        faq_id: ID de la FAQ.
        current_admin: Usuario admin.
    """
    logger.info(f"Admin {current_admin.user_id} eliminando FAQ: {faq_id}")
    
    faq = await get_faq_by_id(db, faq_id, active_only=False)
    
    try:
        await db.delete(faq)
        await db.commit()
        logger.info(f"FAQ {faq_id} eliminada exitosamente")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error al eliminar FAQ: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar la FAQ"
        )


async def get_faqs_grouped_by_category(
    db: AsyncSession,
    active_only: bool = True
) -> Dict[str, List[FAQItem]]:
    """
    Obtiene FAQs agrupadas por categoría.
    
    Args:
        db: Sesión asíncrona de base de datos.
        active_only: Si True, solo FAQs activas.
        
    Returns:
        Diccionario {categoria: [lista de FAQs]}.
    """
    logger.info("Obteniendo FAQs agrupadas por categoría")
    
    stmt = select(FAQItem)
    
    if active_only:
        stmt = stmt.where(FAQItem.is_active == True)
    
    stmt = stmt.order_by(
        FAQItem.category.asc(),
        FAQItem.display_order.asc(),
        FAQItem.created_at.desc()
    )
    
    result = await db.execute(stmt)
    all_faqs = result.scalars().all()
    
    # Agrupar por categoría
    grouped: Dict[str, List[FAQItem]] = {}
    for faq in all_faqs:
        if faq.category not in grouped:
            grouped[faq.category] = []
        grouped[faq.category].append(faq)
    
    logger.info(f"FAQs agrupadas en {len(grouped)} categorías")
    return grouped