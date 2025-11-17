"""
Test suite for Order model.

Este archivo demuestra cómo probar el modelo Order, incluyendo:
- Creación de instancias según el diseño AWS
- Validación de campos obligatorios
- Verificación de enums  
- Métodos de negocio (calculate_totals con comisión 10%, can_be_cancelled)
- Relaciones con User y OrderItem
- Integración con pasarelas de pago (Stripe/PayPal via payment_charge_id)
"""

# Autor: Oscar Alonso Nava Rivera
# Fecha: 05/11/2025
# Descripción: Tests para el modelo Order (cálculo de totales, estados, relaciones y lógica de negocio).

import pytest
from decimal import Decimal

from app.models.order import Order, OrderStatusEnum


@pytest.mark.models
@pytest.mark.unit
class TestOrderModel:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Order model creation and validation.
    """

    def test_create_order_with_required_fields(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test creating an order with required fields.
        
        En el flujo real:
        1. Usuario completa checkout en frontend
        2. Backend procesa pago via Stripe/PayPal
        3. Si pago exitoso, se crea Order con payment_charge_id
        """
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("100.00"),
            commission_amount=Decimal("10.00"),  # 10% comisión
            total_amount=Decimal("110.00")
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        assert order.order_id is not None
        assert order.buyer_id == user.user_id
        assert order.order_status == OrderStatusEnum.PAID
        assert order.subtotal == Decimal("100.00")
        assert order.commission_amount == Decimal("10.00")
        assert order.total_amount == Decimal("110.00")
        assert order.created_at is not None
        assert order.updated_at is not None

    def test_create_order_with_payment_info(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test creating an order with payment gateway information.
        """
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("100.00"),
            commission_amount=Decimal("10.00"),
            total_amount=Decimal("110.00"),
            payment_charge_id="ch_stripe_123456789",  # ID de Stripe
            payment_method="stripe"
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        assert order.payment_charge_id == "ch_stripe_123456789"
        assert order.payment_method == "stripe"

    def test_order_default_status(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that default status is PAID.
        """
        order = Order(
            buyer_id=user.user_id,
            subtotal=Decimal("100.00"),
            commission_amount=Decimal("10.00"),
            total_amount=Decimal("110.00")
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        assert order.order_status == OrderStatusEnum.PAID


@pytest.mark.models
@pytest.mark.unit
class TestOrderEnums:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Order enum values.
    """

    def test_order_status_enum_values(self):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that OrderStatusEnum has expected values.
        """
        assert OrderStatusEnum.PAID == "PAID"
        assert OrderStatusEnum.SHIPPED == "SHIPPED"
        assert OrderStatusEnum.DELIVERED == "DELIVERED"
        assert OrderStatusEnum.CANCELLED == "CANCELLED"
        assert OrderStatusEnum.REFUNDED == "REFUNDED"

    def test_order_status_transitions(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test changing order status through different states.
        """
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("100.00"),
            commission_amount=Decimal("10.00"),
            total_amount=Decimal("110.00")
        )
        db.add(order)
        db.commit()

        # Transition to SHIPPED
        order.order_status = OrderStatusEnum.SHIPPED
        db.commit()
        assert order.order_status == OrderStatusEnum.SHIPPED

        # Transition to DELIVERED
        order.order_status = OrderStatusEnum.DELIVERED
        db.commit()
        assert order.order_status == OrderStatusEnum.DELIVERED


@pytest.mark.models
@pytest.mark.unit
class TestOrderBusinessLogic:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Order business logic methods.
    """

    def test_calculate_totals_with_10_percent_commission(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test calculate_totals method with 10% commission.
        
        RF-25: La plataforma cobra 10% de comisión en cada transacción.
        """
        from app.models.listing import Listing, ListingStatusEnum, ListingTypeEnum
        from app.models.order_item import OrderItem

        # Create order
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("0"),
            commission_amount=Decimal("0"),
            total_amount=Decimal("0")
        )
        db.add(order)
        db.commit()

        # Create listing
        listing = Listing(
            title="Test Item",
            description="Test description",
            price=Decimal("100.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE
        )
        db.add(listing)
        db.commit()

        # Create order item (subtotal will be 100.00)
        item = OrderItem(
            order_id=order.order_id,
            listing_id=listing.listing_id,
            quantity=1,
            price_at_purchase=Decimal("100.00")
        )
        db.add(item)
        db.commit()
        db.refresh(order)

        # Calculate totals based on order items
        order.calculate_totals()
        db.commit()
        db.refresh(order)

        # Subtotal should be 100.00
        assert order.subtotal == Decimal("100.00")
        # Commission should be 10% of subtotal
        assert order.commission_amount == Decimal("10.00")
        # Total should be subtotal + commission
        assert order.total_amount == Decimal("110.00")

    def test_get_item_count_with_no_items(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test get_item_count when order has no items.
        """
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("100.00"),
            commission_amount=Decimal("10.00"),
            total_amount=Decimal("110.00")
        )
        db.add(order)
        db.commit()

        assert order.get_item_count() == 0

    def test_get_item_count_with_items(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test get_item_count with multiple order items.
        """
        from app.models.listing import Listing, ListingStatusEnum, ListingTypeEnum
        from app.models.order_item import OrderItem

        # Create order
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("100.00"),
            commission_amount=Decimal("10.00"),
            total_amount=Decimal("110.00")
        )
        db.add(order)
        db.commit()

        # Create listings
        listing1 = Listing(
            title="Item 1",
            description="Desc 1",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE
        )
        listing2 = Listing(
            title="Item 2",
            description="Desc 2",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE
        )
        db.add_all([listing1, listing2])
        db.commit()

        # Create order items with different quantities
        item1 = OrderItem(
            order_id=order.order_id,
            listing_id=listing1.listing_id,
            quantity=2,
            price_at_purchase=Decimal("50.00")
        )
        item2 = OrderItem(
            order_id=order.order_id,
            listing_id=listing2.listing_id,
            quantity=3,
            price_at_purchase=Decimal("50.00")
        )
        db.add_all([item1, item2])
        db.commit()
        db.refresh(order)

        # Total items should be sum of quantities: 2 + 3 = 5
        assert order.get_item_count() == 5

    def test_can_be_cancelled_when_paid(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that a PAID order can be cancelled.
        """
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("100.00"),
            commission_amount=Decimal("10.00"),
            total_amount=Decimal("110.00")
        )
        db.add(order)
        db.commit()

        assert order.can_be_cancelled() is True

    def test_cannot_be_cancelled_when_shipped(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that a SHIPPED order cannot be cancelled.
        """
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.SHIPPED,
            subtotal=Decimal("100.00"),
            commission_amount=Decimal("10.00"),
            total_amount=Decimal("110.00")
        )
        db.add(order)
        db.commit()

        assert order.can_be_cancelled() is False

    def test_cannot_be_cancelled_when_delivered(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that a DELIVERED order cannot be cancelled.
        """
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.DELIVERED,
            subtotal=Decimal("100.00"),
            commission_amount=Decimal("10.00"),
            total_amount=Decimal("110.00")
        )
        db.add(order)
        db.commit()

        assert order.can_be_cancelled() is False


@pytest.mark.models
@pytest.mark.integration
@pytest.mark.db
class TestOrderRelationships:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Order relationships with other models.
    """

    def test_order_belongs_to_buyer(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that an order belongs to a buyer (user).
        """
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("100.00"),
            commission_amount=Decimal("10.00"),
            total_amount=Decimal("110.00")
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        assert order.buyer == user
        assert order in user.orders

    def test_order_can_have_order_items(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that an order can have multiple order items.
        """
        from app.models.listing import Listing, ListingStatusEnum, ListingTypeEnum
        from app.models.order_item import OrderItem

        # Create order
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.PAID,
            subtotal=Decimal("100.00"),
            commission_amount=Decimal("10.00"),
            total_amount=Decimal("110.00")
        )
        db.add(order)
        db.commit()

        # Create listings
        listing1 = Listing(
            title="Item 1",
            description="Desc 1",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE
        )
        listing2 = Listing(
            title="Item 2",
            description="Desc 2",
            price=Decimal("75.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE
        )
        db.add_all([listing1, listing2])
        db.commit()

        # Create order items
        item1 = OrderItem(
            order_id=order.order_id,
            listing_id=listing1.listing_id,
            quantity=1,
            price_at_purchase=Decimal("50.00")
        )
        item2 = OrderItem(
            order_id=order.order_id,
            listing_id=listing2.listing_id,
            quantity=1,
            price_at_purchase=Decimal("75.00")
        )
        db.add_all([item1, item2])
        db.commit()
        db.refresh(order)

        assert len(order.order_items) == 2
        assert item1 in order.order_items
        assert item2 in order.order_items
