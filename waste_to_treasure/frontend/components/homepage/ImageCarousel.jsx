'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function ImageCarousel({ items = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Extraer solo las URLs de imágenes reales
  const imagePool = items.flatMap(item => 
    item.images && item.images.length > 0
      ? item.images.map(img => img.image_url)
      : [] // No agregar nada si no hay imágenes
  );

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
      {imagePool.map((src, index) => (
        <Image
          key={index}
          src={src}
          alt={`Foto de collage ${index + 1}`}
          width={500}
          height={500}
          className={`absolute w-[450px] h-[450px] rounded-lg object-cover transition-all duration-1000 ease-in-out rotate-3
            ${
              index === currentIndex
                ? 'opacity-100 scale-100' // Imagen visible
                : 'opacity-0 scale-95' // Imagen oculta
            }
          `}
          priority={index < 2} // Precargar las primeras imágenes
        />
      ))}
    </div>
  )
}