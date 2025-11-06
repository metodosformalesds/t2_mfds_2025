"""
Modulo de esquemas Pydantic

Expone todos los esquemas de validacion para las operaciones de la API.
"""
from app.schemas.category import (
    CategoryBase,
    CategoryCreate,
    CategoryUpdate,
    CategoryInDB,
    CategoryRead,
    Category,
    CategoryWithChildren,
    CategoryList,
    CategoryTree,
)
from app.schemas.address import(
    AddressBase,
    AddressCreate,
    AddressInDB,
    AddressRead,
    AddressList,
    AddressWithUser,
    UserBasic,
)
from app.schemas.user import (
    UserRead,
    UserPublic,
    UserUpdate,
    UserAdminUpdate,
)

__all__ = [
    # category schemas
    "CategoryBase",
    "CategoryCreate",
    "CategoryUpdate",
    "CategoryInDB",
    "CategoryRead",
    "Category",
    "CategoryWithChildren",
    "CategoryList",
    "CategoryTree",

    #address schemas
    "AddressBase",
    "AddressCreate",
    "AddressUpdate",
    "AddressInDB",
    "AddressRead",
    "AddressList",
    "AddressWithUser",
    "UserBasic",
    
    # user schemas
    "UserRead",
    "UserPublic",
    "UserUpdate",
    "UserAdminUpdate",
]