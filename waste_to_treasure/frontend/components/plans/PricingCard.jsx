import Link from 'next/link'
import { Check, X } from 'lucide-react'

export default function PricingCard({ plan, isAnnual }) {
  const price = isAnnual ? plan.priceAnnual : plan.priceMonthly
  const buttonHref =
    plan.name === 'Empresarial' ? '/contact' : '/register'

  const primaryButtonClasses = 'bg-primary-600 text-white hover:bg-primary-700'
  const outlineButtonClasses =
    'border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white'

  const cardBorderClasses = plan.isPopular
    ? 'border-2 border-primary-500' // Borde verde para "Pro"
    : 'border border-neutral-200' // Borde gris suave para los demás

  const currentButtonClasses =
    plan.buttonVariant === 'primary' ? primaryButtonClasses : outlineButtonClasses

  return (
    // --- INICIO DE LA CORRECCIÓN ---
    // 1. Agregamos 'h-full' para que la tarjeta se estire
    // 2. Mantenemos 'flex flex-col' para el layout interno
    // --- FIN DE LA CORRECCIÓN ---
    <div
      className={`relative flex h-full flex-col rounded-lg bg-white p-8 shadow-xl ${cardBorderClasses}`}
    >
      {/* --- INICIO DE LA CORRECCIÓN ---
        3. Quitamos 'flex-grow' de aquí para que el header no se estire
        --- FIN DE LA CORRECCIÓN ---
      */}
      <div className="text-center">
        <h3 className="font-poppins text-3xl font-semibold text-neutral-900">
          {plan.name}
        </h3>
        <p className="mt-2.5 font-inter text-lg text-neutral-600">
          {plan.description}
        </p>
        <div className="mt-6 flex items-baseline justify-center">
          <span className="font-inter text-5xl font-extrabold text-neutral-900">
            ${price}
          </span>
          <span className="ml-1 text-2xl font-semibold text-neutral-600">
            MXN
          </span>
        </div>
        <p className="mt-2.5 font-inter text-base text-neutral-500">
          {plan.priceMonthly === 0
            ? plan.priceLabel
            : isAnnual
              ? 'por mes, facturado anualmente'
              : 'por mes'}
        </p>
      </div>

      <hr className="my-6 border-neutral-200" />

      {/* Botón */}
      <Link
        href={buttonHref}
        className={`w-full rounded-lg px-4 py-3.5 text-center text-xl font-semibold transition-colors ${currentButtonClasses}`}
      >
        {plan.buttonText}
      </Link>

      {/* --- INICIO DE LA CORRECCIÓN ---
        4. Agregamos 'flex-grow' aquí. Esto empuja la lista de características
           hacia abajo, y si la tarjeta es más alta que su contenido
           (como en Básico y Empresarial), el espacio en blanco se añadirá
           automáticamente DESPUÉS de la lista de features.
        --- FIN DE LA CORRECCIÓN ---
      */}
      <ul className="mt-8 flex-grow space-y-4">
        {plan.features.map(feature => (
          <li key={feature.text} className="flex items-start gap-4">
            {feature.included ? (
              <Check className="h-6 w-6 flex-shrink-0 text-primary-500" />
            ) : (
              <X className="h-6 w-6 flex-shrink-0 text-neutral-400" />
            )}
            <span
              className={`font-inter text-base text-neutral-700 ${
                feature.bold ? 'font-bold' : 'font-medium'
              }`}
            >
              {feature.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}