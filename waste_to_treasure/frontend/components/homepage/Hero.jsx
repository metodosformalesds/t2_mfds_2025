import Link from 'next/link'
import ImageCarousel from './ImageCarousel'

export default function Hero({ items = [] }) {
  return (
    <section className="w-full bg-neutral-100">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-20 md:grid-cols-2 md:items-center lg:px-8">
        {/* Contenido de texto */}
        <div className="flex flex-col gap-8">
          <h1 className="font-poppins text-5xl font-bold text-neutral-900">
            El Marketplace de la Economía Circular en Ciudad Juárez.
          </h1>
          <p className="max-w-lg font-inter text-base text-neutral-600">
            Conectamos industrias con excedentes y artesanos que los
            transforman. Descubre materiales únicos y apoya el talento local
            sostenible.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/materials"
              className="rounded-lg bg-primary-500 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-primary-600"
            >
              Buscar materiales
            </Link>
            <Link
              href="/products"
              className="rounded-lg bg-secondary-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-secondary-500"
            >
              Comprar productos
            </Link>
          </div>
        </div>

        {/* Carrusel de Imágenes */}
        <div className="relative h-96 w-full md:h-[500px]">
          <ImageCarousel items={items} />
        </div>
      </div>
    </section>
  )
}