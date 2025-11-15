'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Lock, ChevronDown } from 'lucide-react'

export default function OrderSummary({ items = [] }) {
  const [showDetails, setShowDetails] = useState(false)

  // Calcular totales basados en items seleccionados
  const subtotal = items.reduce((sum, item) => {
    const itemPrice = parseFloat(item.listing_price || 0)
    const itemQty = parseFloat(item.quantity || 0)
    return sum + (itemPrice * itemQty)
  }, 0)

  const shippingCost = items.length > 0 ? 150.0 : 0.0
  const total = subtotal + shippingCost

  return (
    <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-2xl lg:sticky lg:top-32 lg:max-w-xs">
      <h2 className="border-b border-neutral-300 pb-3 font-roboto text-lg font-bold text-black">
        Resumen del Pedido
      </h2>

      <div className="space-y-3 py-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex justify-between items-center p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition"
          title="Haz clic para ver detalles de cada producto"
        >
          <span className="flex items-center gap-2 font-inter font-medium text-sm text-black">
            <ChevronDown size={18} className={`transition-transform ${showDetails ? 'rotate-180' : ''}`} />
            Subtotal
          </span>
          <span className="text-black font-bold">${subtotal.toFixed(2)}</span>
        </button>

        {showDetails && items.length > 0 && (
          <div className="bg-gradient-to-b from-neutral-50 to-white rounded-lg p-4 border-2 border-primary-100 space-y-3">
            <p className="font-inter text-xs font-semibold text-neutral-500 uppercase tracking-wide">Detalles de productos</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map((item) => {
                const itemTotal = parseFloat(item.listing_price) * parseFloat(item.quantity)
                return (
                  <div key={item.cart_item_id} className="flex items-start justify-between text-xs bg-white rounded p-2.5 border border-neutral-150 hover:border-primary-200 transition">
                    <div className="flex-1 min-w-0">
                      <p className="font-roboto font-semibold text-neutral-900 truncate text-xs">
                        {item.listing_title}
                      </p>
                      <p className="font-inter text-neutral-500 text-xs">
                        {item.quantity} {item.listing_price_unit || 'unidades'} × ${parseFloat(item.listing_price).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-2 text-right">
                      <p className="font-roboto font-bold text-neutral-900 text-xs">
                        ${itemTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="border-t border-neutral-200 pt-2 mt-2">
              <p className="text-right font-inter text-xs text-neutral-600">
                <span className="font-semibold text-neutral-900">Subtotal productos: </span>
                <span className="text-primary-600 font-bold">${subtotal.toFixed(2)}</span>
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between font-inter text-sm font-medium">
          <span className="text-black opacity-60">Envío:</span>
          <span className="text-black">${shippingCost.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t border-neutral-300 pt-4">
        <div className="flex justify-between font-inter">
          <span className="text-base font-medium text-black opacity-60">
            Total:
          </span>
          <span className="text-xl font-medium text-black">
            ${total.toFixed(2)}
          </span>
        </div>
        <p className="mt-1 text-right font-inter text-xs font-normal text-neutral-500">
          IVA incluido cuando aplique
        </p>
      </div>

      <Link
        href="/checkout"
        className={`mt-4 flex w-full items-center justify-center rounded-lg px-4 py-3 text-center font-inter text-base font-semibold transition ${
          items.length > 0
            ? 'bg-primary-500 text-white hover:bg-primary-600'
            : 'bg-neutral-300 text-neutral-600 cursor-not-allowed'
        }`}
        onClick={(e) => {
          if (items.length === 0) {
            e.preventDefault()
          }
        }}
      >
        Proceder compra
      </Link>

      <div className="mt-3 flex items-center justify-center gap-2">
        <Lock size={14} className="text-neutral-600" />
        <span className="font-inter text-xs font-normal text-neutral-600">
          Pago 100% seguro
        </span>
      </div>
    </div>
  )
}