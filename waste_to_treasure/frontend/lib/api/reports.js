/**
 * Servicio para operaciones de reportes de usuarios.
 *
 * Implementa llamadas para crear reportes de publicaciones
 */

import apiClient from './client'

export const reportsService = {
  /**
   * Crea un reporte de una publicación.
   * @param {Object} reportData - Datos del reporte
   * @param {number} reportData.reported_listing_id - ID de la publicación a reportar
   * @param {string} reportData.reason - Motivo del reporte (obligatorio) - debe ser uno de los enum values del backend
   * @param {string} [reportData.description] - Descripción adicional del reporte
   * @returns {Promise<Object>} Reporte creado
   */
  createReport: async (reportData) => {
    try {
      // Mapear el motivo en español al enum del backend
      const reasonMap = {
        Spam: 'spam',
        Fraude: 'fraud',
        'Contenido inapropiado': 'inappropriate_content',
        'Información falsa': 'fake_product',
        Otro: 'other',
      }

      const payload = {
        reported_listing_id: reportData.reported_listing_id,
        reason: reasonMap[reportData.reason] || 'other',
        description: reportData.description || null,
      }

      const { data } = await apiClient.post('/reports', payload)
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Obtiene los motivos disponibles para reportar.
   * @returns {Array<string>} Lista de motivos disponibles en español
   */
  getReportReasons: () => {
    // Estos valores son los que se muestran al usuario en español
    // El servicio se encarga de mapearlos al enum del backend
    return ['Spam', 'Fraude', 'Contenido inapropiado', 'Información falsa', 'Otro']
  },
}

export default reportsService
