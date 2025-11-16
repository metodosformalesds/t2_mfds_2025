'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/useAdminGuard'
import { plansService } from '@/lib/api/plans'
import SubscriptionPlanCard from '@/components/plans/SubscriptionPlanCard'

export default function SubscriptionSelectPage() {
  const { isAuthorized, isLoading: isAuthLoading } = useAuthGuard()
  const router = useRouter()
  
  const [plans, setPlans] = useState([])
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isAuthorized) return

    const loadPlans = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await plansService.getAvailablePlans()
        
        // Filtrar el plan gratuito (se asigna automáticamente al crear cuenta)
        const paidPlans = (response.items || []).filter(p => parseFloat(p.price) > 0)
        setPlans(paidPlans)
        
        // Pre-seleccionar el plan "Pro" si existe
        const proPlan = paidPlans.find(p => p.name.toLowerCase().includes('pro'))
        if (proPlan) {
          setSelectedPlanId(proPlan.plan_id)
        }
      } catch (err) {
        console.error('Error al cargar planes:', err)
        setError('No se pudieron cargar los planes. Intenta de nuevo.')
      } finally {
        setIsLoading(false)
      }
    }

    loadPlans()
  }, [isAuthorized])

  const handleSelectPlan = (planId) => {
    // Guardar el plan seleccionado en sessionStorage y continuar al pago
    const selectedPlan = plans.find(p => p.plan_id === planId)
    sessionStorage.setItem('selectedSubscriptionPlan', JSON.stringify(selectedPlan))
    router.push('/dashboard/subscription/payment')
  }

  if (isAuthLoading || !isAuthorized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="mb-10 text-center">
          <h1 className="font-poppins text-5xl font-bold text-black">
            Elige tu Plan de Suscripción
          </h1>
          <p className="mt-4 font-inter text-lg text-neutral-700">
            Selecciona el plan que mejor se adapte a tus necesidades
          </p>
        </div>

        {/* Contenido */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-red-600 px-6 py-2 text-white hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            {/* Grid de planes */}
            <div className="grid gap-8 md:grid-cols-2">
              {plans.map((plan, index) => (
                <SubscriptionPlanCard
                  key={plan.plan_id}
                  plan={plan}
                  isSelected={selectedPlanId === plan.plan_id}
                  onSelect={() => handleSelectPlan(plan.plan_id)}
                  isPopular={plan.name.toLowerCase().includes('pro')} // El plan Pro es el más popular
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
