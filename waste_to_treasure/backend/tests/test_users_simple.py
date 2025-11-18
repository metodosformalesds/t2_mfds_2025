"""
Tests simplificados para endpoints de usuarios (/api/v1/users).

Estos tests verifican:
- JIT (Just-In-Time) user creation desde Cognito
- Endpoints /users/me (GET, PATCH)
- Endpoints admin /users/{user_id} (GET, PATCH)
- Permisos y autenticación

IMPORTANTE:
- Cada test limpia la BD automáticamente (fixture cleanup_database)
- Cognito está mockeado - no se hacen llamadas reales a AWS
- Usa la misma BD que desarrollo (Supabase/PostgreSQL)
"""
# Autor: Oscar Alonso Nava Rivera
# Fecha: 06/11/2025
# Descripción: Tests básicos para endpoints de usuarios (JIT / profile / admin)

import pytest
from uuid import uuid4
from app.models.user import UserRoleEnum, UserStatusEnum


# ==========================================
# TESTS: GET /users/me (JIT User Creation)
# ==========================================

@pytest.mark.asyncio
async def test_jit_user_creation(client, mock_verify_cognito_token):
    """
    
    Test: Primera petición crea usuario automáticamente (JIT).
    
    Verifica que:
    1. Usuario NO existe en BD
    2. GET /users/me crea el usuario automáticamente
    3. Retorna datos correctos del usuario creado
    """
    
    # Primera petición - crea usuario
    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer mock_token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Verificar datos del usuario creado
    assert "user_id" in data
    assert "email" in data
    assert data["full_name"] == "Test User"  # given_name + family_name
    assert data["role"] == UserRoleEnum.USER.value
    assert data["status"] == UserStatusEnum.ACTIVE.value


@pytest.mark.asyncio
async def test_get_existing_user(client, mock_verify_cognito_token):
    """
    
    Test: Segunda petición retorna usuario existente.
    
    Verifica que:
    1. Primera petición crea usuario
    2. Segunda petición retorna el MISMO usuario (no crea duplicado)
    """
    
    # Primera petición - crea usuario
    response1 = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer mock_token"}
    )
    assert response1.status_code == 200
    user_id_1 = response1.json()["user_id"]
    
    # Segunda petición - retorna mismo usuario
    response2 = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer mock_token"}
    )
    assert response2.status_code == 200
    user_id_2 = response2.json()["user_id"]
    
    # Debe ser el MISMO usuario
    assert user_id_1 == user_id_2


@pytest.mark.asyncio
async def test_get_user_without_auth(client):
    """
    
    Test: Petición sin autenticación debe fallar.
    """
    
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 403  # FastAPI security dependency


# ==========================================
# TESTS: PATCH /users/me (Update Profile)
# ==========================================

@pytest.mark.asyncio
async def test_update_user_profile(client, mock_verify_cognito_token):
    """
    Autor: Oscar Alonso Nava Rivera
    Test: Usuario puede actualizar su propio perfil.
    """
    # Crear usuario con primera petición
    response1 = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer mock_token"}
    )
    assert response1.status_code == 200
    
    # Actualizar nombre
    response2 = await client.patch(
        "/api/v1/users/me",
        json={"full_name": "Updated Name"},
        headers={"Authorization": "Bearer mock_token"}
    )
    assert response2.status_code == 200
    data = response2.json()
    assert data["full_name"] == "Updated Name"


@pytest.mark.asyncio
async def test_user_cannot_change_role(client, mock_verify_cognito_token):
    """
    Autor: Oscar Alonso Nava Rivera
    Test: Usuario normal NO puede cambiar su propio rol a ADMIN.
    
    El schema UserUpdate NO incluye el campo 'role'.
    """
    # Crear usuario
    await client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer mock_token"}
    )
    
    # Intentar cambiar rol (debe ignorarse)
    response = await client.patch(
        "/api/v1/users/me",
        json={"full_name": "Test", "role": "ADMIN"},  # role ignorado
        headers={"Authorization": "Bearer mock_token"}
    )
    assert response.status_code == 200
    data = response.json()
    
    # Rol debe seguir siendo USER
    assert data["role"] == UserRoleEnum.USER.value


# ==========================================
# TESTS: GET /users/{user_id} (Admin Only)
# ==========================================

# TODO: Fix admin fixture - mock not matching actual admin user in DB
# @pytest.mark.asyncio
# async def test_admin_can_get_any_user(client, auth_headers_admin, mock_verify_cognito_token):
#     """Test: Admin puede obtener información de cualquier usuario."""
#     pass


@pytest.mark.asyncio
async def test_regular_user_cannot_get_other_users(client, mock_verify_cognito_token):
    """
    Test: Usuario normal NO puede obtener info de otros usuarios.
    """
    # Crear usuario
    await client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer mock_token"}
    )
    
    # Intentar consultar otro usuario (UUID aleatorio)
    other_user_id = str(uuid4())
    response = await client.get(
        f"/api/v1/users/{other_user_id}",
        headers={"Authorization": "Bearer mock_token"}
    )
    assert response.status_code == 403  # Forbidden


# ==========================================
# TESTS: PATCH /users/{user_id} (Admin Only)
# ==========================================

# TODO: Fix admin fixture - mock not matching actual admin user in DB
# @pytest.mark.asyncio
# async def test_admin_can_update_any_user(client, auth_headers_admin, mock_verify_cognito_token):
#     """Test: Admin puede actualizar cualquier usuario."""
#     pass

# @pytest.mark.asyncio
# async def test_admin_can_change_user_role(client, auth_headers_admin, mock_verify_cognito_token):
#     """Test: Admin puede cambiar el rol de un usuario."""
#     pass


@pytest.mark.asyncio
async def test_regular_user_cannot_update_others(client, mock_verify_cognito_token):
    """
    Test: Usuario normal NO puede actualizar otros usuarios.
    """
    # Crear usuario
    await client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer mock_token"}
    )
    
    # Intentar actualizar otro usuario
    other_user_id = str(uuid4())
    response = await client.patch(
        f"/api/v1/users/{other_user_id}",
        json={"full_name": "Hacked"},
        headers={"Authorization": "Bearer mock_token"}
    )
    assert response.status_code == 403  # Forbidden
