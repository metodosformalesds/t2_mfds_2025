'use client'

import Link from 'next/link'
import { useCartStore } from '@/stores/useCartStore'

export default function CheckoutSummary({
  onContinue,
  buttonText = 'Continuar',
  backLink,
  backText,
  showTerms = false,
  isLoading = false,
  items = [],
}) {
  // Si no hay items, usar el store como fallback (para compatibilidad)
  const { items: cartItems, total_items } = useCartStore()
  const itemsToUse = items.length > 0 ? items : cartItems

  // Calcular totales basados en items
  const subtotalNum = itemsToUse.reduce((sum, item) => {
    const itemPrice = parseFloat(item.listing_price || 0)
    const itemQty = parseFloat(item.quantity || 0)
    return sum + (itemPrice * itemQty)
  }, 0)

  const shippingCost = itemsToUse.length > 0 ? 150.0 : 0.0
  const total = subtotalNum + shippingCost

  return (
    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl lg:sticky lg:top-32">
      <h2 className="border-b border-neutral-300 pb-4 font-roboto text-[26px] font-bold text-black">
        Resumen del Pedido
      </h2>

      <div className="space-y-3 py-6">
        <div className="flex justify-between font-inter text-2xl font-medium">
          <span className="text-black">Subtotal:</span>
          <span className="text-black">${subtotalNum.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-inter text-2xl font-medium">
          <span className="text-black opacity-60">Envío:</span>
          <span className="text-black">${shippingCost.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t border-neutral-300 pt-6">
        <div className="flex justify-between font-inter">
          <span className="text-2xl font-medium text-black opacity-60">
            Total:
          </span>
          <span className="text-[28px] font-medium text-black">
            ${total.toFixed(2)}
          </span>
        </div>
        <p className="mt-1 text-right font-inter text-sm font-normal text-black">
          IVA incluido cuando aplique
        </p>
      </div>

      {showTerms && (
        <div className="mt-6 rounded-lg bg-neutral-100 p-3 text-center">
          <p className="font-inter text-sm text-black">
            Al confirmar tu pago, aceptas los
            <br />
            <Link href="/legal/terms" className="font-medium text-blue-600 hover:underline">
              Términos y condiciones
            </Link>
          </p>
        </div>
      )}

      <button
        onClick={onContinue}
        disabled={isLoading || itemsToUse.length === 0}
        className={`mt-6 flex w-full items-center justify-center rounded-lg px-5 py-4 text-center font-inter text-xl font-semibold transition ${
          itemsToUse.length > 0 && !isLoading
            ? 'bg-primary-500 text-white hover:bg-primary-600'
            : 'bg-neutral-300 text-neutral-600 cursor-not-allowed'
        }`}
      >
        {isLoading ? 'Procesando...' : buttonText}
      </button>

      {backLink && backText && (
        <div className="mt-4 text-center">
          <Link href={backLink} className="text-sm text-blue-600 hover:underline">
            {backText}
          </Link>
        </div>
      )}
    </div>
  )
}