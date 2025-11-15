'use client'

export default function TopProducts({ products = [] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 font-poppins text-2xl font-bold text-neutral-900">
          Mis Productos Más Vendidos
        </h2>
        <p className="text-center text-gray-500 py-8">
          No hay datos de ventas disponibles
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white p-8 shadow-lg">
      <h2 className="mb-6 font-poppins text-2xl font-bold text-neutral-900">
        Mis Productos Más Vendidos
      </h2>
      <div className="space-y-4">
        {products.map((product) => (
          <div
            key={product.listing_id}
            className="flex items-center justify-between rounded-lg border border-neutral-200 p-4 transition-colors hover:border-primary-500"
          >
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
              <div>
                <p className="font-inter font-semibold text-neutral-900">
                  {product.title}
                </p>
                <p className="font-inter text-sm text-neutral-600">
                  {product.totalSales} ventas • ${product.totalRevenue.toFixed(2)} generados
                </p>
              </div>
            </div>
            <p className="font-poppins text-xl font-bold text-neutral-900">
              ${(product.totalRevenue / 1000).toFixed(1)}k
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}