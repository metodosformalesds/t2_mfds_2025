/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: EditCategoryModal
 * Descripción: modal para editar categorías existentes con campos para nombre y tipo
 */

'use client'

import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'

export default function EditCategoryModal({
  isOpen,
  onClose,
  category,
  onUpdate,
}) {
  // Use lazy initialization - el componente se resetea cuando cambia la key
  const [newName, setNewName] = useState(() => category?.name || '')
  const [newType, setNewType] = useState(() => (category?.type || 'MATERIAL').toUpperCase())

  const handleSubmit = e => {
    e.preventDefault()
    if (!newName) return
    onUpdate({ id: category.id, newName, newType })
  }

  if (!isOpen) return null

  return (
    // Fondo oscuro (Backdrop)
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      {/* Contenedor del Modal */}
      <div
        onClick={e => e.stopPropagation()} // Evita que el clic en el modal cierre el modal
        className="flex w-full max-w-md flex-col items-center gap-6 rounded-xl bg-white p-8 shadow-lg"
      >
        <div className="flex w-full items-center justify-between">
          {/* Título (lo empujamos al centro con un spacer) */}
          <span className="w-6"></span> {/* Spacer */}
          <h2 className="text-center font-poppins text-3xl font-semibold text-neutral-900">
            Editar categoría
          </h2>
          <button
            onClick={onClose}
            className="-mr-2 -mt-2 text-neutral-500 hover:text-neutral-900"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Formulario de Edición */}
        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col items-center gap-5"
        >
          {/* Campo Nombre Actual (No editable) */}
          <div className="flex w-full flex-col items-center gap-2">
            <label
              htmlFor="currentName"
              className="font-roboto text-lg font-medium text-neutral-900"
            >
              Categoría
            </label>
            <input
              id="currentName"
              type="text"
              value={category?.name || ''} // Fallback a string vacía
              disabled
              className="w-full max-w-xs rounded-xl border border-neutral-400 bg-neutral-100 px-4 py-2.5 text-center font-inter text-neutral-700"
            />
          </div>

          {/* Campo Nuevo Nombre */}
          <div className="flex w-full flex-col items-center gap-2">
            <label
              htmlFor="newName"
              className="font-roboto text-lg font-medium text-neutral-900"
            >
              Nueva categoría
            </label>
            <input
              id="newName"
              type="text"
              value={newName} // Este valor ahora está controlado (nunca undefined)
              onChange={e => setNewName(e.target.value)}
              placeholder="Ej: Textiles"
              className="w-full max-w-xs rounded-xl border border-neutral-900 bg-white px-4 py-2.5 font-inter text-neutral-900/70 placeholder-neutral-900/70 focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Campo Tipo (Select) */}
          <div className="flex w-full flex-col items-center gap-2">
            <label
              htmlFor="newType"
              className="font-roboto text-lg font-medium text-neutral-900"
            >
              Tipo
            </label>
            <div className="relative w-40">
              <select
                id="newType"
                value={newType} // Este valor ahora está controlado (nunca undefined)
                onChange={e => setNewType(e.target.value)}
                className="w-full appearance-none rounded-xl border border-neutral-900 bg-white px-4 py-2.5 pr-10 font-inter text-neutral-900/70 focus:ring-2 focus:ring-primary-500"
              >
                <option value="MATERIAL">Material</option>
                <option value="PRODUCT">Producto</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-900" />
            </div>
          </div>

          {/* Botón de Actualizar */}
          <button
            type="submit"
            className="mt-2 w-fit rounded-lg bg-primary-500 px-5 py-3 font-inter text-base font-semibold text-white transition-colors hover:bg-primary-600"
          >
            Actualizar
          </button>
        </form>
      </div>
    </div>
  )
}