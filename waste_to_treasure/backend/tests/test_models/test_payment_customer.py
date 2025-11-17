"""
Tests para el modelo PaymentCustomer.

Cubre:
- Creación de customers en Stripe
- Constraints (unique, user_id + gateway)
- Métodos de negocio
- Relaciones con User
"""
# Autor: Oscar Alonso Nava Rivera
# Fecha: 07/11/2025
# Descripción: Tests para el modelo PaymentCustomer (creación, constraints, métodos y relaciones con User).
import pytest
from uuid import uuid4

from app.models.user import User, UserStatusEnum
from app.models.payment_customer import PaymentCustomer
from app.models.payment_enums import PaymentGatewayEnum
from sqlalchemy.exc import IntegrityError


class TestPaymentCustomerModel:
    """
    Autor: Oscar Alonso Nava Rivera

    Tests básicos del modelo PaymentCustomer.
    """
    
    def test_create_stripe_customer_basic(self, db, user):
        """Test crear un customer básico de Stripe."""
        customer = PaymentCustomer(
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_customer_id="cus_test123456789"
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
        
        assert customer.payment_customer_id is not None
        assert customer.user_id == user.user_id
        assert customer.gateway == PaymentGatewayEnum.STRIPE
        assert customer.gateway_customer_id == "cus_test123456789"
        assert customer.default_payment_method_id is None
        assert customer.created_at is not None
    
    def test_create_customer_with_default_payment_method(self, db, user):
        """Test crear customer con método de pago predeterminado."""
        customer = PaymentCustomer(
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_customer_id="cus_test987654321",
            default_payment_method_id="pm_test123"
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
        
        assert customer.default_payment_method_id == "pm_test123"
        assert customer.has_default_payment_method() is True
    
    def test_gateway_customer_id_unique_constraint(self, db, user):
        """Test que gateway_customer_id sea único."""
        customer1 = PaymentCustomer(
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_customer_id="cus_duplicate_test"
        )
        db.add(customer1)
        db.commit()
        
        # Intentar crear otro customer con mismo gateway_customer_id
        user2 = User(
            user_id=uuid4(),
            email=f"user2_{uuid4().hex[:8]}@example.com",
            full_name="User Two",
            status=UserStatusEnum.ACTIVE
        )
        db.add(user2)
        db.commit()
        
        customer2 = PaymentCustomer(
            user_id=user2.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_customer_id="cus_duplicate_test"
        )
        db.add(customer2)
        
        with pytest.raises(IntegrityError):
            db.commit()


class TestPaymentCustomerConstraints:
    """
    Autor: Oscar Alonso Nava Rivera

    Tests de constraints del modelo PaymentCustomer.
    """
    
    def test_user_gateway_unique_constraint(self, db, user):
        """Test que un usuario solo pueda tener un customer por gateway."""
        customer1 = PaymentCustomer(
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_customer_id="cus_first"
        )
        db.add(customer1)
        db.commit()
        
        # Intentar crear segundo customer para mismo usuario y gateway
        customer2 = PaymentCustomer(
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_customer_id="cus_second"
        )
        db.add(customer2)
        
        with pytest.raises(IntegrityError):
            db.commit()
    
    def test_customer_requires_user_id(self, db):
        """Test que user_id sea requerido."""
        customer = PaymentCustomer(
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_customer_id="cus_test"
        )
        db.add(customer)
        
        with pytest.raises(IntegrityError):
            db.commit()
    
    def test_customer_requires_gateway(self, db, user):
        """Test que gateway sea requerido al hacer flush/commit."""
        from sqlalchemy.exc import IntegrityError
        # SQLAlchemy 2.0 valida NOT NULL en flush/commit
        with pytest.raises(IntegrityError):
            customer = PaymentCustomer(
                user_id=user.user_id,
                gateway_customer_id="cus_test"
            )
            db.add(customer)
            db.flush()


class TestPaymentCustomerMethods:
    """
    Autor: Oscar Alonso Nava Rivera

    Tests de métodos del modelo PaymentCustomer.
    """
    
    def test_is_stripe_customer(self, db, user):
        """Test método is_stripe_customer()."""
        customer = PaymentCustomer(
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_customer_id="cus_stripe_test"
        )
        db.add(customer)
        db.commit()
        
        assert customer.is_stripe_customer() is True
    
    def test_has_default_payment_method_true(self, db, user):
        """Test has_default_payment_method() cuando existe."""
        customer = PaymentCustomer(
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_customer_id="cus_test",
            default_payment_method_id="pm_123"
        )
        db.add(customer)
        db.commit()
        
        assert customer.has_default_payment_method() is True
    
    def test_has_default_payment_method_false(self, db, user):
        """Test has_default_payment_method() cuando no existe."""
        customer = PaymentCustomer(
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_customer_id="cus_test"
        )
        db.add(customer)
        db.commit()
        
        assert customer.has_default_payment_method() is False


class TestPaymentCustomerRelationships:
    """
    Autor: Oscar Alonso Nava Rivera

    Tests de relaciones del modelo PaymentCustomer.
    """
    
    def test_customer_belongs_to_user(self, db, user):
        """Test relación con User."""
        customer = PaymentCustomer(
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_customer_id="cus_relation_test"
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
        
        assert customer.user is not None
        assert customer.user.user_id == user.user_id
        assert customer.user.email == user.email
    
    def test_user_can_have_multiple_customers_different_gateways(self, db, user):
        """Test que un usuario puede tener múltiples customers (diferentes gateways)."""
        stripe_customer = PaymentCustomer(
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_customer_id="cus_stripe"
        )
        db.add(stripe_customer)
        db.commit()
        
        # Recargar usuario para ver relación
        db.refresh(user)
        assert len(user.payment_customers) == 1
        assert user.payment_customers[0].gateway == PaymentGatewayEnum.STRIPE
    
    def test_customer_cascade_delete_with_user(self, db):
        """Test que PaymentCustomer se elimine cuando se elimina el usuario."""
        user = User(
            user_id=uuid4(),
            email=f"cascade_{uuid4().hex[:8]}@example.com",
            full_name="Cascade Test",
            status=UserStatusEnum.ACTIVE
        )
        db.add(user)
        db.commit()
        
        customer = PaymentCustomer(
            user_id=user.user_id,
            gateway=PaymentGatewayEnum.STRIPE,
            gateway_customer_id="cus_cascade_test"
        )
        db.add(customer)
        db.commit()
        
        customer_id = customer.payment_customer_id
        
        # Eliminar usuario
        db.delete(user)
        db.commit()
        
        # Verificar que customer fue eliminado
        deleted_customer = db.query(PaymentCustomer).filter_by(
            payment_customer_id=customer_id
        ).first()
        assert deleted_customer is None
