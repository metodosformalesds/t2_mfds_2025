from fastapi import APIRouter
from app.api.v1.endpoints import categories

router = APIRouter()

# Include the router from the categories endpoints module
router.include_router(
    categories.router,
    prefix="/categories",
    tags=["Categories"]
)

# Aquí se incluirán los routers de los diferentes módulos (usuarios, productos, etc.)
# Ejemplo:
# from app.api.v1.endpoints import users
# router.include_router(users.router, prefix="/users", tags=["Users"])
