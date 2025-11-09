# Route Group: (auth)

## 🎯 Propósito
Rutas relacionadas con **autenticación de usuarios** usando AWS Cognito.

## 📂 Contenido
- `login/page.jsx` - Formulario de inicio de sesión
- `register/page.jsx` - Formulario de registro
- `layout.jsx` - Layout compartido (opcional: centrado, sin header/footer)

## 🔐 Autenticación
Estas rutas usan **AWS Amplify UI** o componentes personalizados que integran:
- `signIn()` de Amplify Auth
- `signUp()` de Amplify Auth
- Validación de tokens JWT
- Redirección a `/dashboard` después de login exitoso

## 🚀 Implementación
Los componentes deben ser **Client Components** (`'use client'`) porque usan hooks de Amplify.

## 🎨 Diseño
Usar tokens de Figma para formularios, botones y estados de error.
