"""
Módulo de servicios AWS.

Expone todos los servicios de integración con AWS:
- S3: Almacenamiento de imágenes
- SES: Envío de emails transaccionales
- Cognito: Gestión de usuarios

NOTA IMPORTANTE:
================
Estos servicios están en MODO MOCK y NO ejecutarán código real de AWS
hasta que configures las credenciales.

PASOS PARA ACTIVAR:
1. Instalar boto3:
   ```bash
   pip install boto3==1.34.0 botocore==1.34.0
   pip freeze > requirements.txt
   ```

2. Configurar variables de entorno en .env:
   ```bash
   # AWS General
   AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
   AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   AWS_REGION=us-east-2

   # S3
   S3_BUCKET_NAME=waste-to-treasure-images
   S3_IMAGES_PREFIX=images/

   # SES
   SES_FROM_EMAIL=no-reply@waste-to-treasure.com
   SES_REGION=us-east-2

   # Cognito
   COGNITO_USER_POOL_ID=us-east-2_XXXXXXXXX
   COGNITO_APP_CLIENT_ID=1234567890abcdefghij
   COGNITO_REGION=us-east-2
   ```

3. Descomentar las líneas de boto3 en cada servicio:
   - app/services/aws_s3_service.py
   - app/services/aws_ses_service.py
   - app/services/aws_cognito_service.py

4. Verificar que SES esté configurado:
   - Email SES_FROM_EMAIL debe estar verificado en AWS SES
   - Salir del sandbox de SES si vas a enviar a emails no verificados

5. Verificar que S3 bucket exista:
   - El bucket S3_BUCKET_NAME debe estar creado en AWS
   - Configurar permisos de CORS si subirás desde frontend

6. Probar los servicios:
   ```python
   from app.services import s3_service, ses_service, cognito_service
   
   # Test S3
   url = await s3_service.upload_listing_image(file, listing_id=1)
   
   # Test SES
   sent = await ses_service.send_welcome_email("test@example.com", "Juan")
   
   # Test Cognito
   user_info = await cognito_service.get_user_info(user_uuid)
   ```

Autor: Oscar Alonso Nava Rivera
Fecha: 31/10/2025
Descripción: Agrupa y exporta servicios integrados (S3, SES, Cognito).
"""

from app.services.aws_s3_service import s3_service
from app.services.aws_ses_service import ses_service
from app.services.aws_cognito_service import cognito_service

__all__ = [
    "s3_service",
    "ses_service",
    "cognito_service",
]
