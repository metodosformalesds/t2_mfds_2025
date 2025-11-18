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
      const return_url = `${window.location.origin}/checkout/success`;

      const payload = {
        payment_token: checkoutData.payment_token || 'tok_simulated_payment',
        shipping_address_id: checkoutData.shipping_address_id,
        shipping_method_id: checkoutData.shipping_method_id,
        return_url: return_url
      }
      
      const { data } = await apiClient.post('/orders/checkout', payload)
      return data
    } catch (error) {
      // Detectar si el payment method está "quemado" (usado sin customer)
      if (error.response?.status === 410 || 
          (error.response?.data?.detail?.error === 'payment_method_burned')) {
        // Lanzar error específico que el componente pueda detectar
        const customError = new Error('PAYMENT_METHOD_BURNED')
        customError.paymentMethodId = error.response?.data?.detail?.payment_method_id
        throw customError
      }
      
      // Detectar si el monto es demasiado pequeño
      if (error.response?.status === 400 && 
          error.response?.data?.detail?.error === 'amount_too_small') {
        const detail = error.response.data.detail
        const customError = new Error('AMOUNT_TOO_SMALL')
        customError.minimumAmount = detail.minimum_amount
        customError.currentAmount = detail.current_amount
        customError.message = detail.message
        throw customError
      }
      
      // Error genérico
      const errorMsg = error.response?.data?.detail?.message || 
                       error.response?.data?.detail || 
                       'No se pudo procesar tu pago. Por favor, verifica tus fondos o intenta con otra tarjeta.'
      throw new Error(errorMsg)
    }
  },

  // --- Mis Compras ---

  /**
   * Obtiene la lista de compras del usuario autenticado.
   * (GET /api/v1/orders/my-purchases)
   * @param {Object} params - Parámetros de paginación
   * @param {number} [params.skip=0] - Número de registros a omitir
   * @param {number} [params.limit=20] - Número de registros por página
   * @returns {Promise<Object>} Lista paginada de OrderList { items, total, page, page_size }
   */
  getMyPurchases: async (params = {}) => {
    try {
      const skip = params.skip || 0
      const limit = params.limit || 20
      const { data } = await apiClient.get('/orders/my-purchases', {
        params: { skip, limit }
      })
      return data
    } catch (error) {
      throw error
    }
  },

  // --- Mis Ventas ---

  /**
   * Obtiene la lista de ventas del usuario autenticado.
   * (GET /api/v1/orders/my-sales)
   * @param {Object} params - Parámetros de paginación
   * @param {number} [params.skip=0] - Número de registros a omitir
   * @param {number} [params.limit=20] - Número de registros por página
   * @returns {Promise<Object>} Lista paginada de OrderList { items, total, page, page_size }
   */
  getMySales: async (params = {}) => {
    try {
      const { skip = 0, limit = 20 } = params
      const { data } = await apiClient.get('/orders/my-sales', {
        params: { skip, limit }
      })
      return data
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'No se pudieron cargar las ventas.')
    }
  },

  // --- Detalle de Orden ---

  /**
   * Obtiene el detalle de una orden específica.
   * (GET /api/v1/orders/{order_id})
   * Requiere ser el comprador, el vendedor de un item, o admin.
   * @param {number} orderId - ID de la orden
   * @returns {Promise<Object>} Detalle completo de OrderRead
   */
  getOrderDetails: async (orderId) => {
    try {
      const { data } = await apiClient.get(`/orders/${orderId}`)
      return data
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'No se pudo cargar el detalle de la orden.')
    }
  },

  /**
   * Verifica si el usuario autenticado ha comprado un listing específico.
   * @param {number} listingId - ID del listing
   * @returns {Promise<Object>} { purchased: boolean, order_item_id: number|null }
   */
  checkPurchase: async (listingId) => {
    try {
      // Obtener las compras del usuario con un límite alto
      const purchases = await ordersService.getMyPurchases({ skip: 0, limit: 100 })
      
      if (!purchases || !purchases.items || purchases.items.length === 0) {
        return {
          purchased: false,
          order_item_id: null
        }
      }
      
      // Buscar si alguna compra incluye este listing
      for (const order of purchases.items) {
        if (order.order_items && Array.isArray(order.order_items)) {
          for (const item of order.order_items) {
            // El listing_id está dentro del objeto listing
            const itemListingId = item.listing?.listing_id
            
            if (itemListingId === Number(listingId)) {
              // Encontrado - usuario ha comprado este listing
              return {
                purchased: true,
                order_item_id: item.order_item_id
              }
            }
          }
        }
      }
      
      // No encontrado
      return {
        purchased: false,
        order_item_id: null
      }
    } catch (error) {
      // En caso de error, no permitir reseña por seguridad
      return {
        purchased: false,
        order_item_id: null,
        error: error.message
      }
    }
  },
}

export default ordersService