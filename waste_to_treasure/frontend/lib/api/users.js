/**
 * Servicio para operaciones con Usuarios.
 *
 * Implementa llamadas a /users/me (para auth) y /users/{user_id} (para admin)
 */

import apiClient from './client'

export const usersService = {
  /**
   * Obtiene el perfil del usuario autenticado desde nuestra base de datos.
   * (Cognito nos da la identidad, esto nos da el rol de la app).
   *
   * @returns {Promise<Object>} Perfil del usuario (UserRead)
   */
  getMe: async () => {
    try {
      const { data } = await apiClient.get('/users/me')
      return data
    } catch (error) {
      console.error('Error al obtener perfil de usuario:', error)
      throw error
    }
  },

  /**
   * Obtiene un usuario específico por ID (Admin).
   *
   * @param {string} userId - UUID del usuario
   * @returns {Promise<Object>} Datos públicos del usuario (UserPublic)
   */
  getById: async (userId) => {
    try {
      const { data } = await apiClient.get(`/users/${userId}`)
      return data
    } catch (error) {
      console.error(`Error al obtener usuario ${userId}:`, error)
      throw error
    }
  },

  /**
   * Actualiza un usuario (Admin).
   * Se usa para cambiar rol o estado (ej. BLOQUEADO).
   *
   * @param {string} userId - UUID del usuario
   * @param {Object} updates - Campos a actualizar (ej. { status: 'BLOCKED' })
   * @returns {Promise<Object>} Usuario actualizado (UserRead)
   */
  updateUser: async (userId, updates) => {
    try {
      const { data } = await apiClient.patch(`/users/${userId}`, updates)
      return data
    } catch (error) {
      console.error(`Error al actualizar usuario ${userId}:`, error)
      throw error
    }
  },

  // NOTA: La API (w2t_API.json) no parece incluir un endpoint para
  // LISTAR todos los usuarios (ej. GET /api/v1/admin/users/).
  // La página de admin/users necesitará este endpoint para ser 100% funcional.
  // Por ahora, las acciones de bloqueo/desbloqueo sí se pueden implementar.

  // --- Métodos adicionales agregados ---

  /**
   * Actualiza los datos del perfil del usuario autenticado.
   * (PATCH /api/v1/users/me)
   * 
   * Campos editables:
   * - full_name: Nombre completo del usuario
   * 
   * Campos NO editables (gestionados por Cognito o admin):
   * - email: Gestionado por Cognito
   * - user_id: Inmutable
   * - role: Solo admins pueden cambiar
   * - status: Solo admins pueden cambiar
   * 
   * @param {Object} profileData - Datos a actualizar
   * @param {string} [profileData.full_name] - Nombre completo
   * @returns {Promise<Object>} Perfil actualizado (UserRead)
   */
  updateProfile: async (profileData) => {
    try {
      const { data } = await apiClient.patch('/users/me', profileData)
      return data
    } catch (error) {
      console.error('Error al actualizar perfil:', error)
      throw new Error(error.response?.data?.detail || 'No se pudo actualizar el perfil.')
    }
  },
}

export default usersService