'use client'

import { useState } from 'react'
import PricingCard from './PricingCard'

// Datos de los planes (igual que antes)
const plans = [
  {
    name: 'Básico',
    description: 'Para comenzar en la economía circular',
    priceMonthly: 0,
    priceAnnual: 0,
    priceLabel: 'Gratis para siempre',
    buttonText: 'COMENZAR GRATIS',
    buttonVariant: 'outline',
    isPopular: false,
    features: [
      { text: 'Hasta 5 publicaciones activas', included: true },
      { text: 'Acceso al marketplace', included: true },
      { text: 'Búsqueda básica de materiales', included: true },
      { text: 'Comisión estándar del 10%', included: true },
      { text: 'Soporte por email', included: true },
      { text: 'Sin visibilidad destacada', included: false },
      { text: 'Sin métricas avanzadas', included: false },
    ],
  },
  {
    name: 'Pro',
    description: 'Para artesanos y talleres activos',
    priceMonthly: 149,
    priceAnnual: 119, // Precio con descuento anual
    priceLabel: 'por mes',
    buttonText: 'COMENZAR PRUEBA GRATUITA',
    buttonVariant: 'primary',
    isPopular: true,
    features: [
      { text: 'Publicaciones ilimitadas', included: true, bold: true },
      { text: 'Visibilidad destacada en búsquedas', included: true },
      { text: 'Métricas básicas de rendimiento', included: true },
      { text: 'Comisión reducida del 8%', included: true },
      { text: 'Soporte prioritario por chat', included: true },
    ],
  },
  {
    name: 'Empresarial',
    description: 'Para empresas y maquiladoras',
    priceMonthly: 299,
    priceAnnual: 239, // Precio con descuento anual
    priceLabel: 'por mes',
    buttonText: 'CONTACTAR VENTAS',
    buttonVariant: 'primary',
    isPopular: false,
    features: [
      { text: 'Todo lo incluido en Pro', included: true, bold: true },
      { text: 'Reportes de impacto ambiental', included: true },
      { text: 'Métricas avanzadas y analytics', included: true },
      { text: 'Account manager dedicado', included: true },
      { text: 'Comisión preferente del 6%', included: true },
    ],
  },
]

export default function PlansHeader() {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <>
      {/* Fondo verde con título y toggle */}
      <div className="w-full overflow-hidden rounded-b-lg bg-primary-500 px-4 py-16 text-center text-white shadow-lg">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-poppins text-5xl font-bold">Planes y Precios</h1>
          <p className="mt-5 font-inter text-lg font-medium">
            Elige el plan que mejor se adapte a tus necesidades y comienza a
            formar parte de la economía circular en Ciudad Juárez
          </p>
        </div>

        {/* Toggle Mensual/Anual */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <span
            className={`font-roboto text-xl font-bold ${
              !isAnnual ? 'text-white' : 'text-neutral-300'
            }`}
          >
            Mensual
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            aria-pressed={isAnnual}
            className={`relative flex h-9 w-16 items-center rounded-full bg-neutral-500/50 p-1 transition-colors ${
              isAnnual ? 'bg-primary-500' : ''
            }`}
          >
            <span
              className={`h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition-transform ${
                isAnnual ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
          <span
            className={`font-roboto text-xl font-bold ${
              isAnnual ? 'text-white' : 'text-neutral-300'
            }`}
          >
            Anual
          </span>
          <div className="hidden rounded-full bg-secondary-600 px-3 py-1 text-sm font-bold text-white sm:block">
            Ahorra 20%
          </div>
        </div>
      </div>

      {/* Sección de Tarjetas de Precios */}
      <div className="mx-auto max-w-7xl -mt-16 transform px-4 pb-20 py-32">
        {/*
          --- INICIO DE LA CORRECCIÓN ---
          Eliminamos 'items-start'. 
          Por defecto, los items de un grid se "estiran" (stretch) para ocupar 
          la misma altura, que es lo que queremos.
          --- FIN DE LA CORRECCIÓN ---
        */}
        <div className="grid gap-8 md:grid-cols-3">
          {plans.map(plan => (
            <PricingCard key={plan.name} plan={plan} isAnnual={isAnnual} />
          ))}
        </div>
      </div>
    </>
  )
}