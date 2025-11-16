/**
 * Servicio para operaciones de Administrador.
 *
 * Implementa llamadas a /admin/dashboard, /admin/moderation, /admin/reports
 */

import apiClient from './client'

export const adminService = {
  // --- User Management ---

  /**
   * Obtiene la lista de usuarios (Admin).
   * @param {Object} params - Parámetros de filtrado (skip, limit, role, status, search)
   * @returns {Promise<Object>} Lista paginada de usuarios
   */
  getUsersList: async (params = {}) => {
    try {
      const { data } = await apiClient.get('/admin/users', { params })
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Actualiza un usuario (Admin only).
   * @param {string} userId - UUID del usuario
   * @param {Object} updateData - Datos a actualizar (status, role, etc.)
   * @returns {Promise<Object>} Usuario actualizado
   */
  updateUser: async (userId, updateData) => {
    try {
      const { data } = await apiClient.patch(`/users/${userId}`, updateData)
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Obtiene las estadísticas de un usuario específico.
   * TODO: Implementar en backend GET /admin/users/{user_id}/stats
   * 
   * @param {string} userId - UUID del usuario
   * @returns {Promise<Object>} Objeto con estadísticas del usuario
   */
  getUserDetailedStats: async (userId) => {
    // TODO: Implementar cuando el backend tenga el endpoint
    // const { data } = await apiClient.get(`/admin/users/${userId}/stats`)
    // return data
    
    return {
      publications: 0,
      transactions: 0,
      reports: 0,
      warnings: 0
    }
  },

  // --- Dashboard ---

  /**
   * Obtiene las estadísticas del dashboard de admin.
   * @returns {Promise<Object>} Objeto StatsDashboard
   */
  getDashboardStats: async () => {
    try {
      const { data } = await apiClient.get('/admin/dashboard/stats')
      return data
    } catch (error) {
      throw error
    }
  },

  // --- Moderación de Publicaciones ---

  /**
   * Obtiene la cola de publicaciones pendientes de moderación.
   * @param {Object} params - Parámetros de paginación (skip, limit, status)
   * @returns {Promise<Object>} Lista paginada de ModerationListingList
   */
  getModerationListings: async (params = {}) => {
    try {
      const { data } = await apiClient.get('/admin/moderation/listings', { params })
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Obtiene los detalles completos de un listing en moderación.
   * @param {number} listingId - ID del listing
   * @returns {Promise<Object>} Detalles completos del listing
   */
  getModerationListingDetail: async (listingId) => {
    try {
      const { data } = await apiClient.get(`/admin/moderation/listings/${listingId}`)
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Aprueba una publicación.
   * @param {number} listingId - ID de la publicación
   * @param {string} [reason] - Razón opcional
   * @returns {Promise<Object>} Respuesta de moderación
   */
  approveListing: async (listingId, reason = 'Aprobado por moderador') => {
    try {
      const { data } = await apiClient.post(
        `/admin/moderation/listings/${listingId}/approve`,
        { 
          reason,
          notes: null
        }
      )
      
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Rechaza una publicación.
   * @param {number} listingId - ID de la publicación
   * @param {string} reason - Razón del rechazo (obligatoria)
   * @returns {Promise<Object>} Respuesta de moderación
   */
  rejectListing: async (listingId, reason) => {
    try {
      if (!reason || reason.trim().length === 0) {
        throw new Error('La razón del rechazo es obligatoria')
      }

      const { data } = await apiClient.post(
        `/admin/moderation/listings/${listingId}/reject`,
        { 
          reason: reason.trim(),
          notes: null
        }
      )
      
      return data
    } catch (error) {
      throw error
    }
  },

  // --- Reportes ---

  /**
   * Obtiene la cola de reportes de usuarios.
   * @param {Object} params - Parámetros de paginación (skip, limit, status)
   * @returns {Promise<Object>} Lista paginada de ReportList
   */
  getReports: async (params = {}) => {
    try {
      const { data } = await apiClient.get('/admin/moderation/reports', { params })
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Resuelve o desestima un reporte.
   * @param {number} reportId - ID del reporte
   * @param {Object} resolutionData - Datos de la resolución
   * @param {string} resolutionData.action - 'resolved' o 'dismissed'
   * @param {string} resolutionData.resolution_notes - Notas del admin
   * @returns {Promise<Object>} Respuesta de resolución
   */
  resolveReport: async (reportId, resolutionData) => {
    try {
      const { data } = await apiClient.post(
        `/admin/moderation/reports/${reportId}/resolve`,
        resolutionData
      )
      return data
    } catch (error) {
      throw error
    }
  },
}

export default adminService