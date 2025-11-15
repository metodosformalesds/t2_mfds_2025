'use client'

import { useState, useMemo, useEffect } from 'react'
import ModerationQueue from '@/components/admin/ModerationQueue'
import ModerationDetail from '@/components/admin/ModerationDetail'
import { useConfirmStore } from '@/stores/useConfirmStore'
import { adminService } from '@/lib/api/admin'

export default function AdminModerationPage() {
  const [queue, setQueue] = useState([])
  const [totalItems, setTotalItems] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [selectedListingDetails, setSelectedListingDetails] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [error, setError] = useState('')

  const itemsPerPage = 10
  const openConfirmModal = useConfirmStore(state => state.open)

  // Cargar cola de moderación con paginación
  const fetchQueue = async (page = 1) => {
    try {
      setIsLoading(true)
      const skip = (page - 1) * itemsPerPage
      const data = await adminService.getModerationListings({ 
        status: 'pending',
        skip,
        limit: itemsPerPage 
      })
      
      const items = data.items || []
      setQueue(items)
      setTotalItems(data.total || 0)
      setCurrentPage(page)
      
      // Seleccionar el primer item si existe
      if (items.length > 0) {
        await handleSelectItem(items[0].listing_id)
      } else {
        setSelectedId(null)
        setSelectedListingDetails(null)
      }
    } catch (error) {
      console.error("Error al cargar cola de moderación:", error)
      setError('Error al cargar la cola de moderación')
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchQueue(1)
  }, [])

  // Mapear datos al formato esperado por los componentes
  const formattedQueue = useMemo(() => {
    return queue.map(item => ({
      id: item.listing_id,
      title: item.title || 'Sin título',
      pendingCount: 0,
      publisher: item.seller_name || 'Desconocido',
      user: item.seller_name || 'Desconocido',
      description: 'Ver detalles completos en la vista de detalle',
      images: [],
      price: item.price,
      category: item.category_name,
      status: item.status,
      createdAt: item.created_at,
    }))
  }, [queue])

  const selectedItem = useMemo(() => {
    if (!selectedId || !selectedListingDetails) return null
    
    const queueItem = formattedQueue.find(item => item.id === selectedId)
    if (!queueItem) return null
    
    // Combinar datos de la cola con detalles completos del listing
    return {
      ...queueItem,
      description: selectedListingDetails.description || 'Sin descripción disponible',
      images: (selectedListingDetails.images || []).map(img => {
        // Manejar tanto objetos con image_url como strings directos
        if (typeof img === 'string') return img
        return img.image_url || img.url || ''
      }).filter(url => url), // Filtrar URLs vacías
    }
  }, [formattedQueue, selectedId, selectedListingDetails])
  
  const handleSelectItem = async (id) => {
    setSelectedId(id)
    setRejectionReason('')
    setError('')
    
    // Cargar detalles completos del listing usando el endpoint de admin
    try {
      const details = await adminService.getModerationListingDetail(id)
      setSelectedListingDetails(details)
    } catch (error) {
      console.error('Error al cargar detalles del listing:', error)
      setSelectedListingDetails(null)
    }
  }

  // Función para remover item de la UI y recargar la página actual
  const removeItemFromQueue = async (itemId) => {
    // Recargar la cola completa para reflejar cambios
    await fetchQueue(currentPage)
    setRejectionReason('')
    setError('')
  }
  
  const handleApprove = async () => {
    if (!selectedItem) return
    
    openConfirmModal(
      'Aprobar Publicación',
      `¿Estás seguro de que quieres aprobar "${selectedItem.title}"?`,
      async () => {
        try {
          await adminService.approveListing(selectedItem.id, 'Aprobado por moderador')
          await removeItemFromQueue(selectedItem.id)
          setError('')
        } catch (error) {
          console.error('Error al aprobar:', error)
          setError(error.response?.data?.detail || 'Error al aprobar la publicación')
        }
      },
      false // No es peligroso
    )
  }
  
  const handleReject = () => {
    if (!selectedItem) return
    
    if (!rejectionReason.trim()) {
      setError('Debes proporcionar una razón para rechazar la publicación.')
      return
    }
    
    openConfirmModal(
      'Rechazar Publicación',
      `¿Estás seguro de que quieres rechazar "${selectedItem.title}"? El vendedor recibirá la razón: "${rejectionReason}"`,
      async () => {
        try {
          await adminService.rejectListing(selectedItem.id, rejectionReason)
          await removeItemFromQueue(selectedItem.id)
          setError('')
        } catch (error) {
          console.error('Error al rechazar:', error)
          setError(error.response?.data?.detail || 'Error al rechazar la publicación')
        }
      },
      true // Es peligroso
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-900 font-medium">Cargando Moderacion...</p>
        </div>
      </div>
    )
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchQueue(newPage)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="font-poppins text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-500">
          Moderación de contenido
        </h1>
        <div className="flex items-center gap-2 text-neutral-600">
          <span className="font-roboto text-lg font-semibold">{totalItems}</span>
          <span className="font-inter text-sm">publicaciones pendientes</span>
        </div>
      </div>

      {error && !selectedItem && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-red-800 font-inter text-sm">{error}</p>
        </div>
      )}

      <div className="mt-6 sm:mt-10 grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
        {/* Cola con paginación */}
        <div className="lg:col-span-1">
          <ModerationQueue
            items={formattedQueue}
            selectedId={selectedId}
            onSelectItem={handleSelectItem}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            isLoading={isLoading}
          />
        </div>

        {/* Detalle */}
        <div className="lg:col-span-2">
          {selectedItem ? (
            <ModerationDetail
              item={selectedItem}
              rejectionReason={rejectionReason}
              onReasonChange={setRejectionReason}
              onApprove={handleApprove}
              onReject={handleReject}
              error={error}
            />
          ) : (
            <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl bg-white p-8 shadow-md">
              <p className="font-inter text-lg text-neutral-600">
                {isLoading ? 'Cargando...' : 'No hay publicaciones pendientes de moderar.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}