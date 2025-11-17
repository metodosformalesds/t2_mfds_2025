"""
Test suite for Listing model.

Tests para el modelo Listing que representa publicaciones en el marketplace
tanto para materiales.

Conceptos clave:
- Listing puede ser MATERIAL o PRODUCT (enum ListingTypeEnum)
- Estados de moderación: PENDING, ACTIVE, REJECTED, INACTIVE
- Relaciones: seller (User), category, location (Address), images
- Métodos de negocio: is_available(), reduce_stock(), get_price_display()
"""

# Autor: Oscar Alonso Nava Rivera
# Fecha: 07/11/2025
# Descripción: Tests unitarios para el modelo Listing (tipos, estados, relaciones y métodos de negocio).

import pytest
from uuid import uuid4
from decimal import Decimal
from sqlalchemy.exc import IntegrityError

from app.models.listing import Listing, ListingStatusEnum
from app.models.category import ListingTypeEnum
from app.models.user import User, UserRoleEnum, UserStatusEnum
from app.models.address import Address


@pytest.mark.models
@pytest.mark.unit
class TestListingModel:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Listing model creation and validation.
    """

    def test_create_listing_with_required_fields(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test creating a listing with required fields only.
        """
        listing = Listing(
            title="Wood Pallets",
            description="High quality recycled wood pallets",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.MATERIAL,
            quantity=100
        )
        db.add(listing)
        db.commit()
        db.refresh(listing)

        assert listing.listing_id is not None
        assert listing.title == "Wood Pallets"
        assert listing.price == Decimal("50.00")
        assert listing.seller_id == user.user_id
        assert listing.status == ListingStatusEnum.PENDING  # default
        assert listing.quantity == 100
        assert listing.created_at is not None
        assert listing.updated_at is not None

    def test_create_listing_material_type(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test creating a MATERIAL listing (B2B marketplace).
        """
        listing = Listing(
            title="Recycled Plastic Bottles",
            description="PET plastic bottles ready for recycling",
            price=Decimal("25.50"),
            price_unit="Kg",
            quantity=500,
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.MATERIAL,
            origin_description="Collected from local restaurants"
        )
        db.add(listing)
        db.commit()
        db.refresh(listing)

        assert listing.listing_type == ListingTypeEnum.MATERIAL
        assert listing.price_unit == "Kg"
        assert listing.origin_description is not None

    def test_create_listing_product_type(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test creating a PRODUCT listing (B2C marketplace).
        """
        listing = Listing(
            title="Handcrafted Bag from Recycled Materials",
            description="Beautiful bag made from recycled plastic",
            price=Decimal("150.00"),
            quantity=10,
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT
        )
        db.add(listing)
        db.commit()
        db.refresh(listing)

        assert listing.listing_type == ListingTypeEnum.PRODUCT
        assert listing.quantity == 10

    def test_listing_with_location_address(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test creating a listing with physical location.
        """
        address = Address(
            user_id=user.user_id,
            street="123 Industrial Ave",
            city="Monterrey",
            state="Nuevo León",
            postal_code="64000",
            country="MX"
        )
        db.add(address)
        db.commit()

        listing = Listing(
            title="Metal Scraps",
            description="Various metal scraps for recycling",
            price=Decimal("30.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.MATERIAL,
            location_address_id=address.address_id,
            quantity=200
        )
        db.add(listing)
        db.commit()
        db.refresh(listing)

        assert listing.location is not None
        assert listing.location.city == "Monterrey"
        assert listing.location_address_id == address.address_id

    def test_listing_status_default_pending(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that new listings default to PENDING status.
        """
        listing = Listing(
            title="Test Listing",
            description="Test Description",
            price=Decimal("100.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=5
        )
        db.add(listing)
        db.commit()
        db.refresh(listing)

        assert listing.status == ListingStatusEnum.PENDING

    def test_listing_approved_by_admin(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test listing approval by admin.
        """
        admin = User(
            user_id=uuid4(),
            email="admin@example.com",
            full_name="Admin User",
            role=UserRoleEnum.ADMIN,
            status=UserStatusEnum.ACTIVE
        )
        db.add(admin)
        db.commit()

        listing = Listing(
            title="Approved Listing",
            description="This listing is approved",
            price=Decimal("75.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.MATERIAL,
            status=ListingStatusEnum.ACTIVE,
            approved_by_admin_id=admin.user_id,
            quantity=50
        )
        db.add(listing)
        db.commit()
        db.refresh(listing)

        assert listing.status == ListingStatusEnum.ACTIVE
        assert listing.approved_by_admin_id == admin.user_id
        assert listing.approved_by is not None


@pytest.mark.models
@pytest.mark.unit
class TestListingBusinessMethods:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Listing business logic methods.
    """

    def test_is_available_active_with_stock(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test is_available returns True for active listings with stock.
        """
        listing = Listing(
            title="Available Listing",
            description="Has stock and is active",
            price=Decimal("100.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            quantity=10
        )
        db.add(listing)
        db.commit()

        assert listing.is_available() is True

    def test_is_available_inactive(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test is_available returns False for inactive listings.
        """
        listing = Listing(
            title="Inactive Listing",
            description="Not available",
            price=Decimal("100.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.INACTIVE,
            quantity=10
        )
        db.add(listing)
        db.commit()

        assert listing.is_available() is False

    def test_is_available_no_stock(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test is_available returns False when out of stock.
        """
        listing = Listing(
            title="Out of Stock Listing",
            description="No stock available",
            price=Decimal("100.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE,
            quantity=0
        )
        db.add(listing)
        db.commit()

        assert listing.is_available() is False

    def test_reduce_stock_success(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test reduce_stock successfully reduces quantity.
        """
        listing = Listing(
            title="Test Stock",
            description="Testing stock reduction",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=100
        )
        db.add(listing)
        db.commit()

        result = listing.reduce_stock(30)
        db.commit()

        assert result is True
        assert listing.quantity == 70

    def test_reduce_stock_insufficient(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test reduce_stock fails when insufficient stock.
        """
        listing = Listing(
            title="Test Stock",
            description="Testing insufficient stock",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=10
        )
        db.add(listing)
        db.commit()

        result = listing.reduce_stock(20)

        assert result is False
        assert listing.quantity == 10  # No cambió

    def test_get_price_display_with_unit(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test get_price_display with price_unit.
        """
        listing = Listing(
            title="Material with Unit",
            description="Has price unit",
            price=Decimal("45.50"),
            price_unit="Kg",
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.MATERIAL,
            quantity=100
        )
        db.add(listing)
        db.commit()

        assert listing.get_price_display() == "$45.50/Kg"

    def test_get_price_display_without_unit(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test get_price_display without price_unit.
        """
        listing = Listing(
            title="Product without Unit",
            description="No price unit",
            price=Decimal("120.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=5
        )
        db.add(listing)
        db.commit()

        assert listing.get_price_display() == "$120.00"

    def test_get_primary_image_no_images(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test get_primary_image returns None when no images.
        """
        listing = Listing(
            title="No Images",
            description="Listing without images",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=1
        )
        db.add(listing)
        db.commit()

        assert listing.get_primary_image() is None


@pytest.mark.models
@pytest.mark.integration
@pytest.mark.db
class TestListingRelationships:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Listing relationships with other models.
    """

    def test_listing_belongs_to_seller(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test listing has relationship with seller (User).
        """
        listing = Listing(
            title="Seller Test",
            description="Testing seller relationship",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=10
        )
        db.add(listing)
        db.commit()
        db.refresh(listing)

        assert listing.seller is not None
        assert listing.seller.user_id == user.user_id
        assert listing.seller.email == user.email

    def test_user_can_have_multiple_listings(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test user can have multiple listings as seller.
        """
        listing1 = Listing(
            title="Listing 1",
            description="First listing",
            price=Decimal("100.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=5
        )
        listing2 = Listing(
            title="Listing 2",
            description="Second listing",
            price=Decimal("200.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.MATERIAL,
            quantity=50
        )
        db.add_all([listing1, listing2])
        db.commit()
        db.refresh(user)

        assert len(user.listings) >= 2
        listing_ids = [l.listing_id for l in user.listings]
        assert listing1.listing_id in listing_ids
        assert listing2.listing_id in listing_ids

    def test_listing_belongs_to_category(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test listing has relationship with category.
        """
        listing = Listing(
            title="Category Test",
            description="Testing category relationship",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=10
        )
        db.add(listing)
        db.commit()
        db.refresh(listing)

        assert listing.category is not None
        assert listing.category.category_id == category.category_id
        assert listing.category.name == category.name

    def test_listing_cascade_delete_with_seller(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test listing is deleted when seller is deleted (CASCADE).
        """
        listing = Listing(
            title="Cascade Test",
            description="Testing cascade delete",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=10
        )
        db.add(listing)
        db.commit()
        listing_id = listing.listing_id

        # Eliminar usuario debe eliminar listing
        db.delete(user)
        db.commit()

        deleted_listing = db.query(Listing).filter_by(listing_id=listing_id).first()
        assert deleted_listing is None


@pytest.mark.models
@pytest.mark.unit
class TestListingStatusEnum:
    """
    Autor: Oscar Alonso Nava Rivera

    Test ListingStatusEnum values.
    """

    def test_listing_status_enum_values(self):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that ListingStatusEnum has expected values.
        """
        assert ListingStatusEnum.PENDING == "PENDING"
        assert ListingStatusEnum.ACTIVE == "ACTIVE"
        assert ListingStatusEnum.REJECTED == "REJECTED"
        assert ListingStatusEnum.INACTIVE == "INACTIVE"

    def test_listing_status_transitions(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test transitioning between listing statuses.
        """
        listing = Listing(
            title="Status Transitions",
            description="Testing status changes",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=10
        )
        db.add(listing)
        db.commit()

        # Start as PENDING
        assert listing.status == ListingStatusEnum.PENDING

        # Activate
        listing.status = ListingStatusEnum.ACTIVE
        db.commit()
        assert listing.status == ListingStatusEnum.ACTIVE

        # Deactivate
        listing.status = ListingStatusEnum.INACTIVE
        db.commit()
        assert listing.status == ListingStatusEnum.INACTIVE


@pytest.mark.models
@pytest.mark.unit
class TestListingConstraints:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Listing database constraints.
    """

    def test_listing_requires_seller(self, db, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that seller_id is required.
        """
        listing = Listing(
            title="No Seller",
            description="Missing seller",
            price=Decimal("50.00"),
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=10
            # seller_id is missing
        )
        db.add(listing)
        
        with pytest.raises(IntegrityError):
            db.commit()

    def test_listing_requires_category(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that category_id is required.
        """
        listing = Listing(
            title="No Category",
            description="Missing category",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=10
            # category_id is missing
        )
        db.add(listing)
        
        with pytest.raises(IntegrityError):
            db.commit()

    def test_listing_price_precision(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that price has proper decimal precision.
        """
        listing = Listing(
            title="Price Precision Test",
            description="Testing decimal precision",
            price=Decimal("99.99"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=10
        )
        db.add(listing)
        db.commit()
        db.refresh(listing)

        assert listing.price == Decimal("99.99")
        assert isinstance(listing.price, Decimal)
