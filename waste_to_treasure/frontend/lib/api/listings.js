/**
 * Servicio para operaciones con Listings (Materiales/Productos).
 *
 * Implementa todas las llamadas al endpoint /listings del backend.
 */

import apiClient from './client'

/**
 * Servicio de Listings
 */
export const listingsService = {
  /**
   * Obtiene listado público de listings con filtros y paginación.
   *
   * @param {Object} params - Parámetros de filtrado y paginación
   * @param {string} [params.listing_type] - Tipo: 'MATERIAL' o 'PRODUCT'
   * @param {number} [params.category_id] - ID de categoría
   * @param {number} [params.min_price] - Precio mínimo
   * @param {number} [params.max_price] - Precio máximo
   * @param {string} [params.search] - Búsqueda en título y descripción
   * @param {number} [params.page=1] - Número de página
   * @param {number} [params.page_size=20] - Elementos por página
   * @returns {Promise<Object>} Response con { total, page, page_size, items }
   */
  getAll: async (params = {}) => {
    try {
      const { data } = await apiClient.get('/listings', { params })
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Obtiene un listing específico por ID.
   *
   * @param {number} listingId - ID del listing
   * @returns {Promise<Object>} Datos completos del listing
   */
  getById: async (listingId) => {
    try {
      const { data } = await apiClient.get(`/listings/${listingId}`)
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Obtiene los listings del usuario autenticado.
   *
   * @param {Object} params - Parámetros de filtrado
   * @param {string} [params.status_filter] - Filtrar por estado
   * @param {number} [params.page=1] - Número de página
   * @param {number} [params.page_size=20] - Elementos por página
   * @returns {Promise<Object>} Response con listings del usuario
   */
  getMyListings: async (params = {}) => {
    try {
      const { data } = await apiClient.get('/listings/me', { params })
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Crea un nuevo listing.
   *
   * @param {Object} listingData - Datos del listing a crear
   * @param {string} listingData.title - Título de la publicación
   * @param {string} listingData.description - Descripción detallada
   * @param {number} listingData.price - Precio del ítem
   * @param {string} [listingData.price_unit] - Unidad de precio (Kg, Unidad, etc)
   * @param {number} listingData.quantity - Cantidad disponible
   * @param {number} listingData.category_id - ID de la categoría
   * @param {string} listingData.listing_type - 'MATERIAL' o 'PRODUCT'
   * @param {string} [listingData.origin_description] - Origen del material
   * @param {number} [listingData.location_address_id] - ID de ubicación
   * @returns {Promise<Object>} Listing creado
   */
  create: async (listingData) => {
    try {
      const { data } = await apiClient.post('/listings', listingData)
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Actualiza un listing existente.
   *
   * @param {number} listingId - ID del listing
   * @param {Object} updates - Campos a actualizar (parcial)
   * @returns {Promise<Object>} Listing actualizado
   */
  update: async (listingId, updates) => {
    try {
      const { data } = await apiClient.patch(`/listings/${listingId}`, updates)
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Elimina (desactiva) un listing.
   *
   * @param {number} listingId - ID del listing
   * @returns {Promise<void>}
   */
  delete: async (listingId) => {
    try {
      await apiClient.delete(`/listings/${listingId}`)
    } catch (error) {
      throw error
    }
  },

  /**
   * Agrega imágenes a un listing.
   *
   * @param {number} listingId - ID del listing
   * @param {string[]} imageUrls - URLs de imágenes
   * @returns {Promise<Array>} Lista de imágenes agregadas
   */
  addImages: async (listingId, imageUrls) => {
    try {
      const params = new URLSearchParams()
      imageUrls.forEach((url) => params.append('image_urls', url))

      const { data } = await apiClient.post(
        `/listings/${listingId}/images?${params.toString()}`
      )
      return data
    } catch (error) {
      throw error
    }
  },
}

export default listingsService
