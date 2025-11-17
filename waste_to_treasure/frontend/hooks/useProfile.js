// Autor: Gabriel Florentino Reyes
// Fecha: 13-11-2025
// Descripción: Hook para gestionar el perfil del usuario. Permite obtener y actualizar los 
//              datos del perfil, y sincroniza cambios con el contexto de autenticación.

/**
 * Hook para gestionar el perfil del usuario.
 * Proporciona funciones para obtener y actualizar el perfil.
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { usersService } from '@/lib/api/users'

export function useProfile() {
  const { user, updateUser } = useAuth() // Asumiendo que AuthContext tiene updateUser
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Carga los datos del perfil desde la API
   */
  const fetchProfile = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await usersService.getMe()
      setProfile(data)
      return data
    } catch (err) {
      setError(err.message || 'Error al cargar el perfil')
      console.error('Error en fetchProfile:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Actualiza el perfil del usuario
   * @param {Object} profileData - Datos a actualizar
   * @param {string} [profileData.full_name] - Nombre completo
   */
  const updateProfile = async (profileData) => {
    setIsLoading(true)
    setError(null)

    try {
      const updatedProfile = await usersService.updateProfile(profileData)
      setProfile(updatedProfile)
      
      // Actualizar el contexto de autenticación si existe la función
      if (updateUser) {
        updateUser(updatedProfile)
      }
      
      return updatedProfile
    } catch (err) {
      setError(err.message || 'Error al actualizar el perfil')
      console.error('Error en updateProfile:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar perfil al montar el componente
  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user?.user_id]) // Solo recargar si cambia el ID del usuario

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
  }
}