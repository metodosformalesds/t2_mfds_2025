'use client'

import { Check } from 'lucide-react'

/**
 * Tarjeta de plan de suscripción para el flujo de compra
 * @param {Object} props
 * @param {Object} props.plan - Datos del plan
 * @param {boolean} props.isSelected - Si el plan está seleccionado
 * @param {Function} props.onSelect - Callback cuando se selecciona el plan
 * @param {boolean} props.isPopular - Si el plan es el más popular
 */
export default function SubscriptionPlanCard({ plan, isSelected, onSelect, isPopular = false }) {
  const parseFeatures = (features) => {
    if (!features) return []
    if (typeof features === 'string') {
      try {
        return JSON.parse(features)
      } catch {
        return []
      }
    }
    return features
  }

  const features = parseFeatures(plan.features_json)
  const billingCycleText = {
    monthly: 'mes',
    quarterly: 'trimestre',
    yearly: 'año',
  }[plan.billing_cycle] || 'mes'

  return (
    <div
      className={`relative flex flex-col rounded-lg border-2 bg-white p-6 shadow-lg transition-all ${
        isSelected
          ? 'border-primary-500 ring-4 ring-primary-500/20'
          : 'border-neutral-200 hover:border-primary-300'
      }`}
    >
      {/* Badge de popular */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-secondary-600 px-4 py-1 text-sm font-bold text-white">
          MÁS POPULAR
        </div>
      )}

      {/* Encabezado del plan */}
      <div className="mb-4">
        <h3 className="font-poppins text-2xl font-bold text-black">{plan.name}</h3>
        <div className="mt-2">
          <span className="font-poppins text-4xl font-bold text-primary-500">
            ${parseFloat(plan.price).toFixed(0)}
          </span>
          <span className="ml-2 font-inter text-lg text-neutral-600">
            / {billingCycleText}
          </span>
        </div>
      </div>

      {/* Características */}
      <ul className="mb-6 flex-1 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-500" />
            <span className="font-inter text-sm text-neutral-700">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Botón de selección */}
      <button
        onClick={onSelect}
        className="w-full rounded-lg py-3 font-roboto text-base font-bold transition-all bg-primary-500 text-white hover:bg-primary-600"
      >
        Elegir Este Plan
      </button>
    </div>
  )
}
