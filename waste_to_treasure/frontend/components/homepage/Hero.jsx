/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: Hero
 * Descripción: sección principal con título llamativo, descripción de plataforma, botones de navegación hacia materiales y productos, elementos decorativos de fondo, y carrusel de imágenes
 */

import Link from 'next/link'
import ImageCarousel from './ImageCarousel'
import { Leaf, Sparkles } from 'lucide-react'

export default function Hero({ items = [] }) {
  return (
    <section className="relative w-full overflow-hidden bg-neutral-100">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-primary-500/5 blur-3xl" />
        <div className="absolute -right-32 bottom-20 h-96 w-96 rounded-full bg-secondary-600/5 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-24 md:grid-cols-2 md:items-center md:py-28 lg:px-8">
        {/* Contenido de texto */}
        <div className="flex flex-col gap-8">
          <h1 className="font-poppins text-5xl font-bold leading-tight text-neutral-900 md:text-6xl lg:text-6xl">
            El Marketplace de la{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
                Economía Circular
              </span>
              <svg
                className="absolute -bottom-2 left-0 w-full"
                height="8"
                viewBox="0 0 200 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 5C50 2 150 2 199 5"
                  stroke="#396539"
                  strokeWidth="2"
                  strokeOpacity="0.3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            {' '}en Ciudad Juárez.
          </h1>
          
          <p className="max-w-lg font-inter text-lg leading-relaxed text-neutral-600">
            Conectamos industrias con excedentes y artesanos que los
            transforman. Descubre materiales únicos y apoya el talento local
            sostenible.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/materials"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-primary-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-primary-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary-500/30"
            >
              <span className="relative z-10">Buscar materiales</span>
              <div className="absolute inset-0 -z-0 bg-gradient-to-r from-primary-500 to-primary-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-xl bg-secondary-500 px-8 py-4 text-base font-semibold text-white shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-secondary-500 hover:bg-secondary-50"
            >
              Comprar productos
            </Link>
          </div>
        </div>
            <ImageCarousel items={items} />
      </div>
    </section>
  )
}