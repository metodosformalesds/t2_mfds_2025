/**
 * Autor: Arturo Perez Gonzalez
 * Fecha: 09/11/2024
 * Descripción: Cliente HTTP Axios configurado para comunicación con el backend.
 *              Incluye interceptors para autenticación automática con JWT/Cognito,
 *              manejo global de errores (401, 403, 404, 500, etc.) y timeout de 30s.
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
 * Obtener token de autenticacion
 * Intenta primero desde localStorage (funciona para OAuth y login normal)
 * Si no existe, intenta obtenerlo desde Cognito User Pool
 */
const getFreshToken = async () => {
  try {
    // Primero intentar desde localStorage (funciona para OAuth)
    let token = localStorage.getItem('auth-token')
    
    if (token) {
      console.log('Token encontrado en localStorage')
      return token
    }
    
    // Si no hay token en localStorage, intentar desde Cognito User Pool
    console.log('Intentando obtener token desde Cognito User Pool...')
    const { getAuthToken } = await import('@/lib/auth/cognito')
    token = await getAuthToken()
    
    if (token) {
      localStorage.setItem('auth-token', token)
      console.log('Token obtenido desde Cognito User Pool')
    } else {
      localStorage.removeItem('auth-token')
      console.log('No se encontro token')
    }
    
    return token
  } catch (error) {
    console.error('Error obteniendo token:', error)
    // Fallback a localStorage
    return localStorage.getItem('auth-token')
  }
}

/**
 * Interceptor de request - Agrega token de autenticacion si existe
 */
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getFreshToken()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('Token agregado al request:', token.substring(0, 50) + '...')
    } else {
      console.log('No hay token disponible para este request')
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
          console.error('Error 401: No autenticado')
          localStorage.removeItem('auth-token')
          localStorage.removeItem('access-token')
          localStorage.removeItem('refresh-token')
          
          // Redirigir solo si no estamos en una ruta publica
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
          console.error('Error 403: Sin permisos')
          console.error('Response data:', error.response.data)
          break

        case 404:
          // Recurso no encontrado
          break

        case 422:
          // Error de validacion
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