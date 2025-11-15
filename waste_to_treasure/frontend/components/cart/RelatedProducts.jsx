'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { listingsService } from '@/lib/api/listings'
import ProductCard from '@/components/marketplace/ProductCard' // Reutilizamos el ProductCard

export default function RelatedProducts() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const scrollRef = useRef(null)

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        setIsLoading(true)
        // Pedimos productos aleatorios (o por categoría si tuviéramos el contexto)
        const res = await listingsService.getAll({
          listing_type: 'PRODUCT',
          page_size: 10,
        })
        setProducts(res.items || [])
      } catch (err) {
        console.error('Error fetching related products:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRelated()
  }, [])

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  if (isLoading || products.length === 0) {
    // Puedes poner un skeleton loader aquí
    return null
  }

  return (
    <div className="w-full rounded-lg bg-white p-6 shadow-2xl">
      <h2 className="mb-6 font-poppins text-3xl font-bold text-black">
        Relacionado a los productos que viste
      </h2>
      <div className="relative">
        <button
          onClick={() => scroll('left')}
          aria-label="Scroll Left"
          className="absolute -left-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur-sm transition hover:bg-white md:flex"
        >
          <ChevronLeft className="h-6 w-6 text-neutral-900" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scroll-smooth px-2 pb-4 [scrollbar-width:none]"
        >
          {products.map((product) => (
            <div key={product.listing_id} className="w-[260px] flex-shrink-0">
              <ProductCard
                product={{
                  id: product.listing_id,
                  title: product.title,
                  price: product.price,
                  quantity: product.quantity,
                  images: [{ image_url: product.primary_image_url }],
                }}
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          aria-label="Scroll Right"
          className="absolute -right-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur-sm transition hover:bg-white md:flex"
        >
          <ChevronRight className="h-6 w-6 text-neutral-900" />
        </button>
      </div>
    </div>
  )
}