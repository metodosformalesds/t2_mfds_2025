import Image from 'next/image'
import Link from 'next/link'

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
  // Try several possible properties where a URL may be present.
  // The backend isn't fully wired in all places, sometimes the card receives:
  // - product.primary_image_url (string)
  // - product.listing_image_url (string)
  // - product.imageUrl (string)
  // - product.images = [{ image_url: string }] or product.images = [string]
  const imageUrl =
    product.primary_image_url ||
    product.listing_image_url ||
    product.imageUrl ||
    (product.images && product.images.length > 0 && (product.images[0].image_url || product.images[0])) ||
    'https://via.placeholder.com/260x160'

  // Ensure it's a string (Image component expects a string src)
  const resolvedImageUrl = typeof imageUrl === 'string' ? imageUrl : String(imageUrl)

  // Resolve ID from possible shapes coming from different endpoints
  const resolvedId =
    product.id ?? product.listing_id ?? product.listingId ?? ''
  const href = `/products/${resolvedId}`
  
  // Resolve quantity from different possible fields
  const quantity = product.quantity ?? product.available ?? 0
  
  // Resolve category name
  const categoryName = product.category?.name || product.category_name || 'Sin categoría'
  
  // Safely parse price
  const price = Number.isFinite(Number(product.price)) ? parseFloat(product.price) : 0

  return (
    <Link
      href={href}
      className="flex h-full w-full min-w-[240px] flex-col rounded-lg border border-primary-500 bg-white shadow-sm transition-all hover:shadow-lg"
    >
      {/* Imagen */}
      <div className="relative h-40 w-full overflow-hidden rounded-t-lg">
        <Image
          src={resolvedImageUrl}
          alt={product.title}
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-roboto text-xl font-bold text-neutral-900">
            {product.title}
          </h3>
          <p className="font-inter text-sm text-neutral-600">
            {categoryName}
          </p>
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