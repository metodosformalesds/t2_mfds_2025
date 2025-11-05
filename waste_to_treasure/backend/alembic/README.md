# Alembic - Gestión de Migraciones de Base de Datos

Este directorio contiene la configuración y las migraciones de Alembic para el proyecto Waste-To-Treasure.

## Configuración

- `env.py`: Configura el entorno de Alembic y conecta con los modelos de SQLAlchemy
- `script.py.mako`: Plantilla para generar nuevos archivos de migración
- `versions/`: Directorio donde se almacenan las migraciones generadas

## Comandos Útiles

### Generar una nueva migración automáticamente
```bash
alembic revision --autogenerate -m "descripción de la migración"
```

### Aplicar todas las migraciones pendientes
```bash
alembic upgrade head
```

### Revertir la última migración
```bash
alembic downgrade -1
```

### Ver el historial de migraciones
```bash
alembic history
```

### Ver la migración actual
```bash
alembic current
```

## Notas Importantes

1. **Importar todos los modelos**: En `env.py` se deben importar TODOS los modelos para que Alembic los detecte automáticamente.

2. **Variables de entorno**: Alembic usa la configuración del proyecto (`.env`) para conectarse a la base de datos.

3. **Orden de creación**: Alembic maneja automáticamente las dependencias entre tablas (ForeignKeys).

4. **Referencias circulares**: Los modelos usan strings ("User", "Order") en las relaciones para evitar imports circulares. SQLAlchemy resuelve estas referencias en runtime.

## Proceso de Migración

1. Modificar o crear modelos en `app/models/`
2. Asegurarse de que el modelo está importado en `app/models/__init__.py`
3. Generar la migración: `alembic revision --autogenerate -m "descripción"`
4. Revisar el archivo generado en `versions/`
5. Aplicar la migración: `alembic upgrade head`
