'use client'

import { useState } from 'react'
import { ShoppingCart, Truck, ShieldCheck, RotateCcw } from 'lucide-react'

/**
 * Pricing Card Component
 * Displays price, quantity selector, and add to cart button
 * All data comes from backend API
 * Supports both Material and Product views with conditional policies section
 */
export default function PricingCard({ listing, onAddToCart }) {
  const [quantity, setQuantity] = useState(1)

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
      {isProduct ? (
        <button className="mb-6 w-full rounded-lg border border-primary-500 bg-white px-6 py-3 font-inter text-base font-medium text-primary-500 transition-colors hover:bg-primary-50">
          Gestionar mi carrito
        </button>
      ) : (
        <button className="mb-4 w-full rounded-lg border border-primary-500 bg-white px-6 py-3 font-inter text-base font-medium text-primary-500 transition-colors hover:bg-primary-50">
          Contactar al vendedor
        </button>
      )}

      {/* Policies Section - Only for Products */}
      {isProduct && (
        <>
          <div className="mb-4 space-y-3 border-t border-neutral-200 pt-4">
            <h4 className="font-inter text-sm font-semibold text-neutral-900">
              Políticas de este producto
            </h4>

            {/* Shipping Policy */}
            <button className="flex w-full items-center justify-between rounded-lg border border-neutral-300 bg-white px-4 py-3 text-left transition-colors hover:bg-neutral-50">
              <div className="flex items-center gap-3">
                <Truck size={18} className="text-primary-500" />
                <span className="font-inter text-sm text-neutral-900">Política de envíos</span>
              </div>
              <span className="text-neutral-400">›</span>
            </button>

            {/* Warranty Policy */}
            <button className="flex w-full items-center justify-between rounded-lg border border-neutral-300 bg-white px-4 py-3 text-left transition-colors hover:bg-neutral-50">
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-primary-500" />
                <span className="font-inter text-sm text-neutral-900">Política de garantía</span>
              </div>
              <span className="text-neutral-400">›</span>
            </button>

            {/* Return Policy */}
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

          {/* Report Button */}
          <button className="flex w-full items-center justify-center gap-2 font-inter text-sm text-red-600 transition-colors hover:text-red-700">
            🚩 Reportar
          </button>
        </>
      )}
    </div>
  )
}
