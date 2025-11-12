'use client'

import { useState, useMemo, useEffect } from 'react'
import ModerationQueue from '@/components/admin/ModerationQueue'
import ModerationDetail from '@/components/admin/ModerationDetail'
import { useConfirmStore } from '@/stores/useConfirmStore'
import { adminService } from '@/lib/api/admin'

export default function AdminModerationPage() {
  const [queue, setQueue] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [error, setError] = useState('')

  const openConfirmModal = useConfirmStore(state => state.open)

  // Cargar cola de moderación
  const fetchQueue = async () => {
    try {
      setIsLoading(true)
      const data = await adminService.getModerationListings({ status: 'pending' })
      const items = data.items || []
      setQueue(items)
      
      // Seleccionar el primer item si existe
      if (items.length > 0) {
        setSelectedId(items[0].listing_id)
      } else {
        setSelectedId(null)
      }
    } catch (error) {
      console.error("Error al cargar cola de moderación:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchQueue()
  }, [])

  // Mapear datos al formato esperado por los componentes
  const formattedQueue = useMemo(() => {
    return queue.map(item => ({
      id: item.listing_id,
      title: item.title,
      pendingCount: 0,
      publisher: item.seller_name,
      user: item.seller_name,
      description: item.description || 'Sin descripción',
      images: item.images || [],
    }))
  }, [queue])

  const selectedItem = useMemo(
    () => formattedQueue.find(item => item.id === selectedId),
    [formattedQueue, selectedId]
  )
  
  const handleSelectItem = (id) => {
    setSelectedId(id)
    setRejectionReason('')
    setError('')
  }

  // Función para remover item de la UI y seleccionar el siguiente
  const removeItemFromQueue = (itemId) => {
    const newQueue = queue.filter(item => item.listing_id !== itemId)
    setQueue(newQueue)
    setSelectedId(newQueue.length > 0 ? newQueue[0].listing_id : null)
    setRejectionReason('')
    setError('')
  }
  
  const createApproveHandler = () => {
    return async () => {
      try {
        console.log(`Aprobando item ${selectedItem.id}`)
        await adminService.approveListing(selectedItem.id, 'Aprobado por moderador')
        removeItemFromQueue(selectedItem.id)
      } catch (error) {
        console.error("Error al aprobar:", error)
        setError("Error al aprobar la publicación.")
      }
    }
  }

  const createRejectHandler = () => {
    return async () => {
      try {
        console.log(`Rechazando item ${selectedItem.id} por: ${rejectionReason}`)
        await adminService.rejectListing(selectedItem.id, rejectionReason)
        removeItemFromQueue(selectedItem.id)
      } catch (error) {
        console.error("Error al rechazar:", error)
        setError("Error al rechazar la publicación.")
      }
    }
  }

  const handleApprove = () => {
    openConfirmModal(
      'Aprobar Publicación',
      `¿Estás seguro de que quieres aprobar "${selectedItem.title}"?`,
      createApproveHandler(),
      { danger: false }
    )
  }
  
  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setError('Debes proporcionar una razón para rechazar la publicación.')
      return
    }
    
    openConfirmModal(
      'Rechazar Publicación',
      `¿Estás seguro de que quieres rechazar "${selectedItem.title}"? El vendedor recibirá la razón: "${rejectionReason}"`,
      createRejectHandler(),
      { danger: true }
    )
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="font-poppins text-5xl font-bold text-primary-500">
          Cargando Moderación...
        </h1>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="font-poppins text-5xl font-bold text-primary-500">
        Moderación de contenido
      </h1>
      
      <p className="mt-4 text-orange-600 font-semibold">
        Nota: El API de moderación (`ModerationQueueItem`) no provee
        'description' ni 'images'. El detalle podría aparecer vacío.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ModerationQueue
            items={formattedQueue}
            selectedId={selectedId}
            onSelectItem={handleSelectItem}
          />
        </div>

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
                No hay publicaciones pendientes de moderar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}