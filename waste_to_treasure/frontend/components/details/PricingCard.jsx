'use client'

import { useState } from 'react'
import { ShoppingCart, Truck, ShieldCheck, RotateCcw, CreditCard, Globe, FileText, Check, Flag } from 'lucide-react'
import ReportModal from '@/components/reports/ReportModal'

/**
 * Pricing Card Component
 * Displays price, quantity selector, and add to cart button
 * All data comes from backend API
 * Supports both Material and Product views with conditional policies section
 */
export default function PricingCard({ listing, onAddToCart }) {
  const [quantity, setQuantity] = useState(1)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  const price = parseFloat(listing?.price || 0)
  const priceUnit = listing?.price_unit || 'unidad'
  const availableQuantity = listing?.quantity || 0
  const isProduct = listing?.listing_type === 'PRODUCT'

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 1
    setQuantity(Math.min(Math.max(1, value), availableQuantity))
  }

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(listing.listing_id, quantity)
    }
  }

  const totalPrice = price * quantity

  // Label changes based on type
  const priceLabel = isProduct ? 'Precio unitario' : 'Precio sugerido'
  const quantityLabel = isProduct ? 'Cantidad disponible' : 'Cantidad'

  return (
    <div className="rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
      {/* Price Display */}
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

      {/* Quantity Selector */}
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

      {/* Total Price */}
      <div className="mb-4 rounded-lg bg-primary-500/10 p-3">
        <p className="font-inter text-sm text-neutral-900">Total</p>
        <p className="font-roboto text-2xl font-bold text-primary-500">
          ${totalPrice.toFixed(2)} MXN
        </p>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={!listing?.is_available}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-6 py-3 font-inter text-base font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ShoppingCart size={20} />
        AGREGAR AL CARRITO
      </button>

      {/* Second Button - Different for Materials vs Products */}
        <button className="mb-6 w-full rounded-lg border border-primary-500 bg-white px-6 py-3 font-inter text-base font-medium text-primary-500 transition-colors hover:bg-primary-50">
          Gestionar mi carrito
        </button>

      {/* Divider */}
      <div className="mb-4 space-y-3 border-t border-neutral-200 pt-4">
      </div>

      {/* Report Button - For both Materials and Products */}
      <button
        onClick={() => setIsReportModalOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500 bg-white px-6 py-3 font-inter text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
      >
        <Flag size={18} />
        Reportar
      </button>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        listingId={listing?.listing_id}
      />
    </div>
  )
}
