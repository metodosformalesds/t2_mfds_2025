'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import listingsService from '@/lib/api/listings'
import { useCartStore } from '@/stores/useCartStore'
import ImageGallery from '@/components/details/ImageGallery'
import PricingCard from '@/components/details/PricingCard'
import SellerCard from '@/components/details/SellerCard'
import SpecificationsTable from '@/components/details/SpecificationsTable'
import ReviewsSection from '@/components/details/ReviewsSection'
import SimilarMaterials from '@/components/details/SimilarMaterials'

export default function ProductDetailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const params = useParams()
  const productId = searchParams.get('id') || params?.id

  const { addItem } = useCartStore()
  const [product, setProduct] = useState(null)
  const [similarProducts, setSimilarProducts] = useState([])
  const [reviews, setReviews] = useState([])
  const [reviewStats, setReviewStats] = useState({ average_rating: 0, total_reviews: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [addToCartMessage, setAddToCartMessage] = useState(null)

  /**
   * Fetch product data from API
   */
  useEffect(() => {
    if (!productId) {
      setError('ID de producto no especificado')
      setIsLoading(false)
      return
    }

    const fetchProductData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch main product data
        const productData = await listingsService.getById(productId)
        setProduct(productData)

        // Fetch similar products (same category)
        if (productData.category_id) {
          const similarData = await listingsService.getAll({
            listing_type: 'PRODUCT',
            category_id: productData.category_id,
            page: 1,
            page_size: 5,
          })
          // Filter out current product
          const filtered = similarData.items.filter(
            (item) => item.listing_id !== productData.listing_id
          )
          setSimilarProducts(filtered)
        }
      } catch (err) {
        console.error('Error al cargar producto:', err)
        setError('Error al cargar los detalles del producto')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProductData()
  }, [productId])

  /**
   * Handle add to cart
   */
  const handleAddToCart = async (listingId, quantity) => {
    try {
      setAddToCartMessage(null)
      await addItem(listingId, quantity)
      setAddToCartMessage({ type: 'success', text: `${quantity} unidad(es) agregada(s) al carrito` })
      setTimeout(() => setAddToCartMessage(null), 3000)
    } catch (err) {
      console.error('Error al agregar al carrito:', err)
      setAddToCartMessage({ type: 'error', text: 'Error al agregar al carrito. Intenta de nuevo.' })
      setTimeout(() => setAddToCartMessage(null), 3000)
    }
  }

  /**
   * Loading State
   */
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <p className="font-inter text-lg text-neutral-600">Cargando producto...</p>
        </div>
      </div>
    )
  }

  /**
   * Error State
   */
  if (error || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <div className="text-center">
          <p className="mb-4 font-roboto text-xl font-semibold text-neutral-900">
            {error || 'Producto no encontrado'}
          </p>
          <button
            onClick={() => router.push('/products')}
            className="rounded-lg bg-primary-500 px-6 py-3 font-inter text-white transition-colors hover:bg-primary-600"
          >
            Volver a productos
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Toast Messages */}
      {addToCartMessage && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg font-inter text-white transition-all ${
            addToCartMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {addToCartMessage.text}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="bg-white px-4 py-4 sm:px-6 lg:px-[220px]">
        <nav className="flex items-center gap-2 font-inter text-sm text-neutral-600">
          <Link href="/" className="hover:text-primary-500">
            Inicio
          </Link>
          <ChevronRight size={16} />
          <Link href="/products" className="hover:text-primary-500">
            Productos
          </Link>
          <ChevronRight size={16} />
          <span className="font-medium text-neutral-900">{product.title}</span>
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
              images={product.images || []}
              title={product.title}
              listingType={product.listing_type}
            />

            {/* Description */}
            <div className="mt-8 rounded-lg border border-neutral-300 bg-white p-6">
              <h2 className="mb-4 font-roboto text-2xl font-bold text-neutral-900">
                Descripción
              </h2>
              <p className="whitespace-pre-wrap font-inter text-base text-neutral-700">
                {product.description}
              </p>
            </div>

            {/* Specifications */}
            <div className="mt-8">
              <SpecificationsTable listing={product} />
            </div>
          </div>

          {/* Right Column - Pricing and Seller */}
          <div className="space-y-6">
            <div className="rounded-lg border border-neutral-300 bg-white p-6">
              <h1 className="mb-2 font-roboto text-3xl font-bold text-neutral-900">
                {product.title}
              </h1>
              <p className="font-inter text-sm text-neutral-600">Producto</p>
            </div>

            <PricingCard listing={product} onAddToCart={handleAddToCart} />
            <SellerCard sellerId={product.seller_id} sellerStats={reviewStats} />
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

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div>
            <SimilarMaterials materials={similarProducts} title="Productos Similares" />
          </div>
        )}
      </div>
    </div>
  )
}
