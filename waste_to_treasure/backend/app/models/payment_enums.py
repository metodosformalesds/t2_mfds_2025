"""
Enums para el sistemas de pagos

Define los tipos de estado y pasarelas de pago
"""
"""
Autor: Oscar Alonso Nava Rivera
Fecha: 07/11/2025
Descripción: Enums de pagos (gateway, estado, payout, etc.).
"""
import enum

class PaymentGatewayEnum(str, enum.Enum):
    """
    Enum para las pasarelas de pago soportadas.
    
    Attributes:
        STRIPE: Stripe (tarjetas, wallets, OXXO, SPEI)
    """
    STRIPE = "STRIPE"
    PAYPAL = "PAYPAL"

class PaymentStatusEnum(str, enum.Enum):
    """
    Enum para el estado de una transacción de pago.
    
    Attributes:
        PENDING: Pago iniciado, esperando confirmación
        PROCESSING: Pago siendo procesado por la pasarela
        COMPLETED: Pago completado exitosamente
        FAILED: Pago falló (tarjeta declinada, fondos insuficientes, etc)
        CANCELLED: Pago cancelado por el usuario
        REFUNDED: Pago reembolsado (total o parcial)
    """
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"

class PayoutStatusEnum(str, enum.Enum):
    """
    Enum para el estado de un payout (pago a vendedor).
    
    Attributes:
        PENDING: Payout pendiente de procesamiento
        APPROVED: Payout aprobado por admin, listo para transferir
        PROCESSING: Transferencia en proceso
        COMPLETED: Payout completado exitosamente
        FAILED: Transferencia falló
        REJECTED: Payout rechazado por admin
    """
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REJECTED = "REJECTED"