"""
Test suite for Cart and CartItem models.

Tests para los modelos Cart y CartItem que gestionan el carrito de compras.

Conceptos clave:
- Cart: Relación 1:1 con User (un usuario = un carrito)
- CartItem: Items individuales del carrito con cantidad
- Constraint unique (cart_id, listing_id) - un listing solo una vez por carrito
- Métodos: get_total_items(), get_subtotal(), get_estimated_total(), clear()
- CartItem métodos: update_quantity(), increase_quantity(), decrease_quantity()
"""

# Autor: Oscar Alonso Nava Rivera
# Fecha: 07/11/2025
# Descripción: Tests unitarios e integración para los modelos Cart y CartItem (operaciones, validaciones y relaciones).

import pytest
from uuid import uuid4
from decimal import Decimal
from sqlalchemy.exc import IntegrityError

from app.models.cart import Cart, CartItem
from app.models.listing import Listing, ListingStatusEnum
from app.models.category import ListingTypeEnum


@pytest.mark.models
@pytest.mark.unit
class TestCartModel:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Cart model creation and validation.
    """

    def test_create_cart_basic(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test creating a cart for a user.
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)

        assert cart.cart_id is not None
        assert cart.user_id == user.user_id
        assert cart.created_at is not None
        assert len(cart.items) == 0

    def test_user_can_have_only_one_cart(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that user_id is unique (one cart per user).
        """
        cart1 = Cart(user_id=user.user_id)
        db.add(cart1)
        db.commit()

        # Intentar crear segundo carrito para mismo usuario
        cart2 = Cart(user_id=user.user_id)
        db.add(cart2)
        
        with pytest.raises(IntegrityError):
            db.commit()

    def test_cart_requires_user_id(self, db):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that user_id is required.
        """
        cart = Cart()  # Sin user_id
        db.add(cart)
        
        with pytest.raises(IntegrityError):
            db.commit()


@pytest.mark.models
@pytest.mark.unit
class TestCartMethods:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Cart business logic methods.
    """

    def test_get_total_items_empty_cart(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test get_total_items returns 0 for empty cart.
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()

        assert cart.get_total_items() == 0

    def test_get_total_items_with_items(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test get_total_items sums quantities of all items.
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()

        # Crear listings
        listing1 = Listing(
            title="Product 1",
            description="Test",
            price=Decimal("10.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            quantity=100
        )
        listing2 = Listing(
            title="Product 2",
            description="Test",
            price=Decimal("20.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            quantity=100
        )
        db.add_all([listing1, listing2])
        db.commit()

        # Agregar items al carrito
        item1 = CartItem(cart_id=cart.cart_id, listing_id=listing1.listing_id, quantity=2)
        item2 = CartItem(cart_id=cart.cart_id, listing_id=listing2.listing_id, quantity=3)
        db.add_all([item1, item2])
        db.commit()
        db.refresh(cart)

        assert cart.get_total_items() == 5  # 2 + 3

    def test_get_subtotal_empty_cart(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test get_subtotal returns 0 for empty cart.
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()

        assert cart.get_subtotal() == Decimal("0.00")

    def test_get_subtotal_with_items(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test get_subtotal calculates correct total.
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()

        listing1 = Listing(
            title="Product 1",
            description="Test",
            price=Decimal("10.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            quantity=100
        )
        listing2 = Listing(
            title="Product 2",
            description="Test",
            price=Decimal("25.50"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            quantity=100
        )
        db.add_all([listing1, listing2])
        db.commit()

        item1 = CartItem(cart_id=cart.cart_id, listing_id=listing1.listing_id, quantity=2)
        item2 = CartItem(cart_id=cart.cart_id, listing_id=listing2.listing_id, quantity=1)
        db.add_all([item1, item2])
        db.commit()
        db.refresh(cart)

        # 2 * 10.00 + 1 * 25.50 = 45.50
        assert cart.get_subtotal() == Decimal("45.50")

    def test_get_estimated_total_with_default_commission(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test get_estimated_total adds 10% commission by default.
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()

        listing = Listing(
            title="Product",
            description="Test",
            price=Decimal("100.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            quantity=100
        )
        db.add(listing)
        db.commit()

        item = CartItem(cart_id=cart.cart_id, listing_id=listing.listing_id, quantity=1)
        db.add(item)
        db.commit()
        db.refresh(cart)

        # Subtotal: 100.00, Commission: 10.00, Total: 110.00
        assert cart.get_estimated_total() == Decimal("110.00")

    def test_clear_cart(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test clear() removes all items from cart.
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()

        listing = Listing(
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            quantity=100
        )
        db.add(listing)
        db.commit()

        item = CartItem(cart_id=cart.cart_id, listing_id=listing.listing_id, quantity=2)
        db.add(item)
        db.commit()
        db.refresh(cart)

        assert len(cart.items) > 0

        # Limpiar carrito
        cart.clear()
        db.commit()
        db.refresh(cart)

        assert len(cart.items) == 0

    def test_has_unavailable_items(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test has_unavailable_items detects inactive listings.
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()

        # Listing inactivo
        listing = Listing(
            title="Inactive Product",
            description="Test",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.INACTIVE,
            quantity=100
        )
        db.add(listing)
        db.commit()

        item = CartItem(cart_id=cart.cart_id, listing_id=listing.listing_id, quantity=1)
        db.add(item)
        db.commit()
        db.refresh(cart)

        assert cart.has_unavailable_items() is True


@pytest.mark.models
@pytest.mark.unit
class TestCartItemModel:
    """
    Autor: Oscar Alonso Nava Rivera

    Test CartItem model creation and validation.
    """

    def test_create_cart_item_basic(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test creating a cart item.
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()

        listing = Listing(
            title="Test Product",
            description="Test",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            quantity=100
        )
        db.add(listing)
        db.commit()

        item = CartItem(
            cart_id=cart.cart_id,
            listing_id=listing.listing_id,
            quantity=3
        )
        db.add(item)
        db.commit()
        db.refresh(item)

        assert item.cart_item_id is not None
        assert item.cart_id == cart.cart_id
        assert item.listing_id == listing.listing_id
        assert item.quantity == 3

    def test_cart_item_default_quantity(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that quantity defaults to 1.
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()

        listing = Listing(
            title="Test Product",
            description="Test",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            quantity=100
        )
        db.add(listing)
        db.commit()

        item = CartItem(
            cart_id=cart.cart_id,
            listing_id=listing.listing_id
            # quantity not specified
        )
        db.add(item)
        db.commit()
        db.refresh(item)

        assert item.quantity == 1

    def test_cart_item_unique_listing_per_cart(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that same listing cannot be added twice to same cart.
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()

        listing = Listing(
            title="Test Product",
            description="Test",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            quantity=100
        )
        db.add(listing)
        db.commit()

        # Primer item
        item1 = CartItem(cart_id=cart.cart_id, listing_id=listing.listing_id, quantity=1)
        db.add(item1)
        db.commit()

        # Intentar agregar mismo listing otra vez
        item2 = CartItem(cart_id=cart.cart_id, listing_id=listing.listing_id, quantity=2)
        db.add(item2)
        
        with pytest.raises(IntegrityError):
            db.commit()

    def test_cart_item_quantity_must_be_positive(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that quantity must be > 0.
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()

        listing = Listing(
            title="Test Product",
            description="Test",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            quantity=100
        )
        db.add(listing)
        db.commit()

        item = CartItem(cart_id=cart.cart_id, listing_id=listing.listing_id, quantity=0)
        db.add(item)
        
        with pytest.raises(IntegrityError):
            db.commit()


@pytest.mark.models
@pytest.mark.unit
class TestCartItemMethods:
    """
    Autor: Oscar Alonso Nava Rivera

    Test CartItem business logic methods.
    """

    def test_get_item_subtotal(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test get_item_subtotal calculates price * quantity.
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()

        listing = Listing(
            title="Product",
            description="Test",
            price=Decimal("25.50"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            quantity=100
        )
        db.add(listing)
        db.commit()

        item = CartItem(cart_id=cart.cart_id, listing_id=listing.listing_id, quantity=4)
        db.add(item)
        db.commit()

        # 25.50 * 4 = 102.00
        assert item.get_item_subtotal() == Decimal("102.00")

    def test_is_valid_returns_true_for_available_listing(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test is_valid returns True for available listing with sufficient stock.
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()

        listing = Listing(
            title="Available Product",
            description="Test",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            quantity=100
        )
        db.add(listing)
        db.commit()

        item = CartItem(cart_id=cart.cart_id, listing_id=listing.listing_id, quantity=5)
        db.add(item)
        db.commit()

        assert item.is_valid() is True

    def test_is_valid_returns_false_for_inactive_listing(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test is_valid returns False for inactive listing.
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()

        listing = Listing(
            title="Inactive Product",
            description="Test",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.INACTIVE,
            quantity=100
        )
        db.add(listing)
        db.commit()

        item = CartItem(cart_id=cart.cart_id, listing_id=listing.listing_id, quantity=1)
        db.add(item)
        db.commit()

        assert item.is_valid() is False

    def test_is_valid_returns_false_when_insufficient_stock(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test is_valid returns False when quantity exceeds stock.
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()

        listing = Listing(
            title="Low Stock Product",
            description="Test",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            quantity=5  # Solo 5 disponibles
        )
        db.add(listing)
        db.commit()

        item = CartItem(cart_id=cart.cart_id, listing_id=listing.listing_id, quantity=10)
        db.add(item)
        db.commit()

        assert item.is_valid() is False

    def test_update_quantity_success(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test update_quantity updates the quantity.
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()

        listing = Listing(
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            quantity=100
        )
        db.add(listing)
        db.commit()

        item = CartItem(cart_id=cart.cart_id, listing_id=listing.listing_id, quantity=2)
        db.add(item)
        db.commit()

        result = item.update_quantity(5)
        db.commit()

        assert result is True
        assert item.quantity == 5

    def test_update_quantity_fails_when_exceeds_stock(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test update_quantity fails when new quantity exceeds stock.
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()

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

        item = CartItem(cart_id=cart.cart_id, listing_id=listing.listing_id, quantity=2)
        db.add(item)
        db.commit()

        result = item.update_quantity(20)  # Excede stock

        assert result is False
        assert item.quantity == 2  # No cambió

    def test_increase_quantity(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test increase_quantity increments quantity.
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()

        listing = Listing(
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            quantity=100
        )
        db.add(listing)
        db.commit()

        item = CartItem(cart_id=cart.cart_id, listing_id=listing.listing_id, quantity=3)
        db.add(item)
        db.commit()

        result = item.increase_quantity(2)
        db.commit()

        assert result is True
        assert item.quantity == 5

    def test_decrease_quantity(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test decrease_quantity decrements quantity.
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()

        listing = Listing(
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            quantity=100
        )
        db.add(listing)
        db.commit()

        item = CartItem(cart_id=cart.cart_id, listing_id=listing.listing_id, quantity=5)
        db.add(item)
        db.commit()

        result = item.decrease_quantity(2)
        db.commit()

        assert result is True
        assert item.quantity == 3

    def test_decrease_quantity_fails_when_would_be_zero(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test decrease_quantity fails when result would be <= 0.
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()

        listing = Listing(
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            quantity=100
        )
        db.add(listing)
        db.commit()

        item = CartItem(cart_id=cart.cart_id, listing_id=listing.listing_id, quantity=2)
        db.add(item)
        db.commit()

        result = item.decrease_quantity(3)  # Resultaría en -1

        assert result is False
        assert item.quantity == 2  # No cambió


@pytest.mark.models
@pytest.mark.integration
@pytest.mark.db
class TestCartRelationships:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Cart and CartItem relationships.
    """

    def test_cart_belongs_to_user(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test cart has relationship with user.
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)

        assert cart.owner is not None
        assert cart.owner.user_id == user.user_id

    def test_user_has_one_cart(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test user has cart relationship (1:1).
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()
        db.refresh(user)

        assert user.cart is not None
        assert user.cart.cart_id == cart.cart_id

    def test_cart_items_cascade_delete_with_cart(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test cart items are deleted when cart is deleted.
        """
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()

        listing = Listing(
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            quantity=100
        )
        db.add(listing)
        db.commit()

        item = CartItem(cart_id=cart.cart_id, listing_id=listing.listing_id, quantity=1)
        db.add(item)
        db.commit()
        item_id = item.cart_item_id

        # Eliminar carrito debe eliminar items
        db.delete(cart)
        db.commit()

        deleted_item = db.query(CartItem).filter_by(cart_item_id=item_id).first()
        assert deleted_item is None
