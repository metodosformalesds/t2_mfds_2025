"""
Configuración de Alembic para migraciones de base de datos.

Este archivo se ejecuta cada vez que se genera o aplica una migración.
Conecta Alembic con los modelos SQLAlchemy y la configuración del proyecto.
"""

# Autor: Oscar Alonso Nava Rivera
# Fecha: 16/11/2025
# Descripción: Configuración de Alembic para aplicar y generar migraciones en el proyecto.
from logging.config import fileConfig
import sys
from pathlib import Path

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Agregar el directorio raíz al path para poder importar app
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Importar la configuración del proyecto
from app.core.config import get_settings
from app.core.database import Base

# Importar el paquete de modelos para asegurarnos de que todos los modelos
# se registren en el metadata (esto ejecuta app/models/__init__.py)
import app.models  # noqa: F401

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.

# Obtener la configuración del proyecto y establecer la URL de la base de datos
settings = get_settings()

# Alembic usa conexiones síncronas, así que usamos psycopg2 para migraciones
sync_database_url = str(settings.DATABASE_URL)
if "+asyncpg" in sync_database_url:
    # Reemplazar asyncpg por psycopg2 para migraciones síncronas
    sync_database_url = sync_database_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
elif sync_database_url.startswith("postgresql://"):
    # Agregar el driver síncrono explícito
    sync_database_url = sync_database_url.replace("postgresql://", "postgresql+psycopg2://")

config.set_main_option("sqlalchemy.url", sync_database_url)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
