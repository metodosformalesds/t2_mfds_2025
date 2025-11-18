"""
Test suite para Plan, Subscription, ShippingMethod, AdminActionLog, FAQItem, LegalDocument models.

Tests compactos para validar funcionalidades core de modelos auxiliares.
"""

# Autor: Oscar Alonso Nava Rivera
# Fecha: 07/11/2025
# Descripción: Tests para modelos auxiliares (planes, suscripciones, métodos de envío, logs de admin, FAQ y documentos legales).

import pytest
from uuid import uuid4
from decimal import Decimal
from datetime import datetime, timedelta, timezone
from sqlalchemy.exc import IntegrityError

from app.models.user import User, UserRoleEnum, UserStatusEnum
from app.models.plans import Plan, BillingCycle
from app.models.subscriptions import Subscription, SubscriptionStatus
from app.models.shipping_methods import ShippingMethod, ShippingTypeEnum
from app.models.listing_shipping_options import ListingShippingOption
from app.models.listing import Listing, ListingStatusEnum
from app.models.category import ListingTypeEnum
from app.models.admin_action_logs import AdminActionLog
from app.models.faq_items import FAQItem
from app.models.legal_documents import LegalDocument


# ==================== PLAN & SUBSCRIPTION TESTS ====================
@pytest.mark.models
@pytest.mark.unit
class TestPlanModel:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Plan model creation and validation.
    """

    def test_create_plan_basic(self, db):
        """Test creating a plan with required fields."""
        plan = Plan(
            name="Basic Plan",
            price=Decimal("9.99"),
            billing_cycle=BillingCycle.MONTHLY,
            features_json='{"max_listings": 10, "support": "email"}'
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)

        assert plan.plan_id is not None
        assert plan.name == "Basic Plan"
        assert plan.price == Decimal("9.99")
        assert plan.billing_cycle == BillingCycle.MONTHLY

    def test_plan_name_unique(self, db):
        """Test that plan name must be unique."""
        plan1 = Plan(
            name="Premium",
            price=Decimal("19.99"),
            billing_cycle=BillingCycle.MONTHLY
        )
        db.add(plan1)
        db.commit()

        # Duplicate name
        plan2 = Plan(
            name="Premium",
            price=Decimal("29.99"),
            billing_cycle=BillingCycle.YEARLY
        )
        db.add(plan2)
        
        with pytest.raises(IntegrityError):
            db.commit()

    def test_plan_billing_cycle_enum(self):
        """Test BillingCycle enum values."""
        assert BillingCycle.MONTHLY.value == "monthly"
        assert BillingCycle.QUARTERLY.value == "quarterly"
        assert BillingCycle.YEARLY.value == "yearly"


@pytest.mark.models
@pytest.mark.unit
class TestSubscriptionModel:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Subscription model creation and validation.
    """

    def test_create_subscription_basic(self, db, user):
        """Test creating a subscription."""
        plan = Plan(
            name="Pro Plan",
            price=Decimal("29.99"),
            billing_cycle=BillingCycle.MONTHLY
        )
        db.add(plan)
        db.commit()

        next_billing = datetime.now(timezone.utc) + timedelta(days=30)
        subscription = Subscription(
            user_id=user.user_id,
            plan_id=plan.plan_id,
            status=SubscriptionStatus.ACTIVE,
            next_billing_date=next_billing,
            gateway_sub_id="stripe_sub_123456"
        )
        db.add(subscription)
        db.commit()
        db.refresh(subscription)

        assert subscription.subscription_id is not None
        assert subscription.status == SubscriptionStatus.ACTIVE
        assert subscription.gateway_sub_id == "stripe_sub_123456"

    def test_subscription_unique_user_plan(self, db, user):
        """Test that user can't have duplicate subscriptions to same plan."""
        plan = Plan(
            name="Basic",
            price=Decimal("9.99"),
            billing_cycle=BillingCycle.MONTHLY
        )
        db.add(plan)
        db.commit()

        next_billing = datetime.now(timezone.utc) + timedelta(days=30)
        
        # First subscription
        sub1 = Subscription(
            user_id=user.user_id,
            plan_id=plan.plan_id,
            next_billing_date=next_billing,
            gateway_sub_id="stripe_sub_001"
        )
        db.add(sub1)
        db.commit()

        # Duplicate subscription
        sub2 = Subscription(
            user_id=user.user_id,
            plan_id=plan.plan_id,
            next_billing_date=next_billing,
            gateway_sub_id="stripe_sub_002"
        )
        db.add(sub2)
        
        with pytest.raises(IntegrityError):
            db.commit()

    def test_subscription_gateway_id_unique(self, db, user):
        """Test that gateway_sub_id must be unique."""
        plan = Plan(
            name="Standard",
            price=Decimal("19.99"),
            billing_cycle=BillingCycle.MONTHLY
        )
        db.add(plan)
        db.commit()

        next_billing = datetime.now(timezone.utc) + timedelta(days=30)
        
        # First subscription
        sub1 = Subscription(
            user_id=user.user_id,
            plan_id=plan.plan_id,
            next_billing_date=next_billing,
            gateway_sub_id="stripe_unique_123"
        )
        db.add(sub1)
        db.commit()

        # Create another user
        user2 = User(
            user_id=uuid4(),
            email="user2@example.com",
            full_name="User Two",
            status=UserStatusEnum.ACTIVE
        )
        db.add(user2)
        db.commit()

        # Duplicate gateway_sub_id
        sub2 = Subscription(
            user_id=user2.user_id,
            plan_id=plan.plan_id,
            next_billing_date=next_billing,
            gateway_sub_id="stripe_unique_123"  # Duplicate!
        )
        db.add(sub2)
        
        with pytest.raises(IntegrityError):
            db.commit()


# ==================== SHIPPING METHOD TESTS ====================
@pytest.mark.models
@pytest.mark.unit
class TestShippingMethodModel:
    """
    Autor: Oscar Alonso Nava Rivera

    Test ShippingMethod model creation and validation.
    """

    def test_create_shipping_method_pickup(self, db, user):
        """Test creating a pickup shipping method."""
        method = ShippingMethod(
            seller_id=user.user_id,
            name="Pickup at Store",
            cost=Decimal("0.00"),
            type=ShippingTypeEnum.PICKUP
        )
        db.add(method)
        db.commit()
        db.refresh(method)

        assert method.method_id is not None
        assert method.name == "Pickup at Store"
        assert method.type == ShippingTypeEnum.PICKUP
        assert method.cost == Decimal("0.00")

    def test_create_shipping_method_delivery(self, db, user):
        """Test creating a delivery shipping method."""
        method = ShippingMethod(
            seller_id=user.user_id,
            name="Home Delivery",
            cost=Decimal("15.00"),
            type=ShippingTypeEnum.DELIVERY
        )
        db.add(method)
        db.commit()
        db.refresh(method)

        assert method.type == ShippingTypeEnum.DELIVERY
        assert method.cost == Decimal("15.00")

    def test_shipping_type_enum(self):
        """Test ShippingTypeEnum values."""
        assert ShippingTypeEnum.PICKUP == "pickup"
        assert ShippingTypeEnum.DELIVERY == "delivery"


@pytest.mark.models
@pytest.mark.unit
class TestListingShippingOptionModel:
    """
    Autor: Oscar Alonso Nava Rivera

    Test ListingShippingOption model (Many-to-Many pivot table).
    """

    def test_create_listing_shipping_option(self, db, user, category):
        """Test creating listing shipping option (pivot entry)."""
        # Create shipping method
        method = ShippingMethod(
            seller_id=user.user_id,
            name="Standard Shipping",
            cost=Decimal("10.00"),
            type=ShippingTypeEnum.DELIVERY
        )
        db.add(method)
        db.commit()

        # Create listing
        listing = Listing(
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            quantity=10
        )
        db.add(listing)
        db.commit()

        # Create pivot entry
        option = ListingShippingOption(
            listing_id=listing.listing_id,
            method_id=method.method_id
        )
        db.add(option)
        db.commit()

        # Verify relationship
        db.refresh(listing)
        # Note: Would need proper relationship defined on Listing model
        assert option.listing_id == listing.listing_id
        assert option.method_id == method.method_id


# ==================== ADMIN ACTION LOG TESTS ====================
@pytest.mark.models
@pytest.mark.unit
class TestAdminActionLogModel:
    """
    Autor: Oscar Alonso Nava Rivera

    Test AdminActionLog model creation and validation.
    """

    def test_create_admin_action_log(self, db):
        """Test creating an admin action log."""
        admin = User(
            user_id=uuid4(),
            email="admin@example.com",
            full_name="Admin User",
            role=UserRoleEnum.ADMIN,
            status=UserStatusEnum.ACTIVE
        )
        db.add(admin)
        db.commit()

        log = AdminActionLog(
            admin_id=admin.user_id,
            action_type="LISTING_APPROVED",
            target_entity_type="LISTING",
            target_entity_id=123,
            reason="Listing meets all requirements"
        )
        db.add(log)
        db.commit()
        db.refresh(log)

        assert log.log_id is not None
        assert log.action_type == "LISTING_APPROVED"
        assert log.target_entity_type == "LISTING"
        assert log.target_entity_id == 123

    def test_admin_action_log_without_admin(self, db):
        """Test creating admin log without admin_id (system action)."""
        log = AdminActionLog(
            admin_id=None,
            action_type="SYSTEM_CLEANUP",
            target_entity_type="SYSTEM",
            reason="Automated cleanup"
        )
        db.add(log)
        db.commit()
        db.refresh(log)

        assert log.admin_id is None
        assert log.action_type == "SYSTEM_CLEANUP"


# ==================== FAQ ITEM TESTS ====================
@pytest.mark.models
@pytest.mark.unit
class TestFAQItemModel:
    """
    Autor: Oscar Alonso Nava Rivera

    Test FAQItem model creation and validation.
    """

    def test_create_faq_item_basic(self, db):
        """Test creating an FAQ item."""
        faq = FAQItem(
            category="General",
            question="How do I create an account?",
            answer="Click on the Sign Up button and fill out the form.",
            display_order=1
        )
        db.add(faq)
        db.commit()
        db.refresh(faq)

        assert faq.faq_id is not None
        assert faq.question == "How do I create an account?"
        assert faq.category == "General"
        assert faq.display_order == 1

    def test_faq_item_default_category(self, db):
        """Test that category defaults to 'General'."""
        faq = FAQItem(
            question="What is the return policy?",
            answer="Items can be returned within 30 days."
        )
        db.add(faq)
        db.commit()
        db.refresh(faq)

        assert faq.category == "General"

    def test_faq_item_display_order_optional(self, db):
        """Test that display_order is optional."""
        faq = FAQItem(
            category="Payments",
            question="What payment methods are accepted?",
            answer="We accept credit cards and PayPal."
        )
        db.add(faq)
        db.commit()
        db.refresh(faq)

        assert faq.display_order is None


# ==================== LEGAL DOCUMENT TESTS ====================
@pytest.mark.models
@pytest.mark.unit
class TestLegalDocumentModel:
    """
    Autor: Oscar Alonso Nava Rivera

    Test LegalDocument model creation and validation.
    """

    def test_create_legal_document_basic(self, db):
        """Test creating a legal document."""
        doc = LegalDocument(
            slug="terms-of-service",
            title="Terms of Service",
            content="These are the terms and conditions...",
            version=1.0
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        assert doc.document_id is not None
        assert doc.slug == "terms-of-service"
        assert doc.title == "Terms of Service"
        assert doc.version == 1.0

    def test_legal_document_slug_unique(self, db):
        """Test that slug must be unique."""
        doc1 = LegalDocument(
            slug="privacy-policy",
            title="Privacy Policy",
            content="Version 1",
            version=1.0
        )
        db.add(doc1)
        db.commit()

        # Duplicate slug
        doc2 = LegalDocument(
            slug="privacy-policy",
            title="Privacy Policy Updated",
            content="Version 2",
            version=2.0
        )
        db.add(doc2)
        
        with pytest.raises(IntegrityError):
            db.commit()

    def test_legal_document_default_version(self, db):
        """Test that version defaults to 1.0."""
        doc = LegalDocument(
            slug="cookie-policy",
            title="Cookie Policy",
            content="We use cookies..."
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        assert doc.version == 1.0


@pytest.mark.models
@pytest.mark.integration
@pytest.mark.db
class TestAuxiliaryModelsRelationships:
    """
    Autor: Oscar Alonso Nava Rivera

    Test relationships for auxiliary models.
    """

    def test_user_has_subscriptions(self, db, user):
        """Test user can have multiple subscriptions."""
        plan1 = Plan(name="Plan A", price=Decimal("9.99"), billing_cycle=BillingCycle.MONTHLY)
        plan2 = Plan(name="Plan B", price=Decimal("19.99"), billing_cycle=BillingCycle.YEARLY)
        db.add_all([plan1, plan2])
        db.commit()

        next_billing = datetime.now(timezone.utc) + timedelta(days=30)
        
        sub1 = Subscription(
            user_id=user.user_id,
            plan_id=plan1.plan_id,
            next_billing_date=next_billing,
            gateway_sub_id="sub_001"
        )
        sub2 = Subscription(
            user_id=user.user_id,
            plan_id=plan2.plan_id,
            next_billing_date=next_billing,
            gateway_sub_id="sub_002"
        )
        db.add_all([sub1, sub2])
        db.commit()
        db.refresh(user)

        assert len(user.subscriptions) >= 2

    def test_plan_has_subscriptions(self, db, user):
        """Test plan has relationship with subscriptions."""
        plan = Plan(
            name="Enterprise",
            price=Decimal("99.99"),
            billing_cycle=BillingCycle.YEARLY
        )
        db.add(plan)
        db.commit()

        next_billing = datetime.now(timezone.utc) + timedelta(days=365)
        sub = Subscription(
            user_id=user.user_id,
            plan_id=plan.plan_id,
            next_billing_date=next_billing,
            gateway_sub_id="sub_enterprise_001"
        )
        db.add(sub)
        db.commit()
        db.refresh(plan)

        assert len(plan.subscriptions) >= 1
        assert plan.subscriptions[0].user_id == user.user_id
