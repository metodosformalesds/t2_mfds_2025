from fastapi import APIRouter
from app.api.v1.endpoints import (
    categories,
    addresses,
    users,
    notifications,
    orders,
    plans,
    shipping,
    subscriptions,
)

router = APIRouter()

# Include the routers from the endpoints modules
router.include_router(
    categories.router,
    prefix="/categories",
    tags=["Categories"]
)

router.include_router(
    addresses.router,
    prefix="/address",
    tags=["Addresses"]
)

router.include_router(
    users.router,
    prefix="/users",
    tags=["Users"]
)

router.include_router(
    notifications.router,
    prefix="/notifications",
    tags=["Notifications"]
)

router.include_router(
    orders.router,
    prefix="/orders",
    tags=["Orders"]
)

router.include_router(
    plans.router,
    prefix="/plans",
    tags=["Plans"]
)

router.include_router(
    shipping.router,
    prefix="/shipping",
    tags=["Shipping"]
)

router.include_router(
    subscriptions.router,
    prefix="/subscriptions",
    tags=["Subscriptions"]
)