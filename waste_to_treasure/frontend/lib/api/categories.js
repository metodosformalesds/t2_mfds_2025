/**
 * Autor: Arturo Perez Gonzalez
 * Fecha: 09/11/2024
 * Descripción: Servicio API para operaciones CRUD de categorías de materiales y productos.
 *              Implementa endpoints para listar, obtener árbol jerárquico, crear, actualizar
 *              y eliminar categorías. Incluye normalización de tipos MATERIAL/PRODUCT.
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
      // Normalizar filtro type si viene en params
      const normalizedParams = { ...params }
      if (typeof normalizedParams.type === 'string') {
        const t = normalizedParams.type.trim().toLowerCase()
        if (t === 'material' || t === 'materiales') normalizedParams.type = 'MATERIAL'
        else if (t === 'producto' || t === 'productos' || t === 'product') normalizedParams.type = 'PRODUCT'
        else normalizedParams.type = normalizedParams.type.toUpperCase()
      }

      const { data } = await apiClient.get('/categories', { params: normalizedParams })
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
      // Normalizar el tipo a valores esperados por el backend
      const normalized = { ...categoryData }
      if (typeof normalized.type === 'string') {
        const t = normalized.type.trim().toLowerCase()
        if (t === 'material' || t === 'materiales') normalized.type = 'MATERIAL'
        else if (t === 'producto' || t === 'productos' || t === 'product') normalized.type = 'PRODUCT'
        else normalized.type = normalized.type.toUpperCase()
      }

      const { data } = await apiClient.post('/categories', normalized)
      // Debug: show normalized type being sent to backend
      try {
        console.debug('[categoriesService.create] Enviando tipo normalizado:', normalized.type)
      } catch (e) { /* ignore in older environments */ }
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
      // Normalizar el tipo si se envía en updates
      const normalized = { ...updates }
      if (typeof normalized.type === 'string') {
        const t = normalized.type.trim().toLowerCase()
        if (t === 'material' || t === 'materiales') normalized.type = 'MATERIAL'
        else if (t === 'producto' || t === 'productos' || t === 'product') normalized.type = 'PRODUCT'
        else normalized.type = normalized.type.toUpperCase()
      }

      const { data } = await apiClient.patch(`/categories/${categoryId}`, normalized)
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
