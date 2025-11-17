"""
Capa de servicio para integración con Stripe.

Implementa:
- Gestión de customers
- Creación de Payment Intents
- Checkout Sessions
- Procesamiento de webhooks
- Reembolsos

Autor: Oscar Alonso Nava Rivera
Fecha: 08/11/2025
Descripción: Servicio para integración con Stripe (customers, payments, webhooks)

Documentación: https://docs.stripe.com/api?api-version=2025-10-29
"""
# Autor: Oscar Alonso Nava Rivera
# Fecha: 08/11/2025
# Descripción: Servicio para integración con Stripe (customers, payments, webhooks)
import logging
from typing import Optional, Dict, Any, List
from decimal import Decimal

import stripe
from stripe import StripeError

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class StripeService:
    """
    Servicio para interactuar con Stripe API v2025-10-29.

    Autor: Oscar Alonso Nava Rivera
    Descripción: Capa de servicio para integrar con Stripe (clientes, pagos, webhooks, reembolsos).

    Example:
        `
        from app.services.stripe_service import stripe_service
        
        # Crear customer
        customer = await stripe_service.create_customer(
            email="usuario@example.com",
            name="Juan Pérez"
        )
        
        # Procesar pago
        payment_intent = await stripe_service.create_payment_intent(
            amount=Decimal("1500.00"),
            currency="mxn",
            customer_id=customer.id
        )
    """
    def __init__(self):
        """Inicializa el cliente de Stripe con la clave secreta y versión de API."""
        stripe.api_key = settings.STRIPE_SECRET_KEY
        stripe.api_version = settings.STRIPE_API_VERSION

        self.webhook_secret = settings.STRIPE_WEBHOOK_SECRET

        logger.info(f"Stripe Inicializado - API Version: {stripe.api_version}")

    # GESTION DE USUARIOS (CUSTOMERS)
    async def create_customer(self, email: str, name: Optional[str] = None, 
    metadata: Optional[Dict[str, str]] = None) -> stripe.Customer:
        """
        Autor: Oscar Alonso Nava Rivera
        Crea un customer en Stripe.

        Args:
            email: Email del usuario.
            name: Nombre completo del usuario.
            metadata: Metadata adicional (ej: user_id de BD).

        Returns:
            Customer de Stripe creado.

        Raises:
            StripeError: Si falla la creación.
        """
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata=metadata or {}
            )

            logger.info(f"Customer creado en Stripe: {customer.id} ({email})")
            return customer
        
        except StripeError as e:
            logger.error(f"Error creando customer en Stripe: {e}")
            raise

    async def get_customer(self, customer_id: str) -> stripe.Customer:
        """
        Autor: Oscar Alonso Nava Rivera
        Obtiene un customer por su ID.

        Args:
            customer_id: ID del customer en Stripe (cus_xxx).

        Returns:
            Customer de Stripe.
        """
        try:
            return stripe.Customer.retrieve(customer_id)
        except StripeError as e:
            logger.error(f"Error obteniendo customer {customer_id} en Stripe: {e}")
            raise
    
    async def attach_payment_method(
        self,
        customer_id: str,
        payment_method_id: str,
        set_as_default: bool = False
    ) -> stripe.PaymentMethod:
        """
        Autor: Oscar Alonso Nava Rivera
        Asocia un método de pago a un customer.

        Args:
            customer_id: ID del customer.
            payment_method_id: ID del método de pago (pm_xxx).
            set_as_default: Si marcarlo como predeterminado.

        Returns:
            PaymentMethod de Stripe.
        """
        try:
            # Asociar método de pago al customer
            payment_method = stripe.PaymentMethod.attach(
                payment_method_id,
                customer=customer_id
            )
            
            # Si se marca como default actualizar customer
            if set_as_default:
                stripe.Customer.modify(
                    customer_id,
                    invoice_settings={
                        "default_payment_method": payment_method_id
                    }
                )
                logger.info(
                    f"Método {payment_method_id} marcado como default "
                    f"para customer {customer_id}"
                )
            
            return payment_method
            
        except StripeError as e:
            logger.error(f"Error asociando método de pago: {e}")
            raise

    async def list_payment_methods(
        self,
        customer_id: str,
        type: str = "card"
    ) -> List[stripe.PaymentMethod]:
        """
        Autor: Oscar Alonso Nava Rivera
        Lista métodos de pago de un customer.

        Args:
            customer_id: ID del customer.
            type: Tipo de método ("card", "oxxo", etc).

        Returns:
            Lista de PaymentMethod de Stripe.
        """
        try:
            payment_methods = stripe.PaymentMethod.list(
                customer=customer_id,
                type=type
            )
            return payment_methods.data
        except StripeError as e:
            logger.error(f"Error listando métodos de pago: {e}")
            raise

        
    # PAYMENT INTENTS (PAGO DIRECTO)
    async def create_payment_intent(
        self,
        amount: Decimal,
        currency: str = "mxn",
        customer_id: Optional[str] = None,
        payment_method_id: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
        description: Optional[str] = None,
        return_url: Optional[str] = None
    ) -> stripe.PaymentIntent:
        """
        Autor: Oscar Alonso Nava Rivera
        Crea un Payment Intent para procesar pago.

        Args:
            amount: Monto en la moneda especificada (ej: 1500.00 MXN).
            currency: Código de moneda ISO (mxn, usd, etc).
            customer_id: ID del customer en Stripe.
            payment_method_id: ID del método de pago a usar.
            metadata: Metadata adicional (order_id, etc).
            description: Descripción del pago.
            return_url: URL de retorno para métodos de pago que requieren redirección (3D Secure, etc).

        Returns:
            PaymentIntent de Stripe.

        Note:
            Stripe trabaja con centavos, así que 1500.00 MXN = 150000 centavos.
            Se configura automatic_payment_methods para permitir múltiples métodos de pago
            sin requerir redirección innecesaria (allow_redirects='never').
        """
        try:
            # convertir monto a centavos
            amount_cents = int(amount * 100)

            params = {
                "amount": amount_cents,
                "currency": currency.lower(),
                "metadata": metadata or {},
                "description": description,
                # Configurar métodos de pago automáticos
                # allow_redirects='never' significa que solo acepta métodos que NO requieren redirección
                "automatic_payment_methods": {
                    "enabled": True,
                    "allow_redirects": "never"
                }
            }

            if customer_id:
                params['customer'] = customer_id
                # Si se proporciona un método de pago con un customer,
                # indicamos a Stripe que queremos guardar esta tarjeta para uso futuro.
                if payment_method_id:
                    params['setup_future_usage'] = 'on_session'
            
            if payment_method_id:
                params['payment_method'] = payment_method_id
                params['confirm'] = True  # Confirmar inmediatamente
                
                # IMPORTANTE: return_url SOLO se puede pasar cuando confirm=True
                # Stripe requiere esto para métodos que necesitan redirección (3D Secure, etc)
                if return_url:
                    params['return_url'] = return_url

            payment_intent = stripe.PaymentIntent.create(**params)

            logger.info(
                f"PaymentIntent creado: {payment_intent.id} ",
                f"Amount: {amount_cents} {currency.upper()}"
            )

            return payment_intent
        
        except StripeError as e:
            logger.error(f"Error creando PaymentIntent: {e}")
            raise

    async def confirm_payment_intent(
        self,
        payment_intent_id: str,
        payment_method_id: Optional[str] = None,
        return_url: Optional[str] = None
    ) -> stripe.PaymentIntent:
        """
        Autor: Oscar Alonso Nava Rivera
        Confirma un Payment Intent.

        Args:
            payment_intent_id: ID del Payment Intent.
            payment_method_id: ID del método de pago (si no se especificó antes).
            return_url: URL de retorno para métodos que requieren redirección (3D Secure, etc).

        Returns:
            PaymentIntent confirmado.
        """
        try:
            params = {}
            if payment_method_id:
                params["payment_method"] = payment_method_id
            
            # return_url se puede pasar al confirmar
            if return_url:
                params["return_url"] = return_url
            
            payment_intent = stripe.PaymentIntent.confirm(
                payment_intent_id,
                **params
            )
            
            logger.info(f"Payment Intent confirmado: {payment_intent.id}")
            return payment_intent
            
        except StripeError as e:
            logger.error(f"Error confirmando Payment Intent: {e}")
            raise
    
    # CHECKOUT SESSIONS
    async def create_checkout_session(
        self,
        line_items: List[Dict[str, Any]],
        success_url: str,
        cancel_url: str,
        customer_id: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
        mode: str = "payment"
    ) -> stripe.checkout.Session:
        """
        Autor: Oscar Alonso Nava Rivera
        Crea una Checkout Session (página de pago de Stripe).

        Args:
            line_items: Lista de items a cobrar.
            success_url: URL de redirección tras pago exitoso.
            cancel_url: URL de redirección si usuario cancela.
            customer_id: ID del customer (opcional).
            metadata: Metadata adicional.
            mode: Modo de checkout ("payment" o "subscription").

        Returns:
            Checkout Session de Stripe.
        """
        try:
            params = {
                "mode": mode,
                "line_items": line_items,
                "success_url": success_url,
                "cancel_url": cancel_url,
                "metadata": metadata or {}
            }
            if customer_id:
                params["customer"] = customer_id
            else:
                params['customer_creation'] = 'always'  # Crear customer automáticamente

            session = stripe.checkout.Session.create(**params)

            logger.info(f"Checkout Session creada: {session.id}")
            return session
        except StripeError as e:
            logger.error(f"Error creando Checkout Session: {e}")
            raise

    async def get_checkout_session(
        self,
        session_id: str
    ) -> stripe.checkout.Session:
        """
        Autor: Oscar Alonso Nava Rivera
        Obtiene una Checkout Session por su ID.

        Args:
            session_id: ID de la sesión (cs_xxx).

        Returns:
            Checkout Session de Stripe.
        """
        try:
            return stripe.checkout.Session.retrieve(session_id)
        except StripeError as e:
            logger.error(f"Error obteniendo Checkout Session: {e}")
            raise
    
    # REEMBOLSOS
    async def create_refund(
        self,
        payment_intent_id: str,
        amount: Optional[Decimal] = None,
        reason: Optional[str] = None
    ) -> stripe.Refund:
        """
        Autor: Oscar Alonso Nava Rivera
        Crea un reembolso.

        Args:
            payment_intent_id: ID del Payment Intent a reembolsar.
            amount: Monto a reembolsar (None = total).
            reason: Razón del reembolso.

        Returns:
            Refund de Stripe.

        Note:
            El reembolso puede tardar 5-10 días en reflejarse en la tarjeta.
        """
        try:
            params = {"payment_intent": payment_intent_id}
            
            if amount:
                params["amount"] = int(amount * 100)  # Centavos
            
            if reason:
                params["metadata"] = {"reason": reason}
            
            refund = stripe.Refund.create(**params)
            
            logger.info(f"Reembolso creado: {refund.id} para {payment_intent_id}")
            return refund
            
        except StripeError as e:
            logger.error(f"Error creando reembolso: {e}")
            raise
    
    # WEBHOOKS
    def construct_webhook_event(
        self,
        payload: bytes,
        sig_header: str
    ) -> stripe.Event:
        """
        Autor: Oscar Alonso Nava Rivera
        Verifica y construye un evento de webhook de Stripe.

        Args:
            payload: Body crudo del request (bytes).
            sig_header: Header "Stripe-Signature".

        Returns:
            Evento de Stripe verificado.

        Raises:
            stripe.error.SignatureVerificationError: Si la firma es inválida.
        """
        try:
            event = stripe.Webhook.construct_event(
                payload,
                sig_header,
                self.webhook_secret
            )

            logger.info(f"Webhook verificado: {event.id} - {event.type}")
            return event
        
        except Exception as e:
            # Manejar errores de verificación de firma
            if "signature" in str(e).lower() or "verify" in str(e).lower():
                logger.error(f"Firma de webhook inválida: {e}")
                raise
            logger.error(f"Error procesando webhook: {e}")
            raise

# singleton
stripe_service = StripeService()