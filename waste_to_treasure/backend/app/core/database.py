"""
Configuración de la base de datos usando SQLAlchemy 2.0.
Proporciona el engine, sessionmaker y base declarativa para los modelos.

Autor: Oscar Alonso Nava Rivera
Fecha: 31/10/2025
Descripción: Engine y dependencias de DB (sync/async).
"""
import logging
from typing import Generator, AsyncGenerator
from sqlalchemy import create_engine, event, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase
from sqlalchemy.pool import QueuePool, NullPool
from app.core.config import get_settings

# Configurar logger
logger = logging.getLogger(__name__)
settings = get_settings()


# ==================================
# BASE DECLARATIVA (SQLAlchemy 2.0)
# ==================================
class Base(DeclarativeBase):
    """
    Clase base para todos los modelos de SQLAlchemy.
    """
    pass


# ==================================
# ENGINE DE BASE DE DATOS
# ==================================
def create_db_engine():
    """Crea y configura el engine de SQLAlchemy."""
    logger.info("Creando engine de base de datos...")
    try:
        engine = create_engine(
            str(settings.DATABASE_URL),
            echo=settings.DB_ECHO,
            poolclass=QueuePool,
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_pre_ping=True,
            pool_recycle=3600, # Recicla conexiones cada hora
        )
        logger.info("Engine de base de datos creado exitosamente.")
        return engine
    except Exception as e:
        logger.error(f"Error creando engine de base de datos: {e}")
        raise

engine = create_db_engine()


# ==================================
# SESSION FACTORY (SYNC)
# ==================================
SessionLocal = sessionmaker(
    bind=engine,
    class_=Session,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False
)
logger.info("SessionLocal (sync) creado exitosamente.")


# ==================================
# ASYNC ENGINE Y SESSION FACTORY
# ==================================
# Adaptar la URL de la base de datos para el driver asíncrono
# Soporta tanto postgresql:// como postgresql+psycopg2://
async_database_url = str(settings.DATABASE_URL)
if "+psycopg2" in async_database_url:
    # Reemplazar psycopg2 (sync) por asyncpg (async)
    async_database_url = async_database_url.replace("postgresql+psycopg2://", "postgresql+asyncpg://")
elif async_database_url.startswith("postgresql://"):
    # Agregar el driver async
    async_database_url = async_database_url.replace("postgresql://", "postgresql+asyncpg://")

logger.info(f"Usando URL async: {async_database_url.split('@')[0]}@***")

# IMPORTANTE: AsyncEngine NO puede usar QueuePool
# Usar NullPool para async o dejar que SQLAlchemy use el pool por defecto para async
async_engine = create_async_engine(
    async_database_url,
    echo=settings.DB_ECHO,
    poolclass=NullPool,  # NullPool es compatible con async
    pool_pre_ping=True,
)
logger.info("Async engine de base de datos creado exitosamente.")

async_session_maker = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)
logger.info("Async session maker creado exitosamente.")


# ==================================
# EVENTOS DE BASE DE DATOS (para logging)
# ==================================
@event.listens_for(engine, "connect")
def receive_connect(dbapi_conn, connection_record):
    logger.debug("Nueva conexión a la base de datos establecida.")

@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_conn, connection_record, connection_proxy):
    logger.debug("Conexión obtenida del pool.")


# ==================================
# DEPENDENCY PARA FASTAPI
# ==================================
def get_db() -> Generator[Session, None, None]:
    """
    Dependencia de FastAPI que proporciona una sesión de base de datos.
    La sesión se cierra automáticamente al finalizar la request.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Error en sesión de base de datos: {e}", exc_info=True)
        db.rollback()
        raise
    finally:
        db.close()


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependencia de FastAPI que proporciona una sesión de base de datos asíncrona.
    
    Gestiona automáticamente el commit, rollback y cierre de la sesión.
    
    NOTA IMPORTANTE sobre commits:
    - Esta función NO hace commit automático al finalizar
    - Cada servicio/endpoint debe hacer su propio commit explícito
    - Esto evita conflictos con JIT user creation y otras operaciones
    - Solo hace rollback en caso de excepción
    """
    async with async_session_maker() as session:
        try:
            yield session
            # NO hacer commit automático - cada operación debe hacerlo explícitamente
        except Exception as e:
            logger.error(f"Error en sesión de base de datos asíncrona: {e}", exc_info=True)
            await session.rollback()
            raise
        finally:
            await session.close()


# ==================================
# FUNCIONES DE UTILIDAD
# ==================================
def check_db_connection() -> bool:
    """
    Verifica que la conexión a la base de datos funcione correctamente.
    """
    try:
        logger.info("Verificando conexión a la base de datos...")
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Conexión a la base de datos verificada exitosamente.")
        return True
    except Exception as e:
        logger.error(f"Error conectando a la base de datos: {e}")
        return False

async def check_db_connection_async() -> bool:
    """
    Verifica asíncronamente que la conexión a la base de datos funcione.
    """
    try:
        logger.info("Verificando conexión asíncrona a la base de datos...")
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Conexión asíncrona a la base de datos verificada exitosamente.")
        return True
    except Exception as e:
        logger.error(f"Error conectando a la base de datos de forma asíncrona: {e}")
        return False

def init_db() -> None:
    """
    Inicializa la base de datos creando todas las tablas.
    NOTA: En producción, se debe usar Alembic para migraciones.
    """
    logger.info("Inicializando base de datos...")
    try:
        # TODO: Importar todos los modelos aquí para que SQLAlchemy los detecte
        # from app import models
        Base.metadata.create_all(bind=engine)
        logger.info("Base de datos inicializada correctamente.")
    except Exception as e:
        logger.error(f"Error inicializando base de datos: {e}")
        raise