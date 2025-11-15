/**
 * Hook para gestionar las notificaciones del usuario.
 * Proporciona funciones para obtener, marcar como leídas y paginar notificaciones.
 */

import { useState, useEffect, useCallback } from 'react'
import { notificationsService } from '@/lib/api/notifications'

export function useNotifications(autoLoad = true) {
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
    unreadCount: 0,
  })

  /**
   * Carga las notificaciones desde la API
   * @param {number} page - Número de página (1-indexed)
   */
  const fetchNotifications = useCallback(async (page = 1) => {
    setIsLoading(true)
    setError(null)

    try {
      const skip = (page - 1) * pagination.pageSize
      const result = await notificationsService.getMyNotifications({
        skip,
        limit: pagination.pageSize,
      })

      setNotifications(result.items || [])
      setPagination({
        total: result.total || 0,
        page: result.page || page,
        pageSize: result.page_size || pagination.pageSize,
        totalPages: Math.ceil((result.total || 0) / (result.page_size || pagination.pageSize)),
        unreadCount: result.unread_count || 0,
      })
    } catch (err) {
      setError(err.message || 'Error al cargar las notificaciones')
      console.error('Error en fetchNotifications:', err)
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }, [pagination.pageSize])

  /**
   * Marca una notificación como leída
   * @param {number} notificationId - ID de la notificación
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationsService.markAsRead(notificationId)
      
      // Actualizar el estado local
      setNotifications(prev => 
        prev.map(notif => 
          notif.notification_id === notificationId 
            ? { ...notif, is_read: true } 
            : notif
        )
      )
      
      // Decrementar contador de no leídas
      setPagination(prev => ({
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }))
    } catch (err) {
      console.error('Error al marcar como leída:', err)
    }
  }, [])

  /**
   * Marca todas las notificaciones como leídas
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsService.markAllAsRead()
      
      // Actualizar el estado local
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      )
      
      // Resetear contador
      setPagination(prev => ({
        ...prev,
        unreadCount: 0
      }))
    } catch (err) {
      console.error('Error al marcar todas como leídas:', err)
    }
  }, [])

  /**
   * Navega a una página específica
   * @param {number} page - Número de página
   */
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchNotifications(page)
    }
  }, [pagination.totalPages, fetchNotifications])

  /**
   * Navega a la página siguiente
   */
  const nextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      goToPage(pagination.page + 1)
    }
  }, [pagination.page, pagination.totalPages, goToPage])

  /**
   * Navega a la página anterior
   */
  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      goToPage(pagination.page - 1)
    }
  }, [pagination.page, goToPage])

  /**
   * Recarga la página actual
   */
  const refresh = useCallback(() => {
    fetchNotifications(pagination.page)
  }, [pagination.page, fetchNotifications])

  // Cargar notificaciones al montar el componente si autoLoad es true
  useEffect(() => {
    if (autoLoad) {
      fetchNotifications(1)
    }
  }, [autoLoad]) // Solo ejecutar una vez al montar

  return {
    notifications,
    isLoading,
    error,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    goToPage,
    nextPage,
    prevPage,
    refresh,
  }
}
