/**
 * Servicio para operaciones de Planes (SaaS).
 * Implementa llamadas a /api/v1/plans/
 */
import apiClient from './client'

export const plansService = {
  /**
   * Obtiene la lista de planes disponibles.
   * (GET /api/v1/plans)
   * @returns {Promise<Object>} Lista de planes
   */
  getAvailablePlans: async () => {
    try {
      const { data } = await apiClient.get('/plans')
      return data
    } catch (error) {
      throw error
    }
  },
}

export default plansService
