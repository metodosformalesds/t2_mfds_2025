"""
Waste-To-Treasure API - Aplicación principal FastAPI.

Este módulo inicializa la aplicación FastAPI, configura middleware,
maneja eventos del ciclo de vida y registra los routers principales.
"""

# Autor: Oscar Alonso Nava Rivera
# Fecha: 02/11/2025
# Descripción: Entrypoint principal del backend; registra routers, middlewares y manejadores de excepciones.
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1.router import router as api_router_v1
from app.core.config import get_settings
from app.core.database import check_db_connection_async

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
    Autor: Oscar Alonso Nava Rivera

    Descripción: Maneja el ciclo de vida de la aplicación. Verifica la
    conexión a la base de datos en el arranque y registra eventos de
    apagado. Requiere `app` para poder acceder a la configuración.

    Parámetros:
        app (FastAPI): Instancia de la aplicación FastAPI.

    Retorna:
        None: Es una función de context manager; el `yield` separa startup/shutdown.
    """
    # --- Startup ---
    logger.info(f"La aplicación se ha iniciado correctamente. Documentación en: http://127.0.0.1:8000{app.docs_url}")
    if await check_db_connection_async():
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
    # CRÍTICO: Deshabilitar redirects para evitar exposición de IP interna
    # Los routers deben definir rutas sin trailing slash
    redirect_slashes=False,
)


# 3.1. Middleware para Proxy Headers (IMPORTANTE)
# ================================================
class ProxyHeadersMiddleware(BaseHTTPMiddleware):
    """
    Autor: Oscar Alonso Nava Rivera

    Descripción: Middleware que normaliza headers de proxy y reescribe
    cabeceras Location en redirects cuando el backend se sirve detrás
    de un API Gateway (X-Forwarded-*).

    Parámetros:
        request (Request): Solicitud HTTP entrante.
        call_next: Llamada a la siguiente función middleware/endpoint.

    Retorna:
        Response: Respuesta del downstream, posiblemente con Location reescrito.
    """
    async def dispatch(self, request: Request, call_next):
        # Leer el protocolo original (http/https)
        forwarded_proto = request.headers.get("x-forwarded-proto")
        if forwarded_proto:
            request.scope["scheme"] = forwarded_proto
        
        # Leer el host original (dominio del API Gateway)
        forwarded_host = request.headers.get("x-forwarded-host")
        if not forwarded_host:
            # HTTP API Gateway v2 usa 'host' header en lugar de 'x-forwarded-host'
            forwarded_host = request.headers.get("host")
            
        if forwarded_host:
            # Determinar puerto basado en protocolo
            port = 443 if forwarded_proto == "https" else 80
            request.scope["server"] = (forwarded_host, port)
            
        response = await call_next(request)
        
        # Reescribir Location header en redirects (307, 308, 301, 302)
        if response.status_code in (301, 302, 307, 308):
            location = response.headers.get("location")
            if location and forwarded_host:
                # Si el Location contiene la IP interna, reemplazarla por el host del Gateway
                if "98.95.79.84:8000" in location:
                    scheme = forwarded_proto or "https"
                    new_location = location.replace(
                        "http://98.95.79.84:8000",
                        f"{scheme}://{forwarded_host}"
                    )
                    response.headers["location"] = new_location
                    logger.info(f"✅ Redirect reescrito: {location} -> {new_location}")
                else:
                    logger.debug(f"Location no requiere reescritura: {location}")
            else:
                logger.warning(f"⚠️  No se pudo reescribir redirect. forwarded_host={forwarded_host}, location={location}")
        
        return response


# 4. Middlewares
# ================

# Middleware de Proxy Headers (debe ir primero)
app.add_middleware(ProxyHeadersMiddleware)
logger.info("Middleware de proxy headers configurado.")

# Middleware de TrustedHost
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[
        "pk5nk9n968.execute-api.us-east-1.amazonaws.com",  # API Gateway actual  
        "98.95.79.84",
        "localhost",
        "127.0.0.1",
        "*"  # En producción, especificar hosts exactos
    ]
)
logger.info("Middleware de TrustedHost configurado.")

# Middleware de CORS
# IMPORTANTE: Debe estar habilitado incluso con API Gateway
# API Gateway no puede manejar completamente CORS (especialmente OPTIONS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)
logger.info(f"CORS configurado para orígenes: {settings.BACKEND_CORS_ORIGINS}")

# Middleware de Compresión GZip
app.add_middleware(GZipMiddleware, minimum_size=1000)
logger.info("Middleware de compresión GZip habilitado.")

# Middleware para logging de peticiones
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Autor: Oscar Alonso Nava Rivera

    Descripción: Middleware de logging que mide tiempo de respuesta y
    añade cabecera X-Process-Time.

    Parámetros:
        request (Request): Solicitud entrante.
        call_next: Llamada al siguiente handler.

    Retorna:
        Response: Respuesta del handler con header X-Process-Time.
    """

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
    """
    Autor: Oscar Alonso Nava Rivera

    Descripción: Maneja excepciones HTTP generadas por Starlette y
    devuelve una JSONResponse con el detalle.

    Parámetros:
        request (Request): Solicitud entrante.
        exc (StarletteHTTPException): Excepción HTTP.

    Retorna:
        JSONResponse: Respuesta con status y detalle del error.
    """

    logger.warning(f"Error HTTP {exc.status_code}: {exc.detail} (Ruta: {request.url.path})")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Autor: Oscar Alonso Nava Rivera

    Descripción: Manejador que intercepta errores de validación de Pydantic
    y devuelve un JSON con detalles para facilitar debugging en el cliente.

    Parámetros:
        request (Request): Solicitud entrante.
        exc (RequestValidationError): Excepción de validación.

    Retorna:
        JSONResponse: Respuesta con status 422 y detalle de errores.
    """

    logger.warning(f"Error de validación en: {request.url.path} - {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Error de validación", "errors": exc.errors()},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Autor: Oscar Alonso Nava Rivera

    Descripción: Manejador por defecto para excepciones no previstas; registra
    el stacktrace y devuelve un mensaje genérico al cliente.

    Parámetros:
        request (Request): Solicitud entrante.
        exc (Exception): Excepción capturada.

    Retorna:
        JSONResponse: Respuesta con status 500 y mensaje genérico.
    """

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
    """
    Autor: Oscar Alonso Nava Rivera

    Descripción: Endpoint raíz que retorna estado simple de la API.

    Retorna:
        dict: Estado y mensaje de bienvenida con versión del proyecto.
    """
    return {
        "status": "ok",
        "message": f"Bienvenido a {settings.PROJECT_NAME} v{settings.PROJECT_VERSION}"
    }

@app.get("/health", tags=["Health Check"])
async def health_check():
    """
    Autor: Oscar Alonso Nava Rivera

    Descripción: Endpoint para comprobar salud del servicio.

    Retorna:
        dict: Estado 'healthy' si servicio está activo.
    """
    return {"status": "healthy"}
