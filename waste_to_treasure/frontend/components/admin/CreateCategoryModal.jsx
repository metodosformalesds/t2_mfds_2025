'use client'

import { useState, useEffect } from 'react'
import { X, Layers } from 'lucide-react'

/**
 * Modal para crear una nueva categoría con soporte para jerarquías.
 */
export default function CreateCategoryModal({ isOpen, onClose, onSubmit, existingCategories = [] }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('MATERIAL')
  const [isParent, setIsParent] = useState(true)
  const [parentCategoryId, setParentCategoryId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filtrar categorías padre del mismo tipo
  const availableParents = existingCategories.filter(
    cat => cat.type === type && !cat.parent_category_id
  )

  // Resetear padre cuando cambia el tipo o se selecciona "Es padre"
  useEffect(() => {
    if (isParent) {
      setParentCategoryId('')
    }
  }, [isParent, type])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      const categoryData = {
        name: name.trim(),
        type,
        parent_category_id: isParent ? null : (parentCategoryId ? parseInt(parentCategoryId) : null)
      }
      
      await onSubmit(categoryData)
      
      // Esperar un momento antes de cerrar para asegurar que el backend procesó
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Limpiar formulario después de crear
      setName('')
      setType('MATERIAL')
      setIsParent(true)
      setParentCategoryId('')
      onClose()
    } catch (error) {
      console.error('Error al crear categoría:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setName('')
      setType('MATERIAL')
      setIsParent(true)
      setParentCategoryId('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
            <h3 className="font-poppins text-xl font-semibold text-neutral-900">
              Nueva Categoría
            </h3>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label htmlFor="category-name" className="block font-inter text-sm font-medium text-neutral-700 mb-1">
                  Nombre de la categoría
                </label>
                <input
                  id="category-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Madera Reciclada"
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 font-inter text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-neutral-50 disabled:text-neutral-500"
                  required
                />
              </div>

              {/* Tipo */}
              <div>
                <label htmlFor="category-type" className="block font-inter text-sm font-medium text-neutral-700 mb-1">
                  Tipo de marketplace
                </label>
                <select
                  id="category-type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 font-inter text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-neutral-50 disabled:text-neutral-500"
                  required
                >
                  <option value="MATERIAL">Material (B2B)</option>
                  <option value="PRODUCT">Producto (B2C)</option>
                </select>
              </div>

              {/* Jerarquía */}
              <div className="space-y-3">
                <label className="block font-inter text-sm font-medium text-neutral-700">
                  Jerarquía
                </label>
                
                {/* Radio buttons */}
                <div className="space-y-2">
                  <label className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 cursor-pointer transition-colors hover:bg-neutral-50">
                    <input
                      type="radio"
                      name="hierarchy"
                      checked={isParent}
                      onChange={() => setIsParent(true)}
                      disabled={isSubmitting}
                      className="h-4 w-4 text-primary-500 focus:ring-2 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary-500" />
                        <span className="font-inter text-sm font-medium text-neutral-900">
                          Categoría Padre
                        </span>
                      </div>
                      <p className="mt-0.5 font-inter text-xs text-neutral-600">
                        Nivel principal de organización
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 cursor-pointer transition-colors hover:bg-neutral-50">
                    <input
                      type="radio"
                      name="hierarchy"
                      checked={!isParent}
                      onChange={() => setIsParent(false)}
                      disabled={isSubmitting}
                      className="h-4 w-4 text-primary-500 focus:ring-2 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <span className="font-inter text-sm font-medium text-neutral-900">
                        Subcategoría
                      </span>
                      <p className="mt-0.5 font-inter text-xs text-neutral-600">
                        Pertenece a una categoría padre
                      </p>
                    </div>
                  </label>
                </div>

                {/* Selector de categoría padre */}
                {!isParent && (
                  <div className="mt-3 animate-in fade-in duration-200">
                    <label htmlFor="parent-category" className="block font-inter text-sm font-medium text-neutral-700 mb-1">
                      Categoría padre
                    </label>
                    {availableParents.length > 0 ? (
                      <select
                        id="parent-category"
                        value={parentCategoryId}
                        onChange={(e) => setParentCategoryId(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 font-inter text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-neutral-50 disabled:text-neutral-500"
                        required
                      >
                        <option value="">Seleccionar categoría padre</option>
                        {availableParents.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                        <p className="font-inter text-xs text-yellow-800">
                          No hay categorías padre de tipo <strong>{type}</strong>. Primero crea una categoría padre.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Info adicional */}
              <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
                <p className="font-inter text-xs text-blue-800">
                  <strong>💡 Tip:</strong> Las categorías padre organizan el nivel principal. Las subcategorías permiten clasificaciones más específicas.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 font-inter text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim() || (!isParent && !parentCategoryId && availableParents.length > 0)}
                className="flex-1 rounded-lg bg-primary-500 px-4 py-2.5 font-inter text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                {isSubmitting ? 'Creando...' : 'Crear Categoría'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
