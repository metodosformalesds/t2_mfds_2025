'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { useCartStore } from '@/stores/useCartStore'

export default function OrderSummary() {
  const { subtotal, estimated_commission, estimated_total, total_items } =
    useCartStore()

  // TODO: El envío debe calcularse. Por ahora es un valor fijo.
  const shippingCost = total_items > 0 ? 150.0 : 0.0

  const total = parseFloat(estimated_total) + shippingCost

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
          <span className="text-black">${parseFloat(subtotal).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-inter text-2xl font-medium">
          <span className="text-black opacity-60">Envío:</span>
          <span className="text-black">${shippingCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-inter text-2xl font-medium">
          <span className="text-black opacity-60">Comisión (10%):</span>
          <span className="text-black">
            ${parseFloat(estimated_commission).toFixed(2)}
          </span>
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

      {/* Botón */}
      <Link
        href="/checkout" // TODO: Crear página de checkout
        className="mt-6 flex w-full items-center justify-center rounded-lg bg-primary-500 px-5 py-4 text-center font-inter text-xl font-semibold text-white transition hover:bg-primary-600"
      >
        Proceder compra
      </Link>

      {/* Seguridad */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <Lock size={16} className="text-neutral-600" />
        <span className="font-inter text-sm font-normal text-black">
          Pago 100% seguro
        </span>
      </div>
    </div>
  )
}