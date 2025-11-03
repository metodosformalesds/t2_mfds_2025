"""
Waste-To-Treasure API - Aplicación principal FastAPI.

Este módulo inicializa la aplicación FastAPI, configura middleware,
maneja eventos del ciclo de vida y registra los routers principales.
"""
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.router import router as api_router_v1
from app.core.config import get_settings
from app.core.database import check_db_connection

# 1. Cargar configuración e inicializar logging
# ==============================================
settings = get_settings()
settings.setup_logging()
logger = logging.getLogger(__name__)


# 2. Lifespan (Eventos de inicio y apagado)
# ==========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Maneja el ciclo de vida de la aplicación.
    Verifica la DB al iniciar y puede limpiar recursos al apagar.
    """
    # --- Startup ---
    logger.info(f"La aplicación se ha iniciado correctamente. Documentación en: http://127.0.0.1:8000{app.docs_url}")
    if check_db_connection():
        logger.info("La conexión a la base de datos se ha verificado correctamente.")
    else:
        logger.error("Error al conectar con la base de datos al inicio.")
    
    yield
    
    # --- Shutdown ---
    logger.info(f"Apagando {settings.PROJECT_NAME}")


# 3. Instancia de la aplicación FastAPI
# ======================================
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description=settings.DESCRIPTION,
    debug=settings.DEBUG,
    lifespan=lifespan,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)


# 4. Middlewares
# ================

# Middleware de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info(f"CORS configurado para orígenes: {settings.BACKEND_CORS_ORIGINS}")

# Middleware de Compresión GZip
app.add_middleware(GZipMiddleware, minimum_size=1000)
logger.info("Middleware de compresión GZip habilitado.")

# Middleware para logging de peticiones
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    logger.info(
        f"{request.client.host} - \"{request.method} {request.url.path}\" "
        f"{response.status_code} - {process_time:.3f}s"
    )
    return response


# 5. Manejadores de Excepciones
# ===============================

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.warning(f"Error HTTP {exc.status_code}: {exc.detail} (Ruta: {request.url.path})")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Error de validación en: {request.url.path} - {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Error de validación", "errors": exc.errors()},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Excepción no manejada: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Ocurrió un error interno en el servidor."},
    )


# 6. Routers de la API
# ======================
app.include_router(api_router_v1, prefix=settings.API_V1_STR)
logger.info(f"Rutas de la API v1 registradas en el prefijo: {settings.API_V1_STR}")


# 7. Endpoints Raíz / Health Check
# ==================================

@app.get("/", tags=["Health Check"])
async def read_root():
    """Endpoint raíz para verificar que la API está funcionando."""
    return {
        "status": "ok",
        "message": f"Bienvenido a {settings.PROJECT_NAME} v{settings.PROJECT_VERSION}"
    }

@app.get("/health", tags=["Health Check"])
async def health_check():
    """Endpoint de health check detallado."""
    return {"status": "healthy"}
