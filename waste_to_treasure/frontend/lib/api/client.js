/**
 * Cliente HTTP configurado con Axios para comunicación con el backend.
 *
 * Configuración centralizada de:
 * - Base URL del backend
 * - Interceptors de autenticación
 * - Manejo global de errores
 */

import axios from 'axios'

// Base URL del backend desde variables de entorno
// Next.js usa NEXT_PUBLIC_ prefix para variables expuestas al cliente
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

    console.log('[API Client] Request a:', config.url)
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

      switch (status) {
        case 401:
          // No autenticado - limpiar tokens y silent fail si es esperado
          console.warn('⚠️ No autenticado - sesión expirada o no iniciada')
          localStorage.removeItem('auth-token')
          
          // Solo redirigir si estamos en una página que requiere auth
          // Las páginas públicas pueden manejar el 401 sin redirect
          if (typeof window !== 'undefined') {
            const publicRoutes = ['/', '/login', '/register', '/marketplace']
            const currentPath = window.location.pathname
            const isPublicRoute = publicRoutes.some(route => currentPath.startsWith(route))
            
            if (!isPublicRoute) {
              console.log('Redirigiendo a login desde ruta protegida:', currentPath)
              window.location.href = '/login'
            }
          }
          break

        case 403:
          console.error('Sin permisos para acceder a este recurso')
          break

        case 404:
          console.error('Recurso no encontrado')
          break

        case 422:
          // Error de validación
          console.error('Error de validación:', data.detail || data.errors)
          break

        case 500:
          console.error('Error interno del servidor')
          break

        default:
          console.error('Error en la petición:', data.detail || error.message)
      }
    } else if (error.request) {
      // La petición fue hecha pero no hubo respuesta
      console.error('No se pudo conectar con el servidor. Verifica tu conexión.')
    } else {
      // Algo pasó al configurar la petición
      console.error('Error al configurar la petición:', error.message)
    }

    return Promise.reject(error)
  }
)

export default apiClient
