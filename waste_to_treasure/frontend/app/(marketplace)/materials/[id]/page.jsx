'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
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
 * Material Details Page (Query Params Version)
 * URL: /materials/detail?id=123
 */
export default function MaterialDetailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const params = useParams()
  // Support both query param version (?id=123) and dynamic route (/materials/123)
  const materialId = searchParams.get('id') || params?.id

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
    if (!materialId) {
      setError('ID de material no especificado')
      setIsLoading(false)
      return
    }

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
      } catch (err) {
        console.error('Error al cargar material:', err)
        setError('Error al cargar los detalles del material')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMaterialData()
  }, [materialId])

  /**
   * Handle add to cart
   */
  const handleAddToCart = async (listingId, quantity) => {
    console.log('Agregar al carrito:', { listingId, quantity })
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
        {/* Material Overview Section */}
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

            {/* What is the Material Made From */}
            {material.origin_description && (
              <div className="mt-8 rounded-lg border border-neutral-300 bg-white p-6">
                <h2 className="mb-4 font-roboto text-2xl font-bold text-neutral-900">
                  ¿De Qué Está Hecho El Material?
                </h2>
                <p className="whitespace-pre-wrap font-inter text-base text-neutral-700">
                  {material.origin_description}
                </p>
              </div>
            )}

            {/* Specifications */}
            <div className="mt-8">
              <SpecificationsTable listing={material} />
            </div>
          </div>

          {/* Right Column - Pricing and Seller */}
          <div className="space-y-6">
            <div className="rounded-lg border border-neutral-300 bg-white p-6">
              <h1 className="mb-2 font-roboto text-3xl font-bold text-neutral-900">
                {material.title}
              </h1>
              <p className="font-inter text-sm text-neutral-600">Material</p>
            </div>

            <PricingCard listing={material} onAddToCart={handleAddToCart} />
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
            <SimilarMaterials materials={similarMaterials} title="Materiales Similares" />
          </div>
        )}
      </div>
    </div>
  )
}
