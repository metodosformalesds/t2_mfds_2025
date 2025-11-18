/**
 * Autor: Arturo Perez Gonzalez
 * Fecha: 13/11/2024
 * Descripción: Servicio API para reportes de publicaciones inapropiadas o fraudulentas.
 *              Implementa creación de reportes con mapeo de razones español-inglés.
 */

import apiClient from './client'

// Mapeo de motivos en español a los valores del enum ReportReason del backend
const REPORT_REASON_MAP = {
  'Spam': 'spam',
  'Fraude': 'fraud',
  'Contenido inapropiado': 'inappropriate_content',
  'Información falsa': 'fake_product',
  'Acoso': 'harassment',
  'Estafa': 'scam',
  'Propiedad intelectual': 'intellectual_property',
  'Otro': 'other',
}

// Mapeo inverso para mostrar al usuario
const REASON_DISPLAY_MAP = {
  'spam': 'Spam',
  'fraud': 'Fraude',
  'inappropriate_content': 'Contenido inapropiado',
  'fake_product': 'Información falsa',
  'harassment': 'Acoso',
  'scam': 'Estafa',
  'intellectual_property': 'Propiedad intelectual',
  'other': 'Otro',
}

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
      const payload = {
        reported_listing_id: reportData.reported_listing_id,
        reason: REPORT_REASON_MAP[reportData.reason] || 'other',
        description: reportData.description || null,
      }

      const { data } = await apiClient.post('/reports', payload)
      return data
    } catch (error) {
      console.error('Error al crear reporte:', error)
      throw error
    }
  },

  /**
   * Obtiene los motivos disponibles para reportar.
   * Retorna los valores en español para mostrar al usuario.
   * @returns {Array<string>} Lista de motivos disponibles en español
   */
  getReportReasons: () => {
    return Object.keys(REPORT_REASON_MAP)
  },

  /**
   * Convierte un motivo del backend (inglés) a español para display
   * @param {string} reasonKey - Clave del enum (ej: 'inappropriate_content')
   * @returns {string} Texto en español
   */
  getReasonDisplay: (reasonKey) => {
    return REASON_DISPLAY_MAP[reasonKey] || reasonKey
  },

  /**
   * Convierte un motivo en español al valor del enum del backend
   * @param {string} reasonSpanish - Motivo en español
   * @returns {string} Valor del enum
   */
  getReasonValue: (reasonSpanish) => {
    return REPORT_REASON_MAP[reasonSpanish] || 'other'
  },
}

export default reportsService
