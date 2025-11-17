"""
Tests para el modelo PaymentTransaction.

Cubre:
- Creación de transacciones para órdenes y suscripciones
- Constraints (unique, amount > 0, exclusividad order/subscription)
- Estados de pago (PENDING, PROCESSING, COMPLETED, FAILED, etc.)
- Métodos de negocio
- Relaciones con Order, Subscription y User
"""
# Autor: Oscar Alonso Nava Rivera
# Fecha: 07/11/2025
# Descripción: Tests para PaymentTransaction (creación, constraints, estados, métodos y relaciones).
import pytest
from uuid import uuid4
from decimal import Decimal
from datetime import datetime, timedelta
from sqlalchemy.exc import IntegrityError

from app.models.user import User, UserStatusEnum
from app.models.category import Category, ListingTypeEnum
from app.models.listing import Listing, ListingStatusEnum
from app.models.order import Order, OrderStatusEnum
from app.models.plans import Plan, BillingCycle
from app.models.subscriptions import Subscription, SubscriptionStatus
from app.models.payment_transaction import PaymentTransaction
from app.models.payment_enums import PaymentGatewayEnum, PaymentStatusEnum


class TestPaymentTransactionModel:
    """
    Autor: Oscar Alonso Nava Rivera

    Tests básicos del modelo PaymentTransaction.
    """
    
    def test_create_transaction_for_order(self, db, user, category):
        """Test crear una transacción para una orden."""
        # Crear orden
        seller = User(
            user_id=uuid4(),
            email=f"seller_{uuid4().hex[:8]}@example.com",
            full_name="Seller",
            status=UserStatusEnum.ACTIVE
        )
        db.add(seller)
        db.commit()
        
        listing = Listing(
            seller_id=seller.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            title="Test Product",
            description="Test",
            price=Decimal("100.00"),
            quantity=10,
            status=ListingStatusEnum.ACTIVE
        )
        db.add(listing)
        db.commit()
        
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("100.00"),
            commission_amount=Decimal("10.00"),
            total_amount=Decimal("110.00")
        )
        db.add(order)
        db.commit()
        
        # Crear transacción
        transaction = PaymentTransaction(
            order_id=order.order_id,
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_transaction_id="ch_test123456789",
            amount=Decimal("110.00"),
            currency="MXN",
            status=PaymentStatusEnum.COMPLETED,
            payment_method_type="card",
            payment_method_last4="4242",
            payment_method_brand="visa",
            completed_at=datetime.utcnow()
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        
        assert transaction.transaction_id is not None
        assert transaction.order_id == order.order_id
        assert transaction.subscription_id is None
        assert transaction.user_id == user.user_id
        assert transaction.gateway == PaymentGatewayEnum.STRIPE
        assert transaction.amount == Decimal("110.00")
        assert transaction.status == PaymentStatusEnum.COMPLETED
        assert transaction.initiated_at is not None
    
    def test_create_transaction_for_subscription(self, db, user):
        """Test crear una transacción para una suscripción."""
        # Crear plan y suscripción
        plan = Plan(
            name="Premium Plan",
            price=Decimal("99.00"),
            billing_cycle=BillingCycle.MONTHLY
        )
        db.add(plan)
        db.commit()
        
        subscription = Subscription(
            user_id=user.user_id,
            plan_id=plan.plan_id,
            status=SubscriptionStatus.ACTIVE,
            next_billing_date=datetime.utcnow() + timedelta(days=30),
            gateway_sub_id="sub_stripe_test123"
        )
        db.add(subscription)
        db.commit()
        
        # Crear transacción
        transaction = PaymentTransaction(
            subscription_id=subscription.subscription_id,
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_transaction_id="ch_sub_test123",
            amount=Decimal("99.00"),
            currency="MXN",
            status=PaymentStatusEnum.COMPLETED,
            completed_at=datetime.utcnow()
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        
        assert transaction.subscription_id == subscription.subscription_id
        assert transaction.order_id is None
        assert transaction.amount == Decimal("99.00")


class TestPaymentTransactionConstraints:
    """
    Autor: Oscar Alonso Nava Rivera

    Tests de constraints del modelo PaymentTransaction.
    """
    
    def test_gateway_transaction_id_unique(self, db, user, category):
        """Test que gateway_transaction_id sea único."""
        seller = User(
            user_id=uuid4(),
            email=f"seller_{uuid4().hex[:8]}@example.com",
            full_name="Seller",
            status=UserStatusEnum.ACTIVE
        )
        db.add(seller)
        db.commit()
        
        listing = Listing(
            seller_id=seller.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            quantity=10,
            status=ListingStatusEnum.ACTIVE
        )
        db.add(listing)
        db.commit()
        
        order1 = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("50.00"),
            commission_amount=Decimal("5.00"),
            total_amount=Decimal("55.00")
        )
        db.add(order1)
        db.commit()
        
        transaction1 = PaymentTransaction(
            order_id=order1.order_id,
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_transaction_id="ch_duplicate_test",
            amount=Decimal("55.00"),
            status=PaymentStatusEnum.COMPLETED
        )
        db.add(transaction1)
        db.commit()
        
        # Crear segunda orden
        order2 = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("50.00"),
            commission_amount=Decimal("5.00"),
            total_amount=Decimal("55.00")
        )
        db.add(order2)
        db.commit()
        
        # Intentar crear transacción con mismo gateway_transaction_id
        transaction2 = PaymentTransaction(
            order_id=order2.order_id,
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_transaction_id="ch_duplicate_test",
            amount=Decimal("55.00"),
            status=PaymentStatusEnum.COMPLETED
        )
        db.add(transaction2)
        
        with pytest.raises(IntegrityError):
            db.commit()
    
    def test_amount_must_be_positive(self, db, user, category):
        """Test que amount debe ser mayor a 0 (CHECK constraint)."""
        seller = User(
            user_id=uuid4(),
            email=f"seller_{uuid4().hex[:8]}@example.com",
            full_name="Seller",
            status=UserStatusEnum.ACTIVE
        )
        db.add(seller)
        db.commit()
        
        listing = Listing(
            seller_id=seller.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            quantity=10,
            status=ListingStatusEnum.ACTIVE
        )
        db.add(listing)
        db.commit()
        
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("50.00"),
            commission_amount=Decimal("5.00"),
            total_amount=Decimal("55.00")
        )
        db.add(order)
        db.commit()
        
        transaction = PaymentTransaction(
            order_id=order.order_id,
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_transaction_id="ch_negative_amount",
            amount=Decimal("0.00"),  # Violación: debe ser > 0
            status=PaymentStatusEnum.COMPLETED
        )
        db.add(transaction)
        
        with pytest.raises(IntegrityError):
            db.commit()
    
    def test_transaction_type_exclusive_constraint(self, db, user, category):
        """Test que una transacción no pueda tener order_id y subscription_id al mismo tiempo."""
        seller = User(
            user_id=uuid4(),
            email=f"seller_{uuid4().hex[:8]}@example.com",
            full_name="Seller",
            status=UserStatusEnum.ACTIVE
        )
        db.add(seller)
        db.commit()
        
        listing = Listing(
            seller_id=seller.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            quantity=10,
            status=ListingStatusEnum.ACTIVE
        )
        db.add(listing)
        db.commit()
        
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("50.00"),
            commission_amount=Decimal("5.00"),
            total_amount=Decimal("55.00")
        )
        db.add(order)
        db.commit()
        
        plan = Plan(
            name="Test Plan",
            price=Decimal("99.00"),
            billing_cycle=BillingCycle.MONTHLY
        )
        db.add(plan)
        db.commit()
        
        subscription = Subscription(
            user_id=user.user_id,
            plan_id=plan.plan_id,
            status=SubscriptionStatus.ACTIVE,
            next_billing_date=datetime.utcnow() + timedelta(days=30),
            gateway_sub_id="sub_test123"
        )
        db.add(subscription)
        db.commit()
        
        # Intentar crear transacción con ambos IDs (violación)
        transaction = PaymentTransaction(
            order_id=order.order_id,
            subscription_id=subscription.subscription_id,  # No permitido
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_transaction_id="ch_both_ids",
            amount=Decimal("100.00"),
            status=PaymentStatusEnum.COMPLETED
        )
        db.add(transaction)
        
        with pytest.raises(IntegrityError):
            db.commit()


class TestPaymentTransactionMethods:
    """
    Autor: Oscar Alonso Nava Rivera

    Tests de métodos del modelo PaymentTransaction.
    """
    
    def test_is_successful_when_completed(self, db, user, category):
        """Test is_successful() cuando status es COMPLETED."""
        seller = User(
            user_id=uuid4(),
            email=f"seller_{uuid4().hex[:8]}@example.com",
            full_name="Seller",
            status=UserStatusEnum.ACTIVE
        )
        db.add(seller)
        db.commit()
        
        listing = Listing(
            seller_id=seller.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            quantity=10,
            status=ListingStatusEnum.ACTIVE
        )
        db.add(listing)
        db.commit()
        
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("50.00"),
            commission_amount=Decimal("5.00"),
            total_amount=Decimal("55.00")
        )
        db.add(order)
        db.commit()
        
        transaction = PaymentTransaction(
            order_id=order.order_id,
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_transaction_id="ch_success_test",
            amount=Decimal("55.00"),
            status=PaymentStatusEnum.COMPLETED,
            completed_at=datetime.utcnow()
        )
        db.add(transaction)
        db.commit()
        
        assert transaction.is_successful() is True
    
    def test_is_pending_when_processing(self, db, user, category):
        """Test is_pending() cuando status es PROCESSING."""
        seller = User(
            user_id=uuid4(),
            email=f"seller_{uuid4().hex[:8]}@example.com",
            full_name="Seller",
            status=UserStatusEnum.ACTIVE
        )
        db.add(seller)
        db.commit()
        
        listing = Listing(
            seller_id=seller.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            quantity=10,
            status=ListingStatusEnum.ACTIVE
        )
        db.add(listing)
        db.commit()
        
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("50.00"),
            commission_amount=Decimal("5.00"),
            total_amount=Decimal("55.00")
        )
        db.add(order)
        db.commit()
        
        transaction = PaymentTransaction(
            order_id=order.order_id,
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_transaction_id="ch_pending_test",
            amount=Decimal("55.00"),
            status=PaymentStatusEnum.PROCESSING
        )
        db.add(transaction)
        db.commit()
        
        assert transaction.is_pending() is True
    
    def test_is_failed_when_cancelled(self, db, user, category):
        """Test is_failed() cuando status es CANCELLED."""
        seller = User(
            user_id=uuid4(),
            email=f"seller_{uuid4().hex[:8]}@example.com",
            full_name="Seller",
            status=UserStatusEnum.ACTIVE
        )
        db.add(seller)
        db.commit()
        
        listing = Listing(
            seller_id=seller.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            quantity=10,
            status=ListingStatusEnum.ACTIVE
        )
        db.add(listing)
        db.commit()
        
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("50.00"),
            commission_amount=Decimal("5.00"),
            total_amount=Decimal("55.00")
        )
        db.add(order)
        db.commit()
        
        transaction = PaymentTransaction(
            order_id=order.order_id,
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_transaction_id="ch_failed_test",
            amount=Decimal("55.00"),
            status=PaymentStatusEnum.CANCELLED,
            error_code="cancelled_by_user",
            error_message="Payment cancelled by user"
        )
        db.add(transaction)
        db.commit()
        
        assert transaction.is_failed() is True
    
    def test_can_be_refunded_when_completed(self, db, user, category):
        """Test can_be_refunded() cuando está completada."""
        seller = User(
            user_id=uuid4(),
            email=f"seller_{uuid4().hex[:8]}@example.com",
            full_name="Seller",
            status=UserStatusEnum.ACTIVE
        )
        db.add(seller)
        db.commit()
        
        listing = Listing(
            seller_id=seller.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            quantity=10,
            status=ListingStatusEnum.ACTIVE
        )
        db.add(listing)
        db.commit()
        
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("50.00"),
            commission_amount=Decimal("5.00"),
            total_amount=Decimal("55.00")
        )
        db.add(order)
        db.commit()
        
        transaction = PaymentTransaction(
            order_id=order.order_id,
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_transaction_id="ch_refund_test",
            amount=Decimal("55.00"),
            status=PaymentStatusEnum.COMPLETED,
            completed_at=datetime.utcnow()
        )
        db.add(transaction)
        db.commit()
        
        assert transaction.can_be_refunded() is True
    
    def test_get_formatted_amount(self, db, user, category):
        """Test get_formatted_amount()."""
        seller = User(
            user_id=uuid4(),
            email=f"seller_{uuid4().hex[:8]}@example.com",
            full_name="Seller",
            status=UserStatusEnum.ACTIVE
        )
        db.add(seller)
        db.commit()
        
        listing = Listing(
            seller_id=seller.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            quantity=10,
            status=ListingStatusEnum.ACTIVE
        )
        db.add(listing)
        db.commit()
        
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("50.00"),
            commission_amount=Decimal("5.00"),
            total_amount=Decimal("55.00")
        )
        db.add(order)
        db.commit()
        
        transaction = PaymentTransaction(
            order_id=order.order_id,
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_transaction_id="ch_format_test",
            amount=Decimal("110.50"),
            currency="MXN",
            status=PaymentStatusEnum.COMPLETED
        )
        db.add(transaction)
        db.commit()
        
        assert transaction.get_formatted_amount() == "$110.50 MXN"
    
    def test_get_masked_payment_method(self, db, user, category):
        """Test get_masked_payment_method()."""
        seller = User(
            user_id=uuid4(),
            email=f"seller_{uuid4().hex[:8]}@example.com",
            full_name="Seller",
            status=UserStatusEnum.ACTIVE
        )
        db.add(seller)
        db.commit()
        
        listing = Listing(
            seller_id=seller.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            quantity=10,
            status=ListingStatusEnum.ACTIVE
        )
        db.add(listing)
        db.commit()
        
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("50.00"),
            commission_amount=Decimal("5.00"),
            total_amount=Decimal("55.00")
        )
        db.add(order)
        db.commit()
        
        transaction = PaymentTransaction(
            order_id=order.order_id,
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_transaction_id="ch_mask_test",
            amount=Decimal("55.00"),
            status=PaymentStatusEnum.COMPLETED,
            payment_method_last4="4242"
        )
        db.add(transaction)
        db.commit()
        
        assert transaction.get_masked_payment_method() == "•••• 4242"


class TestPaymentTransactionRelationships:
    """
    Autor: Oscar Alonso Nava Rivera

    Tests de relaciones del modelo PaymentTransaction.
    """
    
    def test_transaction_belongs_to_order(self, db, user, category):
        """Test relación con Order."""
        seller = User(
            user_id=uuid4(),
            email=f"seller_{uuid4().hex[:8]}@example.com",
            full_name="Seller",
            status=UserStatusEnum.ACTIVE
        )
        db.add(seller)
        db.commit()
        
        listing = Listing(
            seller_id=seller.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            quantity=10,
            status=ListingStatusEnum.ACTIVE
        )
        db.add(listing)
        db.commit()
        
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("50.00"),
            commission_amount=Decimal("5.00"),
            total_amount=Decimal("55.00")
        )
        db.add(order)
        db.commit()
        
        transaction = PaymentTransaction(
            order_id=order.order_id,
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_transaction_id="ch_order_rel",
            amount=Decimal("55.00"),
            status=PaymentStatusEnum.COMPLETED
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        
        assert transaction.order is not None
        assert transaction.order.order_id == order.order_id
        assert transaction.subscription is None
    
    def test_transaction_belongs_to_subscription(self, db, user):
        """Test relación con Subscription."""
        plan = Plan(
            name="Premium",
            price=Decimal("99.00"),
            billing_cycle=BillingCycle.MONTHLY
        )
        db.add(plan)
        db.commit()
        
        subscription = Subscription(
            user_id=user.user_id,
            plan_id=plan.plan_id,
            status=SubscriptionStatus.ACTIVE,
            next_billing_date=datetime.utcnow() + timedelta(days=30),
            gateway_sub_id="sub_rel_test"
        )
        db.add(subscription)
        db.commit()
        
        transaction = PaymentTransaction(
            subscription_id=subscription.subscription_id,
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_transaction_id="ch_sub_rel",
            amount=Decimal("99.00"),
            status=PaymentStatusEnum.COMPLETED
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        
        assert transaction.subscription is not None
        assert transaction.subscription.subscription_id == subscription.subscription_id
        assert transaction.order is None
    
    def test_transaction_belongs_to_user(self, db, user, category):
        """Test relación con User."""
        seller = User(
            user_id=uuid4(),
            email=f"seller_{uuid4().hex[:8]}@example.com",
            full_name="Seller",
            status=UserStatusEnum.ACTIVE
        )
        db.add(seller)
        db.commit()
        
        listing = Listing(
            seller_id=seller.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            quantity=10,
            status=ListingStatusEnum.ACTIVE
        )
        db.add(listing)
        db.commit()
        
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("50.00"),
            commission_amount=Decimal("5.00"),
            total_amount=Decimal("55.00")
        )
        db.add(order)
        db.commit()
        
        transaction = PaymentTransaction(
            order_id=order.order_id,
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_transaction_id="ch_user_rel",
            amount=Decimal("55.00"),
            status=PaymentStatusEnum.COMPLETED
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        
        assert transaction.user is not None
        assert transaction.user.user_id == user.user_id


class TestPaymentTransactionStatuses:
    """
    Autor: Oscar Alonso Nava Rivera

    Tests de transiciones de estado de PaymentTransaction.
    """
    
    def test_pending_to_completed_flow(self, db, user, category):
        """Test flujo PENDING -> COMPLETED."""
        seller = User(
            user_id=uuid4(),
            email=f"seller_{uuid4().hex[:8]}@example.com",
            full_name="Seller",
            status=UserStatusEnum.ACTIVE
        )
        db.add(seller)
        db.commit()
        
        listing = Listing(
            seller_id=seller.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            quantity=10,
            status=ListingStatusEnum.ACTIVE
        )
        db.add(listing)
        db.commit()
        
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("50.00"),
            commission_amount=Decimal("5.00"),
            total_amount=Decimal("55.00")
        )
        db.add(order)
        db.commit()
        
        # Crear transacción PENDING
        transaction = PaymentTransaction(
            order_id=order.order_id,
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_transaction_id="ch_flow_test",
            amount=Decimal("55.00"),
            status=PaymentStatusEnum.PENDING
        )
        db.add(transaction)
        db.commit()
        
        assert transaction.is_pending() is True
        assert transaction.is_successful() is False
        
        # Actualizar a COMPLETED
        transaction.status = PaymentStatusEnum.COMPLETED
        transaction.completed_at = datetime.utcnow()
        db.commit()
        
        assert transaction.is_pending() is False
        assert transaction.is_successful() is True
        assert transaction.can_be_refunded() is True
    
    def test_failed_transaction_has_error_info(self, db, user, category):
        """Test que transacciones fallidas tengan información de error."""
        seller = User(
            user_id=uuid4(),
            email=f"seller_{uuid4().hex[:8]}@example.com",
            full_name="Seller",
            status=UserStatusEnum.ACTIVE
        )
        db.add(seller)
        db.commit()
        
        listing = Listing(
            seller_id=seller.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            quantity=10,
            status=ListingStatusEnum.ACTIVE
        )
        db.add(listing)
        db.commit()
        
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("50.00"),
            commission_amount=Decimal("5.00"),
            total_amount=Decimal("55.00")
        )
        db.add(order)
        db.commit()
        
        transaction = PaymentTransaction(
            order_id=order.order_id,
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_transaction_id="ch_error_test",
            amount=Decimal("55.00"),
            status=PaymentStatusEnum.FAILED,
            error_code="card_declined",
            error_message="Your card was declined."
        )
        db.add(transaction)
        db.commit()
        
        assert transaction.is_failed() is True
        assert transaction.error_code == "card_declined"
        assert transaction.error_message is not None
