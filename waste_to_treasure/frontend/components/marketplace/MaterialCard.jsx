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
  // Resolve image URL
  const imageUrl = material.primary_image_url || 
                   material.listing_image_url || 
                   material.imageUrl || 
                   '/placeholder-material.jpg'
  const resolvedImageUrl = typeof imageUrl === 'string' ? imageUrl : String(imageUrl)

  // Resolve ID
  const resolvedId = material.id ?? material.listing_id ?? material.listingId ?? ''
  const href = `/materials/${resolvedId}`

  // Price and unit
  const price = Number.isFinite(Number(material.price)) ? parseFloat(material.price).toFixed(2) : '0.00'
  const available = material.available ?? material.quantity ?? 0
  const unit = material.unit_measure ?? material.price_unit ?? material.unit ?? ''
  
  // Use backend fields directly
  const sellerName = material.seller_name || material.seller?.full_name || 'Vendedor'
  const categoryName = material.category_name || material.category?.name || 'Sin categoría'

  return (
    <Link
      href={href}
      className="flex h-full w-full min-w-[240px] flex-col rounded-lg border border-primary-500 bg-white shadow-sm transition-all hover:shadow-lg"
    >
      {/* Imagen */}
      <div className="relative h-40 w-full overflow-hidden rounded-t-lg bg-neutral-100">
        <Image
          src={resolvedImageUrl}
          alt={material.title}
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
            {material.title}
          </h3>
          <p className="font-inter text-sm text-neutral-600">
            {categoryName}
          </p>
          <p className="font-inter text-xs text-neutral-500">
            Vendido por: {sellerName}
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