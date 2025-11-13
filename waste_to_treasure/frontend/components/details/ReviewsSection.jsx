'use client'

import { Star } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Helper function to get user initials from name
 */
function getInitials(firstName, lastName) {
  const first = firstName?.charAt(0)?.toUpperCase() || ''
  const last = lastName?.charAt(0)?.toUpperCase() || ''
  return `${first}${last}` || 'U'
}

/**
 * Helper function to format relative time
 */
function getRelativeTime(date) {
  if (!date) return 'Fecha no disponible'

  try {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: es,
    })
  } catch (error) {
    return 'Fecha no disponible'
  }
}

/**
 * Reviews Section Component
 * Displays customer reviews from backend API
 * Data comes from /reviews/listing/{listing_id} endpoint
 * Matches Figma design node 6-2574
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
    <div className="rounded-lg bg-[#fcfcfc] p-[25px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.25)]">
      {/* Titulo Section */}
      <div className="border-b border-[rgba(0,0,0,0.2)] pb-[30px] pt-[10px]">
        <p className="mb-[10px] font-poppins text-[36px] font-bold leading-normal text-black">
          Reseñas de Clientes
        </p>

        {/* Overall Rating Summary */}
        <div className="flex gap-[10px]">
          {/* Calificacion - Average Rating */}
          <div className="flex flex-col items-center px-[30px]">
            <p
              className="font-roboto text-[100px] font-black leading-normal text-[#396530]"
              style={{ fontVariationSettings: "'wdth' 100" }}
            >
              {averageRating.toFixed(1)}
            </p>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={24}
                  className={
                    star <= Math.round(averageRating)
                      ? 'fill-[#fbbc05] text-[#fbbc05]'
                      : 'fill-transparent text-[rgba(0,0,0,0.3)]'
                  }
                />
              ))}
            </div>
            <p
              className="mt-2 font-roboto text-[18px] font-normal text-[rgba(0,0,0,0.7)]"
              style={{ fontVariationSettings: "'wdth' 100" }}
            >
              Basado en {totalReviews} reseña{totalReviews !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Rating Bars */}
          <div className="flex flex-1 items-start justify-between px-[5px]">
            {/* Labels - star counts */}
            <div className="flex h-full flex-col justify-between font-roboto text-[18px] font-normal text-[rgba(0,0,0,0.7)]">
              <p style={{ fontVariationSettings: "'wdth' 100" }}>5 estrellas</p>
              <p style={{ fontVariationSettings: "'wdth' 100" }}>4 estrellas</p>
              <p style={{ fontVariationSettings: "'wdth' 100" }}>3 estrellas</p>
              <p style={{ fontVariationSettings: "'wdth' 100" }}>2 estrellas</p>
              <p style={{ fontVariationSettings: "'wdth' 100" }}>1 estrella</p>
            </div>

            {/* Progress Bars */}
            <div className="flex h-full flex-1 flex-col justify-between px-[10px]">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingDistribution[rating] || 0
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0

                return (
                  <div
                    key={rating}
                    className="relative h-[21px] w-full overflow-hidden rounded-[6px] bg-[rgba(0,0,0,0.15)]"
                  >
                    <div
                      className="h-full rounded-[6px] bg-[#fbbc05] transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )
              })}
            </div>

            {/* Count numbers */}
            <div className="flex h-full flex-col justify-between font-roboto text-[18px] font-normal text-[rgba(0,0,0,0.7)]">
              {[5, 4, 3, 2, 1].map((rating) => (
                <p key={rating} style={{ fontVariationSettings: "'wdth' 100" }}>
                  {ratingDistribution[rating] || 0}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="pt-[30px]">
        {reviews.length > 0 ? (
          reviews.slice(0, 3).map((review, index) => {
            const isLast = index === reviews.slice(0, 3).length - 1
            const initials = getInitials(
              review.reviewer?.first_name,
              review.reviewer?.last_name
            )
            const fullName = `${review.reviewer?.first_name || 'Usuario'} ${review.reviewer?.last_name || ''}`

            return (
              <div
                key={review.review_id}
                className={`flex flex-col gap-[10px] ${!isLast ? 'border-b border-[rgba(0,0,0,0.2)] pb-[20px]' : ''} ${index > 0 ? 'pt-[20px]' : ''}`}
              >
                {/* Header with user info and rating */}
                <div className="flex items-center justify-between px-[10px]">
                  {/* User profile */}
                  <div className="flex items-center gap-[20px]">
                    {/* Avatar with initials */}
                    <div className="relative flex h-[67px] w-[67px] items-center justify-center rounded-full bg-[#7b3ff2]">
                      <p className="font-poppins text-[32px] font-bold leading-normal text-white">
                        {initials}
                      </p>
                    </div>

                    {/* Name and time */}
                    <div className="flex flex-col gap-[5px]">
                      <p className="font-poppins text-[24px] font-bold leading-normal text-black">
                        {fullName}
                      </p>
                      <div className="flex gap-[10px]">
                        <p
                          className="font-roboto text-[18px] font-medium text-[rgba(0,0,0,0.6)]"
                          style={{ fontVariationSettings: "'wdth' 100" }}
                        >
                          {getRelativeTime(review.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={24}
                        className={
                          star <= review.rating
                            ? 'fill-[#fbbc05] text-[#fbbc05]'
                            : 'fill-transparent text-[rgba(0,0,0,0.3)]'
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* Review Comment */}
                <div className="flex flex-col gap-[10px] px-[10px]">
                  {review.comment && (
                    <p className="font-inter text-[18px] font-normal leading-normal text-black">
                      {review.comment}
                    </p>
                  )}

                  {/* Review Images - placeholder for future implementation */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-[23px]">
                      {review.images.slice(0, 4).map((image, idx) => (
                        <div
                          key={idx}
                          className="h-[98px] w-[150px] rounded-[4px] bg-neutral-200"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <p className="py-[20px] text-center font-inter text-[18px] text-[rgba(0,0,0,0.6)]">
            Aún no hay reseñas para este producto
          </p>
        )}
      </div>
    </div>
  )
}
