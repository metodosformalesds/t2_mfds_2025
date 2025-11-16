/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: QuantitySelector
 * Descripción: selector numérico para ajustar cantidades de productos con unidades personalizadas (kg, litros, metros), incluye botones incrementar/decrementar, validación de rango y entrada manual con debounce
 */

'use client'

import { useState, useEffect, memo } from 'react'
import { Minus, Plus } from 'lucide-react'

/**
 * Selector para cantidades con decimales (kg, litros, metros, etc.)
 * Usado cuando el precio_unit es "kg", "L", "m", etc.
 * Solo permite edición de números enteros
 */
function QuantitySelector({
  quantity,
  onChange,
  maxQuantity = 999,
  minQuantity = 1,
  disabled = false,
  unit = 'kg',
}) {
  const [inputValue, setInputValue] = useState(String(Math.round(quantity)))

  useEffect(() => {
    setInputValue(String(Math.round(quantity)))
  }, [quantity])

  const handleInputChange = (e) => {
    const value = e.target.value
    // Solo permite dígitos enteros (sin punto decimal)
    if (value === '' || /^\d+$/.test(value)) {
      setInputValue(value)
    }
  }

  const handleInputBlur = () => {
    let numValue = parseInt(inputValue) || minQuantity
    
    // Validar límites
    if (numValue < minQuantity) numValue = minQuantity
    if (numValue > maxQuantity) numValue = maxQuantity
    
    // Solo llamar a onChange si el valor realmente cambió
    if (numValue !== quantity) {
      onChange(numValue)
    }
    
    setInputValue(String(numValue))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleInputBlur()
    }
  }

  const handleIncrease = () => {
    const newValue = Math.round(quantity) + 1
    if (newValue <= maxQuantity && !disabled) {
      onChange(newValue)
    }
  }

  const handleDecrease = () => {
    const newValue = Math.round(quantity) - 1
    if (newValue >= minQuantity && !disabled) {
      onChange(newValue)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDecrease}
        disabled={Math.round(quantity) <= minQuantity || disabled}
        className="flex h-11 w-10 items-center justify-center rounded-l-lg bg-neutral-200 text-neutral-900 transition hover:bg-neutral-300 disabled:opacity-50"
        aria-label="Reducir cantidad"
      >
        <Minus size={16} />
      </button>
      <div className="flex h-11 w-14 items-center justify-center rounded-none border-t border-b border-neutral-300 bg-white px-2">
        <input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={String(minQuantity)}
          className="w-full text-center font-roboto text-sm font-bold text-black outline-none disabled:bg-neutral-100"
          aria-label={`Cantidad en ${unit}`}
        />
      </div>
      <button
        onClick={handleIncrease}
        disabled={Math.round(quantity) >= maxQuantity || disabled}
        className="flex h-11 w-10 items-center justify-center rounded-r-lg bg-neutral-200 text-neutral-900 transition hover:bg-neutral-300 disabled:opacity-50"
        aria-label="Aumentar cantidad"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}

// Memoizar componente para evitar re-renders innecesarios
export default memo(QuantitySelector, (prevProps, nextProps) => {
  return (
    prevProps.quantity === nextProps.quantity &&
    prevProps.maxQuantity === nextProps.maxQuantity &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.unit === nextProps.unit
  )
})