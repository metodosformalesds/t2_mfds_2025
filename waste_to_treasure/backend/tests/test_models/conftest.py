"""
Fixtures específicas para tests de modelos.

Provee fixtures comunes como user, category, etc.
Estos tests usan sesiones SÍNCRONAS porque testan modelos directamente.
"""
import pytest
from uuid import uuid4
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.user import User, UserRoleEnum, UserStatusEnum
from app.models.category import Category
from app.core.config import get_settings


@pytest.fixture(scope="session")
def sync_engine():
    """
    Engine síncrono para tests de modelo.
    """
    settings = get_settings()
    engine = create_engine(str(settings.DATABASE_URL).replace("+asyncpg", "+psycopg2"))
    yield engine
    engine.dispose()


@pytest.fixture
def db(sync_engine):
    """
    Sesión síncrona de base de datos para tests de modelo.
    
    Usa transacciones que se revierten automáticamente.
    """
    connection = sync_engine.connect()
    transaction = connection.begin()
    Session = sessionmaker(bind=connection)
    session = Session()
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def user(db):
    """
    Fixture que provee un usuario de prueba.
    
    Simula un usuario registrado en Cognito con UUID único.
    """
    user_uuid = uuid4()
    user = User(
        user_id=user_uuid,
        email=f"testuser_{user_uuid.hex[:8]}@example.com",
        full_name="Test User",
        role=UserRoleEnum.USER,
        status=UserStatusEnum.ACTIVE
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def category(db):
    """
    Fixture que provee una categoría de prueba.
    """
    from app.models.category import ListingTypeEnum
    
    category = Category(
        name="Test Category",
        slug="test-category",
        type=ListingTypeEnum.PRODUCT
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category
