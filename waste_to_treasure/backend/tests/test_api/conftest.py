"""
Fixtures para tests de API.
"""

# Autor: Oscar Alonso Nava Rivera
# Fecha: 17/11/2025
# Descripción: Fixtures comunes para tests de endpoints

import pytest
from httpx import AsyncClient
from app.main import app


@pytest.fixture
async def async_client():
    """
    Cliente HTTP asíncrono para tests de API.
    """
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
