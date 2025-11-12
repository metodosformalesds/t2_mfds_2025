/**
 * Servicio para operaciones de Órdenes (Pedidos).
 * Implementa llamadas a /api/v1/orders/
 */
import apiClient from './client'

export const ordersService = {
  /**
   * Procesa el checkout y crea una nueva orden.
   * (POST /api/v1/orders/checkout)
   * @param {Object} checkoutData - Datos del checkout (Address ID, Payment Token)
   * @param {string} checkoutData.payment_token - Token de pago (ej. "tok_...")
   * @param {number} [checkoutData.shipping_address_id] - ID de la dirección de envío
   * @param {number} [checkoutData.shipping_method_id] - ID del método de envío
   * @returns {Promise<Object>} Objeto OrderRead
   */
  processCheckout: async (checkoutData) => {
    try {
      // NOTA: La API espera un 'payment_token'.
      // En una implementación real de Stripe, obtendríamos este token
      // del formulario de tarjeta. Aquí simularemos uno si no viene.
      const payload = {
        payment_token: checkoutData.payment_token || 'tok_simulated_payment',
        shipping_address_id: checkoutData.shipping_address_id,
        shipping_method_id: checkoutData.shipping_method_id,
      }
      
      const { data } = await apiClient.post('/orders/checkout', payload)
      return data
    } catch (error) {
      console.error('Error al procesar el checkout:', error)
      // Lanzamos el error para que el modal de confirmación lo atrape
      throw new Error(error.response?.data?.detail || 'No se pudo procesar el pago.')
    }
  },
}

export default ordersService