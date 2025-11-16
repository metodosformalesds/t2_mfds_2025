'use client'

import { Amplify } from 'aws-amplify'
import amplifyConfig from '@/amplifyconfiguration.json'

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

    // Transformar la configuración al formato que espera Amplify v6
    const config = {
      Auth: {
        Cognito: {
          userPoolId: amplifyConfig.aws_user_pools_id,
          userPoolClientId: amplifyConfig.aws_user_pools_web_client_id,
          region: amplifyConfig.aws_cognito_region,
          
          // Configuración OAuth para federated sign-in (Google, Facebook, etc.)
          loginWith: {
            oauth: {
              domain: amplifyConfig.oauth.domain,
              scopes: amplifyConfig.oauth.scope,
              redirectSignIn: [redirectSignIn],
              redirectSignOut: [redirectSignOut],
              responseType: amplifyConfig.oauth.responseType,
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
    // Configuración fallida
  }
}

// Auto-configurar cuando se importa en el cliente
if (typeof window !== 'undefined') {
  configureAmplify()
}
