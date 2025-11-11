/**
 * Servicio para operaciones de Administrador.
 *
 * Implementa llamadas a /admin/dashboard, /admin/moderation, /admin/reports
 */

import apiClient from './client'

export const adminService = {
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
      console.error('Error al obtener estadísticas del dashboard:', error)
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
      console.error('Error al obtener cola de moderación:', error)
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
        { reason }
      )
      return data
    } catch (error) {
      console.error(`Error al aprobar listing ${listingId}:`, error)
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
      const { data } = await apiClient.post(
        `/admin/moderation/listings/${listingId}/reject`,
        { reason }
      )
      return data
    } catch (error) {
      console.error(`Error al rechazar listing ${listingId}:`, error)
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
      console.error('Error al obtener reportes:', error)
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
        `/admin/moderation/reports/${reportId}/resolve`, // CORREGIDO: reportId en lugar de report_id
        resolutionData
      )
      return data
    } catch (error) {
      console.error(`Error al resolver reporte ${reportId}:`, error)
      throw error
    }
  },
}

export default adminService