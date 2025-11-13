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

export default function MaterialCard({ material }) {
  // Resolve possible image URL fields and fallbacks
  const imageUrl =
    material.primary_image_url ||
    material.listing_image_url ||
    material.imageUrl ||
    (material.images && material.images.length > 0 && (material.images[0].image_url || material.images[0])) ||
    '/placeholder-material.jpg'
  const resolvedImageUrl = typeof imageUrl === 'string' ? imageUrl : String(imageUrl)

  // Resolve ID fields used across different endpoints
  const resolvedId = material.id ?? material.listing_id ?? material.listingId ?? ''
  const href = `/materials/${resolvedId}`

  const price = Number.isFinite(Number(material.price)) ? parseFloat(material.price).toFixed(2) : '0.00'
  const available = material.available ?? material.quantity ?? 0
  const unit = material.unit_measure ?? material.price_unit ?? material.unit ?? ''

  return (
    <Link
      href={href}
      className="flex h-full w-full min-w-[240px] flex-col rounded-lg border border-primary-500 bg-white shadow-sm transition-all hover:shadow-lg"
    >
      {/* Imagen - Usando placeholder de gradiente como en tu diseño */}
      <div className="relative h-40 w-full overflow-hidden rounded-t-lg">
        <Image
          src={resolvedImageUrl}
          alt={material.title}
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-roboto text-xl font-bold text-neutral-900">
            {material.title}
          </h3>
          <p className="font-inter text-sm text-neutral-600">
            {material.seller ?? material.user?.username ?? 'Vendedor anónimo'}
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <p className="font-roboto text-lg font-medium text-primary-500">
            ${price} MXN / {unit}
          </p>
          <div className="flex items-center gap-2">
            <BoxIcon />
            <span className="font-inter text-sm text-neutral-900">
              {available} {unit}
              {available > 1 ? 's' : ''} disponibles
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}