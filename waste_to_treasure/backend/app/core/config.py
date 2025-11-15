"""
Configuración centralizada de la aplicación Waste-To-Treasure.
Utiliza Pydantic V2 Settings para gestionar variables de entorno.
"""
import logging
from functools import lru_cache
from typing import List
from pydantic import field_validator, PostgresDsn, Field
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
    
    @property
    def cognito_issuer(self) -> str:
        """Retorna el issuer URL del User Pool de Cognito."""
        return f"https://cognito-idp.{self.COGNITO_REGION}.amazonaws.com/{self.COGNITO_USER_POOL_ID}"
    
    @property
    def cognito_jwks_url(self) -> str:
        """Retorna la URL de JWKS para validar tokens JWT."""
        return f"{self.cognito_issuer}/.well-known/jwks.json"
    
    # ==================================
    # JWT (Fallback - NO SE USA, usamos Cognito)
    # ==================================
    # JWT_SECRET_KEY: str = "not-used-we-use-cognito-jwt-validation"
    # ALGORITHM: str = "RS256"
    # ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
        
    # ==================================
    # PASARELAS DE PAGO
    # ==================================
    STRIPE_SECRET_KEY: str = Field(
        ...,
        description="Clave secreta de Stripe (sk_test_... o sk_live_...)"
    )
    STRIPE_PUBLISHABLE_KEY: str = Field(
        ...,
        description="Clave pública de Stripe (pk_test_... o pk_live_...)"
    )
    STRIPE_WEBHOOK_SECRET: str = Field(
        default="",
        description="Secret para verificar webhooks de Stripe (whsec_...)"
    )
    STRIPE_API_VERSION: str = Field(
        default="2025-10-29",
        description="Versión de la API de Stripe a utilizar"
    )
    PAYPAL_CLIENT_ID: str = ""
    PAYPAL_CLIENT_SECRET: str = ""
    PAYPAL_MODE: str = "sandbox"
    
    @field_validator("STRIPE_SECRET_KEY")
    @classmethod
    def validate_stripe_secret_key(cls, v: str) -> str:
        if not v.startswith(("sk_test_", "sk_live_")):
            raise ValueError(
                "STRIPE_SECRET_KEY debe comenzar con 'sk_test_' o 'sk_live_'"
            )
        return v
    
    @field_validator("STRIPE_PUBLISHABLE_KEY")
    @classmethod
    def validate_stripe_publishable_key(cls, v: str) -> str:
        if not v.startswith(("pk_test_", "pk_live_")):
            raise ValueError(
                "STRIPE_PUBLISHABLE_KEY debe comenzar con 'pk_test_' o 'pk_live_'"
            )
        return v
    
    # ==================================
    # LÓGICA DE NEGOCIO
    # ==================================
    COMMISSION_RATE: float = 0.10
    
    # ==================================
    # CORS
    # ==================================
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v) -> List[str]:
        """Convierte string separado por comas o JSON en lista de URLs."""
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            # Si viene como JSON array string: '["url1","url2"]'
            if v.startswith("["):
                import json
                return json.loads(v)
            # Si viene como CSV: 'url1,url2'
            return [origin.strip() for origin in v.split(",")]
        return v
        
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
    