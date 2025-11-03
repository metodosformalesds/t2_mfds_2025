"""
Configuración de la base de datos usando SQLAlchemy 2.0.
Proporciona el engine, sessionmaker y base declarativa para los modelos.
"""
import logging
from typing import Generator
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase
from sqlalchemy.pool import QueuePool
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
# SESSION FACTORY
# ==================================
SessionLocal = sessionmaker(
    bind=engine,
    class_=Session,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False
)
logger.info("SessionLocal creado exitosamente.")


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