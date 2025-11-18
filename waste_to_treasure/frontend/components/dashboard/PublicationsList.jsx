'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import listingsService from '@/lib/api/listings'
import { Loader2, RefreshCw, Power, Edit, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import ConfirmationModal from '@/components/ui/ConfirmationModal'

/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: PublicationsList
 * Descripción: tabla de publicaciones del usuario con pestañas de estado (activas, inactivas, rechazadas), acciones para editar, activar y desactivar items
 */

// Componente Toast para notificaciones
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [onClose])

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <XCircle className="h-5 w-5 text-red-600" />,
    info: <AlertCircle className="h-5 w-5 text-blue-600" />
  }

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  return (
    <div 
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border-2 shadow-lg transition-all duration-300 ${colors[type]}`}
      style={{ animation: 'slideInRight 0.3s ease-out' }}
    >
      {icons[type]}
      <p className="font-inter text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
        <XCircle className="h-4 w-4" />
      </button>
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

// Componente para la Fila de la Tabla
function PublicationRow({ pub, onEdit, onDeactivate, onReactivate, onDelete, activeTab }) {
  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: { text: 'Activo', class: 'bg-green-100 text-green-700' },
      PENDING: { text: 'Pendiente', class: 'bg-yellow-100 text-yellow-700' },
      REJECTED: { text: 'Rechazado', class: 'bg-red-100 text-red-700' },
      INACTIVE: { text: 'Inactivo', class: 'bg-gray-100 text-gray-700' },
      SOLD: { text: 'Vendido', class: 'bg-blue-100 text-blue-700' }
    }
    return badges[status] || { text: status, class: 'bg-gray-100 text-gray-700' }
  }

  const badge = getStatusBadge(pub.status)

  return (
    <tr className="border-b border-neutral-200 hover:bg-neutral-50/50 transition-colors">
      <td className="py-4 px-2">
        <div className="flex flex-col gap-1">
          <span className="font-inter text-sm text-[#353A44] font-medium">
            {pub.title}
          </span>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.class} w-fit`}>
            {badge.text}
          </span>
        </div>
      </td>
      <td className="py-4 px-2 font-inter text-sm font-medium text-[#353A44]">
        ${parseFloat(pub.price).toFixed(2)}
      </td>
      <td className="py-4 px-2 font-inter text-sm text-[#596171]">
        {pub.listing_type === 'PRODUCT' ? 'Producto' : 'Material'}
      </td>
      <td className="py-4 px-2 font-inter text-sm text-[#596171]">
        {pub.available_quantity || pub.quantity || 0}
      </td>
      {/* Acciones para publicaciones ACTIVAS */}
      {activeTab === 'active' && (
        <td className="py-4 px-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(pub.listing_id)}
              className="rounded-lg border border-primary-500 bg-primary-500/20 px-4 py-1.5 font-inter text-sm font-semibold text-primary-500 transition-colors hover:bg-primary-500/30 flex items-center gap-1"
            >
              <Edit className="h-4 w-4" />
              Editar
            </button>
            <button
              onClick={() => onDeactivate(pub.listing_id)}
              className="rounded-lg border border-red-500 bg-red-500/20 px-4 py-1.5 font-inter text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/30 flex items-center gap-1"
            >
              <Power className="h-4 w-4" />
              Desactivar
            </button>
          </div>
        </td>
      )}
      {/**
       * Autor: Arturo Perez Gonzalez
       * Fecha: 16/11/2024
       * Descripción: Renderiza acciones disponibles para publicaciones inactivas.
       *              Si está RECHAZADA: permite editar o desactivar.
       *              Si está INACTIVE: permite reactivar, editar o desactivar.
       */}
      {activeTab === 'inactive' && (
        <td className="py-4 px-2">
          <div className="flex items-center gap-2">
            {/* Si está RECHAZADA, solo puede editar o desactivar */}
            {pub.status === 'REJECTED' ? (
              <>
                <button
                  onClick={() => onEdit(pub.listing_id)}
                  className="rounded-lg border border-primary-500 bg-primary-500/20 px-4 py-1.5 font-inter text-sm font-semibold text-primary-500 transition-colors hover:bg-primary-500/30 flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={() => onDelete(pub.listing_id)}
                  className="rounded-lg border border-red-500 bg-red-500/20 px-4 py-1.5 font-inter text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/30 flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Desactivar
                </button>
              </>
            ) : (
              /* Si está INACTIVE (desactivada por el usuario), puede reactivar */
              <>
                <button
                  onClick={() => onReactivate(pub.listing_id)}
                  className="rounded-lg border border-green-500 bg-green-500/20 px-4 py-1.5 font-inter text-sm font-semibold text-green-500 transition-colors hover:bg-green-500/30 flex items-center gap-1"
                >
                  <Power className="h-4 w-4" />
                  Reactivar
                </button>
                <button
                  onClick={() => onEdit(pub.listing_id)}
                  className="rounded-lg border border-primary-500 bg-primary-500/20 px-4 py-1.5 font-inter text-sm font-semibold text-primary-500 transition-colors hover:bg-primary-500/30 flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={() => onDelete(pub.listing_id)}
                  className="rounded-lg border border-red-500 bg-red-500/20 px-4 py-1.5 font-inter text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/30 flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Desactivar
                </button>
              </>
            )}
          </div>
        </td>
      )}
    </tr>
  )
}

// Componente para la Pestaña
function TabButton({ label, count, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`border-b-2 pb-2 font-inter text-base font-semibold transition-colors
        ${
          isActive
            ? 'border-primary-500 text-primary-500'
            : 'border-transparent text-neutral-900/60 hover:text-neutral-900'
        }
      `}
    >
      {label} ({count})
    </button>
  )
}

export default function PublicationsList() {
  const [activeTab, setActiveTab] = useState('active')
  const [publications, setPublications] = useState([])
  const [allListings, setAllListings] = useState([]) // Guardar todos los listings
  const [counts, setCounts] = useState({ active: 0, pending: 0, inactive: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Estado para notificaciones toast
  const [toast, setToast] = useState(null)

  // Estados para los modales
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'deactivate', 'reactivate', 'delete'
    listingId: null,
    isProcessing: false,
  })

  // Mapeo de tabs a estados del backend (mover fuera del componente o usar useMemo)
  const statusMap = useMemo(() => ({
    active: ['ACTIVE', 'SOLD'],
    pending: ['PENDING'],
    inactive: ['REJECTED', 'INACTIVE']
  }), [])

  // Función para cargar publicaciones
  const fetchPublications = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await listingsService.getMyListings({ page_size: 100 })
      const listings = response.items || []
      
      console.log(`[FETCH DEBUG] Recibidos ${listings.length} listings del backend`)
      console.log('[FETCH DEBUG] Estados:', listings.map(l => ({ id: l.listing_id, status: l.status })))
      
      // Crear una nueva copia para forzar re-render
      setAllListings([...listings])

      // Calcular contadores por estado
      const newCounts = {
        active: listings.filter(l => ['ACTIVE', 'SOLD'].includes(l.status)).length,
        pending: listings.filter(l => l.status === 'PENDING').length,
        inactive: listings.filter(l => ['REJECTED', 'INACTIVE'].includes(l.status)).length
      }
      setCounts(newCounts)
      console.log('[FETCH DEBUG] Contadores:', newCounts)

      // Filtrar por tab activo
      const filtered = listings.filter(l => 
        statusMap[activeTab].includes(l.status)
      )
      console.log(`[FETCH DEBUG] Filtrados para tab '${activeTab}': ${filtered.length}`)
      setPublications([...filtered])

    } catch (err) {
      console.error('Error al cargar publicaciones:', err)
      setError('No pudimos cargar tus publicaciones. Por favor, recarga la página.')
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar publicaciones al montar
  useEffect(() => {
    fetchPublications()
  }, [])

  // Filtrar cuando cambie el tab activo
  useEffect(() => {
    if (allListings.length === 0) {
      setPublications([])
      return
    }
    
    const filtered = allListings.filter(l => 
      statusMap[activeTab].includes(l.status)
    )
    setPublications(filtered)
  }, [activeTab, allListings, statusMap])

  const handleEdit = (listingId) => {
    window.location.href = `/dashboard/publicaciones/${listingId}/editar`
  }

  const handleDeactivate = (listingId) => {
    setModalState({
      isOpen: true,
      type: 'deactivate',
      listingId,
      isProcessing: false,
    })
  }

  const handleReactivate = (listingId) => {
    setModalState({
      isOpen: true,
      type: 'reactivate',
      listingId,
      isProcessing: false,
    })
  }

  const handleDelete = (listingId) => {
    console.log('[handleDelete] Abriendo modal para listing:', listingId)
    setModalState({
      isOpen: true,
      type: 'delete',
      listingId,
      isProcessing: false,
    })
  }

  const closeModal = () => {
    if (!modalState.isProcessing) {
      setModalState({
        isOpen: false,
        type: null,
        listingId: null,
        isProcessing: false,
      })
    }
  }

  const confirmAction = async () => {
    const { type, listingId } = modalState
    console.log('[confirmAction] Iniciando:', { type, listingId })
    setModalState((prev) => ({ ...prev, isProcessing: true }))

    try {
      if (type === 'deactivate' || type === 'delete') {
        console.log('[confirmAction] Llamando listingsService.delete:', listingId)
        await listingsService.delete(listingId)
        console.log('[confirmAction] DELETE exitoso')
      } else if (type === 'reactivate') {
        console.log('[confirmAction] Llamando listingsService.reactivate:', listingId)
        await listingsService.reactivate(listingId)
        console.log('[confirmAction] REACTIVATE exitoso')
      }

      const messages = {
        deactivate: 'Tu publicación ha sido desactivada. Puedes reactivarla cuando quieras.',
        reactivate: 'Tu publicación está en revisión. Te avisaremos cuando sea aprobada.',
        delete: 'Tu publicación ha sido desactivada correctamente.'
      }
      
      // Cerrar modal primero
      closeModal()
      console.log('[confirmAction] Modal cerrado')
      
      // Mostrar toast
      setToast({ message: messages[type], type: 'success' })
      console.log('[confirmAction] Toast mostrado')

      // Recargar lista después de un pequeño delay
      await new Promise(resolve => setTimeout(resolve, 500))
      console.log(`[DELETE DEBUG] Recargando publicaciones después de ${type}...`)
      await fetchPublications()
      console.log(`[DELETE DEBUG] Publicaciones recargadas. Total: ${allListings.length}`)
      
    } catch (err) {
      console.error('[confirmAction] ERROR:', err)
      const errorMessages = {
        deactivate: 'No pudimos desactivar tu publicación. Por favor, intenta de nuevo.',
        reactivate: 'No pudimos procesar tu solicitud. Por favor, intenta más tarde.',
        delete: 'No pudimos desactivar tu publicación. Por favor, intenta de nuevo.'
      }
      
      let errorDetail = errorMessages[type]
      if (err.response?.data?.detail) {
        errorDetail = err.response.data.detail
      } else if (err.message) {
        errorDetail = err.message
      }
      
      setToast({ message: errorDetail, type: 'error' })
      setModalState((prev) => ({ ...prev, isProcessing: false }))
    }
  }

  // Configuración de modales según el tipo
  const getModalConfig = () => {
    switch (modalState.type) {
      case 'deactivate':
        return {
          title: 'Desactivar Publicación',
          message: '¿Quieres desactivar esta publicación? Ya no será visible para otros usuarios, pero podrás reactivarla cuando quieras desde la sección "Inactivas".',
          confirmText: 'Desactivar',
          variant: 'danger',
        }
      case 'reactivate':
        return {
          title: 'Reactivar Publicación',
          message: 'Tu publicación se enviará nuevamente a revisión. Una vez aprobada, volverá a estar visible para otros usuarios. ¿Deseas continuar?',
          confirmText: 'Reactivar',
          variant: 'success',
        }
      case 'delete':
        return {
          title: 'Desactivar Publicación',
          message: '¿Quieres desactivar esta publicación? Ya no será visible para otros usuarios, pero podrás reactivarla más tarde si lo deseas.',
          confirmText: 'Desactivar',
          variant: 'danger',
        }
      default:
        return {
          title: 'Confirmar',
          message: '¿Estás seguro?',
          confirmText: 'Confirmar',
          variant: 'info',
        }
    }
  }

  return (
    <>
      {/* Toast de notificación */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="w-full rounded-xl bg-white p-8 shadow-lg">
      {/* Cabecera */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-neutral-900/60 pb-4 md:flex-row md:items-center">
        <h1 className="font-poppins text-3xl font-bold text-neutral-900">
          Mis Publicaciones
        </h1>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={fetchPublications}
            disabled={isLoading}
            className="rounded-lg border-2 border-primary-500 px-4 py-3 font-inter text-base font-semibold text-primary-500 transition-colors hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <Link
            href="/dashboard/publicaciones/nuevo"
            className="flex-1 md:flex-none rounded-lg bg-primary-500 px-6 py-3 text-center font-inter text-base font-semibold text-white transition-colors hover:bg-primary-600"
          >
            Publicar Nuevo
          </Link>
        </div>
      </div>

      {/* Pestañas de Filtro */}
      <div className="mt-6 flex items-center gap-6 border-b border-neutral-900/60">
        <TabButton
          label="Activas"
          count={counts.active}
          isActive={activeTab === 'active'}
          onClick={() => setActiveTab('active')}
        />
        <TabButton
          label="Pendientes"
          count={counts.pending}
          isActive={activeTab === 'pending'}
          onClick={() => setActiveTab('pending')}
        />
        <TabButton
          label="Inactivas"
          count={counts.inactive}
          isActive={activeTab === 'inactive'}
          onClick={() => setActiveTab('inactive')}
        />
      </div>

      {/* Tabla de Publicaciones */}
      <div className="mt-6 w-full overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <span className="ml-2 font-inter text-neutral-600">Cargando publicaciones...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="font-inter text-red-600">{error}</p>
          </div>
        ) : (
          <table className="w-full min-w-[700px] table-auto text-left">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="w-2/5 py-3 px-2 font-inter text-xs font-semibold uppercase text-[#353A43]">
                  Publicaciones
                </th>
                <th className="w-1/5 py-3 px-2 font-inter text-xs font-semibold uppercase text-[#353A43]">
                  Precio
                </th>
                <th className="w-1/5 py-3 px-2 font-inter text-xs font-semibold uppercase text-[#353A43]">
                  Tipo
                </th>
                <th className="w-1/5 py-3 px-2 font-inter text-xs font-semibold uppercase text-[#353A43]">
                  Stock
                </th>
                {(activeTab === 'active' || activeTab === 'inactive') && (
                  <th className="w-1/5 py-3 px-2 font-inter text-xs font-semibold uppercase text-[#353A43]">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {publications.length > 0 ? (
                publications.map(pub => (
                  <PublicationRow
                    key={pub.listing_id}
                    pub={pub}
                    onEdit={handleEdit}
                    onDeactivate={handleDeactivate}
                    onReactivate={handleReactivate}
                    onDelete={handleDelete}
                    activeTab={activeTab}
                  />
                ))
              ) : (
                <tr>
                  <td
                    colSpan={(activeTab === 'active' || activeTab === 'inactive') ? "5" : "4"}
                    className="py-12 text-center font-inter text-neutral-600"
                  >
                    No hay publicaciones en esta categoría.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Confirmación */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={confirmAction}
        isLoading={modalState.isProcessing}
        {...getModalConfig()}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
    </>
  )
}