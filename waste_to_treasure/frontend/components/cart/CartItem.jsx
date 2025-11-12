'use client'

import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import QuantitySelector from './QuantitySelector'
import { useCartStore } from '@/stores/useCartStore'

export default function CartItem({ item }) {
  const { updateItem, removeItem } = useCartStore()

  // TODO: Implementar un debounce para no llamar a la API en cada click
  const handleQuantityChange = (newQuantity) => {
    updateItem(item.cart_item_id, newQuantity)
  }

  const handleRemove = () => {
    removeItem(item.cart_item_id)
  }

  return (
    <div className="flex w-full items-center gap-4 border-b border-neutral-200 py-6 last:border-b-0">
      {/* 1. Checkbox */}
      <input
        type="checkbox"
        defaultChecked
        className="h-5 w-5 flex-shrink-0 rounded border-neutral-400 text-primary-500 focus:ring-primary-500"
      />

      {/* 2. Imagen */}
      <div className="relative h-24 w-24 flex-shrink-0 md:h-36 md:w-48">
        <Image
          src={item.listing_image_url || 'https://via.placeholder.com/190x150'}
          alt={item.listing_title || 'Imagen de producto'}
          layout="fill"
          objectFit="cover"
          className="rounded-lg border border-neutral-300"
        />
      </div>

      {/* 3. Contenedor de Detalles */}
      <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Info de Producto */}
        <div className="flex-1 space-y-1">
          <h3 className="font-roboto text-xl font-bold text-black">
            {item.listing_title}
          </h3>
          <p className="font-inter text-base font-medium text-neutral-600">
            {item.listing_description || 'Material reciclado'}
          </p>
          <p className="font-inter text-base font-medium text-neutral-600">
            Cantidad: {item.listing_available_quantity}{' '}
            {item.listing_price_unit || 'unidades'}
          </p>
        </div>

        {/* Precio y Cantidad */}
        <div className="flex items-center gap-4 md:flex-col md:items-end md:gap-2">
          <div className="text-right">
            <p className="font-roboto text-xl font-bold text-black">
              ${parseFloat(item.listing_price).toFixed(2)}
            </p>
            <p className="font-inter text-base font-medium text-neutral-600">
              / {item.listing_price_unit || 'unidad'}
            </p>
          </div>
          <QuantitySelector
            quantity={item.quantity}
            onChange={handleQuantityChange}
            maxQuantity={item.listing_available_quantity}
          />
        </div>
      </div>

      {/* 4. Botón de Eliminar */}
      <button
        onClick={handleRemove}
        className="ml-4 flex-shrink-0 p-2 text-neutral-500 hover:text-red-600"
        aria-label="Eliminar item"
      >
        <Trash2 size={24} />
      </button>
    </div>
  )
}