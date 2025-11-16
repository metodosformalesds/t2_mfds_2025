/**
 * Servicio para operaciones del Carrito de Compras.
 * Implementa llamadas a /api/v1/cart/
 */
import apiClient from './client'

export const cartService = {
  /**
   * Obtiene el carrito completo del usuario autenticado.
   * (GET /api/v1/cart/me)
   * @returns {Promise<Object>} Objeto CartRead
   */
  getCart: async () => {
    try {
      const { data } = await apiClient.get('/cart/me')
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Agrega un item al carrito.
   * (POST /api/v1/cart/me/items)
   * @param {number} listingId - ID del listing
   * @param {number} quantity - Cantidad
   * @returns {Promise<Object>} Objeto CartRead actualizado
   */
  addItem: async (listingId, quantity) => {
    try {
      const { data } = await apiClient.post('/cart/me/items', {
        listing_id: listingId,
        quantity,
      })
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Actualiza la cantidad de un item en el carrito.
   * (PATCH /api/v1/cart/me/items/{cart_item_id})
   * @param {number} cartItemId - ID del item en el carrito
   * @param {number} quantity - Nueva cantidad
   * @returns {Promise<Object>} Objeto CartRead actualizado
   */
  updateItem: async (cartItemId, quantity) => {
    try {
      const { data } = await apiClient.patch(`/cart/me/items/${cartItemId}`, {
        quantity,
      })
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Elimina un item del carrito.
   * (DELETE /api/v1/cart/me/items/{cart_item_id})
   * @param {number} cartItemId - ID del item en el carrito
   * @returns {Promise<Object>} Objeto CartRead actualizado
   */
  removeItem: async (cartItemId) => {
    try {
      const { data } = await apiClient.delete(`/cart/me/items/${cartItemId}`)
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Vacía el carrito del usuario.
   * (DELETE /api/v1/cart/me)
   * @returns {Promise<Object>} Objeto CartRead vacío
   */
  clearCart: async () => {
    try {
      const { data } = await apiClient.delete('/cart/me')
      return data
    } catch (error) {
      throw error
    }
  },
}