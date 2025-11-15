'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function PricingCard({ plan, isAnnual }) {
  const router = useRouter()
  const { user } = useAuth()
  const price = isAnnual ? plan.priceAnnual : plan.priceMonthly
  
  // Si el usuario está autenticado y no es el plan gratuito, ir al flujo de suscripción
  const shouldUseSubscriptionFlow = user && plan.priceMonthly > 0
  const buttonHref = shouldUseSubscriptionFlow 
    ? '/dashboard/subscription/select' 
    : (plan.buttonHref || '/register')

  const primaryButtonClasses = 'bg-primary-600 text-white hover:bg-primary-700'
  const outlineButtonClasses =
    'border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white'

  const cardBorderClasses = plan.isPopular
    ? 'border-2 border-primary-500'
    : 'border border-neutral-200'

  const currentButtonClasses =
    plan.buttonVariant === 'primary' ? primaryButtonClasses : outlineButtonClasses

  const handleClick = (e) => {
    // Para planes de pago cuando el usuario está autenticado
    if (shouldUseSubscriptionFlow) {
      e.preventDefault()
      router.push(buttonHref)
    }
  }

  return (
    <div
      className={`relative flex h-full flex-col rounded-lg bg-white p-8 shadow-xl ${cardBorderClasses}`}
    >
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
        onClick={handleClick}
        className={`w-full rounded-lg px-4 py-3.5 text-center text-xl font-semibold transition-colors ${currentButtonClasses}`}
      >
        {shouldUseSubscriptionFlow ? 'Suscribirse' : plan.buttonText}
      </Link>

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
