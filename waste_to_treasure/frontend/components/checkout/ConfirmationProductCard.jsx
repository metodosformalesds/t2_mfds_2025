'use client'

import Image from 'next/image'
import { Radio } from 'lucide-react'

export default function ConfirmationProductCard({ item, shippingMethod }) {
  return (
    <div className="flex flex-col gap-0 rounded-lg bg-neutral-100 p-4 shadow-md md:flex-row md:items-center">
      {/* Imagen y Cantidad */}
      <div className="flex-shrink-0 md:w-1/3 ml-4">
        <div className="relative h-32 w-full md:w-32">
          <Image
            src={item.listing_image_url || 'https://via.placeholder.com/150'}
            alt={item.listing_title}
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
          />
        </div>
        <p className="mt-2 text-left font-inter text-sm font-semibold text-neutral-700">
          Cantidad: {item.quantity}
        </p>
      </div>

      {/* Detalles del Producto */}
      <div className="flex-1 space-y-1">
        <h3 className="font-roboto text-1xl font-bold text-black">
          {item.listing_title}
        </h3>
        <p className="font-inter text-base font-sm text-neutral-600">
          {/* TODO: La API del carrito no provee el nombre del vendedor */}
          Vendido por: {item.seller_name || 'Vendedor'}
        </p>
        <p className="font-inter text-base font-sm text-neutral-600">
          ${parseFloat(item.listing_price).toFixed(2)}
        </p>
      </div>

      {/* Opción de Envío (Resumen) */}
      <div className="w-full border-t pt-4 md:w-1/3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
        <div className="flex items-start gap-3">
          <Radio size={20} className="mt-1 flex-shrink-0 text-primary-500" />
          <div>
            <h4 className="font-roboto text-lg font-bold text-black">
              {shippingMethod?.name || 'Envío'}
            </h4>
            <p className="font-inter text-sm text-neutral-600">
              {shippingMethod?.description || 'Costo extra'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}