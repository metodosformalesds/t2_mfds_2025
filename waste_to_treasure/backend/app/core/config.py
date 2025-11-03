"""
Configuración centralizada de la aplicación Waste-To-Treasure.
Utiliza Pydantic V2 Settings para gestionar variables de entorno.
"""
import logging
from functools import lru_cache
from typing import List
from pydantic import field_validator, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict

# Configurar logger para este módulo
logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    """
    Configuración de la aplicación que lee variables de entorno y las valida.
    """
    
    # ==================================
    # INFORMACIÓN GENERAL DE LA API
    # ==================================
    PROJECT_NAME: str = "Waste to Treasure API"
    PROJECT_VERSION: str = "1.0.0"
    DESCRIPTION: str = "API para marketplace de Economía Circular"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False
    
    # ==================================
    # BASE DE DATOS (AWS RDS PostgreSQL / Supabase)
    # ==================================
    DATABASE_URL: PostgresDsn
    DB_ECHO: bool = False
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    
    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v:
            raise ValueError("DATABASE_URL no puede estar vacía")
        if not v.startswith("postgresql"):
            raise ValueError("DATABASE_URL debe comenzar con 'postgresql' o 'postgresql+psycopg2'")
        logger.debug("DATABASE_URL validada correctamente")
        return v
    
    # ==================================
    # AWS CONFIGURACIÓN
    # ==================================
    AWS_REGION: str = "us-east-2"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    
    # ==================================
    # AMAZON S3 (Almacenamiento)
    # ==================================
    S3_BUCKET_NAME: str = ""
    S3_IMAGES_PREFIX: str = "images/"
    
    # ==================================
    # AMAZON COGNITO (Autenticación)
    # ==================================
    COGNITO_USER_POOL_ID: str = ""
    COGNITO_APP_CLIENT_ID: str = ""
    COGNITO_REGION: str = "us-east-2"
    
    # ==================================
    # JWT (Fallback)
    # ==================================
    JWT_SECRET_KEY: str = "change_this_secret_key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("JWT_SECRET_KEY debe tener al menos 32 caracteres")
        return v
        
    # ==================================
    # PASARELAS DE PAGO
    # ==================================
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    PAYPAL_CLIENT_ID: str = ""
    PAYPAL_CLIENT_SECRET: str = ""
    PAYPAL_MODE: str = "sandbox"
    
    # ==================================
    # LÓGICA DE NEGOCIO
    # ==================================
    COMMISSION_RATE: float = 0.10
    
    # ==================================
    # CORS
    # ==================================
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    

        
    # ==================================
    # LOGGING
    # ==================================
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    def setup_logging(self) -> None:
        """Configura el sistema de logging de la aplicación."""
        logging.basicConfig(
            level=self.LOG_LEVEL,
            format=self.LOG_FORMAT,
            handlers=[logging.StreamHandler()]
        )
        logger.info(f"Logging configurado con nivel: {self.LOG_LEVEL}")

    # ==================================
    # CONFIGURACIÓN DE PYDANTIC
    # ==================================
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

@lru_cache
def get_settings() -> Settings:
    """
    Retorna la instancia de configuración (Singleton).
    Utiliza lru_cache para asegurar que solo se cree una instancia.
    """
    logger.info("Cargando configuración de la aplicación...")
    return Settings()
    