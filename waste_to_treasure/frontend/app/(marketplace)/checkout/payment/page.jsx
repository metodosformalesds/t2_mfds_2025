'use client'

import { useState, useEffect } from 'react' // useEffect añadido
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/useAdminGuard'
import { useCheckoutStore } from '@/stores/useCheckoutStore'
import { useConfirmStore } from '@/stores/useConfirmStore'
import { paymentsService } from '@/lib/api/payments'
import CheckoutStepper from '@/components/checkout/CheckoutStepper'
import CheckoutSummary from '@/components/checkout/CheckoutSummary'
import PaymentMethodCard from '@/components/checkout/PaymentMethodCard'
import AddCreditCardForm from '@/components/checkout/AddCreditCardForm'
import { CreditCard, Plus } from 'lucide-react'

export default function PaymentPage() {
  const { isAuthorized, isLoading } = useAuthGuard()
  const router = useRouter()
  const openConfirmModal = useConfirmStore(state => state.open)

  const {
    paymentMethodId,
    setPaymentMethod,
    savedCard,
    setSavedCard,
    clearSavedCard
  } = useCheckoutStore()

  const [savedCards, setSavedCards] = useState([])
  const [isLoadingCards, setIsLoadingCards] = useState(true)
  const [isAddCardVisible, setIsAddCardVisible] = useState(false)
  const [isCardLoading, setIsCardLoading] = useState(false)

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


  const handleContinue = () => {
    // Validar que se haya seleccionado un método de pago real
    if (!paymentMethodId || !savedCard) {
      openConfirmModal(
        'Método de Pago Requerido',
        'Por favor, agrega y selecciona un método de pago antes de continuar.',
        () => { setIsAddCardVisible(true); }, // Abrir el form
        { danger: true, confirmText: 'Entendido' }
      )
      return
    }
    
    setPaymentMethod(paymentMethodId) 
    router.push('/checkout/confirmation')
  }

  /**
   * Esta función es llamada por AddCreditCardForm DESPUÉS de que Stripe
   * ha confirmado el SetupIntent y adjuntado el PaymentMethod al Customer.
   *
   * NOTA: Con el flujo de SetupIntent, el PaymentMethod ya está guardado
   * en Stripe cuando esta función se ejecuta. No necesitamos hacer llamadas
   * adicionales al backend.
   *
   * @param {string} paymentMethodId - El ID del PaymentMethod (pm_xxxxx)
   * @param {string} last4 - Los últimos 4 dígitos
   * @param {string} brand - La marca de la tarjeta (visa, mastercard, etc.)
   */
  const handleSaveCard = async (paymentMethodId, last4, brand) => {

    // Chequeo de duplicados por last4
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

    // Si es una tarjeta nueva, proceder con la validación y carga
    setIsAddCardVisible(false)
    setIsCardLoading(true)
    const startTime = Date.now()

    try {
      // El PaymentMethod ya está guardado en Stripe gracias al SetupIntent
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

      // Mostrar modal de éxito
      openConfirmModal(
        'Pago Guardado',
        `Tu nueva tarjeta ${brand.toUpperCase()} terminada en ${last4} se ha validado y guardado.`,
        () => {
          router.push('/checkout/confirmation')
        },
        { danger: false, confirmText: 'Continuar a Confirmación' }
      )

    } catch (error) {
      const elapsedTime = Date.now() - startTime
      if (elapsedTime < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - elapsedTime))
      }
      setIsCardLoading(false)

      const errorMessage = error.response?.data?.detail || error.message || 'Intenta de nuevo.'
      openConfirmModal(
        'Error al Guardar Tarjeta',
        `No se pudo guardar tu método de pago. ${errorMessage}`,
        () => {},
        {
          danger: true,
          confirmText: 'Entendido',
        }
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

  /**
   * Lógica para eliminar una tarjeta guardada
   */
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
      {
        danger: true,
        confirmText: 'Eliminar',
      }
    )
  }

  if (isLoading || !isAuthorized || isLoadingCards) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-12">
      
      {/* Modal de Carga */}
      {isCardLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-8 shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            <p className="font-semibold text-neutral-700">Procesando...</p>
          </div>
        </div>
      )}
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Stepper */}
        <div className="mx-auto max-w-5xl">
          <CheckoutStepper currentStep="payment" />
        </div>

        {/* Encabezado */}
        <div className="mt-10">
          <h1 className="font-poppins text-5xl font-bold text-black">
            Método de pago
          </h1>
          <p className="font-inter text-lg font-medium text-neutral-700">
            Paga de forma segura con Stripe
          </p>
        </div>

        {/* Contenido Principal */}
        <div className="mt-8 flex flex-col items-start gap-8 lg:flex-row">
          {/* Columna Izquierda: Opciones de Pago */}
          <div className="w-full flex-1 rounded-lg bg-white p-6 shadow-2xl">
            <h2 className="border-b border-neutral-300 pb-4 font-poppins text-3xl font-semibold text-black">
              Tu tarjeta de pago
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
                  // Solo mostrar "Cancelar" si ya existe una tarjeta guardada
                  onCancel={savedCard ? () => setIsAddCardVisible(false) : undefined}
                />
              )}
            </div>
          </div>

          {/* Columna Derecha: Resumen */}
          <div className="w-full lg:w-96">
            <CheckoutSummary
              onContinue={handleContinue}
              buttonText="Continuar"
              backLink="/checkout"
              backText="← Volver a entrega"
            />
          </div>
        </div>
      </div>
    </div>
  )
}