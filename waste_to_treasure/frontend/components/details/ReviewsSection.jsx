'use client'

import { Star } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Reviews Section Component
 * Displays customer reviews from backend API
 * Data comes from /reviews/listing/{listing_id} endpoint
 */
export default function ReviewsSection({ reviews = [], averageRating = 0, totalReviews = 0 }) {
  // Rating distribution (from 1 to 5 stars)
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }

  // Calculate distribution from reviews
  reviews.forEach((review) => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingDistribution[review.rating]++
    }
  })

  return (
    <div className="rounded-lg border border-neutral-300 bg-white p-6">
      <h3 className="mb-6 font-roboto text-2xl font-bold text-neutral-900">
        Reseñas de Clientes
      </h3>

      {/* Overall Rating Summary */}
      <div className="mb-8 flex items-start gap-8">
        {/* Average Rating */}
        <div className="text-center">
          <div className="mb-2 font-roboto text-5xl font-bold text-neutral-900">
            {averageRating.toFixed(1)}
          </div>
          <div className="mb-1 flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={20}
                className={
                  star <= Math.round(averageRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-neutral-300'
                }
              />
            ))}
          </div>
          <p className="font-inter text-sm text-neutral-600">
            Basado en {totalReviews} reseña{totalReviews !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Rating Bars */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingDistribution[rating] || 0
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0

            return (
              <div key={rating} className="flex items-center gap-3">
                <span className="w-8 font-inter text-sm text-neutral-900">{rating}</span>
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className="h-full bg-yellow-400 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right font-inter text-sm text-neutral-600">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Individual Reviews */}
      {reviews.length > 0 ? (
        <div className="space-y-6 border-t border-neutral-200 pt-6">
          {reviews.slice(0, 3).map((review) => (
            <div key={review.review_id} className="border-b border-neutral-200 pb-6 last:border-0">
              {/* Reviewer Info */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 font-roboto font-bold text-white">
                    {review.reviewer?.first_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-inter text-sm font-medium text-neutral-900">
                      {review.reviewer?.first_name || 'Usuario'}{' '}
                      {review.reviewer?.last_name?.[0] || ''}.
                    </p>
                    <p className="font-inter text-xs text-neutral-600">
                      {review.created_at
                        ? format(new Date(review.created_at), "d 'de' MMMM, yyyy", {
                            locale: es,
                          })
                        : 'Fecha no disponible'}
                    </p>
                  </div>
                </div>

                {/* Rating Stars */}
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={
                        star <= review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-neutral-300'
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Review Comment */}
              {review.comment && (
                <p className="font-inter text-sm text-neutral-700">{review.comment}</p>
              )}
            </div>
          ))}

          {/* Show More Button */}
          {reviews.length > 3 && (
            <button className="w-full rounded-lg border border-primary-500 bg-white px-4 py-2 font-inter text-sm font-medium text-primary-500 transition-colors hover:bg-primary-50">
              Ver todas las reseñas ({totalReviews})
            </button>
          )}
        </div>
      ) : (
        <p className="border-t border-neutral-200 pt-6 text-center font-inter text-sm text-neutral-600">
          Aún no hay reseñas para este producto
        </p>
      )}
    </div>
  )
}
