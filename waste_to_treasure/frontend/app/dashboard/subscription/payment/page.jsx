'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/useAdminGuard'
import { useSubscription } from '@/hooks/useSubscription'
import { useConfirmStore } from '@/stores/useConfirmStore'
import { useCheckoutStore } from '@/stores/useCheckoutStore'
import AddCreditCardForm from '@/components/checkout/AddCreditCardForm'
import PaymentMethodCard from '@/components/checkout/PaymentMethodCard'
import { paymentsService } from '@/lib/api/payments'
import { CreditCard, Plus, Check } from 'lucide-react'

export default function SubscriptionPaymentPage() {
  const { isAuthorized, isLoading: isAuthLoading } = useAuthGuard()
  const router = useRouter()
  const { subscribe } = useSubscription(false)
  const openConfirmModal = useConfirmStore(state => state.open)

  // Usar el store compartido de checkout para las tarjetas
  const {
    paymentMethodId,
    setPaymentMethod,
    savedCard,
    setSavedCard,
    clearSavedCard
  } = useCheckoutStore()

  const [savedCards, setSavedCards] = useState([])
  const [isLoadingCards, setIsLoadingCards] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCardLoading, setIsCardLoading] = useState(false)

  // Initialize isAddCardVisible based on whether we have saved cards
  const [isAddCardVisible, setIsAddCardVisible] = useState(false)

  // Cargar el plan seleccionado desde sessionStorage usando lazy initialization
  const [selectedPlan, setSelectedPlan] = useState(() => {
    if (typeof window === 'undefined') return null
    const planData = sessionStorage.getItem('selectedSubscriptionPlan')
    if (!planData) return null
    try {
      return JSON.parse(planData)
    } catch (error) {
      console.error('Error al cargar plan:', error)
      return null
    }
  })

  // Cargar tarjetas guardadas al montar el componente
  useEffect(() => {
    if (!isAuthorized) return

    const loadSavedCards = async () => {
      try {
        setIsLoadingCards(true)
        const cards = await paymentsService.listPaymentMethods()
        setSavedCards(cards)

        // Si hay tarjetas y hay una seleccionada en el store, verificar que existe
        if (cards.length > 0) {
          if (savedCard) {
            const cardExists = cards.find(c => c.id === savedCard.id)
            if (cardExists) {
              // La tarjeta guardada en el store existe en Stripe
              setPaymentMethod(savedCard.id)
            } else {
              // La tarjeta del store ya no existe, seleccionar la primera disponible
              const firstCard = cards[0]
              const newCard = {
                id: firstCard.id,
                last4: firstCard.card.last4,
                brand: firstCard.card.brand
              }
              setSavedCard(newCard)
              setPaymentMethod(firstCard.id)
            }
          } else {
            // No hay tarjeta seleccionada, seleccionar la primera
            const firstCard = cards[0]
            const newCard = {
              id: firstCard.id,
              last4: firstCard.card.last4,
              brand: firstCard.card.brand
            }
            setSavedCard(newCard)
            setPaymentMethod(firstCard.id)
          }
        } else {
          // No hay tarjetas guardadas, mostrar formulario
          setIsAddCardVisible(true)
        }
      } catch (error) {
        console.error('Error cargando tarjetas:', error)
        setIsAddCardVisible(true)
      } finally {
        setIsLoadingCards(false)
      }
    }

    loadSavedCards()
  }, [isAuthorized])

  // Cargar el plan y verificar autorización
  useEffect(() => {
    if (!isAuthorized) return

    if (!selectedPlan) {
      router.push('/dashboard/subscription/select')
    }
  }, [isAuthorized, router, selectedPlan])

  const handleSaveCard = async (paymentMethodId, last4, brand) => {
    // Verificar si la tarjeta ya existe
    const cardExists = savedCards.find(c => c.card.last4 === last4)
    if (cardExists) {
      openConfirmModal(
        'Tarjeta ya Guardada',
        `La tarjeta que termina en **** ${last4} ya está guardada como tu método de pago.`,
        () => {
          const newCard = {
            id: cardExists.id,
            last4: cardExists.card.last4,
            brand: cardExists.card.brand
          }
          setSavedCard(newCard)
          setPaymentMethod(cardExists.id)
          setIsAddCardVisible(false)
        },
        { danger: false, confirmText: 'Usar esta tarjeta' }
      )
      return
    }

    setIsAddCardVisible(false)
    setIsCardLoading(true)
    const startTime = Date.now()

    try {
      // El PaymentMethod ya está guardado en Stripe gracias al SetupIntent
      // Solo necesitamos guardarlo en el estado local
      const newCard = {
        id: paymentMethodId,
        last4: last4,
        brand: brand,
      }

      // Timer de 2 segundos para UX
      const elapsedTime = Date.now() - startTime
      if (elapsedTime < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - elapsedTime))
      }

      setIsCardLoading(false)

      // Guardar en el store y actualizar la lista
      setSavedCard(newCard)
      setPaymentMethod(newCard.id)

      // Recargar la lista de tarjetas desde Stripe
      const cards = await paymentsService.listPaymentMethods()
      setSavedCards(cards)

      openConfirmModal(
        'Tarjeta Validada',
        `Tu tarjeta ${brand.toUpperCase()} terminada en ${last4} ha sido validada correctamente.`,
        () => {},
        { danger: false, confirmText: 'Continuar' }
      )
    } catch (error) {
      const elapsedTime = Date.now() - startTime
      if (elapsedTime < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - elapsedTime))
      }
      setIsCardLoading(false)

      const errorMessage = error.response?.data?.detail || error.message || 'Intenta de nuevo.'
      openConfirmModal(
        'Error al Validar Tarjeta',
        `No se pudo validar tu método de pago. ${errorMessage}`,
        () => {},
        { danger: true, confirmText: 'Entendido' }
      )
    }
  }

  const handleSelectCard = (card) => {
    const selectedCard = {
      id: card.id,
      last4: card.card.last4,
      brand: card.card.brand
    }
    setSavedCard(selectedCard)
    setPaymentMethod(card.id)
  }

  const handleDeleteCard = (cardId, last4) => {
    openConfirmModal(
      'Eliminar Tarjeta',
      `¿Estás seguro de que deseas eliminar la tarjeta que termina en **** ${last4}?`,
      async () => {
        setIsCardLoading(true)
        try {
          // Eliminar la tarjeta en Stripe
          await paymentsService.deletePaymentMethod(cardId)

          // Actualizar el estado local
          const updatedCards = savedCards.filter(c => c.id !== cardId)
          setSavedCards(updatedCards)

          // Si la tarjeta eliminada era la seleccionada
          if (savedCard?.id === cardId) {
            if (updatedCards.length > 0) {
              // Seleccionar la primera tarjeta disponible
              const firstCard = updatedCards[0]
              const newCard = {
                id: firstCard.id,
                last4: firstCard.card.last4,
                brand: firstCard.card.brand
              }
              setSavedCard(newCard)
              setPaymentMethod(firstCard.id)
            } else {
              // No quedan tarjetas, limpiar y mostrar formulario
              clearSavedCard()
              setIsAddCardVisible(true)
            }
          }

          setIsCardLoading(false)
        } catch (error) {
          setIsCardLoading(false)
          const errorMessage = error.response?.data?.detail || 'No se pudo eliminar la tarjeta.'
          openConfirmModal('Error', errorMessage, () => {}, { danger: true, confirmText: 'Entendido' })
        }
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

  if (isAuthLoading || !isAuthorized || isLoadingCards) {
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
      {(isProcessing || isCardLoading) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-8 shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            <p className="font-semibold text-neutral-700">
              {isProcessing ? 'Procesando suscripción...' : 'Procesando...'}
            </p>
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
              Tus tarjetas de pago
            </h2>

            <div className="mt-6 space-y-4">
              {/* Mostrar todas las tarjetas guardadas */}
              {savedCards.length > 0 && !isAddCardVisible && (
                <>
                  {savedCards.map((card) => (
                    <PaymentMethodCard
                      key={card.id}
                      icon={CreditCard}
                      title={`Tarjeta ${card.card.brand.toUpperCase()}`}
                      description={`Terminación **** ${card.card.last4}`}
                      isSelected={paymentMethodId === card.id}
                      onSelect={() => handleSelectCard(card)}
                      onDelete={() => handleDeleteCard(card.id, card.card.last4)}
                    />
                  ))}
                </>
              )}

              {/* Si no hay tarjetas y no está mostrando el formulario */}
              {savedCards.length === 0 && !isAddCardVisible && (
                <PaymentMethodCard
                  icon={CreditCard}
                  title="Tarjeta de crédito o débito"
                  description="No hay tarjetas registradas"
                  isSelected={false}
                  onSelect={() => setIsAddCardVisible(true)}
                  isDisabled={true}
                />
              )}

              {/* Botón para agregar nueva tarjeta */}
              {!isAddCardVisible && (
                <button
                  onClick={() => setIsAddCardVisible(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-400 p-6 text-neutral-600 transition hover:border-primary-500 hover:text-primary-500"
                >
                  <Plus size={20} />
                  <span className="font-roboto text-xl font-bold">
                    {savedCards.length > 0 ? 'Agregar otra tarjeta' : 'Agregar nueva tarjeta'}
                  </span>
                </button>
              )}

              {/* Formulario para agregar tarjeta */}
              {isAddCardVisible && (
                <AddCreditCardForm
                  onSave={handleSaveCard}
                  onCancel={savedCards.length > 0 ? () => setIsAddCardVisible(false) : undefined}
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
