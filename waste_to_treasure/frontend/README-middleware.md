# Middleware.ts - Protección de Rutas

## 🎯 Propósito
Middleware de Next.js que protege rutas privadas verificando autenticación.

## 🔒 Rutas Protegidas
- `/dashboard/*` - Panel de usuario
- `/checkout` - Proceso de pago

## 🔑 Lógica
1. Verifica si existe token de Cognito en cookies
2. Si no hay token y la ruta es protegida → redirige a `/login`
3. Guarda URL original en `?redirect=` para volver después de login

## 📝 Agregar Nueva Ruta Protegida
Modificar el array `protectedPaths`:
```javascript
const protectedPaths = ['/dashboard', '/checkout', '/my-reviews']
```
