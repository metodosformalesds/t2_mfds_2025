"""
Capa de servicio para Shipping (Métodos de Envío).

Implementa la lógica de negocio para:
- CRUD de ShippingMethods (con validación de ownership).
- Asociación y desasociación de métodos a Listings.
"""
import logging
import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, and_
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.user import User
from app.models.listing import Listing
from app.models.shipping_methods import ShippingMethod
from app.models.listing_shipping_options import ListingShippingOption
from app.schemas.shipping import ShippingMethodCreate, ShippingMethodUpdate

logger = logging.getLogger(__name__)

class ShippingService:

    # --- CRUD de Métodos de Envío (para el vendedor) ---

    async def create_shipping_method(
        self, 
        db: AsyncSession, 
        data: ShippingMethodCreate, 
        user: User
    ) -> ShippingMethod:
        """Crea un nuevo método de envío para el usuario (vendedor) actual."""
        db_method = ShippingMethod(
            **data.model_dump(),
            seller_id=user.user_id
        )
        db.add(db_method)
        try:
            await db.commit()
            await db.refresh(db_method)
            logger.info(f"Usuario {user.user_id} creó método de envío {db_method.method_id}")
            return db_method
        except Exception as e:
            await db.rollback()
            logger.error(f"Error al crear método de envío: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error al crear el método de envío")

    async def get_seller_shipping_methods(
        self, 
        db: AsyncSession, 
        user: User
    ) -> List[ShippingMethod]:
        """Obtiene todos los métodos de envío de un vendedor."""
        stmt = (
            select(ShippingMethod)
            .where(ShippingMethod.seller_id == user.user_id)
            .order_by(ShippingMethod.cost.asc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_shipping_method_by_id(
        self,
        db: AsyncSession,
        method_id: int,
        user: User
    ) -> ShippingMethod:
        """
        Obtiene un método de envío por ID, validando que pertenezca
        al usuario (vendedor) actual.
        """
        stmt = select(ShippingMethod).where(ShippingMethod.method_id == method_id)
        result = await db.execute(stmt)
        method = result.scalar_one_or_none()

        if not method:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Método de envío no encontrado"
            )
        
        if method.seller_id != user.user_id:
            logger.warning(f"Usuario {user.user_id} intentó acceder al método {method_id} (propietario: {method.seller_id})")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para acceder a este método de envío"
            )
        
        return method

    async def update_shipping_method(
        self,
        db: AsyncSession,
        method_id: int,
        data: ShippingMethodUpdate,
        user: User
    ) -> ShippingMethod:
        """Actualiza un método de envío del vendedor."""
        db_method = await self.get_shipping_method_by_id(db, method_id, user)
        
        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")

        for key, value in update_data.items():
            setattr(db_method, key, value)
        
        try:
            await db.commit()
            await db.refresh(db_method)
            return db_method
        except Exception as e:
            await db.rollback()
            logger.error(f"Error al actualizar método {method_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error al actualizar el método")

    async def delete_shipping_method(
        self,
        db: AsyncSession,
        method_id: int,
        user: User
    ):
        """
        Elimina un método de envío del vendedor.
        Gracias a `ondelete="CASCADE"` en ListingShippingOption,
        esto eliminará automáticamente las asociaciones a listings.
        """
        db_method = await self.get_shipping_method_by_id(db, method_id, user)
        
        await db.delete(db_method)
        await db.commit()
        logger.info(f"Usuario {user.user_id} eliminó método de envío {method_id}")

    # --- Lógica de Asociación (para ser usada por el servicio de Listings) ---

    async def _get_listing_by_id_and_owner(
        self,
        db: AsyncSession,
        listing_id: int,
        user: User
    ) -> Listing:
        """Helper: Obtiene un listing y valida que pertenezca al usuario."""
        stmt = select(Listing).where(Listing.listing_id == listing_id)
        result = await db.execute(stmt)
        listing = result.scalar_one_or_none()

        if not listing:
            raise HTTPException(status_code=404, detail="Publicación no encontrada")
        
        if listing.seller_id != user.user_id:
            raise HTTPException(status_code=403, detail="No tienes permiso para modificar esta publicación")
        
        return listing

    async def add_shipping_option_to_listing(
        self,
        db: AsyncSession,
        listing_id: int,
        method_id: int,
        user: User
    ) -> ListingShippingOption:
        """
        Asocia un método de envío (propio del vendedor) a una
        publicación (propia del vendedor).
        """
        # Validar que el listing pertenece al usuario
        await self._get_listing_by_id_and_owner(db, listing_id, user)
        
        # Validar que el método de envío pertenece al usuario
        await self.get_shipping_method_by_id(db, method_id, user)
        
        # Crear la asociación
        db_option = ListingShippingOption(
            listing_id=listing_id,
            method_id=method_id
        )
        db.add(db_option)
        
        try:
            await db.commit()
            await db.refresh(db_option)
            return db_option
        except IntegrityError:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este método de envío ya está asociado a esta publicación"
            )

    async def remove_shipping_option_from_listing(
        self,
        db: AsyncSession,
        listing_id: int,
        method_id: int,
        user: User
    ):
        """
        Elimina la asociación de un método de envío a una publicación,
        validando propiedad.
        """
        # Validar que el listing pertenece al usuario (implica que puede
        # gestionar las opciones de este listing)
        await self._get_listing_by_id_and_owner(db, listing_id, user)
        
        # Eliminar la asociación
        stmt = delete(ListingShippingOption).where(
            and_(
                ListingShippingOption.listing_id == listing_id,
                ListingShippingOption.method_id == method_id
            )
        )
        result = await db.execute(stmt)
        
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Asociación de envío no encontrada")
        
        await db.commit()

# Singleton del servicio
shipping_service = ShippingService()