'use client'

import Link from 'next/link'
import { Star, MessageCircle, User } from 'lucide-react'

/**
 * Seller Card Component
 * Displays seller information from backend
 * Seller data comes from listing.seller object
 */
export default function SellerCard({ sellerId, seller, sellerStats }) {
  // Extract seller information from the seller object passed from the listing
  const sellerName = seller?.full_name || `Vendedor ${sellerId?.substring(0, 8)}`

  const {
    average_rating = 0,
    total_reviews = 0,
    year_founded = new Date().getFullYear(),
  } = sellerStats || {}

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
          {total_reviews > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star size={16} className="fill-yellow-400 text-yellow-400" />
                <span className="font-inter text-sm font-medium text-neutral-900">
                  {average_rating.toFixed(1)}
                </span>
              </div>
              <span className="font-inter text-sm text-neutral-600">
                ({total_reviews} reseñas)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Seller Info */}
      {year_founded && (
        <div className="mb-4 space-y-2 border-t border-neutral-200 pt-4">
          <div className="flex items-center justify-between">
            <span className="font-inter text-sm text-neutral-600">Miembro desde</span>
            <span className="font-inter text-sm font-medium text-neutral-900">
              {year_founded}
            </span>
          </div>
        </div>
      )}

      {/* Contact Actions */}
      <div className="space-y-2">
        <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary-500 bg-white px-4 py-2 font-inter text-sm font-medium text-primary-500 transition-colors hover:bg-primary-50">
          <MessageCircle size={18} />
          Contactar al vendedor
        </button>
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
