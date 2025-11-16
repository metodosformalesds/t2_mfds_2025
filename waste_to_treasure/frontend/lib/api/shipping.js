/**
 * Servicio para operaciones de Envío.
 * Implementa llamadas a /api/v1/shipping/
 */
import apiClient from './client'

export const shippingService = {
  /**
   * Obtiene los métodos de envío del vendedor (usuario autenticado).
   * (GET /api/v1/shipping/me/shipping_methods)
   * @returns {Promise<Array>} Lista de objetos ShippingMethodRead
   */
  getMyShippingMethods: async () => {
    try {
      const { data } = await apiClient.get('/shipping/me/shipping_methods')
      return data
    } catch (error) {
      throw error
    }
  },
  
  // NOTA: Para el checkout, probablemente necesitemos un endpoint
  // que obtenga los métodos de envío *aplicables a un listing específico*
  // o al carrito, pero usaremos este por ahora.
}

export default shippingService