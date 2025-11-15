'use client'

import { useState, useEffect } from 'react' // useEffect añadido
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/useAdminGuard'
import { useCheckoutStore } from '@/stores/useCheckoutStore'
import { useConfirmStore } from '@/stores/useConfirmStore' 
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
    savedCard, // Objeto singular
    setSavedCard, 
    clearSavedCard 
  } = useCheckoutStore()
  
  const [isAddCardVisible, setIsAddCardVisible] = useState(false)
  const [isCardLoading, setIsCardLoading] = useState(false)

  // Sincronizar la selección si no hay nada seleccionado y SÍ hay una tarjeta guardada
  useEffect(() => {
    if (!paymentMethodId && savedCard) {
      setPaymentMethod(savedCard.id)
    }
    // Si no hay tarjeta guardada, forzar mostrar el formulario
    if (!savedCard) {
      setIsAddCardVisible(true)
    }
  }, [savedCard, paymentMethodId, setPaymentMethod])


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
   * ha validado y tokenizado la tarjeta exitosamente.
   * @param {string} paymentMethodId - El ID real de Stripe (ej. "pm_123...")
   * @param {string} last4 - Los últimos 4 dígitos
   */
  const handleSaveCard = async (paymentMethodId, last4) => {
    
    // --- INICIO DE MODIFICACIÓN: Chequeo de duplicados por last4 ---
    if (savedCard && savedCard.last4 === last4) {
      // Si los últimos 4 dígitos coinciden, asumimos que es la misma tarjeta.
      // No mostramos el loader, solo un modal de confirmación.
      openConfirmModal(
        'Tarjeta ya Guardada',
        `La tarjeta que termina en **** ${last4} ya está guardada como tu método de pago.`,
        () => {
          // Seleccionarla y cerrar el formulario
          setPaymentMethod(savedCard.id)
          setIsAddCardVisible(false)
        },
        { danger: false, confirmText: 'Usar esta tarjeta' }
      )
      return; // No continuar con la validación de 2 segundos
    }
    // --- FIN DE MODIFICACIÓN ---

    // Si es una tarjeta nueva, proceder con la validación y carga
    setIsAddCardVisible(false) 
    setIsCardLoading(true) 
    const startTime = Date.now()

    try {
      // --- SIMULACIÓN DE GUARDADO EN BACKEND ---
      await new Promise(resolve => setTimeout(resolve, 500)) 
      // --- FIN SIMULACIÓN ---

      const newCard = {
        id: paymentMethodId,
        last4: last4,
      }

      // Timer de 2 segundos
      const elapsedTime = Date.now() - startTime
      if (elapsedTime < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - elapsedTime))
      }
      
      setIsCardLoading(false)

      // Reemplazar la tarjeta anterior
      setSavedCard(newCard)
      setPaymentMethod(newCard.id) 
      
      // Mostrar modal de éxito
      openConfirmModal(
        'Pago Guardado',
        `Tu nueva tarjeta terminada en ${last4} se ha validado y guardado.`,
        () => {
          router.push('/checkout/confirmation')
        },
        { danger: false, confirmText: 'Continuar a Confirmación' }
      )

    } catch (error) {
      // --- MANEJO DE ERROR (con timer de 2s) ---
      const elapsedTime = Date.now() - startTime
      if (elapsedTime < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - elapsedTime))
      }
      setIsCardLoading(false)

      // Mostrar modal de error
      openConfirmModal(
        'Error al Guardar Tarjeta',
        `No se pudo guardar tu método de pago. ${error.message || 'Intenta de nuevo.'}`,
        () => {}, 
        {
          danger: true,
          confirmText: 'Entendido',
        }
      )
    }
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
          // --- SIMULACIÓN DE API DELETE ---
          await new Promise(resolve => setTimeout(resolve, 700))
          // --- FIN SIMULACIÓN ---
          
          clearSavedCard(); // Esto borra savedCard y paymentMethodId

          // Forzar que se muestre el formulario de agregar
          setIsAddCardVisible(true);

        } catch (error) {
          openConfirmModal('Error', 'No se pudo eliminar la tarjeta.', () => {}, { danger: true, confirmText: 'Entendido' })
        } finally {
          setIsCardLoading(false)
        }
      },
      {
        danger: true,
        confirmText: 'Eliminar',
      }
    )
  }

  if (isLoading || !isAuthorized) {
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
              
              {/* Mostrar la tarjeta guardada si existe */}
              {savedCard ? (
                 <PaymentMethodCard
                  key={savedCard.id}
                  icon={CreditCard}
                  title="Tarjeta de crédito o débito"
                  description={`Terminación **** ${savedCard.last4}`}
                  isSelected={paymentMethodId === savedCard.id}
                  onSelect={() => setPaymentMethod(savedCard.id)}
                  onDelete={() => handleDeleteCard(savedCard.id, savedCard.last4)}
                />
              ) : (
                // Mostrar "placeholder" si no hay tarjeta Y el form está oculto
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