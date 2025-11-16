'use client'

import { useState, useMemo, useEffect } from 'react'
import ModerationQueue from '@/components/admin/ModerationQueue'
import ModerationDetail from '@/components/admin/ModerationDetail'
import Toast from '@/components/ui/Toast'
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
  const [toast, setToast] = useState(null)
  
  // Nuevos estados para filtros
  const [statusFilter, setStatusFilter] = useState('pending')
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 })

  const itemsPerPage = 10
  const openConfirmModal = useConfirmStore(state => state.open)

  // Cargar estadísticas
  const fetchStats = async () => {
    try {
      const [pendingData, approvedData, rejectedData] = await Promise.all([
        adminService.getModerationListings({ status: 'pending', skip: 0, limit: 1 }),
        adminService.getModerationListings({ status: 'approved', skip: 0, limit: 1 }),
        adminService.getModerationListings({ status: 'rejected', skip: 0, limit: 1 })
      ])
      
      setStats({
        pending: pendingData.total || 0,
        approved: approvedData.total || 0,
        rejected: rejectedData.total || 0
      })
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    }
  }

  // Cargar cola de moderación con paginación y filtros
  const fetchQueue = async (page = 1) => {
    try {
      setIsLoading(true)
      const skip = (page - 1) * itemsPerPage
      const data = await adminService.getModerationListings({ 
        status: statusFilter,
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
      setError('Error al cargar la cola de moderación')
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchStats()
  }, [])
  
  useEffect(() => {
    fetchQueue(1)
  }, [statusFilter])

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
    // Manejar tanto el campo 'images' como posibles variaciones
    const images = selectedListingDetails.images || 
                   selectedListingDetails.listing_images || 
                   []
    
    const processedImages = images.map(img => {
      // Manejar diferentes formatos de imagen
      if (typeof img === 'string') return img
      if (img.image_url) return img.image_url
      if (img.url) return img.url
      return null
    }).filter(url => url) // Filtrar URLs vacías o nulas
    
    return {
      ...queueItem,
      description: selectedListingDetails.description || 'Sin descripción disponible',
      images: processedImages,
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
      setSelectedListingDetails(null)
      setError('Error al cargar detalles de la publicación')
    }
  }

  // Función para remover item de la UI y recargar la página actual
  const removeItemFromQueue = async (itemId) => {
    // Recargar la cola completa para reflejar cambios
    await fetchQueue(currentPage)
    await fetchStats() // Actualizar estadísticas
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
          setToast({ message: `Publicación "${selectedItem.title}" aprobada correctamente`, type: 'success' })
        } catch (error) {
          const errorMsg = error.response?.data?.detail || 'Error al aprobar la publicación'
          setError(errorMsg)
          setToast({ message: errorMsg, type: 'error' })
        }
      },
      false
    )
  }
  
  const handleReject = () => {
    if (!selectedItem) return
    
    if (!rejectionReason.trim()) {
      const errorMsg = 'Debes proporcionar una razón para rechazar la publicación.'
      setError(errorMsg)
      setToast({ message: errorMsg, type: 'warning' })
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
          setToast({ message: `Publicación "${selectedItem.title}" rechazada`, type: 'info' })
        } catch (error) {
          const errorMsg = error.response?.data?.detail || 'Error al rechazar la publicación'
          setError(errorMsg)
          setToast({ message: errorMsg, type: 'error' })
        }
      },
      true
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
      {/* Header con título y descripción */}
      <div className="mb-6 sm:mb-8">
        <h1 className="font-poppins text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-500">
          Moderación de contenido
        </h1>
        <p className="mt-2 text-neutral-600 font-inter">
          Revisa y gestiona las publicaciones antes de que sean visibles en la plataforma
        </p>
      </div>
      
      {/* Filtros y estadísticas integrados */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          {/* Filtros de estado */}
          <div className="flex-1 w-full lg:w-auto">
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Estado de publicaciones
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === 'pending'
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Pendientes
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === 'approved'
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Aprobadas
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === 'rejected'
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Rechazadas
              </button>
            </div>
          </div>
          
          {/* Estadísticas compactas */}
          <div className="flex gap-6 items-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-xs text-neutral-600 mt-0.5">Pendientes</div>
            </div>
            <div className="h-10 w-px bg-neutral-200"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-xs text-neutral-600 mt-0.5">Aprobadas</div>
            </div>
            <div className="h-10 w-px bg-neutral-200"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-xs text-neutral-600 mt-0.5">Rechazadas</div>
            </div>
          </div>
        </div>
        
        {/* Contador actual */}
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <p className="text-sm text-neutral-600">
            Mostrando <span className="font-semibold text-neutral-900">{totalItems}</span> publicaciones{' '}
            {statusFilter === 'pending' ? 'pendientes de revisión' : 
             statusFilter === 'approved' ? 'aprobadas' : 'rechazadas'}
          </p>
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

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}