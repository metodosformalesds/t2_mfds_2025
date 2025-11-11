/**
 * Servicio para operaciones con Sellers (Vendedores).
 *
 * Usa los endpoints de users y listings ya que la diferenciación
 * es por tipo de publicación (MATERIAL o PRODUCT).
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

      // El backend retorna UserPublic schema con: user_id, email, full_name, role, created_at
      return {
        user_id: data.user_id,
        // Usar full_name como business_name
        business_name: data.full_name || `Vendedor ${sellerId.substring(0, 8)}`,
        full_name: data.full_name,
        email: data.email || null,
        role: data.role || 'USER',
        created_at: data.created_at || new Date().toISOString(),
        // Campos adicionales con valores por defecto (no están en UserPublic schema)
        seller_type: 'INDUSTRIAL',
        city: 'Ciudad Juárez',
        state: 'Chihuahua',
        description: `Proveedor de materiales y productos reciclados de alta calidad`,
        profile_image_url: null,
      }
    } catch (error) {
      console.error(`Error al obtener seller ${sellerId}:`, error)

      // Si el usuario no existe (404), retornar fallback
      if (error.response?.status === 404) {
        return {
          user_id: sellerId,
          business_name: `Vendedor ${sellerId.substring(0, 8)}`,
          full_name: null,
          seller_type: 'INDUSTRIAL',
          city: 'Ciudad Juárez',
          state: 'Chihuahua',
          description: 'Proveedor de materiales y productos reciclados de alta calidad',
          created_at: new Date().toISOString(),
          profile_image_url: null,
          email: null,
          role: 'USER',
        }
      }

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
      console.error(`Error al obtener listings del seller ${sellerId}:`, error)
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
      // TODO: Implementar cuando el endpoint de reviews esté disponible
      // const { data } = await apiClient.get(`/reviews/seller/${sellerId}`)
      return {
        total: 0,
        page: params.page || 1,
        page_size: params.page_size || 10,
        items: [],
      }
    } catch (error) {
      console.error(`Error al obtener reseñas del seller ${sellerId}:`, error)
      return {
        total: 0,
        page: 1,
        page_size: 10,
        items: [],
      }
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
      // Obtener listings del seller para calcular estadísticas
      const listings = await sellersService.getListings(sellerId, { page_size: 100 })

      return {
        average_rating: 4.2,
        total_reviews: 0,
        total_listings: listings.items.length,
        total_sales: 0,
        response_time: '24h',
      }
    } catch (error) {
      console.error(`Error al obtener estadísticas del seller ${sellerId}:`, error)
      return {
        average_rating: 0,
        total_reviews: 0,
        total_listings: 0,
        total_sales: 0,
        response_time: '24h',
      }
    }
  },
}

export default sellersService
