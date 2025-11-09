# Types

Definiciones de tipos TypeScript para toda la aplicación.

## Organización

Los tipos están organizados por entidad/funcionalidad del backend:

```
types/
├── index.ts              # Re-exporta todos los tipos
├── api.ts                # Tipos de respuestas API genéricas
├── user.ts               # Usuario, perfil, roles
├── listing.ts            # Publicaciones/productos
├── category.ts           # Categorías
├── cart.ts               # Carrito de compras
├── order.ts              # Órdenes y order items
├── payment.ts            # Pagos, transacciones, customer
├── shipping.ts           # Métodos y opciones de envío
├── review.ts             # Reseñas y calificaciones
├── notification.ts       # Notificaciones
├── subscription.ts       # Suscripciones y planes
├── address.ts            # Direcciones
├── faq.ts                # FAQs
├── legal.ts              # Documentos legales
└── admin.ts              # Reportes, logs admin
```

## Convenciones

### Nomenclatura

- Interfaces para objetos: `User`, `Listing`, `Order`
- Tipos para datos de formularios: `CreateListingData`, `UpdateUserData`
- Tipos para respuestas API: `ListingResponse`, `OrderListResponse`
- Enums para valores fijos: `OrderStatus`, `UserRole`, `PaymentStatus`

### Estructura de Tipos

```typescript
// Entidad base (del backend)
export interface User {
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

// Datos para crear (sin campos autogenerados)
export interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
}

// Datos para actualizar (campos opcionales)
export interface UpdateUserData {
  full_name?: string;
  phone_number?: string;
  bio?: string;
}

// Respuesta de lista paginada
export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  page_size: number;
}
```

## Sincronización con Backend

Los tipos deben reflejar los schemas de Pydantic del backend:
- `backend/app/schemas/*.py` → `frontend/types/*.ts`

Al agregar/modificar endpoints en el backend, actualizar los tipos correspondientes aquí.

## Uso

```typescript
import { User, CreateListingData, OrderStatus } from '@/types';
// o
import type { User, Listing } from '@/types';
```

## Validación

Los tipos no validan en runtime. Para validación usar:
- Zod para formularios
- Validación de backend (principal)
