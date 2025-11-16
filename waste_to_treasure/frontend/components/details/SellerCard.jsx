'use client'

import Link from 'next/link'
import { Star, User } from 'lucide-react'

/**
 * Seller Card Component
 * Displays seller information from backend
 * Seller data comes from listing.seller object and seller review statistics
 */
export default function SellerCard({ sellerId, seller, sellerStats }) {
  // Extract seller information from the seller object passed from the listing
  const sellerName = seller?.full_name || seller?.business_name || `Vendedor ${sellerId?.substring(0, 8)}`

  // Extract seller statistics from the sellerStats object
  // These stats represent ALL reviews across ALL seller's listings
  const {
    average_rating = 0,
    total_reviews = 0,
    total_listings_reviewed = 0,
  } = sellerStats || {}

  console.log('[SellerCard] Estadísticas recibidas:', {
    sellerId,
    sellerName,
    average_rating,
    total_reviews,
    total_listings_reviewed,
    sellerStats
  })

  return (
    <div className="rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
      {/* Seller Name and Logo */}
      <div className="mb-4 flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-500 font-roboto text-xl font-bold text-white">
          <User size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-roboto text-xl font-bold text-neutral-900">
            {sellerName}
          </h3>
          {total_reviews > 0 ? (
            <div className="mt-1 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star size={16} className="fill-yellow-400 text-yellow-400" />
                <span className="font-inter text-sm font-medium text-neutral-900">
                  {average_rating.toFixed(1)}
                </span>
              </div>
              <span className="font-inter text-sm text-neutral-600">
                ({total_reviews} {total_reviews === 1 ? 'reseña' : 'reseñas'})
              </span>
            </div>
          ) : (
            <p className="mt-1 font-inter text-sm text-neutral-500">
              Sin reseñas aún
            </p>
          )}
        </div>
      </div>

      {/* Seller Info */}
      {(total_reviews > 0 || total_listings_reviewed > 0) && (
        <div className="mb-4 space-y-2 border-t border-neutral-200 pt-4">
          {total_listings_reviewed > 0 && (
            <div className="flex items-center justify-between">
              <span className="font-inter text-sm text-neutral-600">Productos con reseñas</span>
              <span className="font-inter text-sm font-medium text-neutral-900">
                {total_listings_reviewed}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Contact Actions */}
      <div className="space-y-2">
        <Link
          href={`/sellers/${sellerId}`}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2 font-inter text-sm font-medium text-white transition-colors hover:bg-primary-600"
        >
          <User size={18} />
          Ver Perfil Completo
        </Link>
      </div>
    </div>
  )
}
