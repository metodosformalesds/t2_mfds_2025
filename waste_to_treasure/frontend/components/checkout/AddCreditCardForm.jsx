'use client'

import { useState } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import FormInput from '@/components/dashboard/FormInput'
import Checkbox from '@/components/ui/Checkbox'

/**
 * Opciones de estilo para el Stripe CardElement
 */
const CARD_ELEMENT_OPTIONS = {
  // ... (sin cambios)
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
 * @param {object} props
 * @param {function} props.onSave - Callback al guardar
 * @param {function | undefined} props.onCancel - Callback al cancelar (si es undefined, no se muestra el botón)
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
      // 1. Crear un PaymentMethod con Stripe.js
      const { error: createError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: name,
        },
      })

      if (createError) {
        throw new Error(createError.message)
      }

      // 2. Si es exitoso, llamar a onSave 
      // onSave se encargará de mostrar el modal de carga de 2s
      onSave(paymentMethod.id, paymentMethod.card.last4)
      
      cardElement.clear()
      setName('')

    } catch (err) {
      console.error('Error al crear PaymentMethod:', err)
      setError(err.message || 'Ocurrió un error. Verifica tus datos.')
      // Permitir que el usuario intente de nuevo
      setIsProcessing(false)
    }
    // No usamos 'finally' para que el estado de carga lo controle la página padre
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