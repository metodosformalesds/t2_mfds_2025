'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function ImageCarousel({ items = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Helper para extraer URL de diferentes formatos posibles
  const extractImgUrl = (img) => {
    if (!img) return ''
    if (typeof img === 'string') return img
    return img.image_url || img.primary_image_url || img.url || ''
  }

  // Extraer solo las URLs de imágenes reales. Los items pueden venir en varias formas:
  // - item.primary_image_url (string)
  // - item.listing_image_url (string)
  // - item.imageUrl (string)
  // - item.images = [{ image_url }] o item.images = [string]
  const imagePool = items.flatMap((item) => {
    const urls = []

    if (!item) return []

    if (item.primary_image_url) urls.push(item.primary_image_url)
    if (item.listing_image_url) urls.push(item.listing_image_url)
    if (item.imageUrl) urls.push(item.imageUrl)

    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      urls.push(...item.images.map(extractImgUrl))
    }

    // Some listing objects may expose a top-level `primary_image_url` under different names
    // or the item itself may be a plain URL string
    if (typeof item === 'string') urls.push(item)

    return urls.filter(Boolean)
  })

  // Si no hay imágenes, mostrar un placeholder estático
  if (imagePool.length === 0) {
    return (
      <div className="relative w-full min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="w-[450px] h-[450px] bg-gray-200 rounded-lg text-center content-center text-neutral-500">
          No existen imagenes
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (imagePool.length < 2) return; // No rotar si hay 0 o 1 imagen

    const timer = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % imagePool.length)
    }, 4000) 

    return () => clearInterval(timer)
  }, [imagePool.length])

  return (
    <div className="relative w-full min-h-[500px] flex items-center justify-center overflow-hidden">
      {imagePool.map((src, index) => {
        const resolvedSrc = typeof src === 'string' ? src : String(src)
        return (
          <Image
            key={index}
            src={resolvedSrc}
            alt={`Foto de collage ${index + 1}`}
            width={500}
            height={500}
            className={`absolute w-[450px] h-[450px] rounded-lg object-cover transition-all duration-1000 ease-in-out
              ${
                index === currentIndex
                  ? 'opacity-100 scale-100' // Imagen visible
                  : 'opacity-0 scale-95' // Imagen oculta
              }
            `}
            priority={index < 2} // Precargar las primeras imágenes
          />
        )
      })}
    </div>
  )
}