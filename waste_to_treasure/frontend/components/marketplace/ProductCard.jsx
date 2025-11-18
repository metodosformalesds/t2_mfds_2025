import Image from 'next/image'
import Link from 'next/link'
import { getPlaceholderDataUri } from '@/components/ui/ImagePlaceholder'

// Icono SVG para la caja
const BoxIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17.5 5.83331L10 1.66665L2.5 5.83331M17.5 5.83331L10 9.99998L2.5 5.83331M17.5 5.83331V14.1666L10 18.3333L2.5 14.1666V5.83331M10 9.99998V18.3333M14.1667 3.74998L6.66667 7.91665"
      stroke="#396530"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export default function ProductCard({ product }) {
  // Resolve image URL - sin fallback a placeholder externo
  const imageUrl = product.primary_image_url ||
                   product.listing_image_url ||
                   product.imageUrl ||
                   getPlaceholderDataUri(260, 160, 'Producto')
  const resolvedImageUrl = typeof imageUrl === 'string' ? imageUrl : String(imageUrl)

  // Resolve ID
  const resolvedId = product.id ?? product.listing_id ?? product.listingId ?? ''
  const href = `/products/${resolvedId}`
  
  // Quantity
  const quantity = product.quantity ?? product.available ?? 0
  
  // Use backend fields directly - sin fallbacks a texto genérico
  const categoryName = product.category_name || product.category?.name || null
  const sellerName = product.seller_name || product.seller?.full_name || null
  
  // Price
  const price = Number.isFinite(Number(product.price)) ? parseFloat(product.price) : 0

  return (
    <Link
      href={href}
      className="flex h-full w-full min-w-[240px] flex-col rounded-lg border border-primary-500 bg-white shadow-sm transition-all hover:shadow-lg"
    >
      {/* Imagen */}
      <div className="relative h-40 w-full overflow-hidden rounded-t-lg bg-neutral-100">
        <Image
          src={resolvedImageUrl}
          alt={product.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          quality={85}
        />
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-roboto text-xl font-bold text-neutral-900">
            {product.title}
          </h3>
          {categoryName && (
            <p className="font-inter text-sm text-neutral-600">
              {categoryName}
            </p>
          )}
          {sellerName && (
            <p className="font-inter text-xs text-neutral-500">
              Vendido por: {sellerName}
            </p>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <p className="font-roboto text-lg font-medium text-primary-500">
            ${price.toFixed(2)} MXN
          </p>
          <div className="flex items-center gap-2">
            <BoxIcon />
            <span className="font-inter text-sm text-neutral-900">
              {quantity} {quantity === 1 ? 'pieza disponible' : 'piezas disponibles'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}