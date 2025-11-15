'use client'

import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import GlobalConfirmModal from '@/components/admin/GlobalConfirmModal'

// Cargar Stripe con tu clave pública
// Asegúrate de que NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY esté en tu .env.local
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
)

export default function CheckoutLayout({ children }) {
  const options = {
    // Aquí podrías pasar un client_secret si estuvieras creando un PaymentIntent por adelantado,
    // pero para guardar tarjetas, solo necesitamos el provider.
  }

  return (
    // Envolvemos todas las páginas de checkout con el provider de Stripe
    <Elements stripe={stripePromise} options={options}>
      {children}
      <GlobalConfirmModal />
    </Elements>
  )
}