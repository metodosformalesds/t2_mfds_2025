'use client'

import { useState, useEffect } from 'react'
import listingsService from '@/lib/api/listings'

export default function TestDeletePage() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const loadListings = async () => {
    setLoading(true)
    try {
      const response = await listingsService.getMyListings({ page_size: 100 })
      console.log('[TEST] Listings recibidos:', response.items)
      setListings(response.items || [])
      setMessage(`Cargados ${response.items?.length || 0} listings`)
    } catch (err) {
      console.error('[TEST] Error:', err)
      setMessage('Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  const testDelete = async (listingId) => {
    if (!confirm(`¿Eliminar listing ${listingId}?`)) return
    
    setMessage(`Eliminando listing ${listingId}...`)
    try {
      await listingsService.delete(listingId)
      setMessage(`✅ Listing ${listingId} eliminado, recargando...`)
      await new Promise(r => setTimeout(r, 1000))
      await loadListings()
    } catch (err) {
      console.error('[TEST] Error al eliminar:', err)
      setMessage(`❌ Error: ${err.response?.data?.detail || err.message}`)
    }
  }

  useEffect(() => {
    loadListings()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">TEST: Delete Listings</h1>
        <p className="mb-4 text-sm text-gray-600">{message}</p>
        
        <button 
          onClick={loadListings}
          disabled={loading}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Cargando...' : 'Recargar Listings'}
        </button>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Título</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {listings.map(listing => (
                <tr key={listing.listing_id} className="border-t">
                  <td className="px-4 py-2">{listing.listing_id}</td>
                  <td className="px-4 py-2">{listing.title}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      listing.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      listing.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                      listing.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {listing.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => testDelete(listing.listing_id)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {listings.length === 0 && !loading && (
            <p className="p-8 text-center text-gray-500">No hay listings</p>
          )}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-bold mb-2">Instrucciones:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Verifica que se cargan tus listings</li>
            <li>Haz clic en "Eliminar" en un listing ACTIVE</li>
            <li>Abre la consola (F12) y verifica los logs</li>
            <li>Espera 1 segundo, debería recargar automáticamente</li>
            <li>El listing debería aparecer como INACTIVE</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
