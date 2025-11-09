# Route Group: (marketplace)

## 🎯 Propósito
Rutas del **marketplace público** (no requieren autenticación para visualizar).

## 📂 Contenido
- `materials/` - Marketplace B2B de materiales reciclados
- `products/` - Marketplace B2C de productos terminados
- `cart/` - Carrito de compras
- `checkout/` - Proceso de pago con Stripe
- `layout.jsx` - Layout con Header + Footer del marketplace

## 🛒 Flujo de Compra
1. Usuario navega materials/products
2. Agrega items al carrito (requiere autenticación)
3. Va a `/cart` para revisar
4. Procede a `/checkout` (Stripe Checkout)
5. Redirige a `/dashboard/my-orders` después de pago

## 🔍 SEO
Estas rutas son **Server Components** por defecto para mejor SEO:
- `/materials` → Lista indexable en Google
- `/materials/[id]` → Detalle con meta tags dinámicos

## 📡 Data Fetching
Usar `fetch()` directo en Server Components:
```javascript
export default async function MaterialsPage() {
  const res = await fetch('http://localhost:8000/api/v1/materials')
  const materials = await res.json()
  return <div>...</div>
}
```
