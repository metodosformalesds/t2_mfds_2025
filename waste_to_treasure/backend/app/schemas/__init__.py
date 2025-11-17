"""
Modulo de esquemas Pydantic

Expone todos los esquemas de validacion para las operaciones de la API.
Autor: Oscar Alonso Nava Rivera
Fecha: 31/10/2025
Descripción: Exporta schemas Pydantic usados por la API.
"""
from app.schemas.category import (
    CategoryBase,
    CategoryCreate,
    CategoryUpdate,
    CategoryInDB,
    CategoryRead,
    Category,
    CategoryWithChildren,
    CategoryList,
    CategoryTree,
)
from app.schemas.address import(
    AddressBase,
    AddressCreate,
    AddressInDB,
    AddressRead,
    AddressList,
    AddressWithUser,
    UserBasic,
)
from app.schemas.user import (
    UserRead,
    UserPublic,
    UserUpdate,
    UserAdminUpdate,
)
from app.schemas.payment import (
    PaymentTransactionBase,
    PaymentTransactionCreate,
    PaymentTransactionUpdate,
    PaymentTransactionInDB,
    PaymentTransactionRead,
    PaymentTransactionList,
    PaymentTransactionPublic,
)
from app.schemas.checkout import (
    CheckoutLineItem,
    CheckoutRequest,
    CheckoutSessionResponse,
    PaymentIntentRequest,
    PaymentIntentResponse,
    PaymentConfirmation,
    PaymentError,
)
from app.schemas.payment_customer import (
    PaymentCustomerBase,
    PaymentCustomerCreate,
    PaymentCustomerUpdate,
    PaymentCustomerInDB,
    PaymentCustomerRead,
    PaymentMethodCreate,
    PaymentMethodRead,
    PaymentMethodList,
)
from app.schemas.seller_payment_account import (
    SellerPaymentAccountBase,
    SellerPaymentAccountCreate,
    SellerPaymentAccountUpdate,
    SellerPaymentAccountInDB,
    SellerPaymentAccountRead,
    SellerPaymentAccountList,
    SellerPaymentAccountAdmin,
)
from app.schemas.payout import (
    PayoutBase,
    PayoutCreate,
    PayoutApprove,
    PayoutReject,
    PayoutInDB,
    PayoutRead,
    PayoutList,
    PayoutStats,
)
from app.schemas.webhook import (
    StripeWebhookEvent,
    WebhookProcessingResult,
    WebhookResponse,
    PayPalWebhookEvent,
    RefundRequest,
    RefundResponse,
)

__all__ = [
    # category schemas
    "CategoryBase",
    "CategoryCreate",
    "CategoryUpdate",
    "CategoryInDB",
    "CategoryRead",
    "Category",
    "CategoryWithChildren",
    "CategoryList",
    "CategoryTree",

    #address schemas
    "AddressBase",
    "AddressCreate",
    "AddressUpdate",
    "AddressInDB",
    "AddressRead",
    "AddressList",
    "AddressWithUser",
    "UserBasic",
    
    # user schemas
    "UserRead",
    "UserPublic",
    "UserUpdate",
    "UserAdminUpdate",

    # Payment transaction schemas
    "PaymentTransactionBase",
    "PaymentTransactionCreate",
    "PaymentTransactionUpdate",
    "PaymentTransactionInDB",
    "PaymentTransactionRead",
    "PaymentTransactionList",
    "PaymentTransactionPublic",
    
    # Checkout schemas
    "CheckoutLineItem",
    "CheckoutRequest",
    "CheckoutSessionResponse",
    "PaymentIntentRequest",
    "PaymentIntentResponse",
    "PaymentConfirmation",
    "PaymentError",
    
    # Payment customer schemas
    "PaymentCustomerBase",
    "PaymentCustomerCreate",
    "PaymentCustomerUpdate",
    "PaymentCustomerInDB",
    "PaymentCustomerRead",
    "PaymentMethodCreate",
    "PaymentMethodRead",
    "PaymentMethodList",
    
    # Seller payment account schemas
    "SellerPaymentAccountBase",
    "SellerPaymentAccountCreate",
    "SellerPaymentAccountUpdate",
    "SellerPaymentAccountInDB",
    "SellerPaymentAccountRead",
    "SellerPaymentAccountList",
    "SellerPaymentAccountAdmin",
    
    # Payout schemas
    "PayoutBase",
    "PayoutCreate",
    "PayoutApprove",
    "PayoutReject",
    "PayoutInDB",
    "PayoutRead",
    "PayoutList",
    "PayoutStats",
    
    # Webhook schemas
    "StripeWebhookEvent",
    "WebhookProcessingResult",
    "WebhookResponse",
    "PayPalWebhookEvent",
    "RefundRequest",
    "RefundResponse",
]