'use client'

import Image from 'next/image'
import { User } from 'lucide-react'
import { useState } from 'react'

/**
 * Helper function to get user initials from name
 */
function getInitials(fullName) {
  if (!fullName || fullName.trim() === '') return 'U'
  
  const nameParts = fullName.trim().split(' ')
  if (nameParts.length === 1) {
    // Solo un nombre, usar las primeras dos letras
    return nameParts[0].substring(0, 2).toUpperCase()
  }
  
  // Tomar primera letra del primer y último nombre
  const first = nameParts[0].charAt(0).toUpperCase()
  const last = nameParts[nameParts.length - 1].charAt(0).toUpperCase()
  return `${first}${last}`
}

/**
 * Helper function to generate consistent color for each user
 */
function getUserColor(userId) {
  if (!userId) return '#7b3ff2' // Color morado por defecto
  
  // Colores consistentes basados en hash del userId
  const colors = [
    '#7b3ff2', // Morado
    '#396530', // Verde
    '#2563eb', // Azul
    '#dc2626', // Rojo
    '#ea580c', // Naranja
    '#7c3aed', // Violeta
    '#0891b2', // Cyan
    '#65a30d', // Lima
    '#c026d3', // Fucsia
    '#0284c7', // Azul cielo
  ]
  
  // Generar hash simple del userId
  let hash = 0
  const str = userId.toString()
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // Usar el hash para seleccionar un color
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

/**
 * UserAvatar Component
 * Displays user profile image with fallback to initials
 * 
 * @param {string} imageUrl - URL de la imagen de perfil del usuario
 * @param {string} fullName - Nombre completo del usuario para generar iniciales
 * @param {string} userId - ID del usuario para generar color consistente
 * @param {string} size - Tamaño: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 * @param {string} className - Clases adicionales de Tailwind
 * @param {boolean} showIcon - Si mostrar icono User cuando no hay imagen ni nombre
 */
export default function UserAvatar({
  imageUrl,
  fullName,
  userId,
  size = 'md',
  className = '',
  showIcon = false,
}) {
  const initials = getInitials(fullName)
  const bgColor = getUserColor(userId)
  const hasImage = imageUrl && imageUrl.trim() !== ''
  const [imageError, setImageError] = useState(false)
  const shouldRenderImage = hasImage && !imageError

  // Definir tamaños
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-12 w-12 text-xl',
    lg: 'h-16 w-16 text-2xl',
    xl: 'h-20 w-20 text-3xl',
    '2xl': 'h-[67px] w-[67px] text-[32px]', // Tamaño específico para ReviewsSection
  }

  const iconSizes = {
    xs: 12,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 40,
    '2xl': 34,
  }

  return (
    <div
      className={`relative flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: hasImage ? 'transparent' : bgColor }}
    >
      {shouldRenderImage ? (
        <Image
          src={imageUrl}
          alt={fullName || 'Usuario'}
          fill
          className="object-cover"
          unoptimized={imageUrl.startsWith('blob:')}
          onError={() => {
            // Marcar que la imagen falló para mostrar el fallback
            setImageError(true)
          }}
        />
      ) : showIcon && !fullName ? (
        <User size={iconSizes[size]} className="text-white" />
      ) : (
        <span className="font-poppins font-bold leading-normal text-white">
          {initials}
        </span>
      )}
    </div>
  )
}
