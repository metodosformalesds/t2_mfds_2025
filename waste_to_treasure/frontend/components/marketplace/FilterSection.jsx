/**
 * Autor: Arturo Perez Gonzalez
 * Fecha: 09/11/2024
 * Componente: FilterSection
 * Descripción: Panel lateral de filtros para catálogo de materiales y productos.
 *              Actualmente implementa filtros de precio por rangos. Notifica cambios
 *              al componente padre mediante callback. Diseñado para expansión futura.
 */

'use client'

import { useState } from 'react'
import Checkbox from '@/components/ui/Checkbox'

export default function FilterSection({ onFiltersChange }) {
  const [filters, setFilters] = useState({
    price: {
      gratis: false,
      lessThan50: false,
      between50And200: false,
      moreThan200: false,
    },
  })

  const handleFilterChange = (category, key) => {
    const newFilters = {
      ...filters,
      [category]: {
        ...filters[category],
        [key]: !filters[category][key],
      },
    }
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }

  return (
    <div className="flex w-full max-w-[400px] flex-col gap-5 rounded-lg bg-neutral-50 p-6 shadow-md">
      <h2 className="font-roboto text-lg font-semibold text-black">
        Filtros
      </h2>

      {/* Precio */}
      <div className="flex flex-col gap-2.5">
        <h3 className="font-roboto text-base font-medium text-black">
          Precio
        </h3>
        <Checkbox
          checked={filters.price.gratis}
          onChange={() => handleFilterChange('price', 'gratis')}
          label="Gratis"
        />
        <Checkbox
          checked={filters.price.lessThan50}
          onChange={() => handleFilterChange('price', 'lessThan50')}
          label="Menos de $50/kg"
        />
        <Checkbox
          checked={filters.price.between50And200}
          onChange={() => handleFilterChange('price', 'between50And200')}
          label="$50 - $200/kg"
        />
        <Checkbox
          checked={filters.price.moreThan200}
          onChange={() => handleFilterChange('price', 'moreThan200')}
          label="Más de $200/kg"
        />
      </div>
    </div>
  )
}
