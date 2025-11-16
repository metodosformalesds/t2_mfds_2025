/**
 * Servicio para operaciones de Pagos (Stripe).
 * Implementa llamadas a /api/v1/payments/
 */
import apiClient from './client'

export const paymentsService = {
  /**
   * Crea un customer en Stripe para el usuario autenticado.
   * (POST /api/v1/payments/customers)
   * @param {string} email
   * @param {string} name
   * @returns {Promise<Object>}
   */
  createCustomer: async (email, name) => {
    try {
      const { data } = await apiClient.post('/payments/customers', { email, name })
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Obtiene el customer de Stripe del usuario autenticado.
   * (GET /api/v1/payments/customers/me)
   * @returns {Promise<Object>}
   */
  getMyCustomer: async () => {
    try {
      const { data } = await apiClient.get('/payments/customers/me')
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Crea una sesión de Stripe Checkout (Página de pago hospedada).
   * (POST /api/v1/payments/checkout)
   * @param {Object} payload
   * @param {number} payload.order_id
   * @param {string} payload.success_url
   * @param {string} payload.cancel_url
   * @returns {Promise<Object>}
   */
  createCheckoutSession: async (payload) => {
    try {
      const { data } = await apiClient.post('/payments/checkout', payload)
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Procesa un pago directo con Payment Intent.
   * (POST /api/v1/payments/process)
   * @param {Object} payload
   * @param {number} payload.order_id
   * @param {string} payload.payment_method_id
   * @param {boolean} [payload.save_payment_method]
   * @returns {Promise<Object>}
   */
  processPayment: async (payload) => {
    try {
      const { data } = await apiClient.post('/payments/process', payload)
      return data
    } catch (error) {
      throw error
    }
  },
}

export default paymentsService