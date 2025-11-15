'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import listingsService from '@/lib/api/listings'
import { Loader2, RefreshCw } from 'lucide-react'

// Componente para la Fila de la Tabla
function PublicationRow({ pub, onEdit, onDeactivate }) {
  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: { text: 'Activo', class: 'bg-green-100 text-green-700' },
      PENDING: { text: 'Pendiente', class: 'bg-yellow-100 text-yellow-700' },
      REJECTED: { text: 'Rechazado', class: 'bg-red-100 text-red-700' },
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
        {pub.quantity}
      </td>
      <td className="py-4 px-2">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit(pub.listing_id)}
            className="rounded-lg border border-primary-500 bg-primary-500/20 px-4 py-1.5 font-inter text-sm font-semibold text-primary-500 transition-colors hover:bg-primary-500/30"
          >
            Editar
          </button>
          {pub.status === 'ACTIVE' && (
            <button 
              onClick={() => onDeactivate(pub.listing_id)}
              className="rounded-lg border border-red-500 bg-red-500/20 px-4 py-1.5 font-inter text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/30"
            >
              Desactivar
            </button>
          )}
        </div>
      </td>
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

  // Mapeo de tabs a estados del backend
  const statusMap = {
    active: ['ACTIVE', 'SOLD'],
    pending: ['PENDING'],
    inactive: ['REJECTED', 'DELETED']
  }

  // Función para cargar publicaciones
  const fetchPublications = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('[PublicationsList] Iniciando carga de publicaciones...')
      const response = await listingsService.getMyListings({ page_size: 100 })
      console.log('[PublicationsList] Respuesta completa de API:', response)
      
      const listings = response.items || []
      console.log('[PublicationsList] Total de listings encontrados:', listings.length)
      console.log('[PublicationsList] Listings cargados:', listings)
      
      // Log detallado de cada listing
      listings.forEach((l, i) => {
        console.log(`  ${i + 1}. ${l.title} - Status: ${l.status} - ID: ${l.listing_id}`)
      })
      
      setAllListings(listings)

      // Calcular contadores por estado
      const newCounts = {
        active: listings.filter(l => ['ACTIVE', 'SOLD'].includes(l.status)).length,
        pending: listings.filter(l => l.status === 'PENDING').length,
        inactive: listings.filter(l => ['REJECTED', 'DELETED'].includes(l.status)).length
      }
      console.log('[PublicationsList] Contadores calculados:', newCounts)
      setCounts(newCounts)

      // Filtrar por tab activo
      const filtered = listings.filter(l => 
        statusMap[activeTab].includes(l.status)
      )
      console.log(`[PublicationsList] Tab activo: "${activeTab}", Filtrados: ${filtered.length}`)
      console.log('[PublicationsList] Estados buscados:', statusMap[activeTab])
      setPublications(filtered)

    } catch (err) {
      console.error('[PublicationsList] Error al cargar publicaciones:', err)
      console.error('[PublicationsList] Detalles del error:', err.response?.data || err.message)
      setError('Error al cargar tus publicaciones')
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
    console.log(`[PublicationsList] Tab cambió a: "${activeTab}"`)
    console.log(`[PublicationsList] Total listings disponibles: ${allListings.length}`)
    const filtered = allListings.filter(l => 
      statusMap[activeTab].includes(l.status)
    )
    console.log(`[PublicationsList] Listings filtrados para "${activeTab}": ${filtered.length}`)
    setPublications(filtered)
  }, [activeTab, allListings])

  const handleEdit = (listingId) => {
    // TODO: Implementar navegación a página de edición
    console.log('Editar listing:', listingId)
    alert(`Función de editar en desarrollo. ID: ${listingId}`)
  }

  const handleDeactivate = async (listingId) => {
    if (!confirm('¿Estás seguro de que deseas desactivar esta publicación?')) {
      return
    }

    try {
      await listingsService.delete(listingId)
      
      // Recargar todas las publicaciones
      await fetchPublications()

      alert('Publicación desactivada exitosamente')
    } catch (err) {
      console.error('Error al desactivar:', err)
      alert('Error al desactivar la publicación')
    }
  }

  return (
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
                <th className="w-1/5 py-3 px-2 font-inter text-xs font-semibold uppercase text-[#353A43]">
                  Acciones
                </th>
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
                  />
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
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
    </div>
  )
}