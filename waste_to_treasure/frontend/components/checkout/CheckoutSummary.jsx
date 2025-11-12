'use client'

import Link from 'next/link'
import { useCartStore } from '@/stores/useCartStore'

/**
 * Tarjeta de Resumen de Pedido para el proceso de Checkout.
 * @param {Object} props
 * @param {Function} props.onContinue - Función para el botón principal.
 * @param {string} props.buttonText - Texto para el botón principal (ej. "Continuar").
 * @param {string} props.backLink - URL para el enlace "Volver".
 * @param {string} props.backText - Texto para el enlace "Volver".
 * @param {boolean} [props.showTerms=false] - Mostrar texto de términos y condiciones.
 * @param {boolean} [props.isLoading=false] - Poner el botón en estado de carga.
 */
export default function CheckoutSummary({
  onContinue,
  buttonText = "Continuar",
  backLink,
  backText,
  showTerms = false,
  isLoading = false,
}) {
  const { subtotal } = useCartStore()

  // TODO: Estos valores (envío, IVA, comisión) deben venir del backend/store.
  // Usamos los mocks de tu imagen 'Checkout paso 3.jpg' por ahora.
  const shippingCost = 150.0
  const taxCost = 132.00 // IVA(16%) mockeado en la imagen
  const commissionCost = 45.00 // Comisión mockeada en la imagen

  const subtotalNum = parseFloat(subtotal)
  
  // El total se calcula con los mocks de la imagen
  const total = subtotalNum + shippingCost + commissionCost + taxCost

  return (
    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl lg:sticky lg:top-32">
      {/* Titulo */}
      <h2 className="border-b border-neutral-300 pb-4 font-roboto text-[26px] font-bold text-black">
        Resumen del Pedido
      </h2>

      {/* Lista de Costos */}
      <div className="space-y-3 py-6">
        <div className="flex justify-between font-inter text-2xl font-medium">
          <span className="text-black">Subtotal:</span>
          <span className="text-black">${subtotalNum.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-inter text-2xl font-medium">
          <span className="text-black opacity-60">Envío:</span>
          <span className="text-black">${shippingCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-inter text-2xl font-medium">
          <span className="text-black opacity-60">Comisión (10%):</span>
          <span className="text-black">${commissionCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-inter text-2xl font-medium">
          <span className="text-black opacity-60">IVA (16%):</span>
          <span className="text-black">${taxCost.toFixed(2)}</span>
        </div>
      </div>

      {/* Total */}
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

      {/* Términos y Condiciones (Solo para Paso 3) */}
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

      {/* Botón */}
      <button
        onClick={onContinue}
        disabled={isLoading}
        className="mt-6 flex w-full items-center justify-center rounded-lg bg-primary-500 px-5 py-4 text-center font-inter text-xl font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50"
      >
        {isLoading ? 'Procesando...' : buttonText}
      </button>

      {/* Link para Volver */}
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