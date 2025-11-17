"""
Servicio para gestionar uploads de imágenes en Amazon S3.

Este servicio maneja:
- Upload de imágenes de listings
- Generación de URLs presignadas para acceso temporal
- Eliminación de imágenes
- Validación de tipos de archivo y tamaños

CONFIGURACIÓN REQUERIDA:
- AWS_ACCESS_KEY_ID en .env
- AWS_SECRET_ACCESS_KEY en .env  
- S3_BUCKET_NAME en .env
- AWS_REGION en .env

IMPORTANTE: Este código NO se ejecutará hasta que configures las credenciales AWS.
"""
# Autor: Oscar Alonso Nava Rivera
# Fecha: 06/11/2025
# Descripción: Servicio S3 para manejo de imágenes (listings y perfiles).

import logging
import uuid
from typing import Optional
from io import BytesIO

import boto3
from botocore.exceptions import ClientError, BotoCoreError
from fastapi import UploadFile, HTTPException, status

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class S3Service:
    """
    Autor: Oscar Alonso Nava Rivera

    Descripción: Servicio para gestionar uploads y accesos a archivos en Amazon S3.

    Servicio para gestionar archivos en Amazon S3.
    
    Example:
        ```python
        from app.services.aws_s3_service import s3_service
        
        # Upload de imagen
        file_url = await s3_service.upload_listing_image(
            file=uploaded_file,
            listing_id=123
        )
        
        # Generar URL presignada (válida 1 hora)
        temp_url = s3_service.generate_presigned_url(
            file_key="images/listings/123/image.jpg",
            expiration=3600
        )
        
        # Eliminar imagen
        await s3_service.delete_image("images/listings/123/image.jpg")
        ```
    """
    
    def __init__(self):
        """
        Inicializa el cliente S3.
        """
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        self.bucket_name = settings.S3_BUCKET_NAME
        self.images_prefix = settings.S3_IMAGES_PREFIX
        
        # Tipos MIME permitidos
        self.allowed_types = {
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
        }
        
        # Tamaño máximo: 5MB
        self.max_file_size = 5 * 1024 * 1024
        
        logger.info(f"S3Service inicializado - Bucket: {self.bucket_name}")
    
    async def upload_listing_image(
        self,
        file: UploadFile,
        listing_id: int,
        is_primary: bool = False
    ) -> str:
        """
        Autor: Oscar Alonso Nava Rivera
        Sube una imagen de listing a S3.
        
        Args:
            file: Archivo subido por el usuario.
            listing_id: ID del listing al que pertenece la imagen.
            is_primary: Si es la imagen principal del listing.
            
        Returns:
            URL pública de la imagen en S3.
            
        Raises:
            HTTPException 400: Si el archivo es inválido.
            HTTPException 500: Si falla el upload.
            
        Example:
            ```python
            file_url = await s3_service.upload_listing_image(
                file=request_file,
                listing_id=456,
                is_primary=True
            )
            # file_url = "https://s3.amazonaws.com/bucket/images/listings/456/uuid.jpg"
            ```
        """
        # Validar tipo de archivo
        if file.content_type not in self.allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo de archivo no permitido. Usa: {', '.join(self.allowed_types)}"
            )
        
        # Leer contenido del archivo
        contents = await file.read()
        file_size = len(contents)
        
        # Validar tamaño
        if file_size > self.max_file_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Archivo demasiado grande. Máximo: {self.max_file_size / (1024*1024)}MB"
            )
        
        # Generar nombre único para el archivo
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        
        # Construir la key en S3
        prefix = "primary_" if is_primary else ""
        s3_key = f"{self.images_prefix}listings/{listing_id}/{prefix}{unique_filename}"
        
        try:
            # Upload a S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=BytesIO(contents),
                ContentType=file.content_type,
                CacheControl='max-age=31536000',  # 1 año
                Metadata={
                    'listing_id': str(listing_id),
                    'is_primary': str(is_primary)
                }
            )
            
            # Construir URL pública
            file_url = f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
            
            logger.info(f"Imagen subida exitosamente: {s3_key}")
            return file_url
            
        except (ClientError, BotoCoreError) as e:
            logger.error(f"Error subiendo imagen a S3: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error subiendo imagen: {str(e)}"
            )
    
    async def upload_profile_image(
        self,
        file: UploadFile,
        user_id: str
    ) -> str:
        """
        Autor: Oscar Alonso Nava Rivera
    
        Sube una imagen de perfil de usuario a S3.
        
        Args:
            file: Archivo subido por el usuario.
            user_id: ID del usuario (UUID).
            
        Returns:
            URL pública de la imagen en S3.
            
        Raises:
            HTTPException 400: Si el archivo es inválido.
            HTTPException 500: Si falla el upload.
            
        Example:
            ```python
            file_url = await s3_service.upload_profile_image(
                file=request_file,
                user_id="1498f438-5001-7000-d32f-c970608926ea"
            )
            # file_url = "https://s3.amazonaws.com/bucket/images/profiles/user_id/uuid.jpg"
            ```
        """
        # Validar tipo de archivo
        if file.content_type not in self.allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo de archivo no permitido. Usa: {', '.join(self.allowed_types)}"
            )
        
        # Leer contenido del archivo
        contents = await file.read()
        file_size = len(contents)
        
        # Validar tamaño
        if file_size > self.max_file_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Archivo demasiado grande. Máximo: {self.max_file_size / (1024*1024)}MB"
            )
        
        # Generar nombre único para el archivo
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        
        # Construir la key en S3 - usar prefijo "profiles" para imágenes de perfil
        s3_key = f"{self.images_prefix}profiles/{user_id}/{unique_filename}"
        
        try:
            # Upload a S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=BytesIO(contents),
                ContentType=file.content_type,
                CacheControl='max-age=31536000',  # 1 año
                Metadata={
                    'user_id': str(user_id),
                    'type': 'profile_image'
                }
            )
            
            # Construir URL pública
            file_url = f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
            
            logger.info(f"Imagen de perfil subida exitosamente: {s3_key}")
            return file_url
            
        except (ClientError, BotoCoreError) as e:
            logger.error(f"Error subiendo imagen de perfil a S3: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error subiendo imagen: {str(e)}"
            )
    
    async def delete_image(self, s3_key: str) -> bool:
        """
        Autor: Oscar Alonso Nava Rivera
        Elimina una imagen de S3.
        
        Args:
            s3_key: Clave del archivo en S3 (ej: "images/listings/123/image.jpg")
            
        Returns:
            True si se eliminó exitosamente.
            
        Example:
            ```python
            deleted = await s3_service.delete_image(
                "images/listings/123/abc-123.jpg"
            )
            ```
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            logger.info(f"Imagen eliminada: {s3_key}")
            return True
        except (ClientError, BotoCoreError) as e:
            logger.error(f"Error eliminando imagen de S3: {e}")
            return False
    
    def generate_presigned_url(
        self,
        s3_key: str,
        expiration: int = 3600
    ) -> str:
        """
        Autor: Oscar Alonso Nava Rivera
        Genera una URL presignada para acceso temporal a un archivo.
        
        Args:
            s3_key: Clave del archivo en S3.
            expiration: Tiempo de validez en segundos (default: 1 hora).
            
        Returns:
            URL presignada válida por el tiempo especificado.
            
        Example:
            ```python
            # URL válida por 2 horas
            temp_url = s3_service.generate_presigned_url(
                s3_key="images/listings/123/private.jpg",
                expiration=7200
            )
            ```
        """
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': s3_key
                },
                ExpiresIn=expiration
            )
            return url
        except (ClientError, BotoCoreError) as e:
            logger.error(f"Error generando URL presignada: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error generando URL de acceso: {str(e)}"
            )


# Singleton del servicio
s3_service = S3Service()
