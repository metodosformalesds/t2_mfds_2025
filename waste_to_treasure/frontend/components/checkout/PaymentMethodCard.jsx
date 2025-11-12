'use client'

/**
 * Tarjeta seleccionable para un método de pago.
 * @param {Object} props
 * @param {React.ReactNode} props.icon - El icono a mostrar (ej. CreditCard)
 * @param {string} props.title - "Tarjeta de crédito o débito"
 * @param {string} props.description - "No hay tarjetas registradas"
 * @param {boolean} props.isSelected - Si está activo
 * @param {Function} props.onSelect - Callback al hacer clic
 * @param {boolean} [props.isDisabled=false] - Si está deshabilitado
 */
export default function PaymentMethodCard({
  icon: Icon,
  title,
  description,
  isSelected,
  onSelect,
  isDisabled = false,
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isDisabled}
      className={`flex w-full items-center gap-6 rounded-lg border-2 bg-neutral-50 p-6 text-left shadow-md transition-all
        ${
          isSelected
            ? 'border-primary-500 ring-2 ring-primary-500/20'
            : 'border-neutral-200 hover:border-neutral-400'
        }
        ${
          isDisabled
            ? 'opacity-60 cursor-not-allowed'
            : 'cursor-pointer'
        }
      `}
    >
      {/* Radio Button */}
      <div
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 ${
          isSelected ? 'border-primary-500' : 'border-neutral-400'
        }`}
      >
        {isSelected && <div className="h-3 w-3 rounded-full bg-primary-500" />}
      </div>
      
      {/* Icono (Opcional) */}
      {Icon && <Icon className="h-8 w-8 flex-shrink-0 text-neutral-700" />}
      
      {/* Texto */}
      <div>
        <h4 className="font-roboto text-2xl font-bold text-black">{title}</h4>
        <p className="font-inter text-base font-medium text-neutral-600">
          {description}
        </p>
      </div>
    </button>
  )
}