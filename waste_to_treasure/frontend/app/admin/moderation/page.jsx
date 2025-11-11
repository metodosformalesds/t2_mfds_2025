'use client'

import { useState, useMemo } from 'react'
import ModerationQueue from '@/components/admin/ModerationQueue'
import ModerationDetail from '@/components/admin/ModerationDetail'
import { useConfirmStore } from '@/stores/useConfirmStore'

// (Datos de initialQueue sin cambios...)
const initialQueue = [
  {
    id: 1,
    title: 'Plástico PET',
    pendingCount: 8,
    publisher: 'Recicladora el norte',
    user: 'Recicladora del Norte',
    description: 'Lote de 500kg de PET post-industrial. Sin limpiar.',
    images: [
      'https://th.bing.com/th/id/R.7bb37e8a014b68ab774be2620c16ccae?rik=8FDwJuvB2NO0Vg&pid=ImgRaw&r=0',
      'https://th.bing.com/th/id/R.7bb37e8a014b68ab774be2620c16ccae?rik=8FDwJuvB2NO0Vg&pid=ImgRaw&r=0',
    ],
  },
  {
    id: 2,
    title: 'Chatarra de acero',
    pendingCount: 0,
    publisher: 'Usuario 123',
    user: 'Usuario 123',
    description: 'Vigas de acero, 2 toneladas.',
    images: [],
  },
  {
    id: 3,
    title: 'Restos de madera',
    pendingCount: 0,
    publisher: 'Mueblería Juárez',
    user: 'Mueblería Juárez',
    description: 'Retazos de pino y encino.',
    images: [],
  },
]

export default function AdminModerationPage() {
  const [queue, setQueue] = useState(initialQueue)
  const [selectedId, setSelectedId] = useState(initialQueue[0]?.id || null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [error, setError] = useState('')

  const openConfirmModal = useConfirmStore(state => state.open)

  const selectedItem = useMemo(
    () => queue.find(item => item.id === selectedId),
    [queue, selectedId]
  )

  const handleSelectItem = id => {
    setSelectedId(id)
    setRejectionReason('')
    setError('')
  }

  // --- INICIO DE LA CORRECCIÓN ---
  
  // Función genérica para eliminar de la cola (simulación)
  const removeItemFromQueue = () => {
    const newQueue = queue.filter(item => item.id !== selectedId)
    setQueue(newQueue)
    // Seleccionar el primer ítem de la nueva cola, o null si está vacía
    setSelectedId(newQueue.length > 0 ? newQueue[0].id : null)
    setRejectionReason('')
    setError('')
  }
  
  // Handler para el modal de Aprobación
  const createApproveHandler = () => {
    return () => {
      console.log(`Aprobando item ${selectedItem.id}`)
      // Aquí va la llamada a la API
      removeItemFromQueue()
    }
  }

  // Handler para el modal de Rechazo
  const createRejectHandler = () => {
    return () => {
      console.log(`Rechazando item ${selectedItem.id} por: ${rejectionReason}`)
      // Aquí va la llamada a la API
      removeItemFromQueue()
    }
  }

  // Botón "Aprobar" ahora abre modal
  const handleApprove = () => {
    openConfirmModal(
      'Aprobar Publicación',
      `¿Estás seguro de que quieres aprobar y publicar "${selectedItem.title}"?`,
      createApproveHandler(),
      { danger: false } // Botón verde
    )
  }
  // --- FIN DE LA CORRECCIÓN ---

  // Botón "Rechazar" abre modal
  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setError('Por favor, especifica una razón de rechazo.')
      return
    }
    setError('')
    
    openConfirmModal(
      'Rechazar Publicación',
      `¿Estás seguro de que quieres rechazar "${selectedItem.title}"? Se notificará al usuario con la razón provista.`,
      createRejectHandler(),
      { danger: true } // Botón rojo
    )
  }

  return (
    // El padding p-12 ahora está en el layout
    <>
      <h1 className="font-poppins text-5xl font-bold text-primary-500">
        Moderación de contenido
      </h1>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Columna Izquierda (Cola) */}
        <div className="lg:col-span-1">
          <ModerationQueue
            items={queue}
            selectedId={selectedId}
            onSelectItem={handleSelectItem}
          />
        </div>

        {/* Columna Derecha (Detalle) */}
        <div className="lg:col-span-2">
          {selectedItem ? (
            <ModerationDetail
              item={selectedItem}
              rejectionReason={rejectionReason}
              onReasonChange={e => setRejectionReason(e.target.value)}
              onApprove={handleApprove}
              onReject={handleReject}
              error={error}
            />
          ) : (
            // Añadido min-h para que no colapse si la cola está vacía
            <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl bg-white p-8 shadow-md">
              <p className="font-inter text-lg text-neutral-600">
                No hay publicaciones pendientes de moderar.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}