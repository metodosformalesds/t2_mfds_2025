"""
Schemas Pydantic para el modelo Plan.
"""
import json
from decimal import Decimal
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, computed_field

from app.models.plans import BillingCycle

class PlanRead(BaseModel):
    """
    Schema para leer un plan de suscripción.
    """
    plan_id: int
    name: str
    price: Decimal
    billing_cycle: BillingCycle
    created_at: datetime
    updated_at: datetime
    
    # Oculta el campo 'features_json' de la respuesta final
    features_json: Optional[str] = Field(None, exclude=True)

    @computed_field
    @property
    def features(self) -> Optional[Dict[str, Any]]:
        """
        Analiza la cadena JSON de 'features_json' y la devuelve como un dict.
        """
        if self.features_json:
            try:
                return json.loads(self.features_json)
            except json.JSONDecodeError:
                return None
        return None
    
    model_config = ConfigDict(from_attributes=True)

class PlanList(BaseModel):
    """
    Schema para la respuesta de la lista de planes.
    """
    items: List[PlanRead]