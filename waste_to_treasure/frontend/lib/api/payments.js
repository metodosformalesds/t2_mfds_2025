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

  /**
   * Lista todos los métodos de pago guardados del usuario.
   * (GET /api/v1/payments/methods)
   * @returns {Promise<Array>} Lista de payment methods
   */
  listPaymentMethods: async () => {
    try {
      const { data } = await apiClient.get('/payments/methods')
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Crea un SetupIntent para guardar un método de pago.
   * (POST /api/v1/payments/setup-intent)
   * Este es el flujo CORRECTO recomendado por Stripe.
   * @returns {Promise<Object>} { client_secret, setup_intent_id }
   */
  createSetupIntent: async () => {
    try {
      const { data } = await apiClient.post('/payments/setup-intent')
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Elimina un método de pago del usuario.
   * (DELETE /api/v1/payments/methods/{payment_method_id})
   * @param {string} paymentMethodId - ID del payment method a eliminar
   * @returns {Promise<Object>}
   */
  deletePaymentMethod: async (paymentMethodId) => {
    try {
      const { data } = await apiClient.delete(`/payments/methods/${paymentMethodId}`)
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * [DEPRECATED] Adjunta un payment method al customer del usuario en Stripe.
   * (POST /api/v1/payments/methods/attach)
   * ADVERTENCIA: Este método está obsoleto y puede causar PaymentMethods quemados.
   * Usa createSetupIntent() en su lugar.
   * @param {string} paymentMethodId - ID del payment method (pm_xxxxx)
   * @param {boolean} setAsDefault - Si se debe marcar como método por defecto
   * @returns {Promise<Object>}
   * @deprecated Use createSetupIntent() instead
   */
  attachPaymentMethod: async (paymentMethodId, setAsDefault = true) => {
    console.warn('attachPaymentMethod está obsoleto. Usa createSetupIntent() en su lugar.')
    try {
      const { data } = await apiClient.post('/payments/methods/attach', {
        payment_method_id: paymentMethodId,
        set_as_default: setAsDefault
      })
      return data
    } catch (error) {
      throw error
    }
  },
}

export default paymentsService