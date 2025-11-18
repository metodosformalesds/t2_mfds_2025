"""
Test suite for Category model.

Este archivo demuestra cómo probar el modelo Category, incluyendo:
- Creación de categorías según el diseño AWS
- Validación de campos obligatorios
- Verificación de enums (MATERIAL vs PRODUCT)
- Jerarquía de categorías (parent/children)
- Relaciones con Listing
- Métodos de negocio (get_full_path)
"""

# Autor: Oscar Alonso Nava Rivera
# Fecha: 05/11/2025
# Descripción: Tests para el modelo Category (validaciones, jerarquía, relaciones y constraints).

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.category import Category, ListingTypeEnum


@pytest.mark.models
@pytest.mark.unit
class TestCategoryModel:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Category model creation and validation.
    """

    def test_create_category_with_required_fields(self, db):
        """
        Autor: Oscar Alonso Nava Rivera

        Test creating a category with only required fields.
        """
        category = Category(
            name="Electronics",
            slug="electronics",
            type=ListingTypeEnum.PRODUCT
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        assert category.category_id is not None
        assert category.name == "Electronics"
        assert category.slug == "electronics"
        assert category.type == ListingTypeEnum.PRODUCT
        assert category.parent_category_id is None
        assert category.created_at is not None
        assert category.updated_at is not None

    def test_create_material_category(self, db):
        """
        Autor: Oscar Alonso Nava Rivera

        Test creating a MATERIAL category for B2B marketplace.
        """
        category = Category(
            name="Metal Scraps",
            slug="metal-scraps",
            type=ListingTypeEnum.MATERIAL
        )
        db.add(category)
        db.commit()
        db.refresh(category)

        assert category.category_id is not None
        assert category.type == ListingTypeEnum.MATERIAL

    def test_category_name_unique_constraint(self, db, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that duplicate category names are not allowed for same type.
        
        Note: ix_categories_name_type enforces uniqueness on (name, type).
        """
        duplicate_category = Category(
            name=category.name,  # same name
            slug="different-slug",
            type=category.type  # same type
        )
        db.add(duplicate_category)
        
        with pytest.raises(IntegrityError):
            db.commit()

    def test_category_slug_unique_constraint(self, db, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that duplicate category slugs are not allowed globally.
        """
        duplicate_category = Category(
            name="Different Name",
            slug=category.slug,  # same slug
            type=ListingTypeEnum.MATERIAL  # different type
        )
        db.add(duplicate_category)
        
        with pytest.raises(IntegrityError):
            db.commit()

    def test_same_name_different_type_allowed(self, db):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that same name is allowed for different types.
        
        Example: "General" can exist as both MATERIAL and PRODUCT category.
        """
        material_cat = Category(
            name="General",
            slug="general-material",
            type=ListingTypeEnum.MATERIAL
        )
        product_cat = Category(
            name="General",
            slug="general-product",
            type=ListingTypeEnum.PRODUCT
        )
        db.add_all([material_cat, product_cat])
        db.commit()
        
        assert material_cat.category_id != product_cat.category_id
        assert material_cat.type == ListingTypeEnum.MATERIAL
        assert product_cat.type == ListingTypeEnum.PRODUCT


@pytest.mark.models
@pytest.mark.integration
@pytest.mark.db
class TestCategoryHierarchy:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Category hierarchical relationships.
    """

    def test_create_parent_category(self, db):
        """
        Autor: Oscar Alonso Nava Rivera

        Test creating a parent category.
        """
        parent = Category(
            name="Electronics",
            slug="electronics",
            type=ListingTypeEnum.PRODUCT
        )
        db.add(parent)
        db.commit()
        db.refresh(parent)

        assert parent.parent_category_id is None
        assert parent.parent is None
        assert len(parent.children) == 0

    def test_create_child_category(self, db):
        """
        Autor: Oscar Alonso Nava Rivera

        Test creating a child category under a parent.
        """
        parent = Category(
            name="Electronics",
            slug="electronics",
            type=ListingTypeEnum.PRODUCT
        )
        db.add(parent)
        db.commit()

        child = Category(
            name="Smartphones",
            slug="smartphones",
            type=ListingTypeEnum.PRODUCT,
            parent_category_id=parent.category_id
        )
        db.add(child)
        db.commit()
        db.refresh(parent)
        db.refresh(child)

        assert child.parent_category_id == parent.category_id
        assert child.parent == parent
        assert child in parent.children

    def test_create_multiple_child_categories(self, db):
        """
        Autor: Oscar Alonso Nava Rivera

        Test creating multiple children under same parent.
        """
        parent = Category(
            name="Electronics",
            slug="electronics",
            type=ListingTypeEnum.PRODUCT
        )
        db.add(parent)
        db.commit()

        child1 = Category(
            name="Smartphones",
            slug="smartphones",
            type=ListingTypeEnum.PRODUCT,
            parent_category_id=parent.category_id
        )
        child2 = Category(
            name="Laptops",
            slug="laptops",
            type=ListingTypeEnum.PRODUCT,
            parent_category_id=parent.category_id
        )
        db.add_all([child1, child2])
        db.commit()
        db.refresh(parent)

        assert len(parent.children) == 2
        assert child1 in parent.children
        assert child2 in parent.children

    def test_get_full_path_root_category(self, db):
        """
        Autor: Oscar Alonso Nava Rivera

        Test get_full_path for a root category.
        """
        parent = Category(
            name="Electronics",
            slug="electronics",
            type=ListingTypeEnum.PRODUCT
        )
        db.add(parent)
        db.commit()
        db.refresh(parent)

        assert parent.get_full_path() == "Electronics"

    def test_get_full_path_nested_category(self, db):
        """
        Autor: Oscar Alonso Nava Rivera

        Test get_full_path for nested categories.
        """
        # Create hierarchy: Electronics > Smartphones > Android
        parent = Category(
            name="Electronics",
            slug="electronics",
            type=ListingTypeEnum.PRODUCT
        )
        db.add(parent)
        db.commit()

        child = Category(
            name="Smartphones",
            slug="smartphones",
            type=ListingTypeEnum.PRODUCT,
            parent_category_id=parent.category_id
        )
        db.add(child)
        db.commit()

        grandchild = Category(
            name="Android",
            slug="android",
            type=ListingTypeEnum.PRODUCT,
            parent_category_id=child.category_id
        )
        db.add(grandchild)
        db.commit()
        db.refresh(grandchild)

        assert grandchild.get_full_path() == "Electronics > Smartphones > Android"


@pytest.mark.models
@pytest.mark.integration
@pytest.mark.db
class TestCategoryRelationships:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Category relationships with other models.
    """

    def test_category_can_have_listings(self, db, user, category):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that a category can have multiple listings.
        """
        from app.models.listing import Listing, ListingStatusEnum, ListingTypeEnum

        listing1 = Listing(
            title="Listing 1",
            description="Desc 1",
            price="100.00",
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE
        )
        listing2 = Listing(
            title="Listing 2",
            description="Desc 2",
            price="200.00",
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE
        )
        db.add_all([listing1, listing2])
        db.commit()
        db.refresh(category)

        assert len(category.listings) == 2
        assert listing1 in category.listings
        assert listing2 in category.listings

    def test_category_delete_restricted_with_listings(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that deleting a category with listings is restricted.
        
        Note: Category uses ondelete='RESTRICT' for listings to prevent
        orphaned listings. Must delete listings first before category.
        """
        from app.models.listing import Listing, ListingStatusEnum, ListingTypeEnum
        from sqlalchemy.exc import IntegrityError

        # Create category and listing
        category = Category(
            name="Test Category",
            slug="test-cat",
            type=ListingTypeEnum.PRODUCT
        )
        db.add(category)
        db.commit()

        listing = Listing(
            title="Test Listing",
            description="Test description",
            price="100.00",
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.PRODUCT,
            status=ListingStatusEnum.ACTIVE
        )
        db.add(listing)
        db.commit()

        # Try to delete category - should fail with IntegrityError
        db.delete(category)
        
        with pytest.raises(IntegrityError):
            db.commit()


@pytest.mark.models
@pytest.mark.unit
class TestCategoryEnums:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Category enum values.
    """

    def test_listing_type_enum_values(self):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that ListingTypeEnum has expected values.
        """
        assert ListingTypeEnum.MATERIAL == "MATERIAL"
        assert ListingTypeEnum.PRODUCT == "PRODUCT"

    def test_create_categories_with_both_types(self, db):
        """
        Autor: Oscar Alonso Nava Rivera

        Test creating categories for both marketplaces.
        """
        material_cat = Category(
            name="Metal",
            slug="metal",
            type=ListingTypeEnum.MATERIAL
        )
        product_cat = Category(
            name="Furniture",
            slug="furniture",
            type=ListingTypeEnum.PRODUCT
        )
        db.add_all([material_cat, product_cat])
        db.commit()

        assert material_cat.type == ListingTypeEnum.MATERIAL
        assert product_cat.type == ListingTypeEnum.PRODUCT


@pytest.mark.models
@pytest.mark.unit
class TestCategoryFactory:
    """
    Autor: Oscar Alonso Nava Rivera

    Test creating multiple categories using fixtures.
    """

    def test_create_multiple_categories_with_factory(self, db):
        """
        Autor: Oscar Alonso Nava Rivera

        Test creating multiple categories programmatically.
        """
        categories = [
            Category(
                name=f"Category {i}",
                slug=f"category-{i}",
                type=ListingTypeEnum.PRODUCT
            )
            for i in range(5)
        ]
        db.add_all(categories)
        db.commit()

        # Verify all categories were created
        assert all(cat.category_id is not None for cat in categories)
        assert len(categories) == 5
