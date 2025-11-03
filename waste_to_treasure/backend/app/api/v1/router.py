from fastapi import APIRouter

router = APIRouter()

# Aquí se incluirán los routers de los diferentes módulos (usuarios, productos, etc.)
# Ejemplo:
# from app.api.v1.endpoints import users
# router.include_router(users.router, prefix="/users", tags=["Users"])
