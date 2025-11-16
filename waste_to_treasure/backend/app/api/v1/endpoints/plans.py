# Autor: Alejandro Campa Alonso 215833
# Fecha: 2025-11-08
# Descripción: Endpoints de la API para Planes (SaaS). Proporciona un endpoint público para
# listar todos los planes de suscripción disponibles en la plataforma, con validación y
# parseo de campos computados JSON.

"""
Endpoints de la API para Planes (SaaS).

- GET /plans: Listar planes disponibles (público).
"""
import logging
from typing import Annotated, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db
from app.schemas.plan import PlanRead, PlanList
from app.services.subscription_service import subscription_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get(
    "",
    response_model=PlanList,
    summary="Listar planes disponibles",
    description="Obtiene una lista de todos los planes de suscripción (SaaS) disponibles en la plataforma."
)
@router.get(
    "/",
    response_model=PlanList,
    include_in_schema=False
)
async def get_available_plans(
    db: Annotated[AsyncSession, Depends(get_async_db)]
) -> PlanList:
    """
    Endpoint público para listar todos los planes de suscripción disponibles en la plataforma.
    
    Obtiene todos los planes activos, los valida y parsea sus campos computados JSON.
    No requiere autenticación, ya que es información pública.
    
    Autor: Alejandro Campa Alonso 215833
    
    Args:
        db: Sesión asincrónica de la base de datos
    
    Returns:
        PlanList: Lista de todos los planes disponibles con metadatos
    """
    plans = await subscription_service.list_available_plans(db)
    
    # Validar usando model_validate para aplicar computed_fields (parsear JSON)
    validated_plans = [PlanRead.model_validate(p) for p in plans]
    
    return PlanList(items=validated_plans)