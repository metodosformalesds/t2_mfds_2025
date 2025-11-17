"""
Test suite for ListingImage model.

Tests para el modelo ListingImage que almacena imágenes asociadas a listings.
Las imágenes se almacenan en S3, este modelo solo guarda las URLs.

Conceptos clave:
- Una imagen pertenece a un listing (relación Many-to-One)
- Solo puede haber UNA imagen primaria por listing
- image_url debe ser único globalmente
- Método get_thumbnail_url() para generar miniaturas
"""

# Autor: Oscar Alonso Nava Rivera
# Fecha: 07/11/2025
# Descripción: Tests para el modelo ListingImage (creación, constraints, métodos y relaciones).

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.listing import Listing, ListingStatusEnum
from app.models.listing_image import ListingImage
from app.models.category import ListingTypeEnum
from decimal import Decimal


@pytest.mark.models
@pytest.mark.unit
class TestListingImageModel:
    """
    Autor: Oscar Alonso Nava Rivera

    Test ListingImage model creation and validation.
    """

    def test_create_listing_image_basic(self, db, user, category):
        """Test creating a listing image with required fields."""
        listing = Listing(
            title="Test Listing",
            description="Listing with image",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=10
        )
        db.add(listing)
        db.commit()

        image = ListingImage(
            listing_id=listing.listing_id,
            image_url="https://s3.amazonaws.com/bucket/image1.jpg",
            is_primary=False
        )
        db.add(image)
        db.commit()
        db.refresh(image)

        assert image.image_id is not None
        assert image.listing_id == listing.listing_id
        assert image.image_url == "https://s3.amazonaws.com/bucket/image1.jpg"
        assert image.is_primary is False
        assert image.created_at is not None

    def test_create_primary_image(self, db, user, category):
        """Test creating a primary image for a listing."""
        listing = Listing(
            title="Test Listing",
            description="Listing with primary image",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=10
        )
        db.add(listing)
        db.commit()

        image = ListingImage(
            listing_id=listing.listing_id,
            image_url="https://s3.amazonaws.com/bucket/primary.jpg",
            is_primary=True
        )
        db.add(image)
        db.commit()
        db.refresh(image)

        assert image.is_primary is True

    def test_listing_can_have_multiple_images(self, db, user, category):
        """Test that a listing can have multiple images."""
        listing = Listing(
            title="Multi-Image Listing",
            description="Listing with multiple images",
            price=Decimal("100.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=5
        )
        db.add(listing)
        db.commit()

        image1 = ListingImage(
            listing_id=listing.listing_id,
            image_url="https://s3.amazonaws.com/bucket/img1.jpg",
            is_primary=True
        )
        image2 = ListingImage(
            listing_id=listing.listing_id,
            image_url="https://s3.amazonaws.com/bucket/img2.jpg",
            is_primary=False
        )
        image3 = ListingImage(
            listing_id=listing.listing_id,
            image_url="https://s3.amazonaws.com/bucket/img3.jpg",
            is_primary=False
        )
        db.add_all([image1, image2, image3])
        db.commit()
        db.refresh(listing)

        assert len(listing.images) == 3

    def test_image_url_unique_constraint(self, db, user, category):
        """Test that image_url must be unique across all images."""
        listing = Listing(
            title="Test Listing",
            description="Testing unique URL constraint",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=10
        )
        db.add(listing)
        db.commit()

        # Primera imagen
        image1 = ListingImage(
            listing_id=listing.listing_id,
            image_url="https://s3.amazonaws.com/bucket/duplicate.jpg",
            is_primary=False
        )
        db.add(image1)
        db.commit()

        # Intentar crear imagen con misma URL (debe fallar)
        image2 = ListingImage(
            listing_id=listing.listing_id,
            image_url="https://s3.amazonaws.com/bucket/duplicate.jpg",
            is_primary=False
        )
        db.add(image2)
        
        with pytest.raises(IntegrityError):
            db.commit()

    def test_only_one_primary_image_per_listing(self, db, user, category):
        """Test that only one image can be primary per listing."""
        listing = Listing(
            title="Primary Constraint Test",
            description="Testing primary image constraint",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=10
        )
        db.add(listing)
        db.commit()

        # Primera imagen primaria (OK)
        image1 = ListingImage(
            listing_id=listing.listing_id,
            image_url="https://s3.amazonaws.com/bucket/primary1.jpg",
            is_primary=True
        )
        db.add(image1)
        db.commit()

        # Segunda imagen primaria para el mismo listing (debe fallar)
        image2 = ListingImage(
            listing_id=listing.listing_id,
            image_url="https://s3.amazonaws.com/bucket/primary2.jpg",
            is_primary=True
        )
        db.add(image2)
        
        with pytest.raises(IntegrityError):
            db.commit()


@pytest.mark.models
@pytest.mark.unit
class TestListingImageMethods:
    """
    Autor: Oscar Alonso Nava Rivera

    Test ListingImage business logic methods.
    """

    def test_get_thumbnail_url_returns_url(self, db, user, category):
        """Test get_thumbnail_url method returns URL."""
        listing = Listing(
            title="Thumbnail Test",
            description="Testing thumbnail URL",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=10
        )
        db.add(listing)
        db.commit()

        image = ListingImage(
            listing_id=listing.listing_id,
            image_url="https://s3.amazonaws.com/bucket/original.jpg",
            is_primary=True
        )
        db.add(image)
        db.commit()

        # Por ahora retorna la URL original
        # TODO: En producción debería transformar con CloudFront
        thumbnail = image.get_thumbnail_url()
        assert thumbnail == "https://s3.amazonaws.com/bucket/original.jpg"

    def test_get_thumbnail_url_with_custom_size(self, db, user, category):
        """Test get_thumbnail_url with custom size parameter."""
        listing = Listing(
            title="Custom Size Test",
            description="Testing custom thumbnail size",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=10
        )
        db.add(listing)
        db.commit()

        image = ListingImage(
            listing_id=listing.listing_id,
            image_url="https://s3.amazonaws.com/bucket/image.jpg",
            is_primary=True
        )
        db.add(image)
        db.commit()

        # Probar con tamaño personalizado
        thumbnail = image.get_thumbnail_url(size="500x500")
        assert thumbnail is not None


@pytest.mark.models
@pytest.mark.integration
@pytest.mark.db
class TestListingImageRelationships:
    """
    Autor: Oscar Alonso Nava Rivera

    Test ListingImage relationships with other models.
    """

    def test_image_belongs_to_listing(self, db, user, category):
        """Test that image has proper relationship with listing."""
        listing = Listing(
            title="Relationship Test",
            description="Testing listing relationship",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=10
        )
        db.add(listing)
        db.commit()

        image = ListingImage(
            listing_id=listing.listing_id,
            image_url="https://s3.amazonaws.com/bucket/relationship.jpg",
            is_primary=True
        )
        db.add(image)
        db.commit()
        db.refresh(image)

        assert image.listing is not None
        assert image.listing.listing_id == listing.listing_id
        assert image.listing.title == "Relationship Test"

    def test_listing_images_cascade_delete(self, db, user, category):
        """Test that images are deleted when listing is deleted."""
        listing = Listing(
            title="Cascade Delete Test",
            description="Testing cascade delete",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=10
        )
        db.add(listing)
        db.commit()

        image = ListingImage(
            listing_id=listing.listing_id,
            image_url="https://s3.amazonaws.com/bucket/cascade.jpg",
            is_primary=True
        )
        db.add(image)
        db.commit()
        image_id = image.image_id

        # Eliminar listing debe eliminar imagen
        db.delete(listing)
        db.commit()

        deleted_image = db.query(ListingImage).filter_by(image_id=image_id).first()
        assert deleted_image is None

    def test_get_primary_image_from_listing(self, db, user, category):
        """Test Listing.get_primary_image() method returns primary image."""
        listing = Listing(
            title="Get Primary Test",
            description="Testing get primary image",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=10
        )
        db.add(listing)
        db.commit()

        # Agregar imagen primaria
        primary_img = ListingImage(
            listing_id=listing.listing_id,
            image_url="https://s3.amazonaws.com/bucket/primary.jpg",
            is_primary=True
        )
        # Agregar imágenes secundarias
        secondary_img1 = ListingImage(
            listing_id=listing.listing_id,
            image_url="https://s3.amazonaws.com/bucket/secondary1.jpg",
            is_primary=False
        )
        secondary_img2 = ListingImage(
            listing_id=listing.listing_id,
            image_url="https://s3.amazonaws.com/bucket/secondary2.jpg",
            is_primary=False
        )
        db.add_all([primary_img, secondary_img1, secondary_img2])
        db.commit()
        db.refresh(listing)

        # Obtener imagen primaria
        primary = listing.get_primary_image()
        assert primary is not None
        assert primary.is_primary is True
        assert primary.image_url == "https://s3.amazonaws.com/bucket/primary.jpg"

    def test_get_primary_image_when_none_marked(self, db, user, category):
        """Test get_primary_image returns first image when none marked as primary."""
        listing = Listing(
            title="No Primary Test",
            description="Testing fallback to first image",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=10
        )
        db.add(listing)
        db.commit()

        # Agregar solo imágenes no primarias
        img1 = ListingImage(
            listing_id=listing.listing_id,
            image_url="https://s3.amazonaws.com/bucket/img1.jpg",
            is_primary=False
        )
        img2 = ListingImage(
            listing_id=listing.listing_id,
            image_url="https://s3.amazonaws.com/bucket/img2.jpg",
            is_primary=False
        )
        db.add_all([img1, img2])
        db.commit()
        db.refresh(listing)

        # Debe retornar la primera imagen como fallback
        primary = listing.get_primary_image()
        assert primary is not None
        # Debe ser una de las imágenes (el orden puede variar)
        assert primary.listing_id == listing.listing_id


@pytest.mark.models
@pytest.mark.unit
class TestListingImageConstraints:
    """
    Autor: Oscar Alonso Nava Rivera

    Test ListingImage database constraints.
    """

    def test_image_requires_listing_id(self, db):
        """Test that listing_id is required."""
        image = ListingImage(
            # listing_id is missing
            image_url="https://s3.amazonaws.com/bucket/orphan.jpg",
            is_primary=False
        )
        db.add(image)
        
        with pytest.raises(IntegrityError):
            db.commit()

    def test_image_requires_image_url(self, db, user, category):
        """Test that image_url is required."""
        listing = Listing(
            title="URL Required Test",
            description="Testing URL requirement",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=10
        )
        db.add(listing)
        db.commit()

        image = ListingImage(
            listing_id=listing.listing_id,
            # image_url is missing
            is_primary=False
        )
        db.add(image)
        
        with pytest.raises(IntegrityError):
            db.commit()

    def test_is_primary_defaults_to_false(self, db, user, category):
        """Test that is_primary defaults to False."""
        listing = Listing(
            title="Default Test",
            description="Testing default value",
            price=Decimal("50.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            quantity=10
        )
        db.add(listing)
        db.commit()

        image = ListingImage(
            listing_id=listing.listing_id,
            image_url="https://s3.amazonaws.com/bucket/default.jpg"
            # is_primary not specified
        )
        db.add(image)
        db.commit()
        db.refresh(image)

        assert image.is_primary is False
