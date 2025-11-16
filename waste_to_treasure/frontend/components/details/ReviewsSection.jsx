'use client'

import { useState } from 'react'
import { Star, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '@/context/AuthContext'
import reviewsService from '@/lib/api/reviews'

/**
 * Helper function to get user initials from name
 */
function getInitials(fullName) {
  if (!fullName) return 'U'
  
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
 * Only allows verified purchasers to leave reviews
 * Matches Figma design node 6-2574
 */
export default function ReviewsSection({ 
  listingId,
  reviews = [], 
  averageRating = 0, 
  totalReviews = 0,
  userPurchase = null, // { order_item_id, purchased: true/false }
  onReviewSubmitted = () => {}
}) {
  const { isAuthenticated, user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Check if user has already left a review
  const userReview = reviews.find(review => review.reviewer?.user_id === user?.user_id)
  const hasUserReviewed = !!userReview

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    
    if (!userPurchase?.order_item_id || rating === 0) {
      setSubmitError('Debes seleccionar una calificación')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await reviewsService.createReview({
        order_item_id: userPurchase.order_item_id,
        rating: rating,
        comment: comment.trim() || undefined
      })
      
      setSubmitSuccess(true)
      setRating(0)
      setComment('')
      
      // Call parent callback to refresh reviews
      onReviewSubmitted()
      
      // Reset success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000)
    } catch (error) {
      console.error('Error al enviar reseña:', error)
      setSubmitError(
        error.response?.data?.detail || 
        'Error al enviar la reseña. Inténtalo de nuevo.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }
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

      {/* Review Form - Only for verified purchasers who haven't reviewed yet */}
      {isAuthenticated && userPurchase?.purchased && !hasUserReviewed && (
        <div className="border-b border-[rgba(0,0,0,0.2)] pb-[30px] pt-[30px]">
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3">
            <CheckCircle size={20} className="text-green-600" />
            <p className="font-inter text-sm font-medium text-green-800">
              ¡Has comprado este producto! Deja tu reseña
            </p>
          </div>

          {submitSuccess ? (
            <div className="rounded-lg bg-green-100 p-4 text-center">
              <p className="font-inter text-base font-semibold text-green-800">
                ¡Gracias por tu reseña!
              </p>
              <p className="mt-1 font-inter text-sm text-green-700">
                Tu opinión ayuda a otros compradores
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="mb-2 block font-poppins text-lg font-semibold text-black">
                  Tu calificación
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={32}
                        className={
                          star <= (hoveredRating || rating)
                            ? 'fill-[#fbbc05] text-[#fbbc05]'
                            : 'fill-transparent text-[rgba(0,0,0,0.3)]'
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label 
                  htmlFor="comment" 
                  className="mb-2 block font-poppins text-lg font-semibold text-black"
                >
                  Tu reseña (opcional)
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Comparte tu experiencia con este producto..."
                  className="w-full rounded-lg border border-neutral-300 p-3 font-inter text-base focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
                <p className="mt-1 text-right font-inter text-sm text-neutral-500">
                  {comment.length}/500 caracteres
                </p>
              </div>

              {submitError && (
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="font-inter text-sm text-red-700">{submitError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="w-full rounded-lg bg-primary-500 px-6 py-3 font-inter text-base font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Enviando...' : 'Publicar reseña'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Message for users who already reviewed */}
      {isAuthenticated && userPurchase?.purchased && hasUserReviewed && (
        <div className="border-b border-[rgba(0,0,0,0.2)] pb-[30px] pt-[30px]">
          <div className="rounded-lg bg-blue-50 p-4 text-center">
            <CheckCircle size={24} className="mx-auto mb-2 text-blue-600" />
            <p className="font-inter text-base font-semibold text-blue-900">
              Ya has dejado una reseña para este producto
            </p>
            <p className="mt-1 font-inter text-sm text-blue-700">
              Gracias por compartir tu opinión
            </p>
          </div>
        </div>
      )}

      {/* Info message for non-purchasers */}
      {isAuthenticated && !userPurchase?.purchased && (
        <div className="border-b border-[rgba(0,0,0,0.2)] pb-[30px] pt-[30px]">
          <div className="rounded-lg bg-blue-50 p-4 text-center">
            <p className="font-inter text-base text-blue-800">
              Solo los clientes que han comprado este producto pueden dejar reseñas
            </p>
          </div>
        </div>
      )}

      {/* Individual Reviews */}
      <div className="pt-[30px]">
        {reviews.length > 0 ? (
          reviews.slice(0, 3).map((review, index) => {
            const isLast = index === reviews.slice(0, 3).length - 1
            const initials = getInitials(review.reviewer?.full_name)
            const fullName = review.reviewer?.full_name || 'Usuario Anónimo'

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
