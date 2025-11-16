/**
 * Cliente HTTP configurado con Axios para comunicación con el backend.
 *
 * Configuración centralizada de:
 * - Base URL del backend
 * - Interceptors de autenticación
 * - Manejo global de errores
 */

import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

/**
 * Cliente axios configurado
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Obtener token de autenticación
 */
const getFreshToken = async () => {
  try {
    const { getAuthToken } = await import('@/lib/auth/cognito')
    const token = await getAuthToken()
    
    if (token) {
      localStorage.setItem('auth-token', token)
    } else {
      localStorage.removeItem('auth-token')
    }
    
    return token
  } catch (error) {
    return localStorage.getItem('auth-token')
  }
}

/**
 * Interceptor de request - Agrega token de autenticación si existe
 */
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getFreshToken()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
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
    if (error.response) {
      const { status } = error.response

      switch (status) {
        case 401:
          // No autenticado - limpiar tokens
          localStorage.removeItem('auth-token')
          
          // Redirigir solo si no estamos en una ruta pública
          if (typeof window !== 'undefined') {
            const publicRoutes = ['/', '/login', '/register', '/marketplace', '/about', '/materials', '/products', '/sellers']
            const currentPath = window.location.pathname
            const isPublicRoute = publicRoutes.some(route => 
              currentPath === route || currentPath.startsWith(route + '/')
            )
            
            if (!isPublicRoute) {
              window.location.href = '/login'
            }
          }
          break

        case 403:
          // Sin permisos
          break

        case 404:
          // Recurso no encontrado
          break

        case 422:
          // Error de validación
          break

        case 500:
          // Error del servidor
          break

        case 502:
        case 503:
        case 504:
          // Servicio no disponible
          break

        default:
          // Otro error
          break
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
