'use client'

/**
 * Muestra el indicador de pasos del proceso de checkout.
 * @param {('delivery'|'payment'|'confirmation')} currentStep - El paso activo.
 */
export default function CheckoutStepper({ currentStep = 'delivery' }) {
  const steps = [
    { id: 'delivery', label: 'Entrega' },
    { id: 'payment', label: 'Pago' },
    { id: 'confirmation', label: 'Confirmación' },
  ]

  return (
    <nav className="flex w-full rounded-lg">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep
        // Determina si el paso ya se completó
        const isCompleted =
          steps.findIndex((s) => s.id === currentStep) > index

        return (
          <div
            key={step.id}
            className="flex flex-1 flex-col items-center gap-2"
          >
            <span
              className={`font-inter text-lg font-medium ${
                isActive || isCompleted ? 'text-black' : 'text-neutral-500'
              }`}
            >
              {step.label}
            </span>
            <div
              className={`h-5 w-full ${
                isActive || isCompleted ? 'bg-primary-500' : 'bg-neutral-300'
              }`}
            />
          </div>
        )
      })}
    </nav>
  )
}