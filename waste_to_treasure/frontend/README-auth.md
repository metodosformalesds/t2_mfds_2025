# Configuración de Autenticación con AWS Cognito

## Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env.local`:

```env
# AWS Cognito Configuration
NEXT_PUBLIC_COGNITO_USER_POOL_ID=tu-user-pool-id
NEXT_PUBLIC_COGNITO_APP_CLIENT_ID=tu-app-client-id
NEXT_PUBLIC_COGNITO_REGION=us-east-2
```

## Cómo Obtener las Credenciales

### 1. User Pool ID
1. Ve a AWS Console → Cognito
2. Selecciona tu User Pool
3. En la pestaña "General settings", copia el **Pool Id**

### 2. Client ID
1. En tu User Pool, ve a "App clients"
2. Copia el **App client id**

### 3. Region
- Es la región donde está desplegado tu User Pool (ej: `us-east-2`, `us-east-1`)

## Configuración del User Pool

Asegúrate de que tu User Pool tenga estas configuraciones:

### Atributos Requeridos
- email (verificado)
- given_name (nombre)
- family_name (apellido)

### Políticas de Contraseña
- Mínimo 8 caracteres
- Requiere mayúsculas
- Requiere minúsculas
- Requiere números

### App Client Settings
- ✅ Enable username password auth for admin APIs
- ✅ Enable SRP auth flow
- ❌ Don't generate client secret (importante para apps públicas)

## Flujo de Autenticación Completo

### 1. Registro
1. Usuario completa el formulario en `/register`
2. Se crea cuenta en Cognito (estado: no confirmado)
3. Cognito envía código de verificación por email
4. Redirección a `/verify-email`

### 2. Verificación de Email
1. Usuario ingresa código recibido por email
2. Cognito confirma la cuenta
3. Cuenta activada (estado: confirmado)
4. Redirección a `/login`

### 3. Inicio de Sesión
1. Usuario ingresa email y contraseña en `/login`
2. Cognito valida credenciales
3. Se crea sesión de usuario
4. Redirección a homepage (/)
5. Header muestra nombre de usuario y botón "Cerrar Sesión"

### 4. Sesión Persistente
- El estado de autenticación se mantiene usando `AuthContext`
- Los tokens se almacenan en localStorage (Cognito SDK)
- La opción "Recordarme" guarda el email en localStorage
- Al recargar la página, el contexto verifica la sesión automáticamente

### 5. Recuperación de Contraseña (NUEVO - 17/11/2025)
1. Usuario hace clic en "¿Olvidaste tu contraseña?" en `/login`
2. Ingresa email en `/forgot-password`
3. Cognito envía código de verificación de 6 dígitos por email
4. Usuario ingresa código y nueva contraseña en `/reset-password`
5. Cognito valida código y actualiza contraseña
6. Redirección a `/login` con nueva contraseña

**Características:**
- ✅ Usa AWS Cognito nativo (sin necesidad de Amazon SES)
- ✅ Código expira en 1 hora
- ✅ Validación de contraseña (8+ chars, mayúscula, minúscula, número, especial)
- ✅ Rate limiting automático (previene abuso)
- ✅ Manejo completo de errores

**Documentación completa:** Ver `README-password-recovery.md`

### 6. Cierre de Sesión
1. Usuario hace clic en "Cerrar Sesión" en el header
2. Se elimina la sesión de Cognito
3. Se limpian datos de localStorage
4. Redirección a `/login`

## Endpoints Disponibles

- ✅ `/register` - Formulario de registro
- ✅ `/verify-email` - Verificación de código por email
- ✅ `/login` - Inicio de sesión
- ✅ `/forgot-password` - Solicitud de código de recuperación (COMPLETO)
- ✅ `/reset-password` - Restablecer contraseña con código (NUEVO)
- ✅ `/` - Homepage (muestra contenido diferente si está autenticado)

## Componentes de Autenticación

### AuthContext (`context/AuthContext.jsx`)
- **Estado Global**: Maneja el estado de autenticación en toda la app
- **Funciones**:
  - `login(userData)` - Actualiza estado después de login exitoso
  - `logout()` - Cierra sesión y limpia datos
  - `checkAuthStatus()` - Verifica si hay sesión activa
- **Propiedades**:
  - `user` - Datos del usuario actual
  - `isAuthenticated` - Boolean de estado de autenticación
  - `isLoading` - Indica si está verificando la sesión

### Cognito Service (`lib/auth/cognito.js`)
- **signUp(email, password, firstName, lastName)** - Registra nuevo usuario
- **confirmSignUp(email, code)** - Confirma cuenta con código de email
- **resendConfirmationCode(email)** - Reenvía código de verificación
- **signIn(email, password)** - Inicia sesión
- **signOut()** - Cierra sesión
- **getCurrentUser()** - Obtiene usuario actual
- **getAuthToken()** - Obtiene token JWT
- **isAuthenticated()** - Verifica si hay sesión activa
- **forgotPassword(email)** - Solicita código de recuperación (NUEVO)
- **confirmPassword(email, code, newPassword)** - Confirma nueva contraseña (NUEVO)

## Protección de Rutas

Actualmente, las rutas están abiertas. Para proteger rutas en el futuro:

### Opción 1: Middleware (Next.js)
```javascript
// middleware.js
export function middleware(request) {
  // Verificar token en cookies
  // Redirigir si no está autenticado
}
```

### Opción 2: Higher-Order Component
```javascript
// components/auth/withAuth.jsx
export function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) redirect('/login');
    return <Component {...props} />;
  };
}
```

## Próximos Pasos

- [x] Implementar página de login
- [x] Implementar recuperación de contraseña con Cognito (COMPLETO - 17/11/2025)
- [ ] Agregar autenticación con Google/Apple
- [ ] Configurar OAuth en Cognito
- [ ] Crear middleware de protección de rutas
- [ ] Configurar dominio personalizado en Cognito

## Despliegue en AWS Amplify

El proyecto está preparado para desplegarse en AWS Amplify con estas configuraciones:

1. **Build Settings**: Next.js automáticamente detectado
2. **Environment Variables**: Agregar las variables de Cognito en Amplify Console
3. **Domain**: Configurar dominio personalizado si es necesario
