'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Calendar, MapPin, Star, Package, ShoppingCart, Clock } from 'lucide-react'
import UserAvatar from '@/components/ui/UserAvatar'
import sellersService from '@/lib/api/sellers'
import listingsService from '@/lib/api/listings'
import MaterialCard from '@/components/marketplace/MaterialCard'
import ProductCard from '@/components/marketplace/ProductCard'

/**
 * Seller Profile Page (Material Seller)
 * Displays public seller profile with their listings and reviews
 * All data comes from backend API
 */
export default function SellerProfilePage() {
  const params = useParams()
  const router = useRouter()
  const sellerId = params.id

  // State management
  const [seller, setSeller] = useState(null)
  const [stats, setStats] = useState(null)
  const [listings, setListings] = useState([])
  const [reviews, setReviews] = useState([])
  const [activeTab, setActiveTab] = useState('listings') // 'listings' or 'reviews'
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Fetch seller data from API
   */
  useEffect(() => {
    const fetchSellerData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch seller info and stats in parallel
        const [sellerData, statsData] = await Promise.all([
          sellersService.getById(sellerId),
          sellersService.getStats(sellerId),
        ])

        setSeller(sellerData)
        setStats(statsData)

        // Fetch seller's listings
        const listingsData = await sellersService.getListings(sellerId, {
          page: 1,
          page_size: 100,
        })
        setListings(listingsData.items || [])

        // Fetch seller's reviews
        const reviewsData = await sellersService.getReviews(sellerId, {
          page: 1,
          page_size: 10,
        })
        setReviews(reviewsData.items || [])
      } catch (err) {
        console.error('Error al cargar datos del vendedor:', err)
        setError('Error al cargar el perfil del vendedor')
      } finally {
        setIsLoading(false)
      }
    }

    if (sellerId) {
      fetchSellerData()
    }
  }, [sellerId])

  /**
   * Loading State
   */
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <p className="font-inter text-lg text-neutral-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  /**
   * Error State
   */
  if (error || !seller) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <div className="text-center">
          <p className="mb-4 font-roboto text-xl font-semibold text-neutral-900">
            {error || 'Vendedor no encontrado'}
          </p>
          <button
            onClick={() => router.push('/materials')}
            className="rounded-lg bg-primary-500 px-6 py-3 font-inter text-white transition-colors hover:bg-primary-600"
          >
            Volver al marketplace
          </button>
        </div>
      </div>
    )
  }

  const memberSince = seller.created_at
    ? new Date(seller.created_at).getFullYear()
    : new Date().getFullYear()

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Hero Section */}
      <section className="bg-primary-600 px-4 pb-16 pt-20 sm:px-6 lg:px-[200px]">
        <div className="flex flex-col gap-[60px] lg:flex-row lg:items-center">
          {/* Profile Picture */}
          <div className="flex justify-center lg:justify-start">
            <UserAvatar
              imageUrl={seller.profile_image_url}
              fullName={seller.business_name}
              userId={sellerId}
              size="xl"
              className="h-[280px] w-[280px] border-[5px] border-white shadow-lg text-[80px]"
              showIcon={true}
            />
          </div>

          {/* Seller Info */}
          <div className="flex-1 space-y-[15px] text-white">
            {/* Badge */}
            <div className="inline-block rounded-[20px] bg-primary-700 px-[20px] py-[10px]">
              <p className="font-roboto text-[18px] font-medium">
                {seller.seller_type === 'INDUSTRIAL' ? 'Proveedor Industrial' : 'Productor Local'}
              </p>
            </div>

            {/* Business Name */}
            <h1 className="font-poppins text-[52px] font-bold leading-tight">
              {seller.business_name}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-[25px]">
              <div className="flex items-center gap-[10px]">
                <Calendar size={48} />
                <p className="font-roboto text-[18px] font-medium">
                  Miembro desde {memberSince}
                </p>
              </div>
              <div className="flex items-center gap-[10px]">
                <MapPin size={48} />
                <p className="font-roboto text-[18px] font-medium">
                  {seller.city || 'Ciudad Juárez'}, {seller.state || 'Chihuahua'}
                </p>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-[20px]">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={48}
                    className={
                      star <= Math.round(stats?.average_rating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-400 text-gray-400'
                    }
                  />
                ))}
              </div>
              <p className="font-roboto text-[32px] font-bold">
                {stats?.average_rating?.toFixed(1) || '0.0'}
              </p>
              <p className="font-roboto text-[18px] font-bold text-white/80">
                ({stats?.total_reviews || 0} reseñas)
              </p>
            </div>

            {/* Description */}
            <p className="max-w-[720px] font-inter text-[18px] font-medium leading-relaxed">
              {seller.description ||
                'Empresa líder en la industria con compromiso con la calidad y sostenibilidad.'}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="px-4 py-16 sm:px-6 lg:px-[200px]">
        <div className="grid grid-cols-1 gap-[40px] md:grid-cols-3">
          {/* Materials Published */}
          <div className="rounded-[10px] border border-neutral-400 bg-white p-[40px] text-center shadow-sm">
            <p className="mb-[20px] font-roboto text-[56px] font-black text-primary-500">
              {stats?.total_listings || 0}
            </p>
            <p className="font-roboto text-[24px] font-black text-neutral-600">
              Materiales Publicados
            </p>
          </div>

          {/* Sales Completed */}
          <div className="rounded-[10px] border border-neutral-400 bg-white p-[40px] text-center shadow-sm">
            <p className="mb-[20px] font-roboto text-[56px] font-black text-primary-500">
              {stats?.total_sales || 0}
            </p>
            <p className="font-roboto text-[24px] font-black text-neutral-600">
              Ventas Completadas
            </p>
          </div>

          {/* Response Time */}
          <div className="rounded-[10px] border border-neutral-400 bg-white p-[40px] text-center shadow-sm">
            <p className="mb-[20px] font-roboto text-[56px] font-black text-primary-500">
              {stats?.response_time || '24h'}
            </p>
            <p className="font-roboto text-[24px] font-black text-neutral-600">
              Tiempo de respuesta
            </p>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="px-4 pb-12 sm:px-6 lg:px-[200px]">
        <div className="rounded-[10px] bg-white shadow-md">
          {/* Tabs Header */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('listings')}
              className={`flex-1 border-b-[5px] px-[10px] py-[40px] text-center font-roboto text-[26px] font-medium transition-colors ${
                activeTab === 'listings'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              En venta ({listings.length})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 border-b-[5px] px-[10px] py-[40px] text-center font-roboto text-[26px] font-medium transition-colors ${
                activeTab === 'reviews'
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              Reseñas ({reviews.length})
            </button>
          </div>

          {/* Tabs Content */}
          <div className="p-[40px]">
            {activeTab === 'listings' ? (
              /* Listings Grid */
              listings.length > 0 ? (
                <div className="grid grid-cols-1 gap-[30px] md:grid-cols-2 lg:grid-cols-3">
                  {listings.slice(0, 9).map((listing) => (
                    <MaterialCard
                      key={listing.listing_id}
                      material={{
                        id: listing.listing_id,
                        title: listing.title,
                        seller: seller.business_name,
                        price: parseFloat(listing.price),
                        unit: listing.price_unit || 'KG',
                        available: listing.quantity,
                        unit_measure: listing.price_unit || 'Tonelada',
                        isResidue: listing.listing_type === 'MATERIAL',
                        imageUrl:
                          listing.primary_image_url || '/placeholder-material.jpg',
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Package size={64} className="mx-auto mb-4 text-neutral-400" />
                  <p className="font-roboto text-xl font-semibold text-neutral-600">
                    No hay materiales en venta actualmente
                  </p>
                </div>
              )
            ) : (
              /* Reviews List */
              reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review, index) => {
                    const reviewerName = review.reviewer?.full_name || 'Usuario Anónimo'
                    
                    // Obtener información del listing desde la reseña o cruzar con listings
                    let listing = null
                    
                    // Primero intentar desde el objeto listing de la review
                    if (review.listing && review.listing.title) {
                      listing = review.listing
                    } 
                    // Si no, buscar en el array de listings del vendedor
                    else if (review.listing_id) {
                      listing = listings.find(l => l.listing_id === review.listing_id)
                    }
                    
                    // Fallback a objeto vacío
                    listing = listing || {}
                    
                    const listingTitle = listing.title || `Producto #${review.listing_id || 'desconocido'}`
                    const listingPrice = listing.price ? `$${parseFloat(listing.price).toFixed(2)}` : null
                    const listingType = listing.listing_type === 'MATERIAL' ? 'Material' : 'Producto'
                    const listingImage = listing.primary_image_url || listing.images?.[0]?.image_url || '/placeholder-material.jpg'
                    const listingUrl = listing.listing_id ? (
                      listing.listing_type === 'MATERIAL' 
                        ? `/materials/${listing.listing_id}` 
                        : `/products/${listing.listing_id}`
                    ) : null
                    
                    return (
                      <div
                        key={review.review_id || index}
                        className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                      >
                        {/* Header: Reviewer info y Rating */}
                          <div className="mb-4 flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              imageUrl={review.reviewer?.profile_image_url}
                              fullName={review.reviewer?.full_name}
                              userId={review.reviewer?.user_id}
                              size="md"
                            />
                            <div>
                              <p className="font-roboto text-lg font-semibold text-neutral-900">
                                {reviewerName}
                              </p>
                              <p className="font-inter text-sm text-neutral-600">
                                {new Date(review.created_at).toLocaleDateString('es-MX', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={24}
                                className={
                                  star <= review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'fill-gray-300 text-gray-300'
                                }
                              />
                            ))}
                          </div>
                        </div>
                        
                        {/* Producto reseñado - Card mejorada */}
                        <div className="mb-4 overflow-hidden rounded-lg border border-neutral-300 bg-white shadow-sm">
                          <div className="flex gap-4 p-4">
                            {/* Imagen del producto */}
                            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100 shadow-sm">
                              <img 
                                src={listingImage} 
                                alt={listingTitle}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.target.src = '/placeholder-material.jpg'
                                }}
                              />
                            </div>
                            
                            {/* Info del producto */}
                            <div className="flex flex-1 flex-col justify-between">
                              {/* Header con badge y precio */}
                              <div className="mb-2 flex items-start justify-between gap-2">
                                <span className="inline-block rounded-full bg-primary-500 px-3 py-1 font-inter text-xs font-semibold text-white">
                                  {listingType}
                                </span>
                                {listingPrice && (
                                  <span className="font-roboto text-xl font-bold text-primary-600">
                                    {listingPrice}
                                  </span>
                                )}
                              </div>
                              
                              {/* Título del producto */}
                              <h4 className="mb-2 line-clamp-2 font-poppins text-lg font-bold text-neutral-900">
                                {listingTitle}
                              </h4>
                              
                              {/* Link al producto */}
                              {listingUrl && listing.listing_id && (
                                <a
                                  href={listingUrl}
                                  className="inline-flex w-fit items-center gap-1 rounded-md bg-primary-50 px-3 py-1.5 font-inter text-sm font-semibold text-primary-600 transition-all hover:bg-primary-100 hover:text-primary-700"
                                >
                                  Ver producto →
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Comentario */}
                        {review.comment ? (
                          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                            <p className="font-inter text-base leading-relaxed text-neutral-800">
                              <span className="font-semibold text-neutral-600">"</span>
                              {review.comment}
                              <span className="font-semibold text-neutral-600">"</span>
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-3">
                            <p className="text-center font-inter text-sm italic text-neutral-500">
                              Sin comentarios adicionales
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Star size={64} className="mx-auto mb-4 text-neutral-400" />
                  <p className="font-roboto text-xl font-semibold text-neutral-600">
                    No hay reseñas todavía
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
