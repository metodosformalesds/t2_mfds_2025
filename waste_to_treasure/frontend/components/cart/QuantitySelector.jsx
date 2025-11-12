'use client'

import { Minus, Plus } from 'lucide-react'

export default function QuantitySelector({
  quantity,
  onChange,
  maxQuantity = 99,
  minQuantity = 1,
}) {
  const handleIncrease = () => {
    if (quantity < maxQuantity) {
      onChange(quantity + 1)
    }
  }

  const handleDecrease = () => {
    if (quantity > minQuantity) {
      onChange(quantity - 1)
    }
  }

  return (
    <div className="flex h-11 w-32 items-center justify-between rounded-lg border border-neutral-300">
      <button
        onClick={handleDecrease}
        disabled={quantity <= minQuantity}
        className="flex h-full w-10 items-center justify-center rounded-l-lg bg-neutral-200 text-neutral-900 transition hover:bg-neutral-300 disabled:opacity-50"
        aria-label="Reducir cantidad"
      >
        <Minus size={16} />
      </button>
      <span className="font-roboto text-base font-bold text-black">
        {quantity}
      </span>
      <button
        onClick={handleIncrease}
        disabled={quantity >= maxQuantity}
        className="flex h-full w-10 items-center justify-center rounded-r-lg bg-neutral-200 text-neutral-900 transition hover:bg-neutral-300 disabled:opacity-50"
        aria-label="Aumentar cantidad"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}