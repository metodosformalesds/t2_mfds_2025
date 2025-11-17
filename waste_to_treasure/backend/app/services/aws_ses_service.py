"""
Servicio para envío de emails transaccionales con Amazon SES.

Este servicio maneja:
- Emails de bienvenida
- Confirmaciones de orden
- Notificaciones de ofertas
- Alertas de moderación

CONFIGURACIÓN REQUERIDA:
- AWS_ACCESS_KEY_ID en .env
- AWS_SECRET_ACCESS_KEY en .env
- SES_FROM_EMAIL en .env (debe estar verificado en SES)
- SES_REGION en .env
- AWS_REGION en .env

IMPORTANTE: Este código NO se ejecutará hasta que configures AWS SES.
"""
# Autor: Oscar Alonso Nava Rivera
# Fecha: 06/11/2025
# Descripción: Servicio SES para envío de correos transaccionales.

import logging
from typing import List, Optional, Dict
from datetime import datetime

# NOTE: boto3 debe instalarse cuando estés listo para usar AWS
# pip install boto3==1.34.0 botocore==1.34.0

# import boto3
# from botocore.exceptions import ClientError, BotoCoreError

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class SESService:
    """
    Autor: Oscar Alonso Nava Rivera
    Descripción: Servicio para enviar emails transaccionales usando Amazon SES (modo mock por defecto).

    Servicio para envío de emails con Amazon SES.
    
    Example:
        ```python
        from app.services.aws_ses_service import ses_service
        
        # Email de bienvenida
        await ses_service.send_welcome_email(
            to_email="usuario@example.com",
            first_name="Juan"
        )
        
        # Confirmación de orden
        await ses_service.send_order_confirmation(
            to_email="comprador@example.com",
            order_id=12345,
            total_amount=1500.00
        )
        ```
    """
    
    def __init__(self):
        """
        Inicializa el cliente SES.
        
        NOTA: Descomenta cuando tengas configuradas las credenciales AWS.
        """
        # self.ses_client = boto3.client(
        #     'ses',
        #     aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        #     aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        #     region_name=settings.SES_REGION or settings.AWS_REGION
        # )
        self.from_email = "no-reply@waste-to-treasure.com"  # settings.SES_FROM_EMAIL
        
        logger.info(
            "SESService inicializado (modo mock - configura AWS para activar)"
        )
    
    async def send_welcome_email(
        self,
        to_email: str,
        first_name: str
    ) -> bool:
        """
        Autor: Oscar Alonso Nava Rivera
        Envía email de bienvenida a usuario nuevo.
        
        Args:
            to_email: Email del destinatario.
            first_name: Nombre del usuario.
            
        Returns:
            True si se envió exitosamente.
            
        Example:
            ```python
            sent = await ses_service.send_welcome_email(
                to_email="nuevo@example.com",
                first_name="María"
            )
            ```
        """
        subject = "¡Bienvenido a Waste to Treasure! 🌱"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2e7d32;">¡Hola {first_name}! 👋</h1>
                
                <p>Gracias por unirte a <strong>Waste to Treasure</strong>, 
                la plataforma de economía circular donde transformamos residuos en recursos.</p>
                
                <h2 style="color: #2e7d32;">¿Qué puedes hacer ahora?</h2>
                <ul>
                    <li>🛒 <strong>Compra</strong> materiales reciclados y productos sostenibles</li>
                    <li>📦 <strong>Vende</strong> tus materiales reciclables o excedentes</li>
                    <li>🤝 <strong>Conéctate</strong> con empresas comprometidas con el medio ambiente</li>
                </ul>
                
                <p style="margin-top: 30px;">
                    <a href="https://waste-to-treasure.com/dashboard" 
                       style="background-color: #2e7d32; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 4px; display: inline-block;">
                        Ir a mi cuenta
                    </a>
                </p>
                
                <p style="color: #666; font-size: 14px; margin-top: 40px;">
                    Si tienes preguntas, contáctanos en 
                    <a href="mailto:soporte@waste-to-treasure.com">soporte@waste-to-treasure.com</a>
                </p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px;">
                    © 2025 Waste to Treasure. Todos los derechos reservados.
                </p>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        ¡Hola {first_name}!
        
        Gracias por unirte a Waste to Treasure, la plataforma de economía circular.
        
        ¿Qué puedes hacer ahora?
        - Compra materiales reciclados y productos sostenibles
        - Vende tus materiales reciclables o excedentes
        - Conéctate con empresas comprometidas con el medio ambiente
        
        Visita tu cuenta en: https://waste-to-treasure.com/dashboard
        
        Si tienes preguntas, contáctanos en soporte@waste-to-treasure.com
        
        © 2025 Waste to Treasure
        """
        
        return await self._send_email(
            to_addresses=[to_email],
            subject=subject,
            html_body=html_body,
            text_body=text_body
        )
    
    async def send_order_confirmation(
        self,
        to_email: str,
        order_id: int,
        total_amount: float,
        order_items: List[Dict],
    ) -> bool:
        """
        Autor: Oscar Alonso Nava Rivera
        Envía confirmación de orden al comprador.
        
        Args:
            to_email: Email del comprador.
            order_id: ID de la orden.
            total_amount: Monto total de la orden.
            order_items: Lista de items de la orden.
            
        Returns:
            True si se envió exitosamente.
        """
        subject = f"Confirmación de Orden #{order_id} - Waste to Treasure"
        
        # Generar lista de items en HTML
        items_html = ""
        for item in order_items:
            items_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                    {item.get('listing_title', 'Producto')}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">
                    ${item.get('unit_price', 0):.2f} × {item.get('quantity', 1)}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">
                    ${item.get('subtotal', 0):.2f}
                </td>
            </tr>
            """
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2e7d32;">¡Orden Confirmada! ✅</h1>
                
                <p>Tu orden <strong>#{order_id}</strong> ha sido confirmada.</p>
                
                <h2>Resumen de tu Orden</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #f5f5f5;">
                            <th style="padding: 10px; text-align: left;">Producto</th>
                            <th style="padding: 10px; text-align: right;">Precio</th>
                            <th style="padding: 10px; text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                    <tfoot>
                        <tr style="font-weight: bold; font-size: 18px;">
                            <td colspan="2" style="padding: 15px; text-align: right;">TOTAL:</td>
                            <td style="padding: 15px; text-align: right; color: #2e7d32;">
                                ${total_amount:.2f}
                            </td>
                        </tr>
                    </tfoot>
                </table>
                
                <p style="margin-top: 30px;">
                    <a href="https://waste-to-treasure.com/orders/{order_id}" 
                       style="background-color: #2e7d32; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 4px; display: inline-block;">
                        Ver Detalles de la Orden
                    </a>
                </p>
            </div>
        </body>
        </html>
        """
        
        return await self._send_email(
            to_addresses=[to_email],
            subject=subject,
            html_body=html_body
        )
    
    async def send_notification_email(
        self,
        to_email: str,
        subject: str,
        message: str
    ) -> bool:
        """
        Envía una notificación genérica por email.
        
        Args:
            to_email: Email del destinatario.
            subject: Asunto del email.
            message: Mensaje del email.
            
        Returns:
            True si se envió exitosamente.
        """
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <p>{message}</p>
            </div>
        </body>
        </html>
        """
        
        return await self._send_email(
            to_addresses=[to_email],
            subject=subject,
            html_body=html_body,
            text_body=message
        )
    
    async def _send_email(
        self,
        to_addresses: List[str],
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> bool:
        """
        Autor: Oscar Alonso Nava Rivera
        Método interno para enviar emails con SES.
        
        Args:
            to_addresses: Lista de emails destinatarios.
            subject: Asunto del email.
            html_body: Cuerpo del email en HTML.
            text_body: Cuerpo del email en texto plano (fallback).
            
        Returns:
            True si se envió exitosamente.
        """
        # TODO: Descomenta cuando tengas AWS SES configurado
        # try:
        #     response = self.ses_client.send_email(
        #         Source=self.from_email,
        #         Destination={'ToAddresses': to_addresses},
        #         Message={
        #             'Subject': {'Data': subject, 'Charset': 'UTF-8'},
        #             'Body': {
        #                 'Html': {'Data': html_body, 'Charset': 'UTF-8'},
        #                 'Text': {'Data': text_body or subject, 'Charset': 'UTF-8'}
        #             }
        #         }
        #     )
        #     
        #     message_id = response['MessageId']
        #     logger.info(f"Email enviado: {message_id} → {to_addresses}")
        #     return True
        #     
        # except (ClientError, BotoCoreError) as e:
        #     logger.error(f"Error enviando email con SES: {e}")
        #     return False
        
        # MOCK
        logger.warning(
            f"SESService en modo MOCK - Email simulado enviado a {to_addresses}"
        )
        logger.info(f"Asunto: {subject}")
        return True


# Singleton del servicio
ses_service = SESService()
