'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/useAdminGuard'
import { useSubscription } from '@/hooks/useSubscription'
import { useConfirmStore } from '@/stores/useConfirmStore'
import SubscriptionCardForm from '@/components/checkout/SubscriptionCardForm'
import PaymentMethodCard from '@/components/checkout/PaymentMethodCard'
import { CreditCard, Plus, Check } from 'lucide-react'

export default function SubscriptionPaymentPage() {
  const { isAuthorized, isLoading: isAuthLoading } = useAuthGuard()
  const router = useRouter()
  const { subscribe } = useSubscription(false)
  const openConfirmModal = useConfirmStore(state => state.open)

  const [selectedPlan, setSelectedPlan] = useState(null)
  const [paymentMethodId, setPaymentMethodId] = useState(null)
  const [savedCard, setSavedCard] = useState(null)
  const [isAddCardVisible, setIsAddCardVisible] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Cargar el plan seleccionado desde sessionStorage
  useEffect(() => {
    if (!isAuthorized) return

    const planData = sessionStorage.getItem('selectedSubscriptionPlan')
    if (!planData) {
      router.push('/dashboard/subscription/select')
      return
    }

    try {
      const plan = JSON.parse(planData)
      setSelectedPlan(plan)
    } catch (error) {
      console.error('Error al cargar plan:', error)
      router.push('/dashboard/subscription/select')
    }

    // Si no hay tarjeta guardada, mostrar formulario
    if (!savedCard) {
      setIsAddCardVisible(true)
    }
  }, [isAuthorized, router, savedCard])

  // Sincronizar la selección si hay una tarjeta guardada
  useEffect(() => {
    if (!paymentMethodId && savedCard) {
      setPaymentMethodId(savedCard.id)
    }
  }, [savedCard, paymentMethodId])

  const handleSaveCard = async (tokenId, last4) => {
    setIsAddCardVisible(false)
    setIsProcessing(true)
    const startTime = Date.now()

    try {
      // Simular guardado de tarjeta
      await new Promise(resolve => setTimeout(resolve, 500))

      const newCard = {
        id: tokenId,  // Ahora es el token ID (tok_xxx)
        last4: last4,
      }

      // Timer de 2 segundos
      const elapsedTime = Date.now() - startTime
      if (elapsedTime < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - elapsedTime))
      }

      setSavedCard(newCard)
      setPaymentMethodId(newCard.id)
      setIsProcessing(false)

      openConfirmModal(
        'Tarjeta Validada',
        `Tu tarjeta terminada en ${last4} ha sido validada correctamente.`,
        () => {},
        { danger: false, confirmText: 'Continuar' }
      )
    } catch (error) {
      const elapsedTime = Date.now() - startTime
      if (elapsedTime < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - elapsedTime))
      }
      setIsProcessing(false)

      openConfirmModal(
        'Error al Validar Tarjeta',
        `No se pudo validar tu método de pago. ${error.message || 'Intenta de nuevo.'}`,
        () => {},
        { danger: true, confirmText: 'Entendido' }
      )
    }
  }

  const handleDeleteCard = () => {
    openConfirmModal(
      'Eliminar Tarjeta',
      `¿Estás seguro de que deseas eliminar la tarjeta que termina en **** ${savedCard.last4}?`,
      () => {
        setSavedCard(null)
        setPaymentMethodId(null)
        setIsAddCardVisible(true)
      },
      { danger: true, confirmText: 'Eliminar' }
    )
  }

  const handleSubscribe = async () => {
    if (!paymentMethodId || !savedCard) {
      openConfirmModal(
        'Método de Pago Requerido',
        'Por favor, agrega y selecciona un método de pago antes de continuar.',
        () => { setIsAddCardVisible(true) },
        { danger: true, confirmText: 'Entendido' }
      )
      return
    }

    if (!selectedPlan) {
      openConfirmModal(
        'Plan no Seleccionado',
        'No se ha seleccionado ningún plan. Por favor, selecciona un plan.',
        () => { router.push('/dashboard/subscription/select') },
        { danger: true, confirmText: 'Volver a Planes' }
      )
      return
    }

    setIsProcessing(true)

    try {
      // Llamar al servicio de suscripción con payment_token
      await subscribe(selectedPlan.plan_id, paymentMethodId)

      // Limpiar sessionStorage y tarjeta guardada
      sessionStorage.removeItem('selectedSubscriptionPlan')
      setSavedCard(null)
      setPaymentMethodId(null)

      setIsProcessing(false)

      // Mostrar modal de éxito
      openConfirmModal(
        '¡Suscripción Activada!',
        `Te has suscrito exitosamente al plan ${selectedPlan.name}. Tu suscripción está activa.`,
        () => {
          router.push('/dashboard/subscription')
        },
        { danger: false, confirmText: 'Ver Mi Suscripción' }
      )
    } catch (error) {
      setIsProcessing(false)

      openConfirmModal(
        'Error al Procesar Suscripción',
        error.message || 'No se pudo procesar tu suscripción. Intenta de nuevo.',
        () => {},
        { danger: true, confirmText: 'Entendido' }
      )
    }
  }

  if (isAuthLoading || !isAuthorized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!selectedPlan) {
    return null
  }

  const billingCycleText = {
    monthly: 'mes',
    quarterly: 'trimestre',
    yearly: 'año',
  }[selectedPlan.billing_cycle] || 'mes'

  return (
    <div className="min-h-screen bg-neutral-100 py-12">
      {/* Modal de Carga */}
      {isProcessing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-8 shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            <p className="font-semibold text-neutral-700">Procesando suscripción...</p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="mb-10">
          <h1 className="font-poppins text-5xl font-bold text-black">
            Método de Pago
          </h1>
          <p className="font-inter text-lg font-medium text-neutral-700 mt-5">
            Completa tu suscripción con un método de pago seguro
          </p>
        </div>

        {/* Contenido */}
        <div className="flex flex-col items-start gap-8 lg:flex-row">
          {/* Columna Izquierda: Método de Pago */}
          <div className="w-full lg:flex-[4] rounded-lg bg-white p-8 shadow-2xl">
            <h2 className="border-b border-neutral-300 pb-4 font-poppins text-3xl font-semibold text-black">
              Tu tarjeta de pago
            </h2>

            <div className="mt-6 space-y-4">
              {/* Mostrar la tarjeta guardada si existe */}
              {savedCard ? (
                <PaymentMethodCard
                  key={savedCard.id}
                  icon={CreditCard}
                  title="Tarjeta de crédito o débito"
                  description={`Terminación **** ${savedCard.last4}`}
                  isSelected={paymentMethodId === savedCard.id}
                  onSelect={() => setPaymentMethodId(savedCard.id)}
                  onDelete={handleDeleteCard}
                />
              ) : (
                !isAddCardVisible && (
                  <PaymentMethodCard
                    icon={CreditCard}
                    title="Tarjeta de crédito o débito"
                    description="No hay tarjetas registradas"
                    isSelected={false}
                    onSelect={() => setIsAddCardVisible(true)}
                    isDisabled={true}
                  />
                )
              )}

              {/* Botón para agregar nueva tarjeta */}
              {!isAddCardVisible && (
                <button
                  onClick={() => setIsAddCardVisible(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-400 p-6 text-neutral-600 transition hover:border-primary-500 hover:text-primary-500"
                >
                  <Plus size={20} />
                  <span className="font-roboto text-xl font-bold">
                    {savedCard ? 'Usar otra tarjeta' : 'Agregar nueva tarjeta'}
                  </span>
                </button>
              )}

              {/* Formulario para agregar tarjeta */}
              {isAddCardVisible && (
                <SubscriptionCardForm
                  onSave={handleSaveCard}
                  onCancel={savedCard ? () => setIsAddCardVisible(false) : undefined}
                />
              )}
            </div>
          </div>

          {/* Columna Derecha: Resumen */}
          <div className="w-full lg:w-72 lg:flex-shrink-0">
            <div className="rounded-lg bg-white p-6 shadow-2xl">
              <h2 className="border-b border-neutral-300 pb-4 font-poppins text-xl font-semibold text-black">
                Resumen de Suscripción
              </h2>

              <div className="mt-6 space-y-4">
                {/* Plan seleccionado */}
                <div>
                  <p className="text-sm font-medium text-neutral-600">Plan seleccionado</p>
                  <p className="font-roboto text-xl font-bold text-black">{selectedPlan.name}</p>
                </div>

                {/* Precio */}
                <div className="flex items-baseline justify-between border-t border-neutral-200 pt-4">
                  <p className="text-sm font-medium text-neutral-600">Total a pagar</p>
                  <div className="text-right">
                    <p className="font-poppins text-3xl font-bold text-primary-500">
                      ${parseFloat(selectedPlan.price).toFixed(2)}
                    </p>
                    <p className="text-sm text-neutral-600">/ {billingCycleText}</p>
                  </div>
                </div>

                {/* Características destacadas */}
                <div className="border-t border-neutral-200 pt-4">
                  <p className="mb-2 text-sm font-medium text-neutral-600">Incluye:</p>
                  <ul className="space-y-2">
                    {(() => {
                      const features = selectedPlan.features_json
                      const parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features
                      return parsedFeatures?.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-500" />
                          <span className="text-sm text-neutral-700">{feature}</span>
                        </li>
                      ))
                    })()}
                  </ul>
                </div>
              </div>

              {/* Botón de suscribirse */}
              <button
                onClick={handleSubscribe}
                disabled={!paymentMethodId || !savedCard}
                className="mt-6 w-full rounded-lg bg-primary-500 py-4 font-roboto text-lg font-bold text-white transition hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Suscripción
              </button>

              {/* Botón de volver */}
              <button
                onClick={() => router.push('/dashboard/subscription/select')}
                className="mt-4 w-full rounded-lg border-2 border-neutral-300 py-3 font-roboto text-base font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                ← Cambiar Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
