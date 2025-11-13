/**
 * Servicio para operaciones de Suscripciones (SaaS).
 *
 * Implementa llamadas a /api/v1/subscriptions/
 */

import apiClient from './client'

export const subscriptionsService = {
  // --- Mi Suscripción ---

  /**
   * Obtiene la suscripción activa del usuario autenticado.
   * (GET /api/v1/subscriptions/me)
   * 
   * @returns {Promise<Object|null>} Datos de la suscripción activa o null si no existe
   */
  getMySubscription: async () => {
    try {
      const { data } = await apiClient.get('/subscriptions/me')
      return data
    } catch (error) {
      console.error('Error al obtener suscripción:', error)
      // Si es 404, retornar null (no hay suscripción)
      if (error.response?.status === 404) {
        return null
      }
      throw new Error(error.response?.data?.detail || 'No se pudo cargar la suscripción.')
    }
  },

  // --- Crear o Cambiar Suscripción ---

  /**
   * Crea una nueva suscripción o actualiza la existente a un nuevo plan.
   * (POST /api/v1/subscriptions/subscribe)
   * 
   * @param {Object} subscriptionData - Datos de la suscripción
   * @param {number} subscriptionData.plan_id - ID del plan a suscribirse
   * @param {string} subscriptionData.payment_token - Token de pago (ej: "tok_visa")
   * @returns {Promise<Object>} Suscripción creada o actualizada
   */
  createOrChangeSubscription: async (subscriptionData) => {
    try {
      const { data } = await apiClient.post('/subscriptions/subscribe', subscriptionData)
      return data
    } catch (error) {
      console.error('Error al crear/cambiar suscripción:', error)
      throw new Error(error.response?.data?.detail || 'No se pudo procesar la suscripción.')
    }
  },

  // --- Cancelar Suscripción ---

  /**
   * Cancela la suscripción activa del usuario.
   * (POST /api/v1/subscriptions/cancel)
   * 
   * @returns {Promise<Object>} Suscripción cancelada
   */
  cancelSubscription: async () => {
    try {
      const { data } = await apiClient.post('/subscriptions/cancel')
      return data
    } catch (error) {
      console.error('Error al cancelar suscripción:', error)
      throw new Error(error.response?.data?.detail || 'No se pudo cancelar la suscripción.')
    }
  },
}

export default subscriptionsService