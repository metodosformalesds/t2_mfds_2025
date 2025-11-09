# Config

Archivos de configuración y constantes de la aplicación.

## Archivos

```
config/
├── index.ts              # Re-exporta configuraciones
├── api.ts                # URLs y configuración de API
├── aws.ts                # Configuración AWS (Cognito, S3)
├── stripe.ts             # Configuración Stripe
├── constants.ts          # Constantes generales
├── theme.ts              # Configuración de tema y colores
└── routes.ts             # Rutas de la aplicación
```

## api.ts

Configuración de endpoints y cliente API:

```typescript
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const API_ENDPOINTS = {
  // Auth
  login: '/auth/login',
  register: '/auth/register',
  
  // Users
  users: '/users',
  profile: '/users/me',
  
  // Listings
  listings: '/listings',
  
  // Orders
  orders: '/orders',
  
  // Payments
  payments: '/payments',
  createCheckout: '/payments/checkout',
  
  // ... otros endpoints
};
```

## aws.ts

Configuración de servicios AWS:

```typescript
export const AWS_CONFIG = {
  cognito: {
    region: process.env.NEXT_PUBLIC_COGNITO_REGION,
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
  },
  s3: {
    bucketUrl: process.env.NEXT_PUBLIC_S3_BUCKET_URL,
    region: process.env.NEXT_PUBLIC_S3_REGION,
  },
};
```

## stripe.ts

Configuración de Stripe:

```typescript
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  successUrl: '/checkout/success',
  cancelUrl: '/checkout/cancel',
};
```

## constants.ts

Constantes de la aplicación:

```typescript
export const APP_NAME = 'Waste to Treasure';
export const APP_DESCRIPTION = 'Marketplace sostenible';

export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 100,
};

export const LISTING_CONSTANTS = {
  maxImages: 10,
  maxTitleLength: 100,
  maxDescriptionLength: 2000,
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;
```

## theme.ts

Configuración del tema visual:

```typescript
export const COLORS = {
  primary: {
    main: '#396539',
    dark: '#294730',
  },
  secondary: {
    main: '#69391E',
    light: '#A2704F',
  },
  neutral: {
    dark: '#262C32',
    white: '#FCFCFC',
    light: '#F3F3F3',
    black: '#000000',
  },
};

export const FONTS = {
  heading: 'Poppins, sans-serif',
  subheading: 'Roboto, sans-serif',
  body: 'Inter, sans-serif',
};
```

## routes.ts

Definición de rutas de la aplicación:

```typescript
export const ROUTES = {
  home: '/',
  
  // Auth
  login: '/login',
  register: '/register',
  
  // Marketplace
  marketplace: '/marketplace',
  listing: (id: string) => `/marketplace/listing/${id}`,
  
  // Dashboard
  dashboard: '/dashboard',
  myListings: '/dashboard/listings',
  myOrders: '/dashboard/orders',
  mySales: '/dashboard/sales',
  
  // Cart & Checkout
  cart: '/cart',
  checkout: '/checkout',
  
  // Profile
  profile: '/profile',
  settings: '/settings',
};
```

## Uso

```typescript
import { API_CONFIG, ROUTES, COLORS } from '@/config';

// En componentes
<Link href={ROUTES.marketplace}>Marketplace</Link>

// En estilos
style={{ color: COLORS.primary.main }}

// En servicios API
const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.listings}`);
```

## Seguridad

- NUNCA hardcodear secretos o keys privadas
- Usar variables de entorno para configuración sensible
- Las variables públicas deben tener prefijo `NEXT_PUBLIC_`
- Validar que variables requeridas existan al inicio
