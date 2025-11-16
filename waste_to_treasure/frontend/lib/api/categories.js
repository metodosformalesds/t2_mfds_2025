/**
 * Servicio para operaciones con Categorías.
 *
 * Implementa todas las llamadas al endpoint /categories del backend.
 */

import apiClient from './client'

/**
 * Servicio de Categorías
 */
export const categoriesService = {
  /**
   * Obtiene listado de categorías con filtros y paginación.
   *
   * @param {Object} params - Parámetros de filtrado
   * @param {number} [params.skip=0] - Offset para paginación
   * @param {number} [params.limit=50] - Límite de resultados
   * @param {string} [params.type] - Filtrar por tipo: 'MATERIAL' o 'PRODUCT'
   * @param {number} [params.parent_id] - Filtrar por categoría padre
   * @param {string} [params.search] - Buscar por nombre
   * @returns {Promise<Object>} Response con { items, total, page, page_size }
   */
  getAll: async (params = {}) => {
    try {
      const { data } = await apiClient.get('/categories', { params })
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Obtiene una categoría específica por ID.
   *
   * @param {number} categoryId - ID de la categoría
   * @returns {Promise<Object>} Datos completos de la categoría
   */
  getById: async (categoryId) => {
    try {
      const { data } = await apiClient.get(`/categories/${categoryId}`)
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Obtiene el árbol jerárquico completo de categorías.
   *
   * @returns {Promise<Object>} { materials: [...], products: [...] }
   */
  getTree: async () => {
    try {
      const { data } = await apiClient.get('/categories/tree')
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Crea una nueva categoría (requiere permisos de admin).
   *
   * @param {Object} categoryData - Datos de la categoría
   * @param {string} categoryData.name - Nombre de la categoría
   * @param {string} categoryData.type - 'MATERIAL' o 'PRODUCT'
   * @param {number} [categoryData.parent_category_id] - ID de categoría padre
   * @returns {Promise<Object>} Categoría creada
   */
  create: async (categoryData) => {
    try {
      const { data } = await apiClient.post('/categories', categoryData)
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Actualiza una categoría existente (requiere permisos de admin).
   *
   * @param {number} categoryId - ID de la categoría
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<Object>} Categoría actualizada
   */
  update: async (categoryId, updates) => {
    try {
      const { data } = await apiClient.patch(`/categories/${categoryId}`, updates)
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Elimina una categoría (requiere permisos de admin).
   *
   * @param {number} categoryId - ID de la categoría
   * @returns {Promise<void>}
   */
  delete: async (categoryId) => {
    try {
      await apiClient.delete(`/categories/${categoryId}`)
    } catch (error) {
      throw error
    }
  },
}

export default categoriesService
