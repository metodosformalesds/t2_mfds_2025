/**
 * Hook para gestionar las ventas del usuario.
 * Proporciona funciones para obtener y paginar ventas.
 */

import { useState, useEffect, useCallback } from 'react'
import { ordersService } from '@/lib/api/orders'

export function useSales(autoLoad = true) {
  const [sales, setSales] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  })

  /**
   * Carga las ventas desde la API
   * @param {number} page - Número de página (1-indexed)
   */
  const fetchSales = useCallback(async (page = 1) => {
    setIsLoading(true)
    setError(null)

    try {
      const skip = (page - 1) * pagination.pageSize
      const result = await ordersService.getMySales({
        skip,
        limit: pagination.pageSize,
      })

      setSales(result.items || [])
      setPagination({
        total: result.total || 0,
        page: result.page || page,
        pageSize: result.page_size || pagination.pageSize,
        totalPages: Math.ceil((result.total || 0) / (result.page_size || pagination.pageSize)),
      })
    } catch (err) {
      setError(err.message || 'Error al cargar las ventas')
      console.error('Error en fetchSales:', err)
      setSales([])
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
      fetchSales(page)
    }
  }, [pagination.totalPages, fetchSales])

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
    fetchSales(pagination.page)
  }, [pagination.page, fetchSales])

  // Cargar ventas al montar el componente si autoLoad es true
  useEffect(() => {
    if (autoLoad) {
      fetchSales(1)
    }
  }, [autoLoad]) // Solo ejecutar una vez al montar

  return {
    sales,
    isLoading,
    error,
    pagination,
    fetchSales,
    goToPage,
    nextPage,
    prevPage,
    refresh,
  }
}