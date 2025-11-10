'use client'

import { useState } from 'react'
import Checkbox from '@/components/ui/Checkbox'

/**
 * FilterSection component for materials catalog filtering
 */
export default function FilterSection({ onFiltersChange }) {
  const [filters, setFilters] = useState({
    materialTypes: {
      metal: true,
      madera: true,
      plastico: false,
      textil: false,
      vidrio: false,
    },
    price: {
      gratis: true,
      lessThan50: true,
      between50And200: false,
      moreThan200: false,
    },
    condition: {
      excelente: true,
      buena: true,
      regular: false,
    },
    quantity: {
      lessThan100: true,
      between100And500: true,
      between500And1000: false,
      moreThan1000: false,
    },
    transport: {
      yes: true,
      no: true,
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

      {/* Tipo de Material */}
      <div className="flex flex-col gap-2.5">
        <h3 className="font-roboto text-base font-medium text-black">
          Tipo de Material
        </h3>
        <Checkbox
          checked={filters.materialTypes.metal}
          onChange={() => handleFilterChange('materialTypes', 'metal')}
          label="Metal"
          count={45}
        />
        <Checkbox
          checked={filters.materialTypes.madera}
          onChange={() => handleFilterChange('materialTypes', 'madera')}
          label="Madera"
          count={45}
        />
        <Checkbox
          checked={filters.materialTypes.plastico}
          onChange={() => handleFilterChange('materialTypes', 'plastico')}
          label="Plástico"
          count={45}
        />
        <Checkbox
          checked={filters.materialTypes.textil}
          onChange={() => handleFilterChange('materialTypes', 'textil')}
          label="Textil"
          count={45}
        />
        <Checkbox
          checked={filters.materialTypes.vidrio}
          onChange={() => handleFilterChange('materialTypes', 'vidrio')}
          label="Vidrio"
          count={45}
        />
      </div>

      {/* Precio */}
      <div className="flex flex-col gap-2.5">
        <h3 className="font-roboto text-base font-medium text-black">
          Precio
        </h3>
        <Checkbox
          checked={filters.price.gratis}
          onChange={() => handleFilterChange('price', 'gratis')}
          label="Gratis"
          count={45}
        />
        <Checkbox
          checked={filters.price.lessThan50}
          onChange={() => handleFilterChange('price', 'lessThan50')}
          label="Menos de $50/kg"
          count={45}
        />
        <Checkbox
          checked={filters.price.between50And200}
          onChange={() => handleFilterChange('price', 'between50And200')}
          label="$50 - $200/kg"
          count={45}
        />
        <Checkbox
          checked={filters.price.moreThan200}
          onChange={() => handleFilterChange('price', 'moreThan200')}
          label="Más de $200/kg"
          count={45}
        />
      </div>

      {/* Condición */}
      <div className="flex flex-col gap-2.5">
        <h3 className="font-roboto text-base font-medium text-black">
          Condición
        </h3>
        <Checkbox
          checked={filters.condition.excelente}
          onChange={() => handleFilterChange('condition', 'excelente')}
          label="Excelente (A)"
          count={45}
        />
        <Checkbox
          checked={filters.condition.buena}
          onChange={() => handleFilterChange('condition', 'buena')}
          label="Buena (B)"
          count={45}
        />
        <Checkbox
          checked={filters.condition.regular}
          onChange={() => handleFilterChange('condition', 'regular')}
          label="Regular (C)"
          count={45}
        />
      </div>

      {/* Cantidad Disponible */}
      <div className="flex flex-col gap-2.5">
        <h3 className="font-roboto text-base font-medium text-black">
          Cantidad Disponible
        </h3>
        <Checkbox
          checked={filters.quantity.lessThan100}
          onChange={() => handleFilterChange('quantity', 'lessThan100')}
          label="Menos de 100kg"
          count={45}
        />
        <Checkbox
          checked={filters.quantity.between100And500}
          onChange={() => handleFilterChange('quantity', 'between100And500')}
          label="100 - 500kg"
          count={45}
        />
        <Checkbox
          checked={filters.quantity.between500And1000}
          onChange={() => handleFilterChange('quantity', 'between500And1000')}
          label="500kg - 1 ton"
          count={45}
        />
        <Checkbox
          checked={filters.quantity.moreThan1000}
          onChange={() => handleFilterChange('quantity', 'moreThan1000')}
          label="Más de 1 ton"
          count={45}
        />
      </div>

      {/* Transporte Incluido */}
      <div className="flex flex-col gap-2.5">
        <h3 className="font-roboto text-base font-medium text-black">
          Transporte Incluido
        </h3>
        <Checkbox
          checked={filters.transport.yes}
          onChange={() => handleFilterChange('transport', 'yes')}
          label="Si"
          count={45}
        />
        <Checkbox
          checked={filters.transport.no}
          onChange={() => handleFilterChange('transport', 'no')}
          label="No"
          count={45}
        />
      </div>
    </div>
  )
}
