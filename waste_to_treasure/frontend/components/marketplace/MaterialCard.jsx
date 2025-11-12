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
  const imageUrl = material.images && material.images.length > 0 
    ? material.images[0].image_url 
    : 'https://via.placeholder.com/260x160'; // Placeholder image

  return (
    <Link
      href={`/materials/${material.id}`}
      className="flex h-full w-full min-w-[240px] flex-col rounded-lg border border-primary-500 bg-white shadow-sm transition-all hover:shadow-lg"
    >
      {/* Imagen */}
      <div className="relative h-40 w-full overflow-hidden rounded-t-lg">
        <Image
          src={imageUrl}
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
            Vendido por {material.user?.username || 'Vendedor anónimo'}
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <p className="font-roboto text-lg font-medium text-primary-500">
            ${parseFloat(material.price).toFixed(2)} MXN / {material.price_unit}
          </p>
          <div className="flex items-center gap-2">
            <BoxIcon />
            <span className="font-inter text-sm text-neutral-900">
              {material.quantity} {material.price_unit}
              {material.quantity > 1 ? 's' : ''} disponibles
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}