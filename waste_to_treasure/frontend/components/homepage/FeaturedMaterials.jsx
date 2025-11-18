/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: FeaturedMaterials
 * Descripción: carrusel infinito horizontal de materiales destacados con scroll suave, botones de navegación, detección automática de fin de lista para crear efecto loop infinito
 */

'use client'
import { useRef, useEffect } from 'react'
import Link from 'next/link'
import MaterialCard from '@/components/marketplace/MaterialCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function FeaturedMaterials({ materials }) {
  const scrollRef = useRef(null)
  const scrollTimeoutRef = useRef(null) // Para evitar bucles de scroll

  // Duplicamos la lista para el bucle infinito
  const displayMaterials = [...materials, ...materials]

  // Al cargar, nos posicionamos al inicio de la "segunda" lista (la mitad)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth / 2
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materials])

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
        // Damos 2px de margen por errores de redondeo del navegador
        if (scrollLeft + clientWidth >= scrollWidth - 2) {
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
    <section className="bg-white py-20">
      <div className="relative mx-auto max-w-7xl">
        <h2 className="px-4 text-center font-poppins text-4xl font-semibold text-neutral-900 sm:px-6 lg:px-8">
          Materiales Disponibles
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
            {displayMaterials.map((material, index) => (
              <div
                key={`${material.id}-${index}`} // Key única para elementos duplicados
                className="w-[260px] flex-shrink-0"
              >
                <MaterialCard material={material} />
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
            href="/materials"
            className="rounded-lg bg-primary-500 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-primary-600"
          >
            Ver todos los materiales
          </Link>
        </div>
      </div>
    </section>
  )
}