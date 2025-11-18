/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: FeaturedProducts
 * Descripción: carrusel infinito horizontal de productos destacados con scroll suave, botones de navegación, efecto loop infinito y duplicación de items para continuidad visual
 */

'use client'
import { useRef, useEffect } from 'react'
import Link from 'next/link'
import ProductCard from '@/components/marketplace/ProductCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function FeaturedProducts({ products }) {
  const scrollRef = useRef(null)
  const scrollTimeoutRef = useRef(null) // Para evitar bucles de scroll

  // Duplicamos la lista para el bucle infinito
  const displayProducts = [...products, ...products]

  // Al cargar, nos posicionamos al inicio de la "segunda" lista (la mitad)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth / 2
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products])

  // Función para mover el carrusel con las flechas
  const scroll = direction => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  // Función que maneja el "salto" invisible del bucle
  const handleScroll = () => {
    if (scrollRef.current) {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      scrollTimeoutRef.current = setTimeout(() => {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        const halfwayPoint = scrollWidth / 2

        // Si se pasó del final (final de la 2da lista)
        if (scrollLeft + clientWidth >= scrollWidth - 1) {
          // Saltamos al final de la 1ra lista (se ve idéntico)
          scrollRef.current.scroll({
            left: halfwayPoint - clientWidth - 1,
            behavior: 'instant',
          })
        }

        // Si se pasó del inicio (inicio de la 1ra lista)
        if (scrollLeft === 0) {
          // Saltamos al inicio de la 2da lista (se ve idéntico)
          scrollRef.current.scroll({
            left: halfwayPoint,
            behavior: 'instant',
          })
        }
      }, 150) // Pequeño delay para que el scroll termine
    }
  }

  return (
    <section className="bg-neutral-100 py-20">
      <div className="relative mx-auto max-w-7xl">
        <h2 className="px-4 text-center font-poppins text-4xl font-semibold text-neutral-900 sm:px-6 lg:px-8">
          Tesoros Recién Creados
        </h2>

        {/* Contenedor del Carrusel Manual */}
        <div className="mt-12 w-full">
          {/* Botón Izquierda - Fuera del div de scroll */}
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll Left"
            className="absolute left-0 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur-sm transition hover:bg-white md:flex lg:-left-16"
          >
            <ChevronLeft className="h-6 w-6 text-neutral-900" />
          </button>

          {/* Wrapper del Scroll */}
          <div
            ref={scrollRef}
            onScroll={handleScroll} // Añadimos el listener de scroll
            className="flex gap-6 overflow-x-auto scroll-smooth px-4 pb-4 [scrollbar-width:none] sm:px-6 lg:px-8"
          >
            {displayProducts.map((product, index) => (
              <div
                key={`${product.id}-${index}`} // Key única para elementos duplicados
                className="w-[260px] flex-shrink-0"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {/* Botón Derecha - Fuera del div de scroll */}
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll Right"
            className="absolute right-0 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur-sm transition hover:bg-white md:flex lg:-right-16"
          >
            <ChevronRight className="h-6 w-6 text-neutral-900" />
          </button>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/products"
            className="rounded-lg bg-secondary-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-secondary-500"
          >
            Ver todos los productos
          </Link>
        </div>
      </div>
    </section>
  )
}