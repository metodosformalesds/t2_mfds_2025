'use client'

import Image from 'next/image'
import Link from 'next/link'

/**
 * Card que muestra una lista de los productos más vendidos.
 */
export default function TopProducts({ products = [] }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-lg">
      <h3 className="font-poppins text-2xl font-bold text-neutral-900">
        Mis Productos Más Vendidos
      </h3>
      <div className="flex flex-col divide-y divide-neutral-200">
        {products.length > 0 ? (
          products.map(product => (
            <div
              key={product.id}
              // --- INICIO DE CORRECCIÓN RESPONSIVE ---
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4"
              // --- FIN DE CORRECCIÓN RESPONSIVE ---
            >
              <Image
                src={product.imageUrl}
                alt={product.title}
                width={80}
                height={60}
                // --- INICIO DE CORRECCIÓN RESPONSIVE ---
                className="h-16 w-full sm:h-16 sm:w-20 rounded-lg border border-neutral-200 object-cover flex-shrink-0"
                // --- FIN DE CORRECCIÓN RESPONSIVE ---
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-poppins text-base font-normal text-neutral-900 truncate">
                  {product.title}
                </h4>
                <p className="font-poppins text-sm text-secondary-600 truncate">
                  {product.stats}
                </p>
              </div>
              <div className="font-roboto text-xl font-bold text-neutral-900 ml-auto sm:ml-0">
                {product.price}
              </div>
            </div>
          ))
        ) : (
          <p className="py-4 font-inter text-neutral-600">
            Aún no tienes ventas registradas.
          </p>
        )}
      </div>
      {products.length > 0 && (
        <Link
          href="/dashboard/sales"
          className="text-right font-inter font-semibold text-primary-500 hover:underline"
        >
          Ver todas las ventas →
        </Link>
      )}
    </div>
  )
}