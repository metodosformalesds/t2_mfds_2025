/**
 * Autor: Arturo Perez Gonzalez
 * Fecha: 13/11/2024
 * Descripción: Servicio API para operaciones de reseñas de listings y vendedores.
 *              Implementa obtención de reseñas por listing/vendedor, estadísticas,
 *              creación de reseñas verificadas y resúmenes de calificación.
 */

import apiClient from './client'

export const reviewsService = {
  /**
   * Obtiene las reseñas de una publicación.
   * @param {number} listingId - ID de la publicación
   * @param {Object} params - Parámetros de paginación
   * @param {number} [params.skip=0] - Número de registros a omitir
   * @param {number} [params.limit=50] - Número máximo de registros
   * @returns {Promise<Object>} Objeto con items, total, average_rating, etc.
   */
  getListingReviews: async (listingId, params = {}) => {
    try {
      const { data } = await apiClient.get(`/reviews/listing/${listingId}`, { params })
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Obtiene estadísticas de reseñas de una publicación.
   * @param {number} listingId - ID de la publicación
   * @returns {Promise<Object>} Estadísticas (total_reviews, average_rating, rating_distribution)
   */
  getListingReviewStatistics: async (listingId) => {
    try {
      const { data } = await apiClient.get(`/reviews/listing/${listingId}/statistics`)
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Crea una nueva reseña.
   * @param {Object} reviewData - Datos de la reseña
   * @param {number} reviewData.order_item_id - ID del item de orden (compra verificada)
   * @param {number} reviewData.rating - Calificación del 1 al 5
   * @param {string} [reviewData.comment] - Comentario opcional
   * @returns {Promise<Object>} Reseña creada
   */
  createReview: async (reviewData) => {
    try {
      const { data } = await apiClient.post('/reviews', reviewData)
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Obtiene las reseñas del usuario actual.
   * @param {Object} params - Parámetros de paginación
   * @returns {Promise<Object>} Objeto con items y total
   */
  getMyReviews: async (params = {}) => {
    try {
      const { data } = await apiClient.get('/reviews/my-reviews', { params })
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Obtiene las reseñas de un vendedor.
   * @param {string} userId - UUID del vendedor
   * @param {Object} params - Parámetros de paginación
   * @returns {Promise<Object>} Objeto con items, total y average_rating
   */
  getSellerReviews: async (userId, params = {}) => {
    try {
      const { data } = await apiClient.get(`/reviews/user/${userId}`, { params })
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Obtiene resumen de reseñas de un vendedor.
   * @param {string} userId - UUID del vendedor
   * @returns {Promise<Object>} Resumen (seller_id, total_reviews, average_rating, total_listings_reviewed)
   */
  getSellerReviewSummary: async (userId) => {
    try {
      const { data } = await apiClient.get(`/reviews/seller/${userId}/summary`)
      return data
    } catch (error) {
      throw error
    }
  },
}

export default reviewsService
