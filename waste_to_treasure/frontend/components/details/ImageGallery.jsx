/**
 * Autor: Arturo Perez Gonzalez
 * Fecha: 10/11/2024
 * Componente: ImageGallery
 * Descripción: Galería de imágenes con navegación por miniaturas.
 *              Muestra imagen principal con badge de "MATERIAL/PRODUCTO RECICLADO"
 *              y hasta 4 miniaturas navegables. Soporta imágenes del backend.
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function ImageGallery({ images = [], title, listingType, showBadge = true }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // Extract image URLs from backend format (images array with image_url property)
  const imageUrls = images.map((img) => img.image_url || img)

  // Fallback image if no images provided
  const displayImages = imageUrls.length > 0 ? imageUrls : ['/placeholder-material.jpg']
  const currentImage = displayImages[selectedImageIndex]

  // Determine badge text based on listing type
  const isProduct = listingType === 'PRODUCT'
  const badgeText = isProduct ? 'PRODUCTO RECICLADO' : 'MATERIAL RECICLADO'

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="relative h-[400px] w-full overflow-hidden rounded-lg bg-gradient-to-br from-pink-500 to-purple-500">
        {/* Badge for recycled products/materials */}
        {showBadge && (
          <div className="absolute left-4 top-4 z-10 rounded bg-primary-500 px-3 py-1 font-inter text-xs font-semibold text-white">
            {badgeText}
          </div>
        )}

        <Image
          src={currentImage}
          alt={title || 'Imagen principal'}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Thumbnail Navigation */}
      {displayImages.length > 1 && (
        <div className="flex gap-4">
          {displayImages.slice(0, 4).map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg transition-all ${
                selectedImageIndex === index
                  ? 'ring-2 ring-primary-500'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={image}
                alt={`${title} - vista ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
