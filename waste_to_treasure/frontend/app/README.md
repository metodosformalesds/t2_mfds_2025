# App Directory

Rutas de la aplicación usando Next.js App Router.

## Estructura

```
app/
├── layout.jsx            # Layout raíz (global)
├── page.jsx              # Página de inicio (landing)
├── loading.jsx           # Loading state global
├── error.jsx             # Error boundary global
├── not-found.jsx         # Página 404
│
├── (auth)/               # Grupo: autenticación (sin layout común)
│   ├── login/
│   │   └── page.jsx     # Página de login
│   └── register/
│       └── page.jsx     # Página de registro
│
├── (marketplace)/        # Grupo: marketplace público
│   ├── layout.jsx       # Layout con header/footer público
│   ├── marketplace/
│   │   ├── page.jsx     # Lista de productos
│   │   ├── [id]/
│   │   │   └── page.jsx # Detalle de producto
│   │   └── search/
│   │       └── page.jsx # Búsqueda de productos
│   ├── categories/
│   │   ├── page.jsx     # Lista de categorías
│   │   └── [slug]/
│   │       └── page.jsx # Productos por categoría
│   ├── cart/
│   │   └── page.jsx     # Carrito de compras
│   ├── checkout/
│   │   ├── page.jsx     # Proceso de checkout
│   │   ├── success/
│   │   │   └── page.jsx # Pago exitoso
│   │   └── cancel/
│   │       └── page.jsx # Pago cancelado
│   ├── sellers/
│   │   └── [id]/
│   │       └── page.jsx # Perfil público de vendedor
│   ├── faq/
│   │   └── page.jsx     # FAQs públicas
│   └── legal/
│       └── [slug]/
│           └── page.jsx # Documentos legales
│
├── dashboard/            # Panel de usuario (autenticado)
│   ├── layout.jsx       # Layout con sidebar
│   ├── page.jsx         # Dashboard home
│   ├── listings/
│   │   ├── page.jsx     # Mis publicaciones
│   │   ├── new/
│   │   │   └── page.jsx # Crear publicación
│   │   └── [id]/
│   │       ├── page.jsx # Ver/editar publicación
│   │       └── edit/
│   │           └── page.jsx
│   ├── orders/
│   │   ├── page.jsx     # Mis compras
│   │   └── [id]/
│   │       └── page.jsx # Detalle de orden
│   ├── sales/
│   │   ├── page.jsx     # Mis ventas
│   │   └── [id]/
│   │       └── page.jsx # Detalle de venta
│   ├── reviews/
│   │   └── page.jsx     # Mis reseñas
│   ├── notifications/
│   │   └── page.jsx     # Notificaciones
│   ├── subscription/
│   │   └── page.jsx     # Plan y suscripción
│   ├── settings/
│   │   ├── page.jsx     # Configuración general
│   │   ├── profile/
│   │   │   └── page.jsx # Editar perfil
│   │   ├── security/
│   │   │   └── page.jsx # Seguridad y contraseña
│   │   └── payment/
│   │       └── page.jsx # Métodos de pago
│   └── shipping/
│       └── page.jsx     # Direcciones de envío
│
└── api/                  # API Routes (backend-for-frontend)
    ├── webhooks/
    │   └── stripe/
    │       └── route.ts # Webhook de Stripe
    └── auth/
        └── [...nextauth]/
            └── route.ts # (futuro) NextAuth endpoints
```

## Grupos de Rutas

### (auth) - Autenticación
- Sin layout compartido
- Páginas públicas de login/registro
- Redirige a dashboard si ya está autenticado

### (marketplace) - Marketplace Público
- Layout con header y footer públicos
- Accesible sin autenticación
- Páginas de productos, categorías, búsqueda

### dashboard - Panel de Usuario
- Requiere autenticación
- Layout con sidebar de navegación
- Gestión de listados, órdenes, perfil

## Convenciones

### Nomenclatura de Archivos

- `page.jsx` - Componente de página (ruta pública)
- `layout.jsx` - Layout compartido
- `loading.jsx` - Estado de carga
- `error.jsx` - Manejo de errores
- `not-found.jsx` - Página 404
- `route.ts` - API Route handler

### Segmentos Dinámicos

- `[id]` - Parámetro dinámico (ej: /marketplace/123)
- `[...slug]` - Catch-all (ej: /blog/2024/01/post)
- `[[...slug]]` - Catch-all opcional

### Metadata

Definir metadata en cada página:

```jsx
export const metadata = {
  title: 'Marketplace - Waste to Treasure',
  description: 'Encuentra productos sostenibles',
};

export default function Page() {
  return <div>Content</div>;
}
```

## Data Fetching

### Server Components (default)

```jsx
// Fetch directo en server component
async function getListings() {
  const res = await fetch('http://localhost:8000/api/v1/listings', {
    cache: 'no-store', // o 'force-cache', 'revalidate'
  });
  return res.json();
}

export default async function ListingsPage() {
  const listings = await getListings();
  return <ListingGrid listings={listings} />;
}
```

### Client Components

```jsx
'use client';

import { useListings } from '@/hooks';

export default function ListingsPage() {
  const { listings, loading } = useListings();
  
  if (loading) return <Loading />;
  return <ListingGrid listings={listings} />;
}
```

## Protección de Rutas

Middleware para autenticación:

```typescript
// middleware.ts (raíz)
import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('auth-token');
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

## API Routes

Usar para:
- Webhooks (Stripe, AWS)
- Proxy para ocultar keys del backend
- Server-side operations que no pueden ir en componentes

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.text();
  // Procesar webhook
  return NextResponse.json({ received: true });
}
```

## Best Practices

- Usar Server Components por defecto
- Marcar Client Components con 'use client' solo cuando sea necesario
- Colocar lógica de negocio en `/lib` y `/hooks`
- Mantener páginas simples, delegar a componentes
- Usar loading.jsx y error.jsx para mejor UX
- Implementar metadata para SEO

