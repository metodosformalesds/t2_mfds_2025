'use client'

import { Amplify } from 'aws-amplify'

// Configurar Amplify solo una vez y solo en el cliente
let isConfigured = false

export function configureAmplify() {
  if (isConfigured || typeof window === 'undefined') {
    return
  }

  try {
    const currentUrl = window.location.origin
    
    // Determinar redirect URLs basado en el entorno
    const redirectUri = currentUrl.includes('amplifyapp.com')
      ? 'https://main.d20d0dqywsvuyq.amplifyapp.com/callback'
      : 'http://localhost:3000/callback'
    
    const signOutUri = currentUrl.includes('amplifyapp.com')
      ? 'https://main.d20d0dqywsvuyq.amplifyapp.com/'
      : 'http://localhost:3000/'

    // Validar variables requeridas
    if (!process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 
        !process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ||
        !process.env.NEXT_PUBLIC_COGNITO_DOMAIN) {
      console.error('Variables de Cognito no configuradas:', {
        UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ? 'OK' : 'MISSING',
        ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ? 'OK' : 'MISSING',
        Domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN ? 'OK' : 'MISSING',
      })
      return
    }

    const config = {
      Auth: {
        Cognito: {
          userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
          userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
          region: process.env.NEXT_PUBLIC_COGNITO_REGION || 'us-east-1',
          
          loginWith: {
            oauth: {
              domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
              scopes: ['openid', 'email', 'profile'],
              redirectSignIn: [redirectUri],
              redirectSignOut: [signOutUri],
              responseType: 'code',
            },
          },
        },
      },
    }

    console.log('Configurando Amplify con:', {
      domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
      redirectSignIn: redirectUri,
      redirectSignOut: signOutUri,
    })

    Amplify.configure(config, { ssr: false })

    isConfigured = true
    console.log('Amplify configurado exitosamente')
  } catch (error) {
    console.error('Error configuring Amplify:', error)
  }
}

if (typeof window !== 'undefined') {
  configureAmplify()
}