'use client'

import { Amplify } from 'aws-amplify'

// Configurar Amplify solo una vez y solo en el cliente
let isConfigured = false

export function configureAmplify() {
  // Evitar reconfiguración múltiple
  if (isConfigured || typeof window === 'undefined') {
    return
  }

  try {
    // Detectar el entorno actual
    const currentUrl = window.location.origin
    
    // Configurar redirects basado en el entorno
    let redirectSignIn = 'http://localhost:3000/'
    let redirectSignOut = 'http://localhost:3000/'
    
    // Si estamos en producción (Amplify), usar la URL de producción
    if (currentUrl.includes('amplifyapp.com')) {
      redirectSignIn = 'https://main.d20d0dqywsvuyq.amplifyapp.com/'
      redirectSignOut = 'https://main.d20d0dqywsvuyq.amplifyapp.com/'
    }

    // Leer configuración desde variables de entorno
    const config = {
      Auth: {
        Cognito: {
          userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
          userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
          region: process.env.NEXT_PUBLIC_COGNITO_REGION,
          
          // Configuración OAuth para federated sign-in (Google, Facebook, etc.)
          loginWith: {
            oauth: {
              domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
              scopes: ['openid', 'email', 'profile'],
              redirectSignIn: [redirectSignIn],
              redirectSignOut: [redirectSignOut],
              responseType: 'code',
            },
          },
        },
      },
    }

    Amplify.configure(config, {
      ssr: false,
    })

    isConfigured = true
  } catch (error) {
    console.error('Error configuring Amplify:', error)
  }
}

// Auto-configurar cuando se importa en el cliente
if (typeof window !== 'undefined') {
  configureAmplify()
}
