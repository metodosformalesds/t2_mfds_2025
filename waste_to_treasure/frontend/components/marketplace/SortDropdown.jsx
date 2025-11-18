/**
 * Autor: Arturo Perez Gonzalez
 * Fecha: 09/11/2024
 * Componente: SortDropdown
 * Descripción: Dropdown de ordenamiento para listados de materiales y productos.
 *              Actualmente soporta ordenamiento por fecha (más recientes).
 *              Diseñado para expansión cuando el backend agregue más opciones de ordenamiento.
 */

'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function SortDropdown({ onSortChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState('Más recientes')

  const options = [
    'Más recientes',
  ]

  const handleSelect = (option) => {
    setSelected(option)
    setIsOpen(false)
    onSortChange?.(option)
  }

  return (
    <div className="relative w-[200px]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border-2 border-neutral-300 bg-white px-4 py-2.5 font-inter text-base text-black transition-colors hover:border-neutral-400"
      >
        <span>{selected}</span>
        <ChevronDown
          size={24}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Overlay to close dropdown when clicking outside */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 top-full z-20 mt-1 w-full rounded-lg border border-neutral-300 bg-white shadow-lg">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                className={`w-full px-4 py-2.5 text-left font-inter text-base transition-colors hover:bg-neutral-100 first:rounded-t-lg last:rounded-b-lg ${
                  selected === option
                    ? 'bg-primary-500/10 text-primary-500'
                    : 'text-black'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
