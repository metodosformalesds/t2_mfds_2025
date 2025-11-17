/**
 * Autor: Arturo Perez Gonzalez
 * Fecha: 09/11/2024
 * Componente: Checkbox
 * Descripción: Componente de checkbox reutilizable para filtros y formularios.
 *              Incluye label, estado checked/unchecked, contador opcional y callback onChange.
 *              Implementa accesibilidad con ARIA.
 */

'use client'

import { Check } from 'lucide-react'

export default function Checkbox({ checked = false, onChange, label, count }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={onChange}
        className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
          checked
            ? 'border-black bg-primary-500'
            : 'border-black bg-white hover:bg-gray-50'
        }`}
      >
        {checked && (
          <Check size={14} className="text-white" strokeWidth={3} />
        )}
      </button>
      <span className="flex-1 font-inter text-base text-black">
        {label}
      </span>
      {count !== undefined && (
        <span className="font-inter text-base text-black/60">
          ({count})
        </span>
      )}
    </label>
  )
}
