/**
 * Hook para gestionar las publicaciones del usuario.
 * Proporciona funciones para obtener, crear, actualizar y eliminar publicaciones.
 */

import { useState, useEffect, useCallback } from 'react'
import { listingsService } from '@/lib/api/listings'

export function useMyListings(autoLoad = true) {
  const [listings, setListings] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  })

  /**
   * Carga las publicaciones del usuario desde la API
   * @param {string|null} statusFilter - Filtro por estado (PENDING, ACTIVE, REJECTED, INACTIVE)
   * @param {number} page - Número de página (1-indexed)
   */
  const fetchListings = useCallback(async (statusFilter = null, page = 1) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await listingsService.getMyListings({
        status_filter: statusFilter,
        page,
        page_size: pagination.pageSize,
      })

      setListings(result.items || [])
      setPagination({
        total: result.total || 0,
        page: result.page || page,
        pageSize: result.page_size || pagination.pageSize,
        totalPages: Math.ceil((result.total || 0) / (result.page_size || pagination.pageSize)),
      })
    } catch (err) {
      setError(err.message || 'Error al cargar las publicaciones')
      console.error('Error en fetchListings:', err)
      setListings([])
    } finally {
      setIsLoading(false)
    }
  }, [pagination.pageSize])

  /**
   * Elimina una publicación (soft delete)
   * @param {number} listingId - ID de la publicación
   */
  const deleteListing = useCallback(async (listingId) => {
    try {
      await listingsService.delete(listingId)
      // Recargar la lista después de eliminar
      fetchListings(null, pagination.page)
      return true
    } catch (err) {
      console.error('Error al eliminar publicación:', err)
      throw err
    }
  }, [fetchListings, pagination.page])

  /**
   * Actualiza una publicación
   * @param {number} listingId - ID de la publicación
   * @param {Object} updates - Datos a actualizar
   */
  const updateListing = useCallback(async (listingId, updates) => {
    try {
      const updatedListing = await listingsService.update(listingId, updates)
      // Actualizar la lista local
      setListings(prev => prev.map(listing => 
        listing.listing_id === listingId ? updatedListing : listing
      ))
      return updatedListing
    } catch (err) {
      console.error('Error al actualizar publicación:', err)
      throw err
    }
  }, [])

  /**
   * Recarga la página actual
   */
  const refresh = useCallback(() => {
    fetchListings(null, pagination.page)
  }, [fetchListings, pagination.page])

  // Cargar publicaciones al montar el componente si autoLoad es true
  useEffect(() => {
    if (autoLoad) {
      fetchListings(null, 1)
    }
  }, [autoLoad]) // Solo ejecutar una vez al montar

  return {
    listings,
    isLoading,
    error,
    pagination,
    fetchListings,
    deleteListing,
    updateListing,
    refresh,
  }
}