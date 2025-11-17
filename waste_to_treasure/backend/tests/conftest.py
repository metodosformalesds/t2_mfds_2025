"""
Pytest configuration and shared fixtures for testing.

This file provides:
- Database fixtures usando la MISMA base de datos que desarrollo
- Cognito JWT mocking para tests sin dependencias externas
- Limpieza automática de datos entre tests

IMPORTANTE: 
- Los tests usan la MISMA base de datos (Supabase en desarrollo, PostgreSQL en producción)
- Limpiamos TODAS las tablas ANTES de cada test con TRUNCATE
- NO usamos schemas separados - probamos contra la BD real
- AWS Cognito se mockea para evitar dependencias externas en tests
- Cada test usa emails únicos (UUID) para evitar conflictos
"""

# Autor: Oscar Alonso Nava Rivera
# Fecha: 06/11/2025
# Descripción: Configuración de pytest y fixtures compartidas para tests de integración y unidad.

import pytest
import pytest_asyncio
from unittest.mock import patch
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from uuid import uuid4
import os


@pytest.fixture(scope="session")
def db_url():
    """
    Autor: Oscar Alonso Nava Rivera

    Obtiene la URL de la base de datos de desarrollo.
    
    Los tests usan la MISMA base de datos que desarrollo.
    Supabase en desarrollo, PostgreSQL en producción.
    """
    from app.core.config import get_settings
    settings = get_settings()
    return str(settings.DATABASE_URL)


@pytest_asyncio.fixture(scope="function")
async def cleanup_database(db_url):
    """
    Autor: Oscar Alonso Nava Rivera

    Limpia TODAS las tablas antes de cada test.
    
    Esto asegura que cada test empieza con una base de datos limpia.
    Usa TRUNCATE CASCADE para limpiar todas las tablas relacionadas.
    """
    # Crear engine async para limpieza
    async_url = db_url.replace("postgresql://", "postgresql+asyncpg://")
    engine = create_async_engine(async_url, echo=False)
    
    async with engine.begin() as conn:
        # Limpiar todas las tablas en orden inverso de dependencias
        await conn.execute(text("TRUNCATE TABLE order_items CASCADE"))
        await conn.execute(text("TRUNCATE TABLE orders CASCADE"))
        await conn.execute(text("TRUNCATE TABLE listing_images CASCADE"))
        await conn.execute(text("TRUNCATE TABLE listings CASCADE"))
        await conn.execute(text("TRUNCATE TABLE reviews CASCADE"))
        await conn.execute(text("TRUNCATE TABLE addresses CASCADE"))
        await conn.execute(text("TRUNCATE TABLE users CASCADE"))
        await conn.execute(text("TRUNCATE TABLE categories CASCADE"))
    
    await engine.dispose()
    
    yield  # Test corre aquí con BD limpia
    
    # Opcionalmente podemos limpiar después también
    # pero con BEFORE es suficiente para la mayoría de casos


# ==================== COGNITO MOCKING FIXTURES ====================

@pytest.fixture
def mock_cognito_token_payload():
    """
    Autor: Oscar Alonso Nava Rivera

    Mock de payload de JWT de Cognito.
    
    Cada invocación genera un UUID y email únicos para evitar conflictos.
    Simula los claims que retorna un ID Token válido de AWS Cognito.
    """
    import time
    
    # UUID único para cada test
    unique_uuid = uuid4()
    # Email único basado en UUID
    unique_email = f"test_{unique_uuid.hex[:8]}@example.com"
    
    return {
        "sub": str(unique_uuid),
        "email": unique_email,
        "given_name": "Test",
        "family_name": "User",
        "email_verified": True,
        "iss": "https://cognito-idp.us-east-2.amazonaws.com/us-east-2_TESTPOOL",
        "aud": "test_client_id",
        "token_use": "id",
        "auth_time": int(time.time()),
        "iat": int(time.time()),
        "exp": int(time.time()) + 3600
    }


@pytest.fixture
def mock_verify_cognito_token(mock_cognito_token_payload):
    """
    Autor: Oscar Alonso Nava Rivera

    Mock de verify_cognito_token para tests.
    
    Retorna directamente el payload sin validar firma.
    Debe patchearse donde se USA (app.api.deps), no donde se define.
    """
    with patch("app.api.deps.verify_cognito_token") as mock:
        mock.return_value = mock_cognito_token_payload
        yield mock


@pytest.fixture
def auth_headers_user(mock_verify_cognito_token):
    """
    Autor: Oscar Alonso Nava Rivera

    Headers de autenticación para usuario normal.
    
    Usage:
        response = await client.get("/users/me", headers=auth_headers_user)
    """
    return {"Authorization": "Bearer mock_user_token"}


@pytest.fixture
def auth_headers_admin(mock_cognito_token_payload):
    """
    Autor: Oscar Alonso Nava Rivera

    Headers de autenticación para usuario ADMIN.
    
    IMPORTANTE: Crea un usuario con rol ADMIN en BD y mockea Cognito.
    """
    import asyncio
    from app.models.user import User, UserRoleEnum, UserStatusEnum
    from app.core.database import async_session_maker
    
    # UUID y email únicos para admin
    admin_uuid = uuid4()
    admin_email = f"admin_{admin_uuid.hex[:8]}@example.com"
    
    # Crear usuario ADMIN en BD sincrónicamente
    async def create_admin():
        async with async_session_maker() as session:
            admin = User(
                user_id=admin_uuid,
                email=admin_email,
                full_name="Admin User",
                role=UserRoleEnum.ADMIN,
                status=UserStatusEnum.ACTIVE
            )
            session.add(admin)
            await session.commit()
    
    # Ejecutar creación
    asyncio.get_event_loop().run_until_complete(create_admin())
    
    # Mock del payload de Cognito
    admin_payload = {
        **mock_cognito_token_payload,
        "sub": str(admin_uuid),
        "email": admin_email,
        "given_name": "Admin",
        "family_name": "User"
    }
    
    with patch("app.api.deps.verify_cognito_token") as mock:
        mock.return_value = admin_payload
        yield {"Authorization": "Bearer mock_admin_token"}


# ==================== API CLIENT FIXTURES ====================

@pytest_asyncio.fixture(scope="function")
async def client(cleanup_database):
    """
    Autor: Oscar Alonso Nava Rivera

    AsyncClient fixture para tests de API.

    Depende de cleanup_database para asegurar que cada test
    empieza con una base de datos limpia.
    """
    from httpx import AsyncClient, ASGITransport
    from app.main import app
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
