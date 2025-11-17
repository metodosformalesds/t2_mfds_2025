"""
Capa de servicio para Address.

Implementa la lógica de negocio para operaciones CRUD sobre direcciones,
incluyendo validaciones de ownership, gestión de is_default, y manejo
de address book de usuarios.

Este servicio está completamente asíncrono para aprovechar la arquitectura
de FastAPI y SQLAlchemy 2.0 async.

Autor: Oscar Alonso Nava Rivera
Fecha: 06/11/2025
Descripción: Lógica de negocio para CRUD de direcciones y helpers asociados.
"""
import logging
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, and_
from fastapi import HTTPException, status

from app.models.address import Address
from app.models.user import User
from app.schemas.address import AddressCreate, AddressUpdate

logger = logging.getLogger(__name__)


async def create_address(
    db: AsyncSession,
    address_data: AddressCreate,
    current_user: User
) -> Address:
    """
    Autor: Oscar Alonso Nava Rivera
    Descripción: Crea una nueva dirección para el usuario actual.

    Args:
        db: Sesión asíncrona de base de datos.
        address_data: Datos de la dirección a crear.
        current_user: Usuario autenticado (owner de la dirección).
        
    Returns:
        Dirección creada.
        
    Note:
        - Si is_default=True, desmarca automáticamente las demás direcciones
        - user_id se asigna automáticamente del current_user
    """
    logger.info(
        f"Usuario {current_user.user_id} creando dirección en "
        f"{address_data.city}, {address_data.state}"
    )
    
    # Si la nueva dirección es default, desmarcar las demás del usuario
    if address_data.is_default:
        await unset_default_addresses(db, current_user.user_id)
    
    # Crear instancia del modelo con user_id del current_user
    db_address = Address(
        **address_data.model_dump(),
        user_id=current_user.user_id
    )
    
    try:
        db.add(db_address)
        await db.commit()
        await db.refresh(db_address)
        logger.info(
            f"Dirección creada exitosamente: ID {db_address.address_id} "
            f"para usuario {current_user.user_id}"
        )
        return db_address
    except Exception as e:
        await db.rollback()
        logger.error(f"Error al crear dirección: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear la dirección"
        )


async def get_user_addresses(
    db: AsyncSession,
    user_id: int,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[Address], int]:
    """
    Autor: Oscar Alonso Nava Rivera
    Descripción: Obtiene lista paginada de direcciones de un usuario.

    Args:
        db: Sesión asíncrona de base de datos.
        user_id: ID del usuario propietario.
        skip: Número de registros a omitir (paginación).
        limit: Número máximo de registros a devolver.
        
    Returns:
        Tupla (lista de direcciones, total de registros).
        
    Note:
        Las direcciones se ordenan con is_default primero, luego por fecha.
    """
    logger.info(f"Obteniendo direcciones del usuario {user_id}")
    
    # Query base
    stmt = select(Address).where(Address.user_id == user_id)
    
    # Contar total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    count_result = await db.execute(count_stmt)
    total = count_result.scalar() or 0
    
    # Aplicar ordenamiento: default primero, luego más recientes
    stmt = stmt.order_by(
        Address.is_default.desc(),
        Address.created_at.desc()
    ).offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    addresses = result.scalars().all()
    
    logger.info(f"Encontradas {len(addresses)} de {total} direcciones totales")
    return list(addresses), total


async def get_address_by_id(
    db: AsyncSession,
    address_id: int,
    current_user: User
) -> Address:
    """
    Autor: Oscar Alonso Nava Rivera
    Descripción: Obtiene una dirección por su ID y valida ownership.

    Args:
        db: Sesión asíncrona de base de datos.
        address_id: ID de la dirección.
        current_user: Usuario autenticado.
        
    Returns:
        Dirección encontrada.
        
    Raises:
        HTTPException 404: Si la dirección no existe.
        HTTPException 403: Si el usuario no es el owner.
        
    Note:
        Esta función valida automáticamente el ownership.
    """
    logger.info(f"Usuario {current_user.user_id} solicitando dirección {address_id}")
    
    stmt = select(Address).where(Address.address_id == address_id)
    result = await db.execute(stmt)
    address = result.scalar_one_or_none()
    
    if not address:
        logger.warning(f"Dirección {address_id} no encontrada")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dirección con ID {address_id} no encontrada"
        )
    
    # Validar ownership
    if address.user_id != current_user.user_id:
        logger.warning(
            f"Usuario {current_user.user_id} intentó acceder a dirección "
            f"{address_id} de usuario {address.user_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para acceder a esta dirección"
        )
    
    return address


async def update_address(
    db: AsyncSession,
    address_id: int,
    address_data: AddressUpdate,
    current_user: User
) -> Address:
    """
    Autor: Oscar Alonso Nava Rivera
    Descripción: Actualiza una dirección existente y valida permisos.

    Args:
        db: Sesión asíncrona de base de datos.
        address_id: ID de la dirección a actualizar.
        address_data: Datos a actualizar (campos opcionales).
        current_user: Usuario autenticado.
        
    Returns:
        Dirección actualizada.
        
    Raises:
        HTTPException 404: Si la dirección no existe.
        HTTPException 403: Si el usuario no es el owner.
        
    Note:
        - Valida ownership automáticamente
        - Si se marca is_default=True, desmarca las demás
    """
    logger.info(f"Usuario {current_user.user_id} actualizando dirección {address_id}")
    
    # Obtener y validar ownership
    address = await get_address_by_id(db, address_id, current_user)
    
    # Extraer datos a actualizar
    update_data = address_data.model_dump(exclude_unset=True)
    
    if not update_data:
        logger.info("No hay campos para actualizar")
        return address
    
    # Si se marca como default, desmarcar las demás
    if update_data.get("is_default") is True:
        await unset_default_addresses(
            db, 
            current_user.user_id, 
            exclude_id=address_id
        )
    
    # Aplicar actualizaciones
    for field, value in update_data.items():
        setattr(address, field, value)
    
    try:
        await db.commit()
        await db.refresh(address)
        logger.info(f"Dirección {address_id} actualizada exitosamente")
        return address
    except Exception as e:
        await db.rollback()
        logger.error(f"Error al actualizar dirección: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar la dirección"
        )


async def delete_address(
    db: AsyncSession,
    address_id: int,
    current_user: User
) -> None:
    """
    Autor: Oscar Alonso Nava Rivera
    Descripción: Elimina una dirección y gestiona el default si aplica.

    Args:
        db: Sesión asíncrona de base de datos.
        address_id: ID de la dirección a eliminar.
        current_user: Usuario autenticado.
        
    Raises:
        HTTPException 404: Si la dirección no existe.
        HTTPException 403: Si el usuario no es el owner.
        
    Note:
        Si la dirección eliminada era la default, automáticamente se marca
        otra dirección del usuario como default.
    """
    logger.info(f"Usuario {current_user.user_id} eliminando dirección {address_id}")
    
    # Obtener y validar ownership
    address = await get_address_by_id(db, address_id, current_user)
    
    was_default = address.is_default
    
    try:
        await db.delete(address)
        await db.commit()
        logger.info(f"Dirección {address_id} eliminada exitosamente")
        
        # Si era la default, marcar otra como default automáticamente
        if was_default:
            await set_first_address_as_default(db, current_user.user_id)
            
    except Exception as e:
        await db.rollback()
        logger.error(f"Error al eliminar dirección: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar la dirección"
        )


async def unset_default_addresses(
    db: AsyncSession,
    user_id: int,
    exclude_id: Optional[int] = None
) -> None:
    """
    Autor: Oscar Alonso Nava Rivera
    Descripción: Desmarca todas las direcciones default de un usuario (helper).

    Args:
        db: Sesión asíncrona de base de datos.
        user_id: ID del usuario.
        exclude_id: ID de dirección a excluir (para no desmarcar la que se está marcando).
        
    Note:
        Esta función asegura que solo haya una dirección default por usuario.
    """
    logger.debug(f"Desmarcando direcciones default del usuario {user_id}")
    
    stmt = (
        update(Address)
        .where(Address.user_id == user_id)
        .values(is_default=False)
    )
    
    if exclude_id:
        stmt = stmt.where(Address.address_id != exclude_id)
    
    await db.execute(stmt)
    await db.commit()


async def set_first_address_as_default(
    db: AsyncSession,
    user_id: int
) -> None:
    """
    Autor: Oscar Alonso Nava Rivera
    Descripción: Marca la primera dirección disponible del usuario como default.

    Args:
        db: Sesión asíncrona de base de datos.
        user_id: ID del usuario.
        
    Note:
        Se llama automáticamente al eliminar la dirección default.
    """
    logger.debug(f"Asignando nueva dirección default para usuario {user_id}")
    
    # Buscar la primera dirección del usuario (ordenada por fecha)
    stmt = (
        select(Address)
        .where(Address.user_id == user_id)
        .order_by(Address.created_at.desc())
        .limit(1)
    )
    
    result = await db.execute(stmt)
    next_address = result.scalar_one_or_none()
    
    if next_address:
        next_address.is_default = True
        await db.commit()
        logger.info(
            f"Dirección {next_address.address_id} marcada como default "
            f"para usuario {user_id}"
        )


async def get_default_address(
    db: AsyncSession,
    user_id: int
) -> Optional[Address]:
    """
    Autor: Oscar Alonso Nava Rivera
    Descripción: Obtiene la dirección default de un usuario.

    Args:
        db: Sesión asíncrona de base de datos.
        user_id: ID del usuario.
        
    Returns:
        Dirección default o None si no tiene.
        
    Note:
        Útil para checkout de órdenes.
    """
    stmt = select(Address).where(
        and_(
            Address.user_id == user_id,
            Address.is_default == True
        )
    )
    
    result = await db.execute(stmt)
    return result.scalar_one_or_none()