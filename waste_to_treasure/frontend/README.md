# Waste to Treasure - Frontend

Aplicación Next.js para la plataforma de marketplace sostenible Waste to Treasure.

## Tecnologías

- Next.js 14+ (App Router)
- React 18+
- TypeScript
- Tailwind CSS
- AWS Cognito (autenticación)
- Stripe (pagos)
- Zustand (state management)

## Paleta de Colores

### Primary Colors
- `#396539` - Verde principal
- `#294730` - Verde oscuro

### Secondary Colors
- `#69391E` - Marrón
- `#A2704F` - Marrón claro

### Neutral Colors
- `#262C32` - Gris oscuro
- `#FCFCFC` - Blanco
- `#F3F3F3` - Gris claro
- `#000000` - Negro

## Tipografía

- **Poppins**: Headings y títulos
- **Roboto**: Subheadings y texto destacado
- **Inter**: Body text

## Estructura del Proyecto

```
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rutas de autenticación (login, register)
│   ├── (marketplace)/     # Rutas públicas del marketplace
│   ├── dashboard/         # Panel de usuario
│   └── api/               # API routes (webhooks, etc)
├── components/            # Componentes React reutilizables
│   ├── ui/               # Componentes base de UI
│   ├── layout/           # Componentes de layout (header, footer)
│   └── marketplace/      # Componentes específicos del marketplace
├── lib/                   # Utilidades y configuraciones
│   ├── api/              # Cliente API y servicios
│   ├── auth/             # Autenticación AWS Cognito
│   ├── stripe/           # Integración Stripe
│   └── utils/            # Funciones auxiliares
├── types/                 # Definiciones TypeScript
├── hooks/                 # Custom React hooks
├── stores/                # Zustand stores (estado global)
├── styles/                # Estilos globales y configuración CSS
├── public/                # Assets estáticos
└── config/                # Archivos de configuración
```

## Comandos

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build producción
npm run build

# Iniciar producción
npm start

# Linting
npm run lint
```

## Variables de Entorno

Crear archivo `.env.local` con:

```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# AWS Cognito
NEXT_PUBLIC_COGNITO_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your_pool_id
NEXT_PUBLIC_COGNITO_CLIENT_ID=your_client_id

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# AWS S3 (para imágenes)
NEXT_PUBLIC_S3_BUCKET_URL=https://your-bucket.s3.amazonaws.com
```

## Convenciones de Código

- Usar TypeScript para todo el código
- Componentes funcionales con hooks
- Nombrar archivos en kebab-case
- Nombrar componentes en PascalCase
- Usar Tailwind CSS para estilos
- Documentar componentes complejos
- Tests unitarios para lógica de negocio

## Arquitectura

- **App Router**: Rutas organizadas por funcionalidad
- **Component-driven**: Componentes pequeños y reutilizables
- **API Client**: Capa de servicios para comunicación con backend
- **Type-safe**: TypeScript en todo el proyecto
- **State Management**: Zustand para estado global, React Context para estado local
- **Server Components**: Usar RSC donde sea posible para mejor rendimiento

## Integración con Backend

El frontend se comunica con el backend FastAPI mediante:

- REST API (axios/fetch)
- Autenticación JWT (AWS Cognito)
- Webhooks Stripe (API routes)
- WebSockets (futuro: notificaciones en tiempo real)

Ver documentación detallada en cada carpeta.
