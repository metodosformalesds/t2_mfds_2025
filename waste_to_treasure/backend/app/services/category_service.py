"""
Capa de servicio para Category.

Implementa la lógica de negocio para operaciones CRUD sobre categorías,
incluyendo validaciones, generación de slugs y manejo de jerarquías.

Este servicio está completamente asíncrono para aprovechar la arquitectura
de FastAPI y SQLAlchemy 2.0 async, mejorando el rendimiento y escalabilidad.
"""
import logging
import re
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.category import Category, ListingTypeEnum
from app.schemas.category import CategoryCreate, CategoryUpdate

logger = logging.getLogger(__name__)


def generate_slug(name: str) -> str:
    """
    Genera un slug URL-friendly a partir del nombre de la categoría.
    
    Args:
        name: Nombre de la categoría.
        
    Returns:
        Slug normalizado (minúsculas, sin espacios, sin caracteres especiales).
        
    Example:
        >>> generate_slug("Madera Reciclada")
        "madera-reciclada"
    """
    # Convertir a minúsculas
    slug = name.lower()
    
    # Reemplazar espacios y caracteres especiales por guiones
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    
    # Eliminar guiones al inicio y final
    slug = slug.strip('-')
    
    return slug


async def ensure_unique_slug(
    db: AsyncSession, 
    base_slug: str, 
    category_id: Optional[int] = None
) -> str:
    """
    Asegura que el slug sea único en la base de datos.
    
    Si el slug ya existe, añade un sufijo numérico (ej: madera-reciclada-2).
    
    Args:
        db: Sesión asíncrona de base de datos.
        base_slug: Slug base generado del nombre.
        category_id: ID de la categoría (para actualizaciones, None para creación).
        
    Returns:
        Slug único.
    """
    slug = base_slug
    counter = 1
    
    while True:
        # Buscar categorías con este slug
        stmt = select(Category).where(Category.slug == slug)
        
        # Si es una actualización, excluir la categoría actual
        if category_id is not None:
            stmt = stmt.where(Category.category_id != category_id)
        
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()
        
        if not existing:
            return slug
        
        # Si existe, añadir sufijo numérico
        counter += 1
        slug = f"{base_slug}-{counter}"


async def validate_parent_category(
    db: AsyncSession,
    parent_category_id: int,
    category_type: ListingTypeEnum,
    current_category_id: Optional[int] = None
) -> Category:
    """
    Valida que la categoría padre existe y es del mismo tipo.
    
    Args:
        db: Sesión asíncrona de base de datos.
        parent_category_id: ID de la categoría padre.
        category_type: Tipo de la categoría actual.
        current_category_id: ID de la categoría actual (para evitar ciclos).
        
    Returns:
        Categoría padre válida.
        
    Raises:
        HTTPException 404: Si la categoría padre no existe.
        HTTPException 400: Si el tipo no coincide o hay un ciclo.
    """
    stmt = select(Category).where(Category.category_id == parent_category_id)
    result = await db.execute(stmt)
    parent = result.scalar_one_or_none()
    
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categoría padre con ID {parent_category_id} no encontrada"
        )
    
    # Validar que sea del mismo tipo
    if parent.type != category_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La categoría padre debe ser del tipo {category_type.value}"
        )
    
    # Prevenir ciclos: la categoría padre no puede ser descendiente de la actual
    if current_category_id:
        descendants = await get_all_descendant_ids(db, current_category_id)
        if parent_category_id in descendants:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede crear un ciclo en la jerarquía de categorías"
            )
    
    return parent


async def get_all_descendant_ids(db: AsyncSession, category_id: int) -> List[int]:
    """
    Obtiene recursivamente todos los IDs de categorías descendientes.
    
    Args:
        db: Sesión asíncrona de base de datos.
        category_id: ID de la categoría raíz.
        
    Returns:
        Lista de IDs de todas las subcategorías (hijos, nietos, etc.).
    """
    descendants = []
    
    # Obtener hijos directos
    stmt = select(Category).where(Category.parent_category_id == category_id)
    result = await db.execute(stmt)
    children = result.scalars().all()
    
    for child in children:
        descendants.append(child.category_id)
        # Recursión para obtener descendientes del hijo
        child_descendants = await get_all_descendant_ids(db, child.category_id)
        descendants.extend(child_descendants)
    
    return descendants


async def create_category(db: AsyncSession, category_data: CategoryCreate) -> Category:
    """
    Crea una nueva categoría.
    
    Args:
        db: Sesión asíncrona de base de datos.
        category_data: Datos de la categoría a crear.
        
    Returns:
        Categoría creada.
        
    Raises:
        HTTPException 400: Si hay errores de validación.
        HTTPException 404: Si la categoría padre no existe.
    """
    logger.info(f"Creando categoría: {category_data.name} ({category_data.type.value})")
    
    # Generar slug único
    base_slug = generate_slug(category_data.name)
    unique_slug = await ensure_unique_slug(db, base_slug)
    
    # Validar categoría padre si se especifica
    if category_data.parent_category_id:
        await validate_parent_category(
            db,
            category_data.parent_category_id,
            category_data.type
        )
    
    # Crear instancia del modelo
    db_category = Category(
        name=category_data.name,
        slug=unique_slug,
        type=category_data.type,
        parent_category_id=category_data.parent_category_id
    )
    
    try:
        db.add(db_category)
        await db.commit()
        await db.refresh(db_category)
        logger.info(f"Categoría creada exitosamente: ID {db_category.category_id}")
        return db_category
    except IntegrityError as e:
        await db.rollback()
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        
        if "ix_categories_name_type" in error_msg or "duplicate key" in error_msg:
            logger.warning(f"Intento de crear categoría con nombre duplicado: {category_data.name}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe una categoría de tipo {category_data.type.value} con el nombre '{category_data.name}'"
            )
        elif "categories.slug" in error_msg or "slug" in error_msg.lower():
            logger.warning(f"Slug duplicado: {unique_slug}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El slug '{unique_slug}' ya está en uso"
            )
        else:
            logger.error(f"Error de integridad al crear categoría: {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error de integridad en la base de datos"
            )
    except Exception as e:
        await db.rollback()
        logger.error(f"Error inesperado al crear categoría: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear la categoría"
        )


async def get_category_by_id(db: AsyncSession, category_id: int) -> Category:
    """
    Obtiene una categoría por su ID (sin cargar relaciones).
    
    Args:
        db: Sesión asíncrona de base de datos.
        category_id: ID de la categoría.
        
    Returns:
        Categoría encontrada (sin children cargados para evitar MissingGreenlet).
        
    Raises:
        HTTPException 404: Si la categoría no existe.
    """
    stmt = select(Category).where(Category.category_id == category_id)
    result = await db.execute(stmt)
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categoría con ID {category_id} no encontrada"
        )
    
    return category


async def get_categories(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    type_filter: Optional[ListingTypeEnum] = None,
    parent_id: Optional[int] = None,
    search: Optional[str] = None
) -> tuple[List[Category], int]:
    """
    Obtiene una lista paginada de categorías con filtros opcionales.
    
    Args:
        db: Sesión asíncrona de base de datos.
        skip: Número de registros a omitir (paginación).
        limit: Número máximo de registros a devolver.
        type_filter: Filtrar por tipo (MATERIAL o PRODUCT).
        parent_id: Filtrar por categoría padre (None = solo raíces).
        search: Término de búsqueda en el nombre.
        
    Returns:
        Tupla (lista de categorías, total de registros).
    """
    # Construir query base
    stmt = select(Category)
    
    # Aplicar filtros
    filters = []
    
    if type_filter:
        filters.append(Category.type == type_filter)
    
    if parent_id is not None:
        filters.append(Category.parent_category_id == parent_id)
    elif parent_id == -1:  # Convención para "solo raíces"
        filters.append(Category.parent_category_id.is_(None))
    
    if search:
        filters.append(Category.name.ilike(f"%{search}%"))
    
    if filters:
        stmt = stmt.where(and_(*filters))
    
    # Contar total (antes de paginación)
    count_stmt = select(func.count()).select_from(stmt.subquery())
    count_result = await db.execute(count_stmt)
    total = count_result.scalar() or 0
    
    # Aplicar paginación y ordenamiento
    stmt = stmt.order_by(Category.name).offset(skip).limit(limit)
    result = await db.execute(stmt)
    categories = result.scalars().all()
    
    return list(categories), total


async def update_category(
    db: AsyncSession,
    category_id: int,
    category_data: CategoryUpdate
) -> Category:
    """
    Actualiza una categoría existente.
    
    Args:
        db: Sesión asíncrona de base de datos.
        category_id: ID de la categoría a actualizar.
        category_data: Datos a actualizar (campos opcionales).
        
    Returns:
        Categoría actualizada.
        
    Raises:
        HTTPException 404: Si la categoría no existe.
        HTTPException 400: Si hay errores de validación.
    """
    logger.info(f"Actualizando categoría ID {category_id}")
    
    category = await get_category_by_id(db, category_id)
    
    # Actualizar campos proporcionados
    update_data = category_data.model_dump(exclude_unset=True)
    
    # Si se actualiza el nombre, regenerar slug
    if "name" in update_data:
        base_slug = generate_slug(update_data["name"])
        update_data["slug"] = await ensure_unique_slug(db, base_slug, category_id)
    
    # Validar categoría padre si se actualiza
    if "parent_category_id" in update_data and update_data["parent_category_id"]:
        await validate_parent_category(
            db,
            update_data["parent_category_id"],
            update_data.get("type", category.type),
            category_id
        )
    
    # Aplicar actualizaciones
    for field, value in update_data.items():
        setattr(category, field, value)
    
    try:
        await db.commit()
        await db.refresh(category)
        logger.info(f"Categoría {category_id} actualizada exitosamente")
        return category
    except Exception as e:
        await db.rollback()
        logger.error(f"Error al actualizar categoría: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar la categoría"
        )


async def delete_category(db: AsyncSession, category_id: int) -> None:
    """
    Elimina una categoría.
    
    Args:
        db: Sesión asíncrona de base de datos.
        category_id: ID de la categoría a eliminar.
        
    Raises:
        HTTPException 404: Si la categoría no existe.
        HTTPException 400: Si la categoría tiene subcategorías o listings asociados.
    """
    logger.info(f"Eliminando categoría ID {category_id}")
    
    # Obtener categoría con relaciones cargadas para verificación
    stmt = select(Category).where(Category.category_id == category_id).options(
        selectinload(Category.children),
        selectinload(Category.listings)
    )
    result = await db.execute(stmt)
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categoría con ID {category_id} no encontrada"
        )
    
    # Verificar que no tenga subcategorías
    if category.children:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"No se puede eliminar la categoría porque tiene "
                f"{len(category.children)} subcategorías asociadas"
            )
        )
    
    # Verificar que no tenga listings asociados
    if category.listings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"No se puede eliminar la categoría porque tiene "
                f"{len(category.listings)} publicaciones asociadas"
            )
        )
    
    try:
        await db.delete(category)
        await db.commit()
        logger.info(f"Categoría {category_id} eliminada exitosamente")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error al eliminar categoría: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar la categoría"
        )


async def get_category_tree(db: AsyncSession) -> dict:
    """
    Construye el árbol jerárquico completo de categorías.
    
    Utiliza eager loading (selectinload) para cargar recursivamente todas
    las subcategorías en una sola consulta, evitando el problema N+1.
    
    Args:
        db: Sesión asíncrona de base de datos.
        
    Returns:
        Diccionario con dos árboles: 'materials' y 'products'.
        Cada categoría incluye sus hijos cargados recursivamente.
        
    Note:
        Esta implementación es significativamente más eficiente que lazy loading,
        especialmente con jerarquías profundas. En lugar de N+1 queries, hace
        solo 2 queries (una por cada tipo).
        
    Example:
        {
            "materials": [Category(...)],  # con children cargados
            "products": [Category(...)]     # con children cargados
        }
    """
    # Definir recursive eager loading para children
    # Esto carga toda la jerarquía en una sola query por tipo
    children_loader = selectinload(Category.children).options(
        selectinload(Category.children).options(
            selectinload(Category.children)  # 3 niveles de profundidad
        )
    )
    
    # Query para MATERIALS (solo raíz con hijos cargados recursivamente)
    materials_stmt = (
        select(Category)
        .where(
            and_(
                Category.type == ListingTypeEnum.MATERIAL,
                Category.parent_category_id.is_(None)
            )
        )
        .options(children_loader)
        .order_by(Category.name)
    )
    materials_result = await db.execute(materials_stmt)
    materials_root = materials_result.scalars().all()
    
    # Query para PRODUCTS (solo raíz con hijos cargados recursivamente)
    products_stmt = (
        select(Category)
        .where(
            and_(
                Category.type == ListingTypeEnum.PRODUCT,
                Category.parent_category_id.is_(None)
            )
        )
        .options(children_loader)
        .order_by(Category.name)
    )
    products_result = await db.execute(products_stmt)
    products_root = products_result.scalars().all()
    
    return {
        "materials": list(materials_root),
        "products": list(products_root)
    }