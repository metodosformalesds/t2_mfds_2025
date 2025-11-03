import logging
from functools import lru_cache
from typing import List
from pydantic import field_validator, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


# configuracion del logger
logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    """
    Configuracion de la aplicacion

    Lee las varibles de entorno y las valida (Pydantic V2)
    """

    #INFORMACION GENERAL DE LA API
    PROJECT_NAME: str = "Waste to Treasure API"
    PROJECT_VERSION: str = "1.0.0"
    DESCRIPTION: str = "API para marketplace de Economia Circular"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    #CONFIGURACION BASE DE DATOS (AWS RDS POSTGRESQL)
    DATABASE_URL: PostgresDsn
    DB_ECHO: bool = False #SQLAlchemy logging para debugging
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Valida que la URL de la base de datos sea correcta"""
        if not v:
            raise ValueError("DATABASE_URL puede estar vacia")
        if not v.startswith("postgresql"):
            raise ValueError("DATABASE_URL debe comenzar con 'postgresql'")
        logger.debug("DATABASE_URL validada correctamente")
        return v
    
    #AWS CONFIGURACION GENERAL
    AWS_REGION: str = "us-east-2" #Ejemplo, cambia a tu region
    
    #AMAZON S3 CONFIGURACION
    S3_BUCKET_NAME: str = ""
    S3_IMAGES_PREFIX: str = "images/"
    S3_MAX_FILE_SIZE: int = 5 * 1024 * 1024  # 5MB en bytes
    S3_ALLOWED_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".gif", ".webp"]

    #AMAZON COGNITO (Autenticacion)
    COGNITO_USER_POOL_ID: str = ""
    COGNITO_APP_CLIENT_ID: str = ""
    COGNITO_REGION: str = "us-east-2"

    #AMAZON SES (Envio de Emails)
    SES_FROM_EMAIL: str = "no-reply@your-verified-domain.com" # Debe ser una identidad verificada en SES
    SES_REGION: str = "us-east-2"

    #JWT (AUNTENTICACION LOCAL DE fallback)
    JWT_SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """Valida que la SECRET_KEY sea segura."""
        if len(v) < 32:
            logger.error("SECRET_KEY debe tener al menos 32 caracteres")
            raise ValueError("SECRET_KEY insegura: debe tener al menos 32 caracteres")
        if v == "change_this_secret_key":
            logger.warning("Usando SECRET_KEY por defecto. CAMBIAR EN PRODUCCIÓN")
        return v
    
    #PASARELAS DE PAGO
    # Stripe
    STRIPE_SECRET_KEY: str
    STRIPE_PUBLISHABLE_KEY: str
    STRIPE_WEBHOOK_SECRET: str
    STRIPE_API_VERSION: str = "2024-11-20.acacia"
    
    # PayPal
    PAYPAL_CLIENT_ID: str
    PAYPAL_CLIENT_SECRET: str
    PAYPAL_MODE: str = "sandbox"  # "sandbox" o "live"
    
    @field_validator("PAYPAL_MODE")
    @classmethod
    def validate_paypal_mode(cls, v: str) -> str:
        """Valida que el modo de PayPal sea válido."""
        if v not in ["sandbox", "live"]:
            raise ValueError("PAYPAL_MODE debe ser 'sandbox' o 'live'")
        if v == "live":
            logger.warning("PayPal en modo PRODUCCIÓN (live)")
        return v
    
    #LOGICA DE NEGOCIO
    COMMISSION_RATE: float = 0.10  # 10% de comisión por transacción
    MIN_PRICE: float = 0.01
    MAX_PRICE: float = 1000000.00
    FREE_PLAN_MAX_LISTINGS: int = 5
    
    @field_validator("COMMISSION_RATE")
    @classmethod
    def validate_commission_rate(cls, v: float) -> float:
        """Valida que la tasa de comisión esté en rango válido."""
        if not 0 <= v <= 1:
            raise ValueError("COMMISSION_RATE debe estar entre 0 y 1")
        return v
    
    #CORS (seguridad y origenes permitidos)
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # React (desarrollo)
        "http://localhost:5173",  # Vite (desarrollo)
        "http://localhost:5174",  # Vite alternativo
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v) -> List[str]:
        """Parsea CORS origins desde string o lista."""
        if isinstance(v, str):
            # Permite formato: "http://localhost:3000,http://localhost:5173"
            return [origin.strip() for origin in v.split(",")]
        return v
    
    #RATE LIMITING Y SEGURIDAD
    RATE_LIMIT_PER_MINUTE: int = 60
    MAX_LOGIN_ATTEMPTS: int = 5
    LOGIN_ATTEMPT_WINDOW_MINUTES: int = 15

    #LOGGING
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    @field_validator("LOG_LEVEL")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """Valida que el nivel de log sea válido."""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        v = v.upper()
        if v not in valid_levels:
            raise ValueError(f"LOG_LEVEL debe ser uno de: {valid_levels}")
        return v
    
    def setup_logging(self) -> None:
        """Configura el sistema de logging de la aplicacion."""
        logging.basicConfig(
            level=self.LOG_LEVEL,
            format=self.LOG_FORMAT,
            handlers=[
                logging.StreamHandler(),  # Consola
            ]
        )
        logger.info(f"{self.PROJECT_NAME} v{self.PROJECT_VERSION} iniciando...")
        logger.info(f"Nivel de log: {self.LOG_LEVEL}")
        logger.info(f"Modo Debug: {'ACTIVADO' if self.DEBUG else 'DESACTIVADO'}")

    # CONFIGURACION DE Pydantic V2
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore", # ingnora varibles extras en el .env
        validate_default=True,
    )

# Instancia única de configuración (Singleton) a través de una función con caché
# Esto previene la creación de la instancia al importar el módulo
@lru_cache
def get_settings() -> Settings:
    """
    Retorna la instancia de configuración.
    Utiliza lru_cache para asegurar que solo se cree una instancia (singleton).
    """
    logger.info("Cargando configuración de la aplicación...")
    return Settings()
    