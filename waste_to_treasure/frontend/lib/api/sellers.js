/**
 * Autor: Arturo Perez Gonzalez
 * Fecha: 11/11/2024
 * Descripción: Servicio API para operaciones de vendedores (sellers).
 *              Implementa obtención de perfil público, listings del vendedor,
 *              reseñas recibidas y estadísticas agregadas (total de ventas, calificación promedio).
 */

import apiClient from './client'
import listingsService from './listings'

/**
 * Servicio de Sellers
 * Updated: Usa datos reales del campo seller en listings
 */
export const sellersService = {
  /**
   * Obtiene información pública de un seller por ID.
   * Usa el endpoint público de usuarios del backend.
   *
   * @param {string} sellerId - ID del seller (user_id)
   * @returns {Promise<Object>} Datos completos del seller
   */
  getById: async (sellerId) => {
    try {
      // Usar el endpoint público de usuarios
      const { data } = await apiClient.get(`/users/${sellerId}/public`)

      // El backend retorna UserPublic schema con: user_id, email, full_name, bio, role, created_at
      return {
        user_id: data.user_id,
        business_name: data.full_name || null,
        full_name: data.full_name,
        email: data.email || null,
        role: data.role || 'USER',
        created_at: data.created_at || new Date().toISOString(),
        description: data.bio || null,
        seller_type: 'INDUSTRIAL',
        city: null,
        state: null,
        profile_image_url: data.profile_image_url || null,
      }
    } catch (error) {
      console.error(`Error al obtener seller ${sellerId}:`, error)
      throw error
    }
  },

  /**
   * Obtiene los listings de un seller específico.
   * Filtra los listings por seller_id.
   *
   * @param {string} sellerId - ID del seller
   * @param {Object} params - Parámetros de filtrado
   * @param {string} [params.listing_type] - Tipo: 'MATERIAL' o 'PRODUCT'
   * @param {number} [params.page=1] - Número de página
   * @param {number} [params.page_size=20] - Elementos por página
   * @returns {Promise<Object>} Response con listings del seller
   */
  getListings: async (sellerId, params = {}) => {
    try {
      // Obtener todos los listings y filtrar por seller_id en el cliente
      // ya que el backend no tiene endpoint específico para listings de un seller
      const allListings = await listingsService.getAll(params)

      // Filtrar por seller_id
      const sellerListings = allListings.items.filter(
        (listing) => listing.seller_id === sellerId
      )

      return {
        total: sellerListings.length,
        page: params.page || 1,
        page_size: params.page_size || 20,
        items: sellerListings,
      }
    } catch (error) {
      throw error
    }
  },

  /**
   * Obtiene las reseñas de un seller específico.
   *
   * @param {string} sellerId - ID del seller
   * @param {Object} params - Parámetros de filtrado
   * @param {number} [params.page=1] - Número de página
   * @param {number} [params.page_size=20] - Elementos por página
   * @returns {Promise<Object>} Response con reseñas del seller
   */
  getReviews: async (sellerId, params = {}) => {
    try {
      const { page = 1, page_size = 20 } = params
      const skip = (page - 1) * page_size
      
      // Usar el endpoint de reviews del vendedor
      const { data } = await apiClient.get(`/reviews/user/${sellerId}`, {
        params: { skip, limit: page_size }
      })
      
      return {
        total: data.total || 0,
        page: data.page || page,
        page_size: data.page_size || page_size,
        items: data.items || [],
        average_rating: data.average_rating || 0,
      }
    } catch (error) {
      console.error(`Error al obtener reviews de seller ${sellerId}:`, error)
      throw error
    }
  },

  /**
   * Obtiene estadísticas públicas de un seller.
   *
   * @param {string} sellerId - ID del seller
   * @returns {Promise<Object>} Estadísticas del seller
   */
  getStats: async (sellerId) => {
    try {
      // Obtener listings del seller y resumen de reseñas en paralelo
      const [listings, reviewSummary] = await Promise.all([
        sellersService.getListings(sellerId, { page_size: 100 }),
        apiClient.get(`/reviews/seller/${sellerId}/summary`)
          .then(res => res.data)
          .catch((error) => {
            console.error(`Error al obtener resumen de reviews de seller ${sellerId}:`, error)
            throw error
          })
      ])

      return {
        average_rating: reviewSummary.average_rating || 0,
        total_reviews: reviewSummary.total_reviews || 0,
        total_listings: listings.items.length,
        total_listings_reviewed: reviewSummary.total_listings_reviewed || 0,
        total_sales: 0, // TODO: Implementar cuando esté disponible
        response_time: '24h',
      }
    } catch (error) {
      console.error(`Error al obtener estadísticas de seller ${sellerId}:`, error)
      throw error
    }
  },
}

export default sellersService
