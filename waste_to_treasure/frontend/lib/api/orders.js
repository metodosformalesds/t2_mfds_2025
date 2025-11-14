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
      // --- INICIO DE MODIFICACIÓN (Arreglo del error de Stripe) ---
      // Stripe requiere una URL de retorno para métodos de pago que
      // pueden necesitar redirección (como 3D Secure).
      // Construimos la URL absoluta a nuestra página de éxito.
      const return_url = `${window.location.origin}/checkout/success`;
      // --- FIN DE MODIFICACIÓN ---

      const payload = {
        payment_token: checkoutData.payment_token || 'tok_simulated_payment',
        shipping_address_id: checkoutData.shipping_address_id,
        shipping_method_id: checkoutData.shipping_method_id,
        return_url: return_url // <-- Añadimos la URL al payload
      }
      
      const { data } = await apiClient.post('/orders/checkout', payload)
      return data
    } catch (error) {
      // --- INICIO DE MODIFICACIÓN (Manejo de error amigable) ---
      // Logueamos el error técnico detallado solo en la consola (para debug)
      console.error('Error detallado al procesar el checkout:', error.response?.data?.detail || error.message)
      
      // Lanzamos un error simple y amigable para el modal del usuario
      throw new Error('No se pudo procesar tu pago. Por favor, verifica tus fondos o intenta con otra tarjeta.')
      // --- FIN DE MODIFICACIÓN ---
    }
  },
}

export default ordersService