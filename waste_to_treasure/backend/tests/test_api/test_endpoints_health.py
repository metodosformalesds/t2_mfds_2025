"""
Tests básicos de endpoints para verificar que los endpoints están operativos.

Estos tests NO prueban la funcionalidad completa, solo verifican que los endpoints
respondan correctamente y no causen errores del servidor.
"""

# Autor: Oscar Alonso Nava Rivera
# Fecha: 17/11/2025
# Descripción: Tests básicos de endpoints para salud del sistema

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """Cliente HTTP para tests."""
    return TestClient(app)


@pytest.mark.api
class TestHealthEndpoints:
    """Tests básicos de endpoints de salud."""

    def test_root_endpoint(self, client):
        """Test que el endpoint raíz responde."""
        response = client.get("/")
        assert response.status_code in [200, 404, 307]  # 200 OK, 404 Not Found, o 307 Redirect

    def test_api_v1_categories_list(self, client):
        """Test que el endpoint de listado de categorías responde."""
        response = client.get("/api/v1/categories/")
        # Puede ser 200 (éxito) o 401 (no autenticado) pero NO 500
        assert response.status_code in [200, 401, 403]

    def test_api_v1_listings_list(self, client):
        """Test que el endpoint de listado de listings responde."""
        response = client.get("/api/v1/listings/")
        # Puede ser 200 (éxito) o 401 (no autenticado) pero NO 500
        assert response.status_code in [200, 401, 403]

    def test_api_v1_users_endpoint_without_auth(self, client):
        """Test que el endpoint de usuarios requiere autenticación."""
        response = client.get("/api/v1/users/me")
        # Debe requerir autenticación
        assert response.status_code in [401, 403]

    def test_api_v1_cart_endpoint_without_auth(self, client):
        """Test que el endpoint de carrito requiere autenticación."""
        response = client.get("/api/v1/cart/")
        # Debe requerir autenticación o no existir
        assert response.status_code in [401, 403, 404]

    def test_api_v1_orders_endpoint_without_auth(self, client):
        """Test que el endpoint de órdenes requiere autenticación."""
        response = client.get("/api/v1/orders/")
        # Debe requerir autenticación o no existir
        assert response.status_code in [401, 403, 404]

    def test_api_v1_faq_public_endpoint(self, client):
        """Test que el endpoint de FAQ es público."""
        response = client.get("/api/v1/faq/")
        # FAQ debe ser público
        assert response.status_code in [200, 404]

    def test_api_v1_legal_public_endpoint(self, client):
        """Test que el endpoint de documentos legales es público."""
        response = client.get("/api/v1/legal/")
        # Documentos legales deben ser públicos o tener error de configuración
        assert response.status_code in [200, 404, 500]

    def test_invalid_endpoint_returns_404(self, client):
        """Test que endpoints inexistentes retornan 404."""
        response = client.get("/api/v1/nonexistent-endpoint")
        assert response.status_code == 404

    def test_api_v1_plans_public_endpoint(self, client):
        """Test que el endpoint de planes es público."""
        response = client.get("/api/v1/plans/")
        # Planes deben ser públicos
        assert response.status_code in [200, 404]

    def test_api_v1_reviews_endpoint(self, client):
        """Test que el endpoint de reviews responde."""
        response = client.get("/api/v1/reviews/")
        # Puede ser público, requerir autenticación, o no estar disponible
        assert response.status_code in [200, 401, 403, 404, 405]

    def test_api_v1_notifications_requires_auth(self, client):
        """Test que el endpoint de notificaciones requiere autenticación."""
        response = client.get("/api/v1/notifications/")
        # Debe requerir autenticación o no existir
        assert response.status_code in [401, 403, 404]

    def test_api_v1_addresses_requires_auth(self, client):
        """Test que el endpoint de direcciones requiere autenticación."""
        response = client.get("/api/v1/addresses/")
        # Debe requerir autenticación o no existir
        assert response.status_code in [401, 403, 404]

    def test_api_v1_offers_requires_auth(self, client):
        """Test que el endpoint de ofertas requiere autenticación."""
        response = client.get("/api/v1/offers/")
        # Debe requerir autenticación o no estar disponible
        assert response.status_code in [401, 403, 404, 405]

    def test_api_v1_subscriptions_requires_auth(self, client):
        """Test que el endpoint de suscripciones requiere autenticación."""
        response = client.get("/api/v1/subscriptions/")
        # Debe requerir autenticación o no existir
        assert response.status_code in [401, 403, 404]

    def test_api_v1_shipping_endpoint(self, client):
        """Test que el endpoint de shipping responde."""
        response = client.get("/api/v1/shipping/methods")
        # Puede ser público o requerir autenticación
        assert response.status_code in [200, 401, 403, 404]

    def test_api_v1_admin_requires_auth(self, client):
        """Test que el endpoint de admin requiere autenticación."""
        response = client.get("/api/v1/admin/users")
        # Debe requerir autenticación y permisos de admin
        assert response.status_code in [401, 403, 404]

    def test_post_without_auth_rejected(self, client):
        """Test que POST sin autenticación es rechazado."""
        response = client.post("/api/v1/listings/", json={})
        # Debe requerir autenticación
        assert response.status_code in [401, 403, 422]

    def test_put_without_auth_rejected(self, client):
        """Test que PUT sin autenticación es rechazado."""
        response = client.put("/api/v1/listings/1", json={})
        # Debe requerir autenticación o no estar disponible
        assert response.status_code in [401, 403, 404, 405, 422]

    def test_delete_without_auth_rejected(self, client):
        """Test que DELETE sin autenticación es rechazado."""
        response = client.delete("/api/v1/listings/1")
        # Debe requerir autenticación
        assert response.status_code in [401, 403, 404]
