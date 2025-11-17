# Autor: Gabriel Florentino Reyes
# Fecha: 08-11-2025
# Descripción: Servicio de gestión de documentos de la plataforma.
#              Contiene la lógica de negocio para:
#               - Crear, actualizar y eliminar documentos legales.
#               - Crear, actualizar y eliminar FAQs.
#               - Validar existencia y unicidad de documentos y FAQs.
#               - Consultar documentos legales por slug y FAQs por categoría.
#               - Agrupar FAQs por categoría.
#               - Manejar excepciones y logging de acciones.

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
    Autor: Gabriel Florentino Reyes

    Descripción: Crea un nuevo documento legal en la plataforma.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        document_data (LegalDocumentCreate): Datos del documento a crear.
        current_admin (User): Usuario administrador que realiza la acción.

    Retorna:
        LegalDocument: Documento legal creado.
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
    Autor: Gabriel Florentino Reyes

    Descripción: Obtiene una lista paginada de documentos legales.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        skip (int): Número de registros a omitir (offset).
        limit (int): Límite de registros a retornar.
        active_only (bool): Filtra solo documentos activos si es True.

    Retorna:
        Tuple[List[LegalDocument], int]: Lista de documentos y total.
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
    Autor: Gabriel Florentino Reyes

    Descripción: Obtiene un documento legal por su slug.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        slug (str): Slug del documento.
        active_only (bool): Retorna solo si el documento está activo.

    Retorna:
        LegalDocument: Documento legal encontrado.
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
    Autor: Gabriel Florentino Reyes

    Descripción: Actualiza un documento legal existente.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        slug (str): Slug del documento a actualizar.
        document_data (LegalDocumentUpdate): Datos a actualizar.
        current_admin (User): Usuario administrador que realiza la actualización.

    Retorna:
        LegalDocument: Documento actualizado.
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
    Autor: Gabriel Florentino Reyes

    Descripción: Elimina un documento legal.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        slug (str): Slug del documento a eliminar.
        current_admin (User): Usuario administrador que realiza la eliminación.

    Retorna:
        None
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
    Autor: Gabriel Florentino Reyes

    Descripción: Crea un nuevo item de FAQ.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        faq_data (FAQItemCreate): Datos de la FAQ a crear.
        current_admin (User): Usuario administrador que crea la FAQ.

    Retorna:
        FAQItem: FAQ creada.
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
    Autor: Gabriel Florentino Reyes

    Descripción: Obtiene una lista paginada de FAQs, opcionalmente filtradas por categoría.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        skip (int): Número de registros a omitir (offset).
        limit (int): Límite de registros a retornar.
        active_only (bool): Filtra solo FAQs activas si es True.
        category (Optional[str]): Filtra por categoría si se proporciona.

    Retorna:
        Tuple[List[FAQItem], int]: Lista de FAQs y total.
    """
    
    logger.info(
        f"Obteniendo FAQs (active_only={active_only}, category={category})"
    )
    
    stmt = select(FAQItem)
    
    # FAQItem no tiene campo is_active, todas las FAQs son públicas
    # if active_only:
    #     stmt = stmt.where(FAQItem.is_active == True)
    
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
    Autor: Gabriel Florentino Reyes

    Descripción: Obtiene una FAQ por su ID.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        faq_id (int): ID de la FAQ.
        active_only (bool): Retorna solo si la FAQ está activa.

    Retorna:
        FAQItem: FAQ encontrada.
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
    Autor: Gabriel Florentino Reyes

    Descripción: Actualiza una FAQ existente.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        faq_id (int): ID de la FAQ a actualizar.
        faq_data (FAQItemUpdate): Datos a actualizar.
        current_admin (User): Usuario administrador que realiza la actualización.

    Retorna:
        FAQItem: FAQ actualizada.
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
    Autor: Gabriel Florentino Reyes

    Descripción: Elimina una FAQ existente.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        faq_id (int): ID de la FAQ a eliminar.
        current_admin (User): Usuario administrador que realiza la eliminación.

    Retorna:
        None
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
    Autor: Gabriel Florentino Reyes

    Descripción: Obtiene todas las FAQs agrupadas por categoría.

    Parámetros:
        db (AsyncSession): Sesión asíncrona de base de datos.
        active_only (bool): Filtra solo FAQs activas si es True.

    Retorna:
        Dict[str, List[FAQItem]]: Diccionario donde la clave es la categoría y el valor la lista de FAQs.
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