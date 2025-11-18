// Autor: Gabriel Florentino Reyes
// Fecha: 13-11-2025
// Descripción: Hook para gestionar las compras del usuario. Permite obtener las compras paginadas, 
//              navegar entre páginas y recargar la información actual.

/**
 * Hook para gestionar las compras del usuario.
 * Proporciona funciones para obtener y paginar compras.
 */

import { useState, useEffect, useCallback } from 'react'
import { ordersService } from '@/lib/api/orders'

export function usePurchases(autoLoad = true) {
  const [purchases, setPurchases] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  })

  /**
   * Carga las compras desde la API
   * @param {number} page - Número de página (1-indexed)
   */
  const fetchPurchases = useCallback(async (page = 1) => {
    setIsLoading(true)
    setError(null)

    try {
      const skip = (page - 1) * pagination.pageSize
      const result = await ordersService.getMyPurchases({
        skip,
        limit: pagination.pageSize,
      })

      setPurchases(result.items || [])
      setPagination({
        total: result.total || 0,
        page: result.page || page,
        pageSize: result.page_size || pagination.pageSize,
        totalPages: Math.ceil((result.total || 0) / (result.page_size || pagination.pageSize)),
      })
    } catch (err) {
      setError(err.message || 'Error al cargar las compras')
      setPurchases([])
    } finally {
      setIsLoading(false)
    }
  }, [pagination.pageSize])

  /**
   * Navega a una página específica
   * @param {number} page - Número de página
   */
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchPurchases(page)
    }
  }, [pagination.totalPages, fetchPurchases])

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
    fetchPurchases(pagination.page)
  }, [pagination.page, fetchPurchases])

  // Cargar compras al montar el componente si autoLoad es true
  useEffect(() => {
    if (autoLoad) {
      fetchPurchases(1)
    }
  }, [autoLoad]) // Solo ejecutar una vez al montar

  return {
    purchases,
    isLoading,
    error,
    pagination,
    fetchPurchases,
    goToPage,
    nextPage,
    prevPage,
    refresh,
  }
}