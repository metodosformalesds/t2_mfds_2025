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
 * Interceptor de request - Agrega token de autenticación si existe
 */
apiClient.interceptors.request.use(
  (config) => {
    // Obtener token de localStorage (ajustar según tu implementación de auth)
    const token = localStorage.getItem('auth-token')

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
    // Manejo de errores comunes
    if (error.response) {
      // El servidor respondió con un código de error
      const { status, data } = error.response

      switch (status) {
        case 401:
          // No autenticado - redirigir a login
          console.error('No autenticado. Redirigiendo a login...')
          localStorage.removeItem('auth-token')
          // window.location.href = '/login' // Descomentar si necesitas redirect automático
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
