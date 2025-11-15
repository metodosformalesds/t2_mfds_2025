/**
 * Servicio para operaciones de Notificaciones.
 *
 * Implementa llamadas a /api/v1/notifications/me
 */

import apiClient from './client'

export const notificationsService = {
  // --- Mis Notificaciones ---

  /**
   * Obtiene la lista de notificaciones del usuario autenticado.
   * (GET /api/v1/notifications/me)
   * 
   * @param {Object} params - Parámetros de paginación
   * @param {number} [params.skip=0] - Número de registros a omitir
   * @param {number} [params.limit=20] - Número de registros por página
   * @returns {Promise<Object>} Lista paginada de NotificationList { items, total, page, page_size, unread_count }
   */
  getMyNotifications: async (params = {}) => {
    try {
      const { skip = 0, limit = 20 } = params
      const { data } = await apiClient.get('/notifications/me', {
        params: { skip, limit }
      })
      return data
    } catch (error) {
      console.error('Error al obtener notificaciones:', error)
      throw new Error(error.response?.data?.detail || 'No se pudieron cargar las notificaciones.')
    }
  },

  // --- Marcar como Leída ---

  /**
   * Marca una notificación específica como leída.
   * (PATCH /api/v1/notifications/me/{notification_id}/read)
   * 
   * @param {number} notificationId - ID de la notificación
   * @returns {Promise<Object>} Notificación actualizada (NotificationRead)
   */
  markAsRead: async (notificationId) => {
    try {
      const { data } = await apiClient.patch(`/notifications/me/${notificationId}/read`)
      return data
    } catch (error) {
      console.error(`Error al marcar notificación ${notificationId} como leída:`, error)
      throw new Error(error.response?.data?.detail || 'No se pudo marcar como leída.')
    }
  },

  // --- Marcar Todas como Leídas ---

  /**
   * Marca todas las notificaciones no leídas como leídas.
   * (POST /api/v1/notifications/me/read-all)
   * 
   * @returns {Promise<Object>} { updated_count: number }
   */
  markAllAsRead: async () => {
    try {
      const { data } = await apiClient.post('/notifications/me/read-all')
      return data
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error)
      throw new Error(error.response?.data?.detail || 'No se pudieron marcar como leídas.')
    }
  },
}

export default notificationsService