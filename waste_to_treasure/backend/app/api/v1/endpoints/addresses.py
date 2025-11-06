"""
Endpoints de la API para Address.

Implementa operaciones CRUD sobre direcciones físicas de usuarios (Address Book).
Todos los endpoints requieren autenticación y validan ownership automáticamente.
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db, get_current_active_user
from app.models.user import User
from app.schemas.address import (
    AddressRead,
    AddressCreate,
    AddressUpdate,
    AddressList,
)
from app.services import address_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/",
    response_model=AddressRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva dirección",
    description="Crea una nueva dirección en el address book del usuario autenticado.",
    responses={
        201: {"description": "Dirección creada exitosamente"},
        400: {"description": "Datos de entrada inválidos"},
        401: {"description": "No autenticado"},
    }
)
async def create_address(
    address_data: AddressCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
) -> AddressRead:
    """
    Crea una nueva dirección para el usuario actual.
    
    **Requiere**: Usuario autenticado
    
    **Comportamiento**:
    - user_id se asigna automáticamente del usuario autenticado
    - Si is_default=True, se desmarca la anterior dirección default
    - La dirección queda asociada al usuario en su address book
    
    **Ejemplo de request body**:
    ```json
    {
        "street": "Av. Tecnológico 1340",
        "city": "Ciudad Juárez",
        "state": "Chihuahua",
        "postal_code": "32500",
        "country": "MX",
        "notes": "Edificio ICSA, tercer piso",
        "is_default": true
    }
    ```
    """
    logger.info(
        f"Usuario {current_user.user_id} creando dirección en "
        f"{address_data.city}, {address_data.state}"
    )
    
    address = await address_service.create_address(db, address_data, current_user)
    
    return address


@router.get(
    "/",
    response_model=AddressList,
    summary="Listar mis direcciones",
    description="Obtiene lista paginada de direcciones del usuario autenticado.",
    responses={
        200: {"description": "Lista de direcciones obtenida exitosamente"},
        401: {"description": "No autenticado"},
    }
)
async def get_my_addresses(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(50, ge=1, le=100, description="Número máximo de registros"),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
) -> AddressList:
    """
    Lista las direcciones del usuario actual (address book).
    
    **Requiere**: Usuario autenticado
    
    **Ordenamiento**:
    - Dirección default primero
    - Luego por fecha de creación (más recientes primero)
    
    **Paginación**:
    - `skip`: Offset para paginación (default: 0)
    - `limit`: Límite de resultados (default: 50, max: 100)
    
    **Ejemplo de respuesta**:
    ```json
    {
        "items": [...],
        "total": 3,
        "page": 1,
        "page_size": 50
    }
    ```
    """
    logger.info(
        f"Usuario {current_user.user_id} listando sus direcciones "
        f"(skip={skip}, limit={limit})"
    )
    
    addresses, total = await address_service.get_user_addresses(
        db=db,
        user_id=current_user.user_id,
        skip=skip,
        limit=limit
    )
    
    # Calcular página actual
    page = (skip // limit) + 1 if limit > 0 else 1
    
    return AddressList(
        items=addresses,
        total=total,
        page=page,
        page_size=limit
    )


@router.get(
    "/{address_id}",
    response_model=AddressRead,
    summary="Obtener dirección por ID",
    description="Obtiene los detalles completos de una dirección específica.",
    responses={
        200: {"description": "Dirección encontrada"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos (no es el owner)"},
        404: {"description": "Dirección no encontrada"},
    }
)
async def get_address(
    address_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
) -> AddressRead:
    """
    Obtiene una dirección específica por su ID.
    
    **Requiere**: Usuario autenticado y ser el owner
    
    **Validaciones**:
    - La dirección debe existir
    - Solo el usuario propietario puede acceder
    
    **Parámetros**:
    - `address_id`: ID de la dirección
    
    **Ejemplo de respuesta**:
    ```json
    {
        "address_id": 1,
        "user_id": 5,
        "street": "Av. Tecnológico 1340",
        "city": "Ciudad Juárez",
        "state": "Chihuahua",
        "postal_code": "32500",
        "country": "MX",
        "notes": "Edificio ICSA",
        "is_default": true,
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
    }
    ```
    """
    logger.info(f"Usuario {current_user.user_id} obteniendo dirección {address_id}")
    
    address = await address_service.get_address_by_id(db, address_id, current_user)
    
    return address


@router.patch(
    "/{address_id}",
    response_model=AddressRead,
    summary="Actualizar dirección",
    description="Actualiza los campos especificados de una dirección.",
    responses={
        200: {"description": "Dirección actualizada exitosamente"},
        400: {"description": "Datos de entrada inválidos"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos (no es el owner)"},
        404: {"description": "Dirección no encontrada"},
    }
)
async def update_address(
    address_id: int,
    address_data: AddressUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
) -> AddressRead:
    """
    Actualiza una dirección existente (actualización parcial).
    
    **Requiere**: Usuario autenticado y ser el owner
    
    **Validaciones**:
    - La dirección debe existir
    - Solo el usuario propietario puede modificar
    - Si se marca is_default=True, se desmarca la anterior
    
    **Campos actualizables**:
    - `street`: Calle y número
    - `city`: Ciudad
    - `state`: Estado
    - `postal_code`: Código postal
    - `country`: Código de país
    - `notes`: Referencias adicionales
    - `is_default`: Marcar como default
    
    **Ejemplo de request body**:
    ```json
    {
        "notes": "Nueva referencia: Casa color azul",
        "is_default": true
    }
    ```
    
    **Nota**: Todos los campos son opcionales. Solo se actualizan los campos proporcionados.
    """
    logger.info(f"Usuario {current_user.user_id} actualizando dirección {address_id}")
    
    address = await address_service.update_address(
        db, address_id, address_data, current_user
    )
    
    return address


@router.delete(
    "/{address_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar dirección",
    description="Elimina una dirección del address book del usuario.",
    responses={
        204: {"description": "Dirección eliminada exitosamente"},
        401: {"description": "No autenticado"},
        403: {"description": "Sin permisos (no es el owner)"},
        404: {"description": "Dirección no encontrada"},
    }
)
async def delete_address(
    address_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
) -> None:
    """
    Elimina una dirección del address book.
    
    **Requiere**: Usuario autenticado y ser el owner
    
    **Validaciones**:
    - La dirección debe existir
    - Solo el usuario propietario puede eliminar
    
    **Comportamiento especial**:
    - Si la dirección eliminada era la default, automáticamente se marca
      otra dirección del usuario como default (la más reciente)
    
    **Retorna**: 204 No Content (sin cuerpo de respuesta)
    """
    logger.info(f"Usuario {current_user.user_id} eliminando dirección {address_id}")
    
    await address_service.delete_address(db, address_id, current_user)
    
    # FastAPI automáticamente retorna 204 No Content
    return None