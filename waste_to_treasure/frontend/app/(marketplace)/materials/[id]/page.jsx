'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import listingsService from '@/lib/api/listings'
import ImageGallery from '@/components/details/ImageGallery'
import PricingCard from '@/components/details/PricingCard'
import SellerCard from '@/components/details/SellerCard'
import SpecificationsTable from '@/components/details/SpecificationsTable'
import ReviewsSection from '@/components/details/ReviewsSection'
import SimilarMaterials from '@/components/details/SimilarMaterials'

/**
 * Material Details Page
 * Displays full information about a material
 * All data comes from backend API
 */
export default function MaterialDetailPage() {
  const params = useParams()
  const router = useRouter()
  const materialId = params.id

  // State management
  const [material, setMaterial] = useState(null)
  const [similarMaterials, setSimilarMaterials] = useState([])
  const [reviews, setReviews] = useState([])
  const [reviewStats, setReviewStats] = useState({ average_rating: 0, total_reviews: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Fetch material data from API
   */
  useEffect(() => {
    const fetchMaterialData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch main material data
        const materialData = await listingsService.getById(materialId)
        setMaterial(materialData)

        // Fetch similar materials (same category)
        if (materialData.category_id) {
          const similarData = await listingsService.getAll({
            listing_type: 'MATERIAL',
            category_id: materialData.category_id,
            page: 1,
            page_size: 5,
          })
          // Filter out current material
          const filtered = similarData.items.filter(
            (item) => item.listing_id !== materialData.listing_id
          )
          setSimilarMaterials(filtered)
        }

        // TODO: Fetch reviews from reviews endpoint when available
        // const reviewsData = await reviewsService.getByListing(materialId)
        // setReviews(reviewsData.items)
        // setReviewStats({
        //   average_rating: reviewsData.average_rating,
        //   total_reviews: reviewsData.total
        // })
      } catch (err) {
        console.error('Error al cargar material:', err)
        setError('Error al cargar los detalles del material')
      } finally {
        setIsLoading(false)
      }
    }

    if (materialId) {
      fetchMaterialData()
    }
  }, [materialId])

  /**
   * Handle add to cart
   */
  const handleAddToCart = async (listingId, quantity) => {
    // TODO: Implement cart functionality
    console.log('Agregar al carrito:', { listingId, quantity })
    // You would call your cart API here
    alert(`Agregado al carrito: ${quantity} unidades`)
  }

  /**
   * Loading State
   */
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <p className="font-inter text-lg text-neutral-600">Cargando material...</p>
        </div>
      </div>
    )
  }

  /**
   * Error State
   */
  if (error || !material) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <div className="text-center">
          <p className="mb-4 font-roboto text-xl font-semibold text-neutral-900">
            {error || 'Material no encontrado'}
          </p>
          <button
            onClick={() => router.push('/materials')}
            className="rounded-lg bg-primary-500 px-6 py-3 font-inter text-white transition-colors hover:bg-primary-600"
          >
            Volver a materiales
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Breadcrumb */}
      <div className="bg-white px-4 py-4 sm:px-6 lg:px-[220px]">
        <nav className="flex items-center gap-2 font-inter text-sm text-neutral-600">
          <Link href="/" className="hover:text-primary-500">
            Inicio
          </Link>
          <ChevronRight size={16} />
          <Link href="/materials" className="hover:text-primary-500">
            Materiales
          </Link>
          <ChevronRight size={16} />
          <span className="font-medium text-neutral-900">{material.title}</span>
        </nav>
      </div>

      {/* Back Button */}
      <div className="px-4 py-6 sm:px-6 lg:px-[220px]">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 font-inter text-sm text-neutral-600 transition-colors hover:text-primary-500"
        >
          <ArrowLeft size={16} />
          Volver
        </button>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-12 sm:px-6 lg:px-[220px]">
        {/* Product Overview Section */}
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column - Image Gallery */}
          <div className="lg:col-span-2">
            <ImageGallery
              images={material.images || []}
              title={material.title}
              listingType={material.listing_type}
            />

            {/* Description */}
            <div className="mt-8 rounded-lg border border-neutral-300 bg-white p-6">
              <h2 className="mb-4 font-roboto text-2xl font-bold text-neutral-900">
                Descripción
              </h2>
              <p className="whitespace-pre-wrap font-inter text-base text-neutral-700">
                {material.description}
              </p>
            </div>

            {/* Specifications */}
            <div className="mt-8">
              <SpecificationsTable listing={material} />
            </div>
          </div>

          {/* Right Column - Pricing and Seller */}
          <div className="space-y-6">
            {/* Material Title (mobile only) */}
            <div className="lg:hidden">
              <h1 className="mb-2 font-roboto text-3xl font-bold text-neutral-900">
                {material.title}
              </h1>
              <p className="font-inter text-sm text-neutral-600">
                {material.listing_type === 'MATERIAL' ? 'Material' : 'Producto'}
              </p>
            </div>

            {/* Material Title (desktop) */}
            <div className="hidden rounded-lg border border-neutral-300 bg-white p-6 lg:block">
              <h1 className="mb-2 font-roboto text-3xl font-bold text-neutral-900">
                {material.title}
              </h1>
              <p className="font-inter text-sm text-neutral-600">
                {material.listing_type === 'MATERIAL' ? 'Material' : 'Producto'}
              </p>
            </div>

            {/* Pricing Card */}
            <PricingCard listing={material} onAddToCart={handleAddToCart} />

            {/* Seller Card */}
            <SellerCard sellerId={material.seller_id} sellerStats={reviewStats} />
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mb-8">
          <ReviewsSection
            reviews={reviews}
            averageRating={reviewStats.average_rating}
            totalReviews={reviewStats.total_reviews}
          />
        </div>

        {/* Similar Materials */}
        {similarMaterials.length > 0 && (
          <div>
            <SimilarMaterials materials={similarMaterials} />
          </div>
        )}
      </div>
    </div>
  )
}
