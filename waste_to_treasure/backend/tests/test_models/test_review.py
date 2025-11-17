"""
Test suite for Review model.

Tests para el modelo Review que almacena calificaciones y comentarios de compradores.

Conceptos clave:
- Relación 1:1 con OrderItem (una review por compra)
- Rating: 1-5 estrellas (constraint CHECK)
- Relaciones: buyer, seller, listing
- order_item_id debe ser UNIQUE
"""

# Autor: Oscar Alonso Nava Rivera
# Fecha: 07/11/2025
# Descripción: Tests para el modelo Review (rating, constraints, y relaciones con order_item, buyer y seller).

import pytest
from uuid import uuid4
from decimal import Decimal
from sqlalchemy.exc import IntegrityError

from app.models.reviews import Review
from app.models.user import User, UserRoleEnum, UserStatusEnum
from app.models.order import Order, OrderStatusEnum
from app.models.order_item import OrderItem
from app.models.listing import Listing, ListingStatusEnum
from app.models.category import ListingTypeEnum


@pytest.mark.models
@pytest.mark.unit
class TestReviewModel:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Review model creation and validation.
    """

    def test_create_review_basic(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test creating a review with required fields.
        """
        # Crear listing
        seller = User(
            user_id=uuid4(),
            email="seller@example.com",
            full_name="Seller User",
            status=UserStatusEnum.ACTIVE
        )
        db.add(seller)
        db.commit()

        listing = Listing(
            title="Test Product",
            description="Test",
            price=Decimal("50.00"),
            
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            seller_id=seller.user_id,
            quantity=100
        )
        db.add(listing)
        db.commit()

        # Crear order
        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.DELIVERED,
            subtotal=Decimal("50.00"),
            commission_amount=Decimal("5.00"),
            total_amount=Decimal("55.00")
        )
        db.add(order)
        db.commit()

        # Crear order item
        order_item = OrderItem(
            order_id=order.order_id,
            listing_id=listing.listing_id,
            quantity=1,
            price_at_purchase=Decimal("50.00")
        )
        db.add(order_item)
        db.commit()

        # Crear review
        review = Review(
            order_item_id=order_item.order_item_id,
            buyer_id=user.user_id,
            
            listing_id=listing.listing_id,
            seller_id=seller.user_id,
            rating=5,
            comment="Excellent product!"
        )
        db.add(review)
        db.commit()
        db.refresh(review)

        assert review.review_id is not None
        assert review.rating == 5
        assert review.comment == "Excellent product!"
        assert review.buyer_id == user.user_id
        assert review.seller_id == seller.user_id

    def test_review_rating_constraint_min(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that rating must be >= 1.
        """
        seller = User(
            user_id=uuid4(),
            email="seller2@example.com",
            full_name="Seller",
            status=UserStatusEnum.ACTIVE
        )
        db.add(seller)
        db.commit()

        listing = Listing(
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            seller_id=seller.user_id,
            quantity=100
        )
        db.add(listing)
        db.commit()

        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.DELIVERED,
            subtotal=Decimal("50.00"),
            commission_amount=Decimal("5.00"),
            total_amount=Decimal("55.00")
        )
        db.add(order)
        db.commit()

        order_item = OrderItem(
            order_id=order.order_id,
            listing_id=listing.listing_id,
            
            quantity=1,
            price_at_purchase=Decimal("50.00"),
            
        )
        db.add(order_item)
        db.commit()

        # Rating inválido (< 1)
        review = Review(
            order_item_id=order_item.order_item_id,
            buyer_id=user.user_id,
            
            listing_id=listing.listing_id,
            seller_id=seller.user_id,
            rating=0,  # Inválido
            comment="Bad"
        )
        db.add(review)
        
        with pytest.raises(IntegrityError):
            db.commit()

    def test_review_rating_constraint_max(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that rating must be <= 5.
        """
        seller = User(
            user_id=uuid4(),
            email="seller3@example.com",
            full_name="Seller",
            status=UserStatusEnum.ACTIVE
        )
        db.add(seller)
        db.commit()

        listing = Listing(
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            seller_id=seller.user_id,
            quantity=100
        )
        db.add(listing)
        db.commit()

        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.DELIVERED,
            subtotal=Decimal("50.00"),
            commission_amount=Decimal("5.00"),
            total_amount=Decimal("55.00")
        )
        db.add(order)
        db.commit()

        order_item = OrderItem(
            order_id=order.order_id,
            listing_id=listing.listing_id,
            
            quantity=1,
            price_at_purchase=Decimal("50.00"),
            
        )
        db.add(order_item)
        db.commit()

        # Rating inválido (> 5)
        review = Review(
            order_item_id=order_item.order_item_id,
            buyer_id=user.user_id,
            
            listing_id=listing.listing_id,
            seller_id=seller.user_id,
            rating=6,  # Inválido
            comment="Too good"
        )
        db.add(review)
        
        with pytest.raises(IntegrityError):
            db.commit()

    def test_review_order_item_unique_constraint(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that order_item_id must be unique (one review per purchase).
        """
        seller = User(
            user_id=uuid4(),
            email="seller4@example.com",
            full_name="Seller",
            status=UserStatusEnum.ACTIVE
        )
        db.add(seller)
        db.commit()

        listing = Listing(
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            seller_id=seller.user_id,
            quantity=100
        )
        db.add(listing)
        db.commit()

        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.DELIVERED,
            subtotal=Decimal("50.00"),
            commission_amount=Decimal("5.00"),
            total_amount=Decimal("55.00")
        )
        db.add(order)
        db.commit()

        order_item = OrderItem(
            order_id=order.order_id,
            listing_id=listing.listing_id,
            
            quantity=1,
            price_at_purchase=Decimal("50.00"),
            
        )
        db.add(order_item)
        db.commit()

        # Primera review
        review1 = Review(
            order_item_id=order_item.order_item_id,
            buyer_id=user.user_id,
            seller_id=seller.user_id,
            listing_id=listing.listing_id,
            rating=5
        )
        db.add(review1)
        db.commit()

        # Intentar crear segunda review para mismo order_item
        review2 = Review(
            order_item_id=order_item.order_item_id,
            buyer_id=user.user_id,
            seller_id=seller.user_id,
            listing_id=listing.listing_id,
            rating=4
        )
        db.add(review2)
        
        with pytest.raises(IntegrityError):
            db.commit()

    def test_review_comment_optional(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that comment is optional.
        """
        seller = User(
            user_id=uuid4(),
            email="seller5@example.com",
            full_name="Seller",
            status=UserStatusEnum.ACTIVE
        )
        db.add(seller)
        db.commit()

        listing = Listing(
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            seller_id=seller.user_id,
            quantity=100
        )
        db.add(listing)
        db.commit()

        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.DELIVERED,
            subtotal=Decimal("50.00"),
            commission_amount=Decimal("5.00"),
            total_amount=Decimal("55.00")
        )
        db.add(order)
        db.commit()

        order_item = OrderItem(
            order_id=order.order_id,
            listing_id=listing.listing_id,
            
            quantity=1,
            price_at_purchase=Decimal("50.00"),
            
        )
        db.add(order_item)
        db.commit()

        # Review sin comentario
        review = Review(
            order_item_id=order_item.order_item_id,
            buyer_id=user.user_id,
            
            listing_id=listing.listing_id,
            seller_id=seller.user_id,
            rating=3
            # comment not provided
        )
        db.add(review)
        db.commit()
        db.refresh(review)

        assert review.comment is None
        assert review.rating == 3


@pytest.mark.models
@pytest.mark.integration
@pytest.mark.db
class TestReviewRelationships:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Review relationships with other models.
    """

    def test_review_belongs_to_order_item(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test review has relationship with order_item.
        """
        seller = User(
            user_id=uuid4(),
            email="seller6@example.com",
            full_name="Seller",
            status=UserStatusEnum.ACTIVE
        )
        db.add(seller)
        db.commit()

        listing = Listing(
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            seller_id=seller.user_id,
            quantity=100
        )
        db.add(listing)
        db.commit()

        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.DELIVERED,
            subtotal=Decimal("50.00"),
            commission_amount=Decimal("5.00"),
            total_amount=Decimal("55.00")
        )
        db.add(order)
        db.commit()

        order_item = OrderItem(
            order_id=order.order_id,
            listing_id=listing.listing_id,
            
            quantity=1,
            price_at_purchase=Decimal("50.00"),
            
        )
        db.add(order_item)
        db.commit()

        review = Review(
            order_item_id=order_item.order_item_id,
            buyer_id=user.user_id,
            
            listing_id=listing.listing_id,
            seller_id=seller.user_id,
            rating=5
        )
        db.add(review)
        db.commit()
        db.refresh(review)

        assert review.order_item is not None
        assert review.order_item.order_item_id == order_item.order_item_id

    def test_review_belongs_to_buyer_and_seller(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test review has relationships with buyer and seller.
        """
        seller = User(
            user_id=uuid4(),
            email="seller7@example.com",
            full_name="Seller User",
            status=UserStatusEnum.ACTIVE
        )
        db.add(seller)
        db.commit()

        listing = Listing(
            title="Product",
            description="Test",
            price=Decimal("50.00"),
            
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            seller_id=seller.user_id,
            quantity=100
        )
        db.add(listing)
        db.commit()

        order = Order(
            buyer_id=user.user_id,
            order_status=OrderStatusEnum.DELIVERED,
            subtotal=Decimal("50.00"),
            commission_amount=Decimal("5.00"),
            total_amount=Decimal("55.00")
        )
        db.add(order)
        db.commit()

        order_item = OrderItem(
            order_id=order.order_id,
            listing_id=listing.listing_id,
            
            quantity=1,
            price_at_purchase=Decimal("50.00"),
            
        )
        db.add(order_item)
        db.commit()

        review = Review(
            order_item_id=order_item.order_item_id,
            buyer_id=user.user_id,
            
            listing_id=listing.listing_id,
            seller_id=seller.user_id,
            rating=4,
            comment="Good product"
        )
        db.add(review)
        db.commit()
        db.refresh(review)

        assert review.buyer is not None
        assert review.buyer.user_id == user.user_id
        assert review.seller is not None
        assert review.seller.user_id == seller.user_id
