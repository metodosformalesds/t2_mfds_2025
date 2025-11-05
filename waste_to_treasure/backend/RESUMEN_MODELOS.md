# Plan de Implementación: Backend

Este documento sigue el progreso del desarrollo del backend, fase por fase.

---

## Fase 2: Implementación de Esquemas (Pydantic)

**Estado:** En progreso ⏳

**Objetivo:** Definir los "contratos" de nuestra API usando esquemas Pydantic. Estos esquemas aseguran que los datos que entran y salen de la API tengan la estructura correcta, además de realizar validaciones automáticas.

### Tarea Actual: Esquemas para `Category`

Vamos a empezar creando los esquemas para el modelo `Category`. Esto servirá como plantilla para que el resto del equipo pueda crear los esquemas de los otros modelos.

**Archivos a crear:**
- `app/schemas/category.py`
- `app/schemas/__init__.py` (para exportar los nuevos esquemas)

**Esquemas a definir en `category.py`:**

1.  **`CategoryBase`**:
    -   Contiene los campos comunes que se usan tanto en creación como en actualización.
    -   Campos: `name`, `description`, `type`, `parent_category_id`.

2.  **`CategoryCreate`**:
    -   Hereda de `CategoryBase`.
    -   Se usa para validar los datos al **crear** una nueva categoría.
    -   No tiene campos adicionales por ahora.

3.  **`CategoryUpdate`**:
    -   Hereda de `CategoryBase`.
    -   Se usa para validar los datos al **actualizar** una categoría.
    -   Todos sus campos deben ser opcionales.

4.  **`CategoryInDB`**:
    -   Hereda de `CategoryBase`.
    -   Representa cómo se almacena la categoría en la base de datos.
    -   Añade el campo `category_id`.
    -   Configuración: `from_attributes = True` (antes `orm_mode`).

5.  **`Category`**:
    -   Hereda de `CategoryInDB`.
    -   Es el esquema que se usará para **devolver** datos al cliente.
    -   Puede incluir campos adicionales o relaciones en el futuro (ej. `sub_categories`).

### Próximos Pasos

1.  Implementar los 5 esquemas en `app/schemas/category.py`.
2.  Exportarlos desde `app/schemas/__init__.py`.
3.  Proceder con la creación de los endpoints CRUD para `Category`.

---

## ✅ Fases Anteriores (Completadas)

<details>
<summary>Fase 1: Modelos de Datos y Migraciones</summary>

### 1. Modelos de Datos (SQLAlchemy)
**Estado:** Completo

**Modelos Implementados:**
- ✅ `User`
- ✅ `Address`
- ✅ `Category`
- ✅ `Listing`
- ✅ `ListingImage`
- ✅ `Cart` y `CartItem`
- ✅ `Order` y `OrderItem`
- ✅ `Review`
- ⏳ `Report` (Pendiente)

**Características Clave:**
- Todos los modelos heredan de `BaseModel` con `created_at` y `updated_at`.
- Se usan Enums de Python para campos como `role`, `status`, etc.
- Relaciones (`relationship`) definidas con `back_populates` para navegación bidireccional.
- Uso de `TYPE_CHECKING` para evitar importaciones circulares.
- Constraints de base de datos (`CheckConstraint`, `UniqueConstraint`) implementados.

### 2. Configuración de Alembic
**Estado:** Completo

**Características Clave:**
- Conexión automática con la `DATABASE_URL` del proyecto.
- Detección automática de modelos para `autogenerate`.
- Configurado para comparar tipos y valores por defecto del servidor.

### 3. Migraciones de Base de Datos
**Estado:** Completo

**Migraciones generadas:**
1.  `f22e719cc9f5`: Creación inicial de todas las tablas excepto `Address`, `Cart`, `CartItem`.
2.  `...` (nueva migración): Añade las tablas `addresses`, `carts` y `cart_items`, y actualiza las relaciones.

**Resultado:** El esquema de la base de datos está sincronizado con los modelos de SQLAlchemy definidos en `app/models`.

</details>