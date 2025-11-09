# Dashboard - Panel de Usuario

## 🎯 Propósito
Panel privado para usuarios autenticados (compradores y vendedores).

## 📂 Contenido
- `my-listings/` - Gestión de publicaciones del vendedor
- `my-orders/` - Historial de compras del comprador
- `subscriptions/` - Gestión de planes SaaS
- `layout.jsx` - Layout con sidebar de navegación

## 🔒 Protección
Estas rutas están protegidas por **middleware.ts** en la raíz del proyecto.

## 🎨 Layout
El `layout.jsx` incluye:
- Sidebar con navegación (My Listings, Orders, Subscriptions)
- Header con nombre de usuario y logout
- Breadcrumbs para navegación

## 📊 Componentes Dinámicos
Usar **Client Components** para:
- Tablas interactivas
- Formularios de edición
- Modales de confirmación
