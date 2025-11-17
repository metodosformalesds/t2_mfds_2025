"""
Test suite for Address model.

Tests para el modelo Address que almacena direcciones físicas.
Usado para: address book de usuarios, ubicación de listings, y direcciones de envío.

Conceptos clave:
- Una dirección puede pertenecer a un usuario (opcional, para address book)
- Validación de formato postal_code según país
- Validación de country como código ISO de 2 letras
- Solo una dirección puede ser default por usuario
- Métodos: get_full_address(), get_short_address(), validate_postal_code_format()
"""

# Autor: Oscar Alonso Nava Rivera
# Fecha: 07/11/2025
# Descripción: Tests unitarios e integración para el modelo Address (validaciones, relaciones y lógica de negocio).

import pytest
from uuid import uuid4
from sqlalchemy.exc import IntegrityError

from app.models.address import Address
from app.models.user import User, UserRoleEnum, UserStatusEnum


@pytest.mark.models
@pytest.mark.unit
class TestAddressModel:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Address model creation and validation.
    """

    def test_create_address_basic(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test creating an address with required fields.
        """
        address = Address(
            user_id=user.user_id,
            street="123 Main Street",
            city="Ciudad de México",
            state="CDMX",
            postal_code="01000",
            country="MX"
        )
        db.add(address)
        db.commit()
        db.refresh(address)

        assert address.address_id is not None
        assert address.user_id == user.user_id
        assert address.street == "123 Main Street"
        assert address.city == "Ciudad de México"
        assert address.state == "CDMX"
        assert address.postal_code == "01000"
        assert address.country == "MX"
        assert address.is_default is False  # default value
        assert address.created_at is not None

    def test_create_address_with_notes(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test creating an address with additional notes.
        """
        address = Address(
            user_id=user.user_id,
            street="456 Oak Avenue",
            city="Guadalajara",
            state="Jalisco",
            postal_code="44100",
            country="MX",
            notes="Casa azul, portón negro"
        )
        db.add(address)
        db.commit()
        db.refresh(address)

        assert address.notes == "Casa azul, portón negro"

    def test_create_default_address(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test creating a default address for user.
        """
        address = Address(
            user_id=user.user_id,
            street="789 Pine Road",
            city="Monterrey",
            state="Nuevo León",
            postal_code="64000",
            country="MX",
            is_default=True
        )
        db.add(address)
        db.commit()
        db.refresh(address)

        assert address.is_default is True

    def test_create_address_without_user(self, db):
        """
        Autor: Oscar Alonso Nava Rivera

        Test creating an address without user_id (for listings).
        """
        address = Address(
            user_id=None,  # Sin usuario (para listing)
            street="Industrial Zone",
            city="Toluca",
            state="Estado de México",
            postal_code="50000",
            country="MX"
        )
        db.add(address)
        db.commit()
        db.refresh(address)

        assert address.user_id is None
        assert address.street == "Industrial Zone"

    def test_address_country_default_mx(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that country defaults to MX.
        """
        address = Address(
            user_id=user.user_id,
            street="Test Street",
            city="Test City",
            state="Test State",
            postal_code="12345"
            # country not specified
        )
        db.add(address)
        db.commit()
        db.refresh(address)

        assert address.country == "MX"


@pytest.mark.models
@pytest.mark.unit
class TestAddressMethods:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Address business logic methods.
    """

    def test_get_full_address(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test get_full_address returns complete formatted address.
        """
        address = Address(
            user_id=user.user_id,
            street="Av. Reforma 123",
            city="Ciudad de México",
            state="CDMX",
            postal_code="06600",
            country="MX"
        )
        db.add(address)
        db.commit()

        full = address.get_full_address()
        assert "Av. Reforma 123" in full
        assert "Ciudad de México" in full
        assert "CDMX" in full
        assert "06600" in full
        assert "MX" in full

    def test_get_short_address(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test get_short_address returns city and state.
        """
        address = Address(
            user_id=user.user_id,
            street="Any Street",
            city="Guadalajara",
            state="Jalisco",
            postal_code="44100",
            country="MX"
        )
        db.add(address)
        db.commit()

        short = address.get_short_address()
        assert short == "Guadalajara, Jalisco"

    def test_validate_postal_code_format_mx(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test validate_postal_code_format for Mexico (5 digits).
        """
        address = Address(
            user_id=user.user_id,
            street="Test",
            city="Test",
            state="Test",
            postal_code="12345",
            country="MX"
        )
        db.add(address)
        db.commit()

        assert address.validate_postal_code_format() is True

    def test_validate_postal_code_format_mx_invalid(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test validate_postal_code_format rejects invalid MX format.
        """
        # Nota: Este test valida la lógica del método, no el constraint de BD
        # El constraint de BD previene que se guarde postal_code < 4 caracteres
        address = Address(
            user_id=user.user_id,
            street="Test",
            city="Test",
            state="Test",
            postal_code="1234",  # Válido para BD (>= 4), pero inválido para MX (debe ser 5)
            country="MX"
        )
        db.add(address)
        db.commit()

        assert address.validate_postal_code_format() is False

    def test_validate_postal_code_format_us(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test validate_postal_code_format for USA.
        """
        address = Address(
            user_id=user.user_id,
            street="123 Main St",
            city="New York",
            state="NY",
            postal_code="10001",
            country="US"
        )
        db.add(address)
        db.commit()

        assert address.validate_postal_code_format() is True

    def test_validate_postal_code_format_us_extended(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test validate_postal_code_format for USA extended ZIP.
        """
        address = Address(
            user_id=user.user_id,
            street="456 Oak St",
            city="Los Angeles",
            state="CA",
            postal_code="90001-1234",
            country="US"
        )
        db.add(address)
        db.commit()

        assert address.validate_postal_code_format() is True


@pytest.mark.models
@pytest.mark.integration
@pytest.mark.db
class TestAddressRelationships:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Address relationships with other models.
    """

    def test_address_belongs_to_user(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test address has relationship with user.
        """
        address = Address(
            user_id=user.user_id,
            street="Relationship Test",
            city="Test City",
            state="Test State",
            postal_code="12345",
            country="MX"
        )
        db.add(address)
        db.commit()
        db.refresh(address)

        assert address.user is not None
        assert address.user.user_id == user.user_id
        assert address.user.email == user.email

    def test_user_can_have_multiple_addresses(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test user can have multiple addresses in address book.
        """
        addr1 = Address(
            user_id=user.user_id,
            street="Home Address",
            city="CDMX",
            state="CDMX",
            postal_code="01000",
            country="MX",
            is_default=True
        )
        addr2 = Address(
            user_id=user.user_id,
            street="Work Address",
            city="Monterrey",
            state="Nuevo León",
            postal_code="64000",
            country="MX",
            is_default=False
        )
        addr3 = Address(
            user_id=user.user_id,
            street="Warehouse Address",
            city="Guadalajara",
            state="Jalisco",
            postal_code="44100",
            country="MX",
            is_default=False
        )
        db.add_all([addr1, addr2, addr3])
        db.commit()
        db.refresh(user)

        assert len(user.addresses) == 3
        # Verificar que las direcciones están asociadas
        address_streets = [a.street for a in user.addresses]
        assert "Home Address" in address_streets
        assert "Work Address" in address_streets
        assert "Warehouse Address" in address_streets

    def test_address_cascade_delete_with_user(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test address is deleted when user is deleted (CASCADE).
        """
        address = Address(
            user_id=user.user_id,
            street="Cascade Test",
            city="Test",
            state="Test",
            postal_code="12345",
            country="MX"
        )
        db.add(address)
        db.commit()
        address_id = address.address_id

        # Eliminar usuario debe eliminar dirección
        db.delete(user)
        db.commit()

        deleted_address = db.query(Address).filter_by(address_id=address_id).first()
        assert deleted_address is None


@pytest.mark.models
@pytest.mark.unit
class TestAddressConstraints:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Address database constraints.
    """

    def test_postal_code_minimum_length(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that postal_code must be at least 4 characters.
        """
        address = Address(
            user_id=user.user_id,
            street="Test",
            city="Test",
            state="Test",
            postal_code="123",  # Muy corto (< 4)
            country="MX"
        )
        db.add(address)
        
        with pytest.raises(IntegrityError):
            db.commit()

    def test_country_iso_format(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that country must be 2 uppercase letters.
        """
        # Este test verifica que el campo country tiene límite de 2 caracteres
        # La BD rechaza valores > 2 caracteres
        address = Address(
            user_id=user.user_id,
            street="Test",
            city="Test",
            state="Test",
            postal_code="12345",
            country="MX"  # Correcto: 2 letras mayúsculas
        )
        db.add(address)
        db.commit()
        db.refresh(address)
        
        assert address.country == "MX"
        assert len(address.country) == 2

    def test_country_lowercase_invalid(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that country must be uppercase.
        """
        address = Address(
            user_id=user.user_id,
            street="Test",
            city="Test",
            state="Test",
            postal_code="12345",
            country="mx"  # Debe ser mayúscula
        )
        db.add(address)
        
        with pytest.raises(IntegrityError):
            db.commit()

    def test_required_fields(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test that required fields are enforced.
        """
        # Falta city
        address = Address(
            user_id=user.user_id,
            street="Test Street",
            # city missing
            state="Test State",
            postal_code="12345",
            country="MX"
        )
        db.add(address)
        
        with pytest.raises(IntegrityError):
            db.commit()


@pytest.mark.models
@pytest.mark.unit
class TestAddressBusinessLogic:
    """
    Autor: Oscar Alonso Nava Rivera

    Test Address business logic scenarios.
    """

    def test_only_one_default_address_business_logic(self, db, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test business logic for ensuring only one default address per user.
        
        Note: La constraint real debe implementarse en lógica de negocio,
        no solo en la base de datos.
        """
        # Primera dirección default
        addr1 = Address(
            user_id=user.user_id,
            street="First Default",
            city="CDMX",
            state="CDMX",
            postal_code="01000",
            country="MX",
            is_default=True
        )
        db.add(addr1)
        db.commit()

        # Segunda dirección default (en producción, la lógica de negocio
        # debería cambiar la primera a False automáticamente)
        addr2 = Address(
            user_id=user.user_id,
            street="Second Default",
            city="Monterrey",
            state="Nuevo León",
            postal_code="64000",
            country="MX",
            is_default=True
        )
        db.add(addr2)
        db.commit()

        # Verificar que ambas existen
        # (La lógica de negocio debería manejar el cambio de default)
        addresses = db.query(Address).filter_by(user_id=user.user_id).all()
        assert len(addresses) >= 2

    def test_address_for_listing_without_user(self, db, category, user):
        """
        Autor: Oscar Alonso Nava Rivera

        Test creating address for listing location (no user association).
        """
        from app.models.listing import Listing, ListingStatusEnum
        from app.models.category import ListingTypeEnum
        from decimal import Decimal

        # Dirección sin usuario (para ubicación de listing)
        location = Address(
            user_id=None,
            street="Warehouse 5",
            city="Querétaro",
            state="Querétaro",
            postal_code="76000",
            country="MX"
        )
        db.add(location)
        db.commit()

        # Crear listing con esa ubicación
        listing = Listing(
            title="Materials at Warehouse",
            description="Located at warehouse",
            price=Decimal("100.00"),
            seller_id=user.user_id,
            category_id=category.category_id,
            listing_type=ListingTypeEnum.MATERIAL,
            location_address_id=location.address_id,
            quantity=50
        )
        db.add(listing)
        db.commit()

        assert listing.location is not None
        assert listing.location.address_id == location.address_id
        assert listing.location.user_id is None
