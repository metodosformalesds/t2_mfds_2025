/**
 * Servicio para operaciones de Direcciones.
 * Implementa llamadas a /api/v1/address/
 */
import apiClient from './client'

export const addressService = {
  /**
   * Obtiene la lista de direcciones del usuario autenticado.
   * (GET /api/v1/address/)
   * @param {Object} params - Parámetros de paginación (skip, limit)
   * @returns {Promise<Object>} Objeto AddressList
   */
  getMyAddresses: async (params = {}) => {
    try {
      const { data } = await apiClient.get('/address/', { params })
      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * Crea una nueva dirección para el usuario autenticado.
   * (POST /api/v1/address/)
   * @param {Object} addressData - Datos de la dirección (Schema AddressCreate)
   * @returns {Promise<Object>} Objeto AddressRead
   */
  createAddress: async (addressData) => {
    try {
      const { data } = await apiClient.post('/address/', addressData)
      return data
    } catch (error) {
      throw error
    }
  },
}

export default addressService