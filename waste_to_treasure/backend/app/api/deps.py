"""
Módulo para gestionar las dependencias de la API de FastAPI.

Este es el lugar central para definir las dependencias que se utilizarán
en los endpoints de la aplicación, como la obtención de la configuración,
la sesión de la base de datos, o la validación del usuario actual.
"""

from app.core.config import get_settings, Settings
from app.core.database import get_async_session as get_async_db

# Para mantener la consistencia, aunque `get_settings` ya es el singleton,
# lo exponemos a través de `deps.py`. Cualquier endpoint puede ahora usar
# `Depends(get_settings)` para acceder a la configuración de la aplicación.
# Ejemplo:
#
# from fastapi import APIRouter, Depends
# from app.core.config import Settings
# from app.api.deps import get_settings
#
# router = APIRouter()
#
# @router.get("/info")
# def get_app_info(settings: Settings = Depends(get_settings)):
#     return {
#         "project_name": settings.PROJECT_NAME,
#         "project_version": settings.PROJECT_VERSION,
#     }

# La dependencia get_async_db es un alias de get_async_session para mantener
# la consistencia con la guía de migración y la semántica de la capa de API.
__all__ = ["get_async_db", "get_settings"]
