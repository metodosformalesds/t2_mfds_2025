'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, AlertCircle, Package } from 'lucide-react'
import listingsService from '@/lib/api/listings'

export default function EditPublicationForm({ listingId }) {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    price_unit: '',
    quantity: '',
    origin_description: '',
  })

  const [originalData, setOriginalData] = useState(null)

  // Cargar datos del listing
  useEffect(() => {
    const fetchListing = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Validar que el ID sea válido
        if (!listingId || listingId === 'undefined' || listingId === 'null') {
          setError('ID de publicación inválido')
          setIsLoading(false)
          return
        }
        
        const listing = await listingsService.getById(listingId)
        
        // Validar que el listing existe
        if (!listing) {
          setError('Publicación no encontrada')
          setIsLoading(false)
          return
        }

        setFormData({
          title: listing.title || '',
          description: listing.description || '',
          price: listing.price || '',
          price_unit: listing.price_unit || '',
          quantity: listing.quantity || 0,
          origin_description: listing.origin_description || '',
        })
        setOriginalData(listing)
      } catch (err) {
        // Manejo mejorado de errores
        let errorMessage = 'No se pudo cargar la publicación.'
        
        if (err.message === 'Network Error') {
          errorMessage = 'Error de conexión. Verifica que el backend esté funcionando.'
        } else if (err.response?.status === 404) {
          errorMessage = 'Publicación no encontrada.'
        } else if (err.response?.status === 403) {
          errorMessage = 'No tienes permisos para editar esta publicación.'
        } else if (err.response?.status === 401) {
          errorMessage = 'Sesión expirada. Por favor inicia sesión nuevamente.'
        } else if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail
        }
        
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    if (listingId) {
      fetchListing()
    } else {
      setError('ID de publicación no proporcionado')
      setIsLoading(false)
    }
  }, [listingId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccessMessage('')

    try {
      // Validaciones antes de enviar
      const newQuantity = parseInt(formData.quantity)
      if (isNaN(newQuantity) || newQuantity < 0) {
        setError('La cantidad debe ser un número válido mayor o igual a 0')
        setIsSaving(false)
        return
      }

      const newPrice = parseFloat(formData.price)
      if (isNaN(newPrice) || newPrice <= 0) {
        setError('El precio debe ser un número válido mayor a 0')
        setIsSaving(false)
        return
      }

      const updates = {}
      
      if (formData.title !== originalData.title) {
        updates.title = formData.title
      }
      if (formData.description !== originalData.description) {
        updates.description = formData.description
      }
      if (newPrice !== parseFloat(originalData.price)) {
        updates.price = newPrice
      }
      if (formData.price_unit !== originalData.price_unit) {
        updates.price_unit = formData.price_unit
      }
      if (newQuantity !== parseInt(originalData.quantity)) {
        updates.quantity = newQuantity
        
        // Advertencia si se está poniendo en 0
        if (newQuantity === 0) {
          const confirmZero = window.confirm(
            '⚠️ Estás poniendo la cantidad en 0. Esto hará que el producto no esté disponible para compra. ¿Deseas continuar?'
          )
          if (!confirmZero) {
            setIsSaving(false)
            return
          }
        }
      }
      if (formData.origin_description !== originalData.origin_description) {
        updates.origin_description = formData.origin_description
      }

      if (Object.keys(updates).length === 0) {
        setError('No hay cambios para guardar')
        setIsSaving(false)
        return
      }

      await listingsService.update(listingId, updates)
      
      setSuccessMessage('¡Publicación actualizada exitosamente!')
      setOriginalData({ ...originalData, ...updates })
      
      setTimeout(() => {
        router.push('/dashboard/publicaciones')
      }, 2000)
    } catch (err) {
      let errorMessage = 'Error al actualizar la publicación'
      
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail
      } else if (err.message === 'Network Error') {
        errorMessage = 'Error de conexión. Verifica que el backend esté funcionando.'
      }
      
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
          <p className="text-gray-600 font-inter">Cargando publicación...</p>
        </div>
      </div>
    )
  }

  if (error && !originalData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-16 h-16 text-red-400" />
          <p className="mt-4 text-red-600 font-inter text-lg font-semibold">
            Error al cargar
          </p>
          <p className="text-gray-600 font-inter mt-2 text-center max-w-md">
            {error}
          </p>
          <Link
            href="/dashboard/publicaciones"
            className="mt-6 inline-flex items-center gap-2 text-primary-500 hover:underline font-inter"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a mis publicaciones
          </Link>
        </div>
      </div>
    )
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'REJECTED':
        return 'bg-red-100 text-red-700 border-red-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getStatusLabel = (status) => {
    const labels = {
      ACTIVE: 'Activo',
      PENDING: 'Pendiente',
      REJECTED: 'Rechazado',
      INACTIVE: 'Inactivo',
    }
    return labels[status] || status
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-poppins text-neutral-900">
              {originalData?.title}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <Package className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-600 font-inter">
                Tipo: {originalData?.listing_type === 'MATERIAL' ? 'Material' : 'Producto'}
              </p>
            </div>
          </div>
          <span className={`px-4 py-2 text-sm font-semibold rounded-full border ${getStatusColor(originalData?.status)} font-inter`}>
            {getStatusLabel(originalData?.status)}
          </span>
        </div>
      </div>

      {/* Mensajes */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs">✓</span>
          </div>
          <span className="text-green-700 font-inter">{successMessage}</span>
        </div>
      )}

      {error && originalData && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-red-700 font-inter">{error}</span>
        </div>
      )}

      {/* Formulario */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold font-poppins text-gray-900 mb-6">
          Información de la publicación
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 font-inter mb-2">
              Título *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-inter"
            />
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 font-inter mb-2">
              Descripción *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-inter resize-none"
            />
          </div>

          {/* Precio y Unidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="price" className="block text-sm font-semibold text-gray-700 font-inter mb-2">
                Precio *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-inter"
                />
              </div>
            </div>
            <div>
              <label htmlFor="price_unit" className="block text-sm font-semibold text-gray-700 font-inter mb-2">
                Unidad de precio
              </label>
              <select
                id="price_unit"
                name="price_unit"
                value={formData.price_unit}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-inter"
              >
                <option value="">Seleccionar</option>
                <option value="unidad">Por unidad</option>
                <option value="kg">Por kilogramo</option>
                <option value="tonelada">Por tonelada</option>
                <option value="m2">Por metro cuadrado</option>
                <option value="m3">Por metro cúbico</option>
                <option value="litro">Por litro</option>
                <option value="lote">Por lote</option>
              </select>
            </div>
          </div>

          {/* Cantidad */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-semibold text-gray-700 font-inter mb-2">
              Cantidad disponible *
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-inter"
            />
          </div>

          {/* Origen */}
          <div>
            <label htmlFor="origin_description" className="block text-sm font-semibold text-gray-700 font-inter mb-2">
              Origen del material
            </label>
            <textarea
              id="origin_description"
              name="origin_description"
              value={formData.origin_description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-inter resize-none"
            />
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-inter"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar Cambios
                </>
              )}
            </button>
            <Link
              href="/dashboard/publicaciones"
              className="flex-1 inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors font-inter"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-1 font-inter">
          ℹ️ Información importante
        </h3>
        <p className="text-sm text-blue-700 font-inter">
          Los cambios en la publicación pueden requerir una nueva revisión por parte del equipo de moderación dependiendo de las modificaciones realizadas.
        </p>
      </div>
    </div>
  )
}