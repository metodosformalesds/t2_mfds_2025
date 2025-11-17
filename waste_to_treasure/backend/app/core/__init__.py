"""
Paquete core: utilidades y configuración central de la aplicación.

Autor: Oscar Alonso Nava Rivera
Fecha: 31/10/2025
Descripción: Inicialización del paquete `app.core`.
"""

from .config import get_settings, Settings
from .database import get_db, get_async_session
from .security import verify_cognito_token, security

__all__ = [
    "get_settings",
    "Settings",
    "get_db",
    "get_async_session",
    "verify_cognito_token",
    "security",
]
