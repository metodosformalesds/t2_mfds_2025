"""
Módulo de seguridad y autenticación con AWS Cognito.

Proporciona funciones para validar tokens JWT de Cognito,
verificación de roles y autorización de recursos.

Autor: Oscar Alonso Nava Rivera
Fecha: 31/10/2025
Descripción: Validación de tokens Cognito y utilidades de seguridad.
"""
import logging
from typing import Dict

import jwt
from jwt import PyJWKClient
from fastapi import HTTPException, status
from fastapi.security import HTTPBearer

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Esquema de seguridad HTTP Bearer
security = HTTPBearer()


def verify_cognito_token(token: str) -> Dict:
    """
    Verifica y decodifica un token JWT de AWS Cognito.
    
    Valida:
    - Firma del token usando JWKS públicas de Cognito
    - Expiración del token (claim 'exp')
    - Issuer correcto (cognito user pool)
    - Client ID correcto (cognito app client)
    - Token type (debe ser 'access' o 'id')
    
    Args:
        token: Token JWT de Cognito en formato string.
        
    Returns:
        Payload decodificado del token con claims como:
        - sub (UUID): ID del usuario en Cognito
        - email: Email del usuario
        - cognito:groups: Grupos del usuario
        - exp: Timestamp de expiración
        
    Autor: Oscar Alonso Nava Rivera
    Descripción: Verifica firma, expiración y claims del token JWT de Cognito.

    Raises:
        HTTPException 401: Si el token es inválido, expirado o tiene claims incorrectos.
        
    Example:
        ```python
        payload = verify_cognito_token(token)
        user_id = UUID(payload["sub"])
        email = payload["email"]
        ```
    """
    # Construir JWKS URL
    jwks_url = settings.cognito_jwks_url
    
    try:
        # Usar PyJWKClient para obtener y cachear las claves públicas
        jwks_client = PyJWKClient(jwks_url)
        
        # Obtener la clave de firma del token
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        # Validar issuer esperado
        expected_issuer = settings.cognito_issuer
        
        # Decodificar y validar el token
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=expected_issuer,
            audience=settings.COGNITO_APP_CLIENT_ID,
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_iss": True,
                "verify_aud": True,
            }
        )
        
        logger.info(f"Token Cognito validado para usuario: {payload.get('sub')}")
        return payload
        
    except jwt.ExpiredSignatureError:
        logger.warning("Token expirado")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        logger.warning(f"Token inválido: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o mal formado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Error inesperado validando token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Error validando token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ==========================================
# NOTA: Dependencias de autenticación movidas a deps.py
# ==========================================
# Las siguientes funciones ahora están en app/api/deps.py:
# - get_current_user_with_jit() → Autenticación principal con JIT user creation
# - get_current_active_user() → Verifica que el usuario esté activo
# - require_admin() → Requiere rol de administrador
# - verify_resource_owner() → Verifica propiedad de recursos
#
# Usa: from app.api.deps import get_current_user, require_admin, etc.
# ==========================================