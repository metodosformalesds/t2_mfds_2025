'use client'

import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import GlobalConfirmModal from '@/components/admin/GlobalConfirmModal'

// Cargar Stripe con tu clave pública
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
)

export default function SubscriptionLayout({ children }) {
  return (
    // Envolvemos todas las páginas de suscripción con el provider de Stripe
    <Elements stripe={stripePromise}>
      {children}
      <GlobalConfirmModal />
    </Elements>
  )
}
