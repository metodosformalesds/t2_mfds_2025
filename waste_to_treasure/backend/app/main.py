import logging
from fastapi import FastAPI
from app.core.config import get_settings
from app.api.v1.router import router as api_router_v1

# Obtener la configuración de la aplicación
settings = get_settings()

# Configurar logging
# Es importante hacerlo antes de crear la instancia de FastAPI
# para asegurar que los logs de arranque se capturen.
settings.setup_logging()

# Crear la instancia de la aplicación FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description=settings.DESCRIPTION,
    debug=settings.DEBUG,
)

# Incluir el router de la API v1
app.include_router(api_router_v1, prefix=settings.API_V1_STR)

# Crear un logger para este módulo
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Log de inicio de la aplicación."""
    logger.info("La aplicación se ha iniciado correctamente.")
    logger.info(f"Visita la documentación de la API en: http://127.0.0.1:8000{app.docs_url}")

@app.get("/", tags=["Health Check"])
async def read_root():
    """Endpoint de health check para verificar que la API está funcionando."""
    return {"status": "ok", "message": f"Welcome to {settings.PROJECT_NAME}"}