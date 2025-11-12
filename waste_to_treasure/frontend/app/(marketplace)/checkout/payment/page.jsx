'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/useAdminGuard'
import { useCheckoutStore } from '@/stores/useCheckoutStore'
import CheckoutStepper from '@/components/checkout/CheckoutStepper'
import CheckoutSummary from '@/components/checkout/CheckoutSummary'
import PaymentMethodCard from '@/components/checkout/PaymentMethodCard'
import AddCreditCardForm from '@/components/checkout/AddCreditCardForm'
import { CreditCard, Plus } from 'lucide-react'

// ... (Icono de PayPal no cambia) ...
const PayPalIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="text-[#00457C]"
  >
    <path d="M7.183 18.261c.474 0 .91-.12 1.303-.358.405-.247.74-.593.99-1.023.242-.43.368-.92.368-1.455 0-.46-.117-.87-.342-1.21-.234-.34-.539-.603-.902-.767-.354-.165-.75-.24-1.16-.24-.418 0-.81.066-1.16.188-.342.12-.625.29-.83.486-.2.19-.326.39-.37.58H4.2v.38c.03-.49.19-.92.46-1.28.27-.36.63-.64 1.05-.83.42-.19.9-.29 1.4-.29.84 0 1.5.17 1.98.5.48.33.72.82.72 1.46 0 .46-.13.86-.4 1.22-.27.36-.67.65-1.18.85-.3.12-.6.18-.88.18-.46 0-.87-.08-1.2-.23-.34-.15-.6-.35-.78-.58L4 16.219c.22.25.5.47.82.65.33.18.7.3 1.1.37.09.02.18.04.27.05v.972zm9.239-5.32c.56 0 1.01.08 1.34.23.33.15.58.34.75.57.17.23.25.48.25.75 0 .33-.09.61-.26.84-.17.23-.42.41-.73.53-.31.12-.7.18-1.16.18h-.59v.89h-.89v-4.01h1.25zm-.15 1.83c.31 0 .56-.07.74-.2.18-.13.27-.32.27-.56 0-.21-.08-.38-.23-.51-.15-.13-.38-.2-.68-.2h-.4v1.47h.3zm-3.6-1.83c.56 0 1.01.08 1.34.23.33.15.58.34.75.57.17.23.25.48.25.75 0 .33-.09.61-.26.84-.17.23-.42.41-.73.53-.31.12-.7.18-1.16.18h-.59v.89h-.89v-4.01h1.25zm-.15 1.83c.31 0 .56-.07.74-.2.18-.13.27-.32.27-.56 0-.21-.08-.38-.23-.51-.15-.13-.38-.2-.68-.2h-.4v1.47h.3z" />
    <path d="M11.39 8.011c-1.57.0-2.88.38-3.92.85-1.02.47-1.74 1.1-2.14 1.83-.4 0.73-.6 1.5-.6 2.3 0 0.88.24 1.67.7 2.34s1.1 1.2 1.88 1.58c.78.38 1.7.58 2.72.58h.2c.24 0 .45-.01.62-.02.17-.01.3-.02.39-.02 1.39 0 2.56-.35 3.5-1.04.93-.69 1.57-1.58 1.88-2.62.3-1.04.3-2.1.02-3.13-.28-1.03-.8-1.92-1.5-2.62-.7-.7-1.57-1.2-2.5-1.48-.93-.28-1.9-.42-2.85-.42z" />
  </svg>
)

export default function PaymentPage() {
  const { isAuthorized, isLoading } = useAuthGuard()
  const router = useRouter()
  // --- INICIO DE MODIFICACIÓN ---
  const { setPaymentMethod, paymentMethodId } = useCheckoutStore()
  const [selectedMethod, setSelectedMethod] = useState(paymentMethodId || 'card')
  // --- FIN DE MODIFICACIÓN ---
  
  const [isAddCardVisible, setIsAddCardVisible] = useState(false)
  const [savedCards, setSavedCards] = useState([]) 

  const handleContinue = () => {
    // --- INICIO DE MODIFICACIÓN ---
    // Guardar selección en el store
    // Si se seleccionó 'card' pero no hay un ID, usamos el ID de la primera tarjeta guardada
    if (selectedMethod === 'card' && savedCards.length > 0) {
      setPaymentMethod(savedCards[0].id)
    } else {
      setPaymentMethod(selectedMethod)
    }
    
    // Navegar al siguiente paso
    router.push('/checkout/confirmation')
    // --- FIN DE MODIFICACIÓN ---
  }

  // --- INICIO DE MODIFICACIÓN ---
  const handleSaveCard = (paymentMethodId, last4) => {
    // Simulación: agregamos la tarjeta a la lista local
    const newCard = {
      id: paymentMethodId,
      last4: last4,
    }
    setSavedCards([newCard, ...savedCards])
    setIsAddCardVisible(false)
    setSelectedMethod(paymentMethodId) // Auto-seleccionar la tarjeta
    setPaymentMethod(paymentMethodId) // Guardar en el store
  }
  // --- FIN DE MODIFICACIÓN ---

  if (isLoading || !isAuthorized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-12">
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
            Selecciona cómo deseas pagar tu pedido
          </p>
        </div>

        {/* Contenido Principal */}
        <div className="mt-8 flex flex-col items-start gap-8 lg:flex-row">
          {/* Columna Izquierda: Opciones de Pago */}
          <div className="w-full flex-1 rounded-lg bg-white p-6 shadow-2xl">
            <h2 className="border-b border-neutral-300 pb-4 font-poppins text-3xl font-semibold text-black">
              Selecciona tu método de pago
            </h2>

            <div className="mt-6 space-y-4">
              {/* Iterar sobre tarjetas guardadas */}
              {savedCards.map(card => (
                 <PaymentMethodCard
                  key={card.id}
                  icon={CreditCard}
                  title="Tarjeta de crédito o débito"
                  description={`Terminación **** ${card.last4}`}
                  isSelected={selectedMethod === card.id}
                  onSelect={() => setSelectedMethod(card.id)}
                />
              ))}

              {/* Opción default si no hay tarjetas */}
              {savedCards.length === 0 && (
                <PaymentMethodCard
                  icon={CreditCard}
                  title="Tarjeta de crédito o débito"
                  description="No hay tarjetas registradas"
                  isSelected={selectedMethod === 'card'} // 'card' genérico
                  onSelect={() => setSelectedMethod('card')}
                />
              )}

              <PaymentMethodCard
                icon={PayPalIcon}
                title="PayPal"
                description="No hay cuenta registrada"
                isSelected={selectedMethod === 'paypal'}
                onSelect={() => setSelectedMethod('paypal')}
                isDisabled={true} 
              />

              {!isAddCardVisible && (
                <button
                  onClick={() => setIsAddCardVisible(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-400 p-6 text-neutral-600 transition hover:border-primary-500 hover:text-primary-500"
                >
                  <Plus size={20} />
                  <span className="font-roboto text-xl font-bold">
                    Agregar tarjeta de débito o crédito
                  </span>
                </button>
              )}

              {isAddCardVisible && (
                <AddCreditCardForm
                  onSave={handleSaveCard}
                  onCancel={() => setIsAddCardVisible(false)}
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