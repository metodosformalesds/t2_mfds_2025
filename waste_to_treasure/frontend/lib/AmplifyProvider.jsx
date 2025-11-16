'use client'

import { useEffect } from 'react'
import { configureAmplify } from '@/lib/amplifyConfig'

/**
 * Componente que asegura que Amplify esté configurado antes de renderizar children
 * Debe ser usado en el layout como un provider del lado del cliente
 */
export function AmplifyProvider({ children }) {
  useEffect(() => {
    // Configurar Amplify cuando el componente se monte en el cliente
    configureAmplify()
  }, [])

  return <>{children}</>
}
