# 🔄 Guía de Migración: Endpoints de Category a Async

Esta guía muestra cómo actualizar los endpoints de la API para usar el servicio asíncrono refactorizado.

---

## 📝 Template de Endpoint Async

### **Antes (Síncrono):**
```python
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.services import category_service

@router.post("/categories/", response_model=CategoryResponse)
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db)
):
    """Crear nueva categoría."""
    return category_service.create_category(db, category)
```

### **Después (Asíncrono):**
```python
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_async_db  # Cambio 1: Dependency async
from app.services import category_service

@router.post("/categories/", response_model=CategoryResponse)
async def create_category(  # Cambio 2: async def
    category: CategoryCreate,
    db: AsyncSession = Depends(get_async_db)  # Cambio 3: AsyncSession
):
    """Crear nueva categoría."""
    return await category_service.create_category(db, category)  # Cambio 4: await
```

---

## 🔧 Paso 1: Actualizar Dependency `get_async_db`

Crear o verificar que existe en `app/api/deps.py`:

```python
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session_maker

async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency para obtener sesión asíncrona de base de datos.
    
    Yields:
        AsyncSession: Sesión de base de datos asíncrona.
        
    Note:
        Automáticamente hace commit o rollback según el resultado.
    """
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

---

## 📋 Checklist de Migración por Endpoint

### **✅ POST /categories/ - Crear Categoría**

```python
@router.post("/categories/", 
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_category(
    category: CategoryCreate,
    db: AsyncSession = Depends(get_async_db),
    # current_user: User = Depends(get_current_admin_user)  # Si requiere auth
):
    """
    Crear una nueva categoría.
    
    Requiere:
    - name: Nombre de la categoría
    - type: MATERIAL o PRODUCT
    - parent_category_id: (Opcional) ID de categoría padre
    
    Returns:
        Categoría creada con slug generado automáticamente.
    """
    return await category_service.create_category(db, category)
```

---

### **✅ GET /categories/{category_id} - Obtener por ID**

```python
@router.get("/categories/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: int,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Obtener una categoría por su ID.
    
    Args:
        category_id: ID de la categoría.
        
    Returns:
        Categoría encontrada.
        
    Raises:
        404: Si la categoría no existe.
    """
    return await category_service.get_category_by_id(db, category_id)
```

---

### **✅ GET /categories/ - Listar con Filtros**

```python
from typing import Optional

@router.get("/categories/", response_model=CategoryListResponse)
async def list_categories(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=100, description="Máximo de registros"),
    type: Optional[ListingTypeEnum] = Query(None, description="Filtrar por tipo"),
    parent_id: Optional[int] = Query(None, description="Filtrar por categoría padre"),
    search: Optional[str] = Query(None, description="Buscar en nombre"),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Listar categorías con paginación y filtros.
    
    Query Parameters:
    - skip: Offset para paginación (default: 0)
    - limit: Límite de resultados (default: 100, max: 100)
    - type: Filtrar por MATERIAL o PRODUCT
    - parent_id: Filtrar por categoría padre (usa -1 para solo raíces)
    - search: Búsqueda por nombre (case-insensitive)
    
    Returns:
        Lista de categorías y total de registros.
    """
    categories, total = await category_service.get_categories(
        db=db,
        skip=skip,
        limit=limit,
        type_filter=type,
        parent_id=parent_id,
        search=search
    )
    
    return {
        "items": categories,
        "total": total,
        "skip": skip,
        "limit": limit
    }
```

---

### **✅ GET /categories/tree - Obtener Árbol Completo**

```python
@router.get("/categories/tree", response_model=CategoryTreeResponse)
async def get_category_tree(
    db: AsyncSession = Depends(get_async_db)
):
    """
    Obtener árbol jerárquico completo de categorías.
    
    Retorna dos árboles separados:
    - materials: Categorías de tipo MATERIAL con subcategorías
    - products: Categorías de tipo PRODUCT con subcategorías
    
    Note:
        Usa eager loading para cargar toda la jerarquía eficientemente.
        Ideal para cachear en frontend.
        
    Returns:
        Diccionario con árboles 'materials' y 'products'.
    """
    return await category_service.get_category_tree(db)
```

**Schema de respuesta:**
```python
class CategoryTreeResponse(BaseModel):
    """Schema para árbol de categorías."""
    materials: List[CategoryResponse]
    products: List[CategoryResponse]
    
    class Config:
        from_attributes = True
```

---

### **✅ PUT /categories/{category_id} - Actualizar**

```python
@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: AsyncSession = Depends(get_async_db),
    # current_user: User = Depends(get_current_admin_user)
):
    """
    Actualizar una categoría existente.
    
    Args:
        category_id: ID de la categoría a actualizar.
        category_data: Campos a actualizar (todos opcionales).
        
    Note:
        - Si se actualiza 'name', se regenera el slug automáticamente
        - Si se actualiza 'parent_category_id', se valida jerarquía
        - No se permite crear ciclos en la jerarquía
        
    Returns:
        Categoría actualizada.
        
    Raises:
        404: Si la categoría no existe.
        400: Si hay errores de validación.
    """
    return await category_service.update_category(db, category_id, category_data)
```

---

### **✅ DELETE /categories/{category_id} - Eliminar**

```python
@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_async_db),
    # current_user: User = Depends(get_current_admin_user)
):
    """
    Eliminar una categoría.
    
    Args:
        category_id: ID de la categoría a eliminar.
        
    Note:
        Solo se puede eliminar si:
        - No tiene subcategorías asociadas
        - No tiene listings asociados
        
    Returns:
        204 No Content si se elimina exitosamente.
        
    Raises:
        404: Si la categoría no existe.
        400: Si tiene subcategorías o listings.
    """
    await category_service.delete_category(db, category_id)
    return None  # 204 No Content
```

---

## 🎯 Schemas Necesarios

### **CategoryCreate**
```python
from pydantic import BaseModel, Field
from app.models.category import ListingTypeEnum

class CategoryCreate(BaseModel):
    """Schema para crear categoría."""
    name: str = Field(..., min_length=1, max_length=100)
    type: ListingTypeEnum
    parent_category_id: Optional[int] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Smartphones",
                "type": "PRODUCT",
                "parent_category_id": 1
            }
        }
```

### **CategoryUpdate**
```python
class CategoryUpdate(BaseModel):
    """Schema para actualizar categoría."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[ListingTypeEnum] = None
    parent_category_id: Optional[int] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Teléfonos Inteligentes"
            }
        }
```

### **CategoryResponse**
```python
from datetime import datetime

class CategoryResponse(BaseModel):
    """Schema de respuesta para categoría."""
    category_id: int
    name: str
    slug: str
    type: ListingTypeEnum
    parent_category_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    # Relaciones opcionales (para árbol)
    children: List["CategoryResponse"] = []
    
    class Config:
        from_attributes = True
```

### **CategoryListResponse**
```python
class CategoryListResponse(BaseModel):
    """Schema para lista paginada."""
    items: List[CategoryResponse]
    total: int
    skip: int
    limit: int
```

---

## 🧪 Actualizar Tests

### **Test de Endpoint Async**

```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

@pytest.mark.asyncio
async def test_create_category(async_client: AsyncClient, async_db: AsyncSession):
    """Test crear categoría via API."""
    category_data = {
        "name": "Test Category",
        "type": "PRODUCT"
    }
    
    response = await async_client.post("/api/v1/categories/", json=category_data)
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Category"
    assert data["slug"] == "test-category"
    assert data["type"] == "PRODUCT"


@pytest.mark.asyncio
async def test_get_category_tree(async_client: AsyncClient):
    """Test obtener árbol de categorías."""
    response = await async_client.get("/api/v1/categories/tree")
    
    assert response.status_code == 200
    data = response.json()
    assert "materials" in data
    assert "products" in data
    assert isinstance(data["materials"], list)
    assert isinstance(data["products"], list)


@pytest.mark.asyncio
async def test_list_categories_with_filters(async_client: AsyncClient):
    """Test listar categorías con filtros."""
    # Con filtro de tipo
    response = await async_client.get("/api/v1/categories/?type=PRODUCT&limit=10")
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) <= 10
```

### **Fixtures Async para Tests**

```python
# conftest.py
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.config import settings

@pytest.fixture(scope="session")
def async_engine():
    """Engine asíncrono para tests."""
    engine = create_async_engine(
        settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
        echo=False
    )
    yield engine
    engine.sync_engine.dispose()


@pytest.fixture
async def async_db(async_engine):
    """Sesión asíncrona para tests."""
    async_session = sessionmaker(
        async_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        async with session.begin():
            yield session
            await session.rollback()


@pytest.fixture
async def async_client(async_db):
    """Cliente HTTP asíncrono para tests."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
```

---

## ⚡ Optimizaciones Adicionales

### **1. Caché en Endpoint de Árbol**

```python
from functools import lru_cache
from datetime import datetime, timedelta

# Caché simple (mejor usar Redis en producción)
_tree_cache = None
_cache_time = None

@router.get("/categories/tree")
async def get_category_tree(
    db: AsyncSession = Depends(get_async_db),
    force_refresh: bool = Query(False, description="Forzar actualización de caché")
):
    """Obtener árbol con caché."""
    global _tree_cache, _cache_time
    
    now = datetime.utcnow()
    cache_valid = (
        _tree_cache is not None 
        and _cache_time is not None
        and (now - _cache_time) < timedelta(minutes=15)
    )
    
    if not cache_valid or force_refresh:
        _tree_cache = await category_service.get_category_tree(db)
        _cache_time = now
    
    return _tree_cache
```

### **2. Invalidar Caché al Modificar**

```python
@router.post("/categories/")
async def create_category(...):
    """Crear categoría e invalidar caché."""
    global _tree_cache, _cache_time
    
    category = await category_service.create_category(db, category_data)
    
    # Invalidar caché
    _tree_cache = None
    _cache_time = None
    
    return category
```

---

## 📋 Checklist Final de Migración

- [ ] Actualizar imports (`AsyncSession`, `get_async_db`)
- [ ] Cambiar todas las funciones a `async def`
- [ ] Agregar `await` en llamadas al servicio
- [ ] Actualizar dependency injection
- [ ] Crear/actualizar schemas de response
- [ ] Actualizar tests a async con `@pytest.mark.asyncio`
- [ ] Crear fixtures async para tests
- [ ] Verificar que todos los endpoints funcionan
- [ ] Documentar cambios en OpenAPI/Swagger
- [ ] Considerar implementar caché
- [ ] Monitorear rendimiento post-migración

---

## 🚀 Resultado Esperado

Después de la migración:

✅ **Endpoints totalmente asíncronos**  
✅ **10-100x más throughput** bajo carga  
✅ **Tiempos de respuesta consistentes**  
✅ **Mejor experiencia de usuario**  
✅ **Código moderno y mantenible**  

---

**¡Listo para migrar!** 🎉
