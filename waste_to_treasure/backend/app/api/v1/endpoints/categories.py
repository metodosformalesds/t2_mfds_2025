"""
Endpoints de la API para Category.

Implementa operaciones CRUD sobre categorías de materiales y productos.
Todos los endpoints de modificación requieren permisos de administrador.
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db, require_admin
from app.models.user import User
from app.models.category import ListingTypeEnum
from app.schemas.category import (
    Category,
    CategoryRead,
    CategoryCreate,
    CategoryUpdate,
    CategoryList,
    CategoryTree,
)
from app.services import category_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "",
    response_model=CategoryRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva categoría",
    description="Crea una nueva categoría en el marketplace especificado. Requiere permisos de administrador.",
    responses={
        201: {"description": "Categoría creada exitosamente"},
        400: {"description": "Datos de entrada inválidos"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos de administrador"},
    }
)
@router.post(
    "/",
    response_model=CategoryRead,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False
)
async def create_category(
    category_data: CategoryCreate,
    db: AsyncSession = Depends(get_async_db),
    admin: User = Depends(require_admin)
) -> CategoryRead:
    """
    Crea una nueva categoría.
    
    **Requiere**: Rol ADMIN
    
    **Validaciones**:
    - El nombre debe ser único dentro del mismo tipo (MATERIAL/PRODUCT)
    - Si se especifica parent_category_id, debe existir y ser del mismo tipo
    - El slug se genera automáticamente del nombre
    
    **Ejemplo de request body**:
    ```json
    {
        "name": "Madera Reciclada",
        "type": "MATERIAL",
        "parent_category_id": null
    }
    ```
    """
    logger.info(
        f"Admin {admin.user_id} creando categoría: {category_data.name} "
        f"({category_data.type.value})"
    )
    
    category = await category_service.create_category(db, category_data)
    
    return category


@router.get(
    "",
    response_model=CategoryList,
    summary="Listar categorías",
    description="Obtiene una lista paginada de categorías con filtros opcionales.",
    responses={
        200: {"description": "Lista de categorías obtenida exitosamente"},
    }
)
@router.get(
    "/",
    response_model=CategoryList,
    include_in_schema=False
)
async def get_categories(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(50, ge=1, le=100, description="Número máximo de registros"),
    type: Optional[ListingTypeEnum] = Query(
        None,
        description="Filtrar por tipo de marketplace (MATERIAL o PRODUCT)"
    ),
    parent_id: Optional[int] = Query(
        None,
        description="Filtrar por categoría padre (omitir para ver raíces, -1 para solo raíces)"
    ),
    search: Optional[str] = Query(
        None,
        min_length=2,
        max_length=100,
        description="Buscar por nombre de categoría"
    ),
    db: AsyncSession = Depends(get_async_db)
) -> CategoryList:
    """
    Lista categorías con filtros opcionales.
    
    **Acceso**: Público (no requiere autenticación)
    
    **Filtros disponibles**:
    - `type`: MATERIAL o PRODUCT
    - `parent_id`: ID de categoría padre (None = todas, -1 = solo raíces)
    - `search`: Búsqueda por nombre (case-insensitive)
    
    **Paginación**:
    - `skip`: Offset para paginación (default: 0)
    - `limit`: Límite de resultados (default: 50, max: 100)
    
    **Ejemplo de respuesta**:
    ```json
    {
        "items": [...],
        "total": 25,
        "page": 1,
        "page_size": 50
    }
    ```
    """
    logger.info(
        f"Listando categorías: skip={skip}, limit={limit}, type={type}, "
        f"parent_id={parent_id}, search={search}"
    )
    
    # Convertir parent_id=-1 a None para filtrar solo raíces
    parent_filter = None if parent_id == -1 else parent_id
    
    categories, total = await category_service.get_categories(
        db=db,
        skip=skip,
        limit=limit,
        type_filter=type,
        parent_id=parent_filter,
        search=search
    )
    
    # Calcular página actual
    page = (skip // limit) + 1 if limit > 0 else 1
    
    return CategoryList(
        items=categories,
        total=total,
        page=page,
        page_size=limit
    )


@router.get(
    "/tree",
    response_model=CategoryTree,
    summary="Obtener árbol de categorías",
    description="Obtiene el árbol jerárquico completo de categorías para ambos marketplaces.",
    responses={
        200: {"description": "Árbol de categorías obtenido exitosamente"},
    }
)
async def get_category_tree(
    db: AsyncSession = Depends(get_async_db)
) -> CategoryTree:
    """
    Obtiene el árbol jerárquico completo de categorías.
    
    **Acceso**: Público (no requiere autenticación)
    
    **Retorna**:
    - Árbol completo de categorías de MATERIALES (con subcategorías anidadas)
    - Árbol completo de categorías de PRODUCTOS (con subcategorías anidadas)
    
    **Uso típico**:
    - Menús de navegación
    - Filtros de búsqueda
    - Selectores de categoría en formularios
    
    **Ejemplo de respuesta**:
    ```json
    {
        "materials": [
            {
                "category_id": 1,
                "name": "Madera",
                "children": [
                    {"category_id": 2, "name": "Madera Reciclada", "children": []},
                    ...
                ]
            }
        ],
        "products": [...]
    }
    ```
    """
    logger.info("Obteniendo árbol completo de categorías")
    
    tree_data = await category_service.get_category_tree(db)
    
    return CategoryTree(
        materials=tree_data["materials"],
        products=tree_data["products"]
    )


@router.get(
    "/{category_id}",
    response_model=CategoryRead,
    summary="Obtener categoría por ID",
    description="Obtiene los detalles completos de una categoría específica.",
    responses={
        200: {"description": "Categoría encontrada"},
        404: {"description": "Categoría no encontrada"},
    }
)
async def get_category(
    category_id: int,
    db: AsyncSession = Depends(get_async_db)
) -> CategoryRead:
    """
    Obtiene una categoría específica por su ID.
    
    **Acceso**: Público (no requiere autenticación)
    
    **Parámetros**:
    - `category_id`: ID de la categoría
    
    **Retorna**:
    - Todos los datos de la categoría
    - Ruta completa en la jerarquía (full_path)
    
    **Ejemplo de respuesta**:
    ```json
    {
        "category_id": 2,
        "name": "Madera Reciclada",
        "slug": "madera-reciclada",
        "type": "MATERIAL",
        "parent_category_id": 1,
        "full_path": "Madera > Madera Reciclada",
        "children": [],
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
    }
    ```
    """
    logger.info(f"Obteniendo categoría ID {category_id}")
    
    category = await category_service.get_category_by_id(db, category_id)
    
    return category


@router.patch(
    "/{category_id}",
    response_model=CategoryRead,
    summary="Actualizar categoría",
    description="Actualiza los campos especificados de una categoría. Requiere permisos de administrador.",
    responses={
        200: {"description": "Categoría actualizada exitosamente"},
        400: {"description": "Datos de entrada inválidos"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos de administrador"},
        404: {"description": "Categoría no encontrada"},
    }
)
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: AsyncSession = Depends(get_async_db),
    admin: User = Depends(require_admin)
) -> CategoryRead:
    """
    Actualiza una categoría existente (actualización parcial).
    
    **Requiere**: Rol ADMIN
    
    **Validaciones**:
    - La categoría debe existir
    - Si se actualiza parent_category_id, debe ser válido
    - No se pueden crear ciclos en la jerarquía
    - Si se actualiza el nombre, se regenera el slug
    
    **Campos actualizables**:
    - `name`: Nombre de la categoría
    - `type`: Tipo de marketplace (MATERIAL/PRODUCT)
    - `parent_category_id`: ID de categoría padre
    
    **Ejemplo de request body**:
    ```json
    {
        "name": "Madera Reutilizada"
    }
    ```
    
    **Nota**: Todos los campos son opcionales. Solo se actualizan los campos proporcionados.
    """
    logger.info(f"Admin {admin.user_id} actualizando categoría {category_id}")
    
    category = await category_service.update_category(db, category_id, category_data)
    
    return category


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar categoría",
    description="Elimina una categoría del sistema. Requiere permisos de administrador.",
    responses={
        204: {"description": "Categoría eliminada exitosamente"},
        400: {"description": "No se puede eliminar: tiene subcategorías o listings asociados"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos de administrador"},
        404: {"description": "Categoría no encontrada"},
    }
)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_async_db),
    admin: User = Depends(require_admin)
) -> None:
    """
    Elimina una categoría del sistema.
    
    **Requiere**: Rol ADMIN
    
    **Validaciones**:
    - La categoría debe existir
    - No debe tener subcategorías asociadas
    - No debe tener listings (publicaciones) asociados
    
    **Restricciones de integridad**:
    - Si la categoría tiene hijos, primero debes eliminar o reasignar las subcategorías
    - Si la categoría tiene listings, primero debes eliminar o reasignar los listings
    
    **Retorna**: 204 No Content (sin cuerpo de respuesta)
    """
    logger.info(f"Admin {admin.user_id} eliminando categoría {category_id}")
    
    await category_service.delete_category(db, category_id)
    
    # FastAPI automáticamente retorna 204 No Content
    return None
