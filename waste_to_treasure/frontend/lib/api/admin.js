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
      console.error('Error al obtener lista de usuarios:', error)
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
   * Obtiene los detalles completos de un listing en moderación.
   * @param {number} listingId - ID del listing
   * @returns {Promise<Object>} Detalles completos del listing
   */
  getModerationListingDetail: async (listingId) => {
    try {
      const { data } = await apiClient.get(`/admin/moderation/listings/${listingId}`)
      return data
    } catch (error) {
      console.error(`Error al obtener detalles del listing ${listingId}:`, error)
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
      console.log('[adminService.approveListing] Iniciando aprobación')
      console.log('[adminService.approveListing] ListingId:', listingId)
      console.log('[adminService.approveListing] Reason:', reason)
      
      const { data } = await apiClient.post(
        `/admin/moderation/listings/${listingId}/approve`,
        { reason }
      )
      
      console.log('[adminService.approveListing] Respuesta exitosa:', data)
      return data
    } catch (error) {
      console.error('[adminService.approveListing] Error:', error)
      console.error('[adminService.approveListing] Response:', error.response?.data)
      console.error('[adminService.approveListing] Status:', error.response?.status)
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
      console.log('[adminService.rejectListing] Iniciando rechazo')
      console.log('[adminService.rejectListing] ListingId:', listingId)
      console.log('[adminService.rejectListing] Reason:', reason)
      
      const { data } = await apiClient.post(
        `/admin/moderation/listings/${listingId}/reject`,
        { reason }
      )
      
      console.log('[adminService.rejectListing] Respuesta exitosa:', data)
      return data
    } catch (error) {
      console.error('[adminService.rejectListing] Error:', error)
      console.error('[adminService.rejectListing] Response:', error.response?.data)
      console.error('[adminService.rejectListing] Status:', error.response?.status)
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