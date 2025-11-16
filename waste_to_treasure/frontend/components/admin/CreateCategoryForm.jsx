'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function CreateCategoryForm({ onSubmit }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('MATERIAL') // Valor por defecto (usar enum del backend)

  const handleSubmit = e => {
    e.preventDefault()
    if (!name) return // Validación simple
    onSubmit({ name, type })
    setName('') // Resetear formulario
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-xl bg-white p-8 shadow-md"
    >
      <h2 className="font-poppins text-2xl font-semibold text-neutral-900">
        Crear nueva categoría
      </h2>

      {/* Campo Nombre */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="name"
          className="font-roboto text-lg font-medium text-neutral-900"
        >
          Nombre
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ej: Textiles"
          className="w-full rounded-xl border border-neutral-900 bg-white px-4 py-2.5 font-inter text-neutral-900/70 placeholder-neutral-900/70 focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Campo Tipo (Select) */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="type"
          className="font-roboto text-lg font-medium text-neutral-900"
        >
          Tipo
        </label>
        <div className="relative w-40">
          <select
            id="type"
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full appearance-none rounded-xl border border-neutral-900 bg-white px-4 py-2.5 pr-10 font-inter text-neutral-900/70 focus:ring-2 focus:ring-primary-500"
          >
            <option value="MATERIAL">Material</option>
            <option value="PRODUCT">Producto</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-900" />
        </div>
      </div>

      {/* Botón de Guardar */}
      <button
        type="submit"
        className="mt-2 w-fit rounded-lg bg-primary-500 px-5 py-3 font-inter text-base font-semibold text-white transition-colors hover:bg-primary-600"
      >
        Guardar categoría
      </button>
    </form>
  )
}