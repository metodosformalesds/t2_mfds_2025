/**
 * Autor: Arturo Perez Gonzalez
 * Fecha: 10/11/2024
 * Componente: PricingCard
 * Descripción: Card de compra con precio, selector de cantidad y botón de agregar al carrito.
 *              Muestra total calculado, políticas del producto/material y opción de reportar.
 *              Maneja estados de carga y disponibilidad del listing.
 */

'use client'

import { useState } from 'react'
import { ShoppingCart, Truck, ShieldCheck, RotateCcw, CreditCard, Globe, FileText, Check, Flag } from 'lucide-react'
import ReportModal from '@/components/reports/ReportModal'

export default function PricingCard({ listing, onAddToCart }) {
  const [quantity, setQuantity] = useState(1)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const price = parseFloat(listing?.price || 0)
  const priceUnit = listing?.price_unit || 'unidad'
  const availableQuantity = listing?.quantity || 0
  const isProduct = listing?.listing_type === 'PRODUCT'

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 1
    setQuantity(Math.min(Math.max(1, value), availableQuantity))
  }

  const handleAddToCart = async () => {
    if (onAddToCart && !isAddingToCart) {
      setIsAddingToCart(true)
      try {
        await onAddToCart(listing.listing_id, quantity)
      } finally {
        setIsAddingToCart(false)
      }
    }
  }

  const totalPrice = price * quantity
  const priceLabel = isProduct ? 'Precio unitario' : 'Precio sugerido'
  const quantityLabel = isProduct ? 'Cantidad disponible' : 'Cantidad'

  return (
    <div className="rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="mb-2 font-inter text-sm text-neutral-600">{priceLabel}</p>
        <p className="font-roboto text-4xl font-bold text-neutral-900">
          ${price.toFixed(2)} MXN
        </p>
        {isProduct && (
          <p className="mt-1 font-inter text-xs text-neutral-500">
            Por {priceUnit.toLowerCase()}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="quantity" className="mb-2 block font-inter text-sm text-neutral-900">
          {quantityLabel}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={handleQuantityChange}
            min="1"
            max={availableQuantity}
            className="w-full rounded-lg border border-neutral-300 px-4 py-2 font-inter text-base focus:border-primary-500 focus:outline-none"
          />
          {!isProduct && <span className="font-inter text-sm text-neutral-600">{priceUnit}</span>}
        </div>
      </div>

      <div className="mb-4 rounded-lg bg-primary-500/10 p-3">
        <p className="font-inter text-sm text-neutral-900">Total</p>
        <p className="font-roboto text-2xl font-bold text-primary-500">
          ${totalPrice.toFixed(2)} MXN
        </p>
      </div>

      <button
        onClick={handleAddToCart}
        disabled={!listing?.is_available || isAddingToCart}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-6 py-3 font-inter text-base font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ShoppingCart size={20} />
        {isAddingToCart ? 'Agregando...' : 'AGREGAR AL CARRITO'}
      </button>

      {/* Policies section - shown for both products and materials */}
      <div className="mb-4 space-y-3 border-t border-neutral-200 pt-4">
        <h4 className="font-inter text-sm font-semibold text-neutral-900">
          Políticas de este {isProduct ? 'producto' : 'material'}
        </h4>

        <button className="flex w-full items-center justify-between rounded-lg border border-neutral-300 bg-white px-4 py-3 text-left transition-colors hover:bg-neutral-50">
          <div className="flex items-center gap-3">
            <Truck size={18} className="text-primary-500" />
            <span className="font-inter text-sm text-neutral-900">Política de envíos</span>
          </div>
          <span className="text-neutral-400">›</span>
        </button>

        <button className="flex w-full items-center justify-between rounded-lg border border-neutral-300 bg-white px-4 py-3 text-left transition-colors hover:bg-neutral-50">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-primary-500" />
            <span className="font-inter text-sm text-neutral-900">Política de garantía</span>
          </div>
          <span className="text-neutral-400">›</span>
        </button>

        <button className="flex w-full items-center justify-between rounded-lg border border-neutral-300 bg-white px-4 py-3 text-left transition-colors hover:bg-neutral-50">
          <div className="flex items-center gap-3">
            <RotateCcw size={18} className="text-primary-500" />
            <span className="font-inter text-sm text-neutral-900">
              Política de devolución
            </span>
          </div>
          <span className="text-neutral-400">›</span>
        </button>
      </div>

      {/* Report button - shown for both products and materials */}
      <button 
        onClick={() => setIsReportModalOpen(true)}
        className="flex w-full items-center justify-center gap-2 font-inter text-sm text-red-600 transition-colors hover:text-red-700"
      >
        <Flag size={16} />
        Reportar
      </button>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        listingId={listing?.listing_id}
        listingTitle={listing?.title}
      />
    </div>
  )
}
