'use client'

import { useState } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { paymentsService } from '@/lib/api/payments'
import FormInput from '@/components/dashboard/FormInput'
import Checkbox from '@/components/ui/Checkbox'

/**
 * Opciones de estilo para el Stripe CardElement
 */
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Inter", sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
}

/**
 * Componente para agregar tarjeta usando el flujo CORRECTO de Stripe (SetupIntent).
 *
 * Flujo:
 * 1. Backend crea SetupIntent y retorna client_secret
 * 2. Frontend confirma con stripe.confirmCardSetup()
 * 3. Stripe adjunta automáticamente el PaymentMethod al Customer
 * 4. El PaymentMethod queda guardado y reutilizable sin riesgo de quemarse
 *
 * @param {object} props
 * @param {function} props.onSave - Callback al guardar (paymentMethodId, last4, brand)
 * @param {function | undefined} props.onCancel - Callback al cancelar
 */
export default function AddCreditCardForm({ onSave, onCancel }) {
  const stripe = useStripe()
  const elements = useElements()

  const [name, setName] = useState('')
  const [isDefault, setIsDefault] = useState(true)
  const [error, setError] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!stripe || !elements) {
      setError('Stripe no está listo. Intenta de nuevo en un momento.')
      return
    }

    const cardElement = elements.getElement(CardElement)

    if (!cardElement) {
      setError('No se pudo encontrar el componente de tarjeta.')
      return
    }

    if (!name.trim()) {
      setError('Por favor, ingresa el nombre del titular de la tarjeta.')
      return
    }

    setIsProcessing(true)

    try {
      // FLUJO CORRECTO: Usar SetupIntent

      // 1. Crear SetupIntent en el backend
      const { client_secret } = await paymentsService.createSetupIntent()

      // 2. Confirmar el SetupIntent con la tarjeta
      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
        client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: name,
            },
          },
        }
      )

      if (confirmError) {
        throw new Error(confirmError.message)
      }

      // 3. Stripe ya adjuntó automáticamente el PaymentMethod al Customer
      // El setupIntent contiene el ID del PaymentMethod creado
      const paymentMethodId = setupIntent.payment_method

      // Necesitamos obtener los detalles de la tarjeta desde el CardElement
      // porque setupIntent solo devuelve el ID del PaymentMethod
      const cardData = elements.getElement(CardElement)

      // Extraer los últimos 4 dígitos y la marca de la tarjeta que el usuario ingresó
      // Stripe no expone estos datos después de confirmCardSetup, así que los obtenemos
      // haciendo una llamada al backend para recuperar el PaymentMethod
      const pmResponse = await paymentsService.listPaymentMethods()
      const justCreatedPM = pmResponse.find(pm => pm.id === paymentMethodId)

      if (!justCreatedPM) {
        throw new Error('No se pudo obtener la información de la tarjeta')
      }

      // 4. Llamar a onSave con los detalles de la tarjeta
      onSave(justCreatedPM.id, justCreatedPM.card.last4, justCreatedPM.card.brand)

      cardElement.clear()
      setName('')

    } catch (err) {
      console.error('Error al guardar tarjeta:', err)
      setError(err.message || 'Ocurrió un error. Verifica tus datos.')
      setIsProcessing(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 flex animate-fade-in flex-col gap-6 rounded-lg border border-neutral-300 bg-white p-6 shadow-inner"
    >
      <h3 className="text-center font-roboto text-3xl font-bold text-black">
        Agregar una tarjeta de débito o crédito
      </h3>

      <div className="flex flex-col gap-6 border-b border-neutral-300 pb-6">
        <div className="flex-1 space-y-4">
          
          {/* Nombre en la Tarjeta */}
          <FormInput
            id="name"
            name="name"
            label="Nombre del titular"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ignacio Lopez"
            required
            disabled={isProcessing}
          />

          {/* Stripe Card Element */}
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-600">
              Datos de la tarjeta
            </label>
            <div className="rounded-lg border border-neutral-300 p-3">
              <CardElement options={CARD_ELEMENT_OPTIONS} />
            </div>
          </div>

          <Checkbox
            label="Usar como mi pago predeterminada"
            checked={isDefault}
            onChange={() => setIsDefault(!isDefault)}
            disabled={isProcessing}
          />
        </div>
      </div>
      
      {/* Mensaje de Error */}
      {error && (
        <div className="text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      {/* Acciones del Formulario */}
      <div className="flex justify-end gap-4">
        
        {/* --- INICIO DE MODIFICACIÓN: Botón Cancelar Condicional --- */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="rounded-lg bg-neutral-200 px-6 py-3 font-inter text-base font-semibold text-neutral-900 transition hover:bg-neutral-300"
          >
            Cancelar
          </button>
        )}
        {/* --- FIN DE MODIFICACIÓN --- */}

        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="rounded-lg bg-primary-500 px-6 py-3 font-inter text-base font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50"
        >
          {isProcessing ? 'Validando...' : 'Guardar tarjeta'}
        </button>
      </div>
    </form>
  )
}