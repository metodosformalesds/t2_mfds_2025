'use client'

import { Trash2 } from 'lucide-react'

/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: PaymentMethodCard
 * Descripción: tarjeta seleccionable para métodos de pago que muestra icono, título, descripción y estado de selección, con soporte para botón de eliminar tarjeta
 */

'use client'
/* Lines 2-4 omitted */

/**
 * Tarjeta seleccionable para un método de pago.
 * @param {Object} props
 * @param {React.ReactNode} props.icon - El icono a mostrar (ej. CreditCard)
 * @param {string} props.title - "Tarjeta de crédito o débito"
 * @param {string} props.description - "No hay tarjetas registradas"
 * @param {boolean} props.isSelected - Si está activo
 * @param {Function} props.onSelect - Callback al hacer clic
 * @param {boolean} [props.isDisabled=false] - Si está deshabilitado
 * @param {Function} [props.onDelete] - (Opcional) Callback para mostrar botón de eliminar
 */
export default function PaymentMethodCard({
  icon: Icon,
  title,
  description,
  isSelected,
  onSelect,
  isDisabled = false,
  onDelete, 
}) {
  
  // --- INICIO DE MODIFICACIÓN: Convertir <button> en <div> y aplicar estética invertida ---
  return (
    <div
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      onClick={isDisabled ? undefined : onSelect}
      onKeyDown={(e) => {
        if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
          onSelect()
        }
      }}
      className={`relative flex w-full items-center gap-6 rounded-lg border-2 p-6 text-left shadow-md transition-all
        ${
          isSelected
            ? 'border-primary-500 bg-primary-500' // Fondo verde
            : 'border-neutral-200 bg-neutral-50' // Fondo gris claro
        }
        ${
          isDisabled
            ? 'opacity-60 cursor-not-allowed'
            : 'cursor-pointer hover:border-primary-500/50'
        }
      `}
    >
      {/* Radio Button */}
      <div
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 ${
          isSelected ? 'border-white' : 'border-neutral-400' // Borde blanco
        }`}
      >
        {isSelected && <div className="h-3 w-3 rounded-full bg-white" />} 
      </div>
      
      {/* Icono (Opcional) */}
      {Icon && <Icon className={`h-8 w-8 flex-shrink-0 ${isSelected ? 'text-white' : 'text-neutral-700'}`} />}
      
      {/* Texto */}
      <div>
        <h4 className={`font-roboto text-2xl font-bold ${isSelected ? 'text-white' : 'text-black'}`}>{title}</h4>
        <p className={`font-inter text-base font-medium ${isSelected ? 'text-white/90' : 'text-neutral-600'}`}>
          {description}
        </p>
      </div>

      {/* Botón Eliminar (ahora es HTML válido) */}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation() // Evitar que se seleccione la tarjeta
            onDelete()
          }}
          className={`absolute top-4 right-4 z-10 rounded-full p-2 transition-colors
            ${isSelected ? 'text-white/70 hover:bg-white/20 hover:text-white' : 'text-neutral-500 hover:bg-red-100 hover:text-red-600'}
          `}
          aria-label="Eliminar método de pago"
        >
          <Trash2 size={18} />
        </button>
      )}
    </div>
  )
  // --- FIN DE MODIFICACIÓN ---
}