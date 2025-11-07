"""
Servicio para interactuar con AWS Cognito User Pool.

Este servicio maneja:
- Obtener información de usuario desde Cognito
- Actualizar atributos de usuario
- Listar usuarios (para admins)
- Sincronizar datos entre Cognito y BD local

CONFIGURACIÓN REQUERIDA:
- AWS_ACCESS_KEY_ID en .env
- AWS_SECRET_ACCESS_KEY en .env
- COGNITO_USER_POOL_ID en .env
- COGNITO_REGION en .env

IMPORTANTE: Este código NO se ejecutará hasta que configures AWS Cognito.
"""

import logging
from typing import Dict, Optional, List
from uuid import UUID
import boto3
from botocore.exceptions import ClientError, BotoCoreError

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class CognitoService:
    """
    Servicio para interactuar con AWS Cognito User Pool.
    
    Example:
        ```python
        from app.services.aws_cognito_service import cognito_service
        
        # Obtener info de usuario
        user_info = await cognito_service.get_user_info(
            user_id=UUID("550e8400-e29b-41d4-a716-446655440000")
        )
        
        # Actualizar atributos
        updated = await cognito_service.update_user_attributes(
            user_id=UUID("550e8400..."),
            attributes={
                "given_name": "Juan",
                "family_name": "Pérez"
            }
        )
        ```
    """
    
    def __init__(self):
        """
        Inicializa el cliente Cognito.
        """
        settings = get_settings()
        self.cognito_client = boto3.client(
            'cognito-idp',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.COGNITO_REGION
        )
        self.user_pool_id = settings.COGNITO_USER_POOL_ID
        
        logger.info(
            f"CognitoService inicializado - User Pool: {self.user_pool_id}"
        )
    
    async def get_user_info(self, user_id: UUID) -> Optional[Dict]:
        """
        Obtiene información de usuario desde Cognito por su UUID (sub).
        
        Args:
            user_id: UUID del usuario (claim 'sub' de Cognito).
            
        Returns:
            Diccionario con información del usuario o None si no existe.
            
        Example:
            ```python
            user_info = await cognito_service.get_user_info(
                UUID("550e8400-e29b-41d4-a716-446655440000")
            )
            # {
            #     "sub": "550e8400-e29b-41d4-a716-446655440000",
            #     "email": "usuario@example.com",
            #     "email_verified": "true",
            #     "given_name": "Juan",
            #     "family_name": "Pérez"
            # }
            ```
        """
        try:
            response = self.cognito_client.admin_get_user(
                UserPoolId=self.user_pool_id,
                Username=str(user_id)  # Cognito usa 'sub' como username en algunos casos
            )
            
            # Convertir atributos a diccionario
            user_attributes = {}
            for attr in response['UserAttributes']:
                user_attributes[attr['Name']] = attr['Value']
            
            return {
                'username': response['Username'],
                'user_status': response['UserStatus'],
                'enabled': response['Enabled'],
                'created_date': response['UserCreateDate'],
                'modified_date': response['UserLastModifiedDate'],
                **user_attributes
            }
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'UserNotFoundException':
                logger.warning(f"Usuario no encontrado en Cognito: {user_id}")
                return None
            else:
                logger.error(f"Error obteniendo usuario de Cognito: {e}")
                return None
        except Exception as e:
            logger.error(f"Error inesperado obteniendo usuario: {e}")
            return None
    
    async def update_user_attributes(
        self,
        user_id: UUID,
        attributes: Dict[str, str]
    ) -> bool:
        """
        Actualiza atributos de usuario en Cognito.
        
        Args:
            user_id: UUID del usuario.
            attributes: Diccionario con atributos a actualizar.
                Atributos permitidos:
                - given_name: Nombre
                - family_name: Apellido
                - phone_number: Teléfono (formato E.164: +521234567890)
                - custom:role: Rol personalizado
                
        Returns:
            True si se actualizó exitosamente.
            
        Example:
            ```python
            updated = await cognito_service.update_user_attributes(
                user_id=UUID("550e8400..."),
                attributes={
                    "given_name": "Juan Carlos",
                    "family_name": "Pérez López",
                    "phone_number": "+5215512345678"
                }
            )
            ```
        """
        try:
            # Convertir diccionario a formato de Cognito
            user_attributes = [
                {'Name': key, 'Value': value}
                for key, value in attributes.items()
            ]
            
            self.cognito_client.admin_update_user_attributes(
                UserPoolId=self.user_pool_id,
                Username=str(user_id),
                UserAttributes=user_attributes
            )
            
            logger.info(f"Atributos actualizados en Cognito para usuario {user_id}")
            return True
            
        except (ClientError, BotoCoreError) as e:
            logger.error(f"Error actualizando atributos en Cognito: {e}")
            return False
        except Exception as e:
            logger.error(f"Error inesperado actualizando atributos: {e}")
            return False
    
    async def list_users(
        self,
        limit: int = 60,
        pagination_token: Optional[str] = None
    ) -> Dict:
        """
        Lista usuarios del User Pool (solo para admins).
        
        Args:
            limit: Número máximo de usuarios a retornar (1-60).
            pagination_token: Token de paginación para resultados siguientes.
            
        Returns:
            Diccionario con lista de usuarios y token de paginación.
            
        Example:
            ```python
            result = await cognito_service.list_users(limit=20)
            # {
            #     "users": [...],
            #     "pagination_token": "abc123..."
            # }
            ```
        """
        try:
            params = {
                'UserPoolId': self.user_pool_id,
                'Limit': min(limit, 60)
            }
            
            if pagination_token:
                params['PaginationToken'] = pagination_token
            
            response = self.cognito_client.list_users(**params)
            
            users = []
            for user in response.get('Users', []):
                user_attributes = {}
                for attr in user.get('Attributes', []):
                    user_attributes[attr['Name']] = attr['Value']
                
                users.append({
                    'username': user['Username'],
                    'user_status': user['UserStatus'],
                    'enabled': user['Enabled'],
                    'created_date': user['UserCreateDate'],
                    **user_attributes
                })
            
            return {
                'users': users,
                'pagination_token': response.get('PaginationToken')
            }
            
        except (ClientError, BotoCoreError) as e:
            logger.error(f"Error listando usuarios de Cognito: {e}")
            return {'users': [], 'pagination_token': None}
        except Exception as e:
            logger.error(f"Error inesperado listando usuarios: {e}")
            return {'users': [], 'pagination_token': None}
    
    async def disable_user(self, user_id: UUID) -> bool:
        """
        Deshabilita (bloquea) un usuario en Cognito.
        
        Args:
            user_id: UUID del usuario a deshabilitar.
            
        Returns:
            True si se deshabilitó exitosamente.
        """
        try:
            self.cognito_client.admin_disable_user(
                UserPoolId=self.user_pool_id,
                Username=str(user_id)
            )
            logger.info(f"Usuario deshabilitado en Cognito: {user_id}")
            return True
        except (ClientError, BotoCoreError) as e:
            logger.error(f"Error deshabilitando usuario: {e}")
            return False
        except Exception as e:
            logger.error(f"Error inesperado deshabilitando usuario: {e}")
            return False
    
    async def enable_user(self, user_id: UUID) -> bool:
        """
        Habilita un usuario previamente deshabilitado en Cognito.
        
        Args:
            user_id: UUID del usuario a habilitar.
            
        Returns:
            True si se habilitó exitosamente.
        """
        try:
            self.cognito_client.admin_enable_user(
                UserPoolId=self.user_pool_id,
                Username=str(user_id)
            )
            logger.info(f"Usuario habilitado en Cognito: {user_id}")
            return True
        except (ClientError, BotoCoreError) as e:
            logger.error(f"Error habilitando usuario: {e}")
            return False
        except Exception as e:
            logger.error(f"Error inesperado habilitando usuario: {e}")
            return False


# Singleton del servicio
cognito_service = CognitoService()
