/**
 * Cliente HTTP configurado con Axios para comunicación con el backend.
 *
 * Configuración centralizada de:
 * - Base URL del backend (vía API Gateway en producción)
 * - Interceptors de autenticación
 * - Manejo global de errores
 * 
 * IMPORTANTE: En producción, API_BASE_URL debe apuntar al API Gateway,
 * NO directamente a la Elastic IP del backend.
 */

import axios from 'axios'

// Base URL del backend desde variables de entorno
// DESARROLLO: http://localhost:8000/api/v1
// PRODUCCIÓN: https://4vopem29wa.execute-api.us-east-1.amazonaws.com (API Gateway)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

/**
 * Cliente axios configurado
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Obtener token fresco de Cognito
 * Esta función debe ser llamada antes de cada request para asegurar que el token esté actualizado
 */
const getFreshToken = async () => {
  try {
    // Importación dinámica para evitar problemas con SSR
    const { getAuthToken } = await import('@/lib/auth/cognito')
    const token = await getAuthToken()
    
    // Actualizar localStorage si hay un token válido
    if (token) {
      localStorage.setItem('auth-token', token)
    } else {
      localStorage.removeItem('auth-token')
    }
    
    return token
  } catch (error) {
    console.error('[API Client] Error obteniendo token:', error)
    // Si hay error, intentar usar el token de localStorage como fallback
    return localStorage.getItem('auth-token')
  }
}

/**
 * Interceptor de request - Agrega token de autenticación si existe
 */
apiClient.interceptors.request.use(
  async (config) => {
    // Obtener token fresco de Cognito en cada request
    const token = await getFreshToken()

    console.log('[API Client] ======= REQUEST DEBUG =======')
    console.log('[API Client] Base URL:', config.baseURL)
    console.log('[API Client] Request URL:', config.url)
    console.log('[API Client] URL completa:', `${config.baseURL}${config.url}`)
    console.log('[API Client] Method:', config.method)
    console.log('[API Client] Params:', config.params)
    console.log('[API Client] Token presente:', token ? 'SI (longitud: ' + token.length + ')' : 'NO')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    console.error('[API Client] Error en request interceptor:', error)
    return Promise.reject(error)
  }
)

/**
 * Interceptor de response - Maneja errores globales
 */
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Manejo de errores comunes
    if (error.response) {
      // El servidor respondió con un código de error
      const { status, data } = error.response

      console.error('[API Client] Error Response:', {
        status,
        url: error.config?.url,
        method: error.config?.method,
        data: data
      })

      switch (status) {
        case 401:
          // No autenticado - limpiar tokens y silent fail si es esperado
          console.warn('⚠️ No autenticado - sesión expirada o no iniciada')
          localStorage.removeItem('auth-token')
          
          // Solo redirigir si estamos en una página que requiere auth
          // Las páginas públicas pueden manejar el 401 sin redirect
          if (typeof window !== 'undefined') {
            const publicRoutes = ['/', '/login', '/register', '/marketplace', '/about']
            const currentPath = window.location.pathname
            const isPublicRoute = publicRoutes.some(route => 
              currentPath === route || currentPath.startsWith(route + '/')
            )
            
            if (!isPublicRoute) {
              console.log('Redirigiendo a login desde ruta protegida:', currentPath)
              window.location.href = '/login'
            }
          }
          break

        case 403:
          console.error('❌ Sin permisos para acceder a este recurso')
          break

        case 404:
          console.error('❌ Recurso no encontrado:', error.config?.url)
          break

        case 422:
          // Error de validación
          console.error('❌ Error de validación en:', error.config?.url)
          console.error('   Parámetros enviados:', error.config?.params)
          console.error('   Detalles:', data.detail || data.errors)
          if (data.detail && Array.isArray(data.detail)) {
            data.detail.forEach(err => {
              console.error(`   - ${err.loc?.join('.')}: ${err.msg}`)
            })
          }
          break

        case 500:
          console.error('❌ Error interno del servidor')
          console.error('   URL:', error.config?.url)
          console.error('   Método:', error.config?.method)
          console.error('   Detalles:', data)
          break

        case 502:
        case 503:
        case 504:
          console.error('❌ Error de API Gateway o Backend no disponible')
          console.error('   Verifica que:')
          console.error('   1. El backend esté corriendo en EC2')
          console.error('   2. API Gateway esté configurado correctamente')
          console.error('   3. El Security Group permita tráfico en puerto 8000')
          break

        default:
          console.error('❌ Error en la petición:', data.detail || error.message)
      }
    } else if (error.request) {
      // La petición fue hecha pero no hubo respuesta
      console.error('❌ No se pudo conectar con el servidor.')
      console.error('   API URL configurada:', API_BASE_URL)
      console.error('   Verifica:')
      console.error('   1. La variable NEXT_PUBLIC_API_URL en Amplify')
      console.error('   2. Que apunte al API Gateway (no a localhost ni Elastic IP)')
      console.error('   3. Tu conexión a internet')
    } else {
      // Algo pasó al configurar la petición
      console.error('❌ Error al configurar la petición:', error.message)
    }

    return Promise.reject(error)
  }
)

export default apiClient
