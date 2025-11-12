# 🚀 SOLUCIÓN: Error "Application error: a client-side exception has occurred"

## ⚠️ PROBLEMA ACTUAL
El build de Amplify está **pasando exitosamente** (commit `ab8158c`), pero la aplicación da error al cargar en el navegador:

> **"Application error: a client-side exception has occurred"**

**CAUSA:** Faltan las **variables de entorno** en AWS Amplify.

---

## ✅ SOLUCIÓN INMEDIATA

### **1. Ir a Variables de Entorno en Amplify**
1. Abre [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Selecciona tu app: `t2_MFDS_personal` o `t2_mfds_2025`
3. Ve a **App settings** → **Environment variables**
4. Click en **Manage variables**

---

### **2. Agregar TODAS estas Variables**

Copia y pega estas variables (ajusta los valores según tu configuración):

```bash
# ===== BACKEND API (REQUERIDO) =====
NEXT_PUBLIC_API_URL=https://tu-backend-real.com/api/v1

# ===== AWS COGNITO (REQUERIDO) =====
NEXT_PUBLIC_AWS_REGION=us-east-2
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-2_1Mcmsviiy
NEXT_PUBLIC_COGNITO_APP_CLIENT_ID=6b3dtprccp309ovs6a769049oo
NEXT_PUBLIC_COGNITO_REGION=us-east-2

# ===== STRIPE (REQUERIDO) =====
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_o_pk_test_tu_clave_aqui

# ===== AWS S3 (OPCIONAL) =====
NEXT_PUBLIC_S3_BUCKET_NAME=waste-to-treasure-images

# ===== TELÉFONO (OPCIONAL) =====
NEXT_PUBLIC_DEFAULT_PHONE_COUNTRY_CODE=+52
```

**📝 Notas:**
- Los valores de Cognito ya están en `app.json` (usa esos)
- Para `NEXT_PUBLIC_API_URL`, usa la URL de tu backend en producción
- Para Stripe, usa `pk_test_...` en desarrollo, `pk_live_...` en producción

---

### **3. Re-Desplegar**
Después de agregar las variables:

1. Ve a **Deployments**
2. Click en **Redeploy this version** (o espera el próximo deploy automático)
3. Monitorea los logs para verificar que no haya errores

---

### **4. Verificar que Funciona**
Una vez desplegado, prueba:
- ✅ Homepage carga sin error
- ✅ Productos: `/products`
- ✅ Detalle: `/products/123`
- ✅ Login: `/login`
- ✅ Consola del navegador sin errores

---

## 🔍 Cómo Verificar las Variables

### **En Amplify Console:**
```bash
# Deberías ver TODAS estas variables configuradas:
NEXT_PUBLIC_API_URL                      = https://...
NEXT_PUBLIC_AWS_REGION                   = us-east-2
NEXT_PUBLIC_COGNITO_USER_POOL_ID         = us-east-2_1Mcmsviiy
NEXT_PUBLIC_COGNITO_APP_CLIENT_ID        = 6b3dtprccp309ovs6a769049oo
NEXT_PUBLIC_COGNITO_REGION               = us-east-2
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY       = pk_test_...
NEXT_PUBLIC_S3_BUCKET_NAME               = waste-to-treasure-images
NEXT_PUBLIC_DEFAULT_PHONE_COUNTRY_CODE   = +52
```

### **En el Navegador (después del deploy):**
Abre la consola de Chrome/Firefox en tu app:
```javascript
console.log(process.env.NEXT_PUBLIC_API_URL)
// Debe mostrar: https://tu-backend-real.com/api/v1
// NO debe mostrar: undefined
```

---

## 📊 Estado Actual del Build

### ✅ Build Exitoso (ab8158c)
```
✓ Framework detected: Next.js
✓ Node v20.19.4
✓ npm ci --legacy-peer-deps
✓ 739 packages installed
✓ 0 vulnerabilities
```

### ❌ Runtime Error
```
Application error: a client-side exception has occurred
→ Causa: Variables de entorno undefined
→ Solución: Agregar variables en Amplify Console
```

---

## 🛠️ Troubleshooting

### Si el error persiste después de agregar variables:

**1. Limpia el cache:**
```bash
# En Amplify Console > Build settings
# Click "Clear cache" y redeploy
```

**2. Verifica el código:**
```javascript
// Abre waste_to_treasure/frontend/lib/api/client.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// Si NEXT_PUBLIC_API_URL está undefined, usará localhost (incorrecto en producción)
```

**3. Revisa la consola del navegador:**
- Abre DevTools (F12)
- Ve a la pestaña **Console**
- Busca errores rojos que indiquen qué variable falta

**4. Verifica CORS del backend:**
```bash
# El backend debe permitir el dominio de Amplify:
Access-Control-Allow-Origin: https://main.d14h8f9dai8k5y.amplifyapp.com
```

---

## 📝 Archivo de Referencia

Todas las variables están documentadas en:
```
waste_to_treasure/frontend/.env.example
waste_to_treasure/frontend/app.json
```

---

## 🎯 Checklist Final

- [ ] Variables de entorno configuradas en Amplify Console
- [ ] Backend API URL correcta (sin `localhost`)
- [ ] Credenciales de Cognito correctas
- [ ] Clave de Stripe correcta (test o live)
- [ ] Build completado sin errores
- [ ] Deploy completado
- [ ] Homepage carga sin "Application error"
- [ ] Rutas dinámicas funcionan (`/products/123`)
- [ ] Console del navegador sin errores

---

**¡Con esto debería funcionar!** 🚀

El problema NO es el código ni la configuración de `amplify.yml`. 
Es simplemente que Amplify necesita las variables de entorno para que Next.js funcione correctamente.
