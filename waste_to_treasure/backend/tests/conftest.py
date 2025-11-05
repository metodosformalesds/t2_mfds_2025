"""
Pytest configuration and shared fixtures for testing.

This file provides:
- Database session fixtures for testing with PostgreSQL
- Sample data fixtures for common test scenarios
- Factory fixtures for creating test instances

IMPORTANTE: 
- Usamos PostgreSQL tanto en desarrollo (Supabase) como en producción (AWS RDS)
- NO usamos SQLite para evitar incompatibilidades
- Los tests usan un schema separado para aislamiento
"""

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
import os


@pytest.fixture(scope="session")
def test_db_url():
    """
    Get the test database URL from environment or use default.
    
    Usa PostgreSQL con un schema de test separado para no afectar datos de desarrollo.
    
    Variables de entorno:
        TEST_DATABASE_URL: URL completa de la base de datos de test
        
    Si no está definida, usa la DATABASE_URL pero con un schema diferente.
    """
    # Intenta obtener la URL de test del environment
    test_url = os.getenv("TEST_DATABASE_URL")
    
    if not test_url:
        # Si no existe, usa la DATABASE_URL de desarrollo
        from app.core.config import get_settings
        settings = get_settings()
        test_url = str(settings.DATABASE_URL)
    
    return test_url


@pytest.fixture(scope="session")
def engine(test_db_url):
    """
    Create a test database engine using PostgreSQL.
    
    Usa PostgreSQL para mantener compatibilidad total con desarrollo y producción.
    Crea un schema de test separado para aislamiento.
    """
    from app.models.base import Base
    
    # Create engine for PostgreSQL
    test_engine = create_engine(
        test_db_url,
        echo=False,
        pool_pre_ping=True,  # Verify connections before using
        pool_size=5,
        max_overflow=10
    )
    
    # Create a test schema for isolation
    with test_engine.connect() as conn:
        # Drop test schema if exists (cleanup from previous runs)
        conn.execute(text("DROP SCHEMA IF EXISTS test_schema CASCADE"))
        conn.commit()
        
        # Create test schema
        conn.execute(text("CREATE SCHEMA test_schema"))
        conn.commit()
        
        # Set search path to test schema
        conn.execute(text("SET search_path TO test_schema"))
        conn.commit()
    
    # Create all tables in test schema
    Base.metadata.schema = "test_schema"
    Base.metadata.create_all(bind=test_engine)
    
    yield test_engine
    
    # Cleanup: Drop test schema
    with test_engine.connect() as conn:
        conn.execute(text("DROP SCHEMA IF EXISTS test_schema CASCADE"))
        conn.commit()
    
    # Reset schema to None for other uses
    Base.metadata.schema = None
    test_engine.dispose()


@pytest.fixture(scope="function")
def db_session(engine):
    """
    Create a new database session for a test.
    
    Each test gets a fresh session with automatic rollback after the test.
    This ensures tests don't affect each other.
    
    Usa transacciones para rollback automático - mucho más rápido que recrear tablas.
    """
    connection = engine.connect()
    transaction = connection.begin()
    
    # Set search path for this connection
    connection.execute(text("SET search_path TO test_schema"))
    
    SessionLocal = sessionmaker(bind=connection)
    session = SessionLocal()
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def db(db_session):
    """
    Alias for db_session for convenience.
    
    Permite usar `db` en lugar de `db_session` en los tests.
    """
    return db_session


# ==================== SAMPLE DATA FIXTURES ====================

@pytest.fixture
def sample_user_data():
    """
    Sample data for creating a regular user.
    
    En producción, cognito_sub viene de AWS Cognito después de registro.
    En tests, simulamos un cognito_sub generado.
    """
    return {
        "cognito_sub": "cognito_test_user_123456",  # Simula ID de Cognito
        "email": "test@example.com",
        "full_name": "Test User"
    }


@pytest.fixture
def sample_admin_data():
    """
    Sample data for creating an admin user.
    
    En producción, el rol ADMIN se asigna después de validaciones.
    En tests, creamos directamente con rol ADMIN.
    """
    from app.models.user import UserRoleEnum, UserStatusEnum
    return {
        "cognito_sub": "cognito_admin_123456",  # Simula ID de Cognito para admin
        "email": "admin@example.com",
        "full_name": "Admin User",
        "role": UserRoleEnum.ADMIN,
        "status": UserStatusEnum.ACTIVE
    }


@pytest.fixture
def sample_category_data():
    """Sample data for creating a category."""
    from app.models.category import ListingTypeEnum
    return {
        "name": "Test Category",
        "slug": "test-category",
        "type": ListingTypeEnum.PRODUCT
    }


@pytest.fixture
def sample_address_data():
    """Sample data for creating an address."""
    return {
        "street": "123 Test Street",
        "city": "Ciudad de México",
        "state": "CDMX",
        "postal_code": "01000",
        "country": "MX",
        "is_default": True
    }


@pytest.fixture
def sample_listing_data():
    """Sample data for creating a listing."""
    from app.models.listing import ListingStatusEnum
    return {
        "title": "Test Listing",
        "description": "A test listing for unit tests",
        "price": 100.00,
        "status": ListingStatusEnum.ACTIVE
    }


# ==================== MODEL INSTANCE FIXTURES ====================

@pytest.fixture
def user(db, sample_user_data):
    """Create and return a test user."""
    from app.models.user import User
    
    user = User(**sample_user_data)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_user(db, sample_admin_data):
    """Create and return an admin user."""
    from app.models.user import User
    
    admin = User(**sample_admin_data)
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


@pytest.fixture
def category(db, sample_category_data):
    """Create and return a test category."""
    from app.models.category import Category
    
    category = Category(**sample_category_data)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@pytest.fixture
def address(db, user, sample_address_data):
    """Create and return a test address for a user."""
    from app.models.address import Address
    
    address_data = {**sample_address_data, "user_id": user.user_id}
    address = Address(**address_data)
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


@pytest.fixture
def listing(db, user, category, sample_listing_data):
    """Create and return a test listing."""
    from app.models.listing import Listing
    
    listing_data = {
        **sample_listing_data,
        "seller_id": user.id,
        "category_id": category.id
    }
    listing = Listing(**listing_data)
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


# ==================== FACTORY FIXTURES ====================

@pytest.fixture
def create_user(db):
    """
    Factory fixture for creating multiple users.
    
    Usage:
        user1 = create_user("user1@example.com", "User 1")
        user2 = create_user("user2@example.com", "User 2")
    """
    from app.models.user import User
    
    def _create_user(email: str, full_name: str, **kwargs):
        """
        Factory para crear usuarios en tests.
        
        Simula el proceso de AWS Cognito generando un cognito_sub único.
        En producción, cognito_sub viene de Cognito después de registro exitoso.
        """
        import uuid
        
        # Generar cognito_sub simulado si no se proporciona
        if "cognito_sub" not in kwargs:
            kwargs["cognito_sub"] = f"cognito_test_{uuid.uuid4().hex[:12]}"
        
        user_data = {
            "email": email,
            "full_name": full_name,
            **kwargs
        }
        user = User(**user_data)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    return _create_user


@pytest.fixture
def create_category(db):
    """
    Factory fixture for creating multiple categories.
    
    Usage:
        cat1 = create_category("Category 1", "category-1")
        cat2 = create_category("Category 2", "category-2")
    """
    from app.models.category import Category
    
    def _create_category(name: str, slug: str, **kwargs):
        category_data = {
            "name": name,
            "slug": slug,
            **kwargs
        }
        category = Category(**category_data)
        db.add(category)
        db.commit()
        db.refresh(category)
        return category
    
    return _create_category
