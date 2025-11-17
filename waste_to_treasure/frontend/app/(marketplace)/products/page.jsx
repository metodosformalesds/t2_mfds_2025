/**
 * Autor: Arturo Perez Gonzalez
 * Fecha: 09/11/2024
 * Descripción: Página principal del catálogo de productos B2C.
 *              Muestra listado de productos con búsqueda, filtros, ordenamiento y paginación.
 */

'use client'

import { useState, useEffect } from 'react'
import SearchBar from '@/components/marketplace/SearchBar'
import FilterSection from '@/components/marketplace/FilterSection'
import SortDropdown from '@/components/marketplace/SortDropdown'
import ProductCard from '@/components/marketplace/ProductCard'
import Pagination from '@/components/marketplace/Pagination'
import listingsService from '@/lib/api/listings'

export default function ProductsPage() {
  // Estados de UI
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [sortOption, setSortOption] = useState('Más recientes')
  const [filters, setFilters] = useState({})

  // Estados de datos de la API
  const [products, setProducts] = useState([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const pageSize = 9 // 9 productos por página (3x3 grid)

  /**
   * Autor: Arturo Perez Gonzalez
   * Descripción: Carga productos desde la API aplicando filtros, búsqueda y paginación.
   * Parámetros: Ninguno (usa estados del componente)
   * Retorna: Promise<void>
   */
  const fetchProducts = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Construir parámetros de búsqueda
      const params = {
        listing_type: 'PRODUCT',
        page: currentPage,
        page_size: pageSize,
      }

      // Agregar búsqueda si existe
      if (searchTerm && searchTerm.length >= 3) {
        params.search = searchTerm
      }

      // Agregar filtro de categoría si no es "Todos"
      if (selectedCategoryId) {
        params.category_id = selectedCategoryId
      }

      // Agregar filtros de precio si existen
      if (filters.price) {
        if (filters.price.gratis) {
          params.min_price = 0
          params.max_price = 0
        } else {
          // Calcular rangos de precio basados en filtros activos
          const priceRanges = []
          if (filters.price.lessThan50) priceRanges.push({ min: 0.01, max: 50 })
          if (filters.price.between50And200) priceRanges.push({ min: 50, max: 200 })
          if (filters.price.moreThan200) priceRanges.push({ min: 200, max: 999999 })

          if (priceRanges.length > 0) {
            params.min_price = Math.min(...priceRanges.map(r => r.min))
            params.max_price = Math.max(...priceRanges.map(r => r.max))
          }
        }
      }

      // Llamar a la API
      const response = await listingsService.getAll(params)

      // Filtrar productos sin stock (quantity <= 0)
      const productsInStock = (response.items || []).filter(item => {
        const quantity = item.quantity ?? item.available ?? 0
        return quantity > 0
      })

      // Actualizar estados con la respuesta filtrada
      setProducts(productsInStock)
      setTotalProducts(response.total || 0)
      setTotalPages(Math.ceil(response.total / pageSize) || 1)
    } catch (err) {
      console.error('Error al cargar productos:', err)
      console.error('Detalles del error:', err.response?.data || err.message)
      setError('Error al cargar productos. Por favor, intenta de nuevo.')
      setProducts([])
      setTotalProducts(0)
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar productos cuando cambian los filtros o la página
  useEffect(() => {
    fetchProducts()
  }, [currentPage, searchTerm, selectedCategoryId, filters])

  const handleSearch = (term) => {
    setSearchTerm(term)
    setCurrentPage(1) // Reset a primera página al buscar
  }

  const handleCategoryChange = (category, categoryId) => {
    setSelectedCategory(category)
    setSelectedCategoryId(categoryId)
    setCurrentPage(1) // Reset a primera página al cambiar categoría
  }

  const handleSortChange = (option) => {
    setSortOption(option)
    // Nota: El backend actualmente solo soporta ordenamiento por fecha descendente
    // Esta funcionalidad se puede extender en el futuro
  }

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset a primera página al cambiar filtros
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Hero Section */}
      <section className="px-4 pb-6 pt-10 sm:px-6 lg:px-[220px]">
        <h1 className="mb-6 font-poppins text-5xl font-bold text-black">
          Productos Disponibles
        </h1>
        <SearchBar
          onSearch={handleSearch}
          onCategoryChange={handleCategoryChange}
          isProductMode={true}
        />
      </section>

      {/* Main Content */}
      <section className="flex gap-10 px-4 py-10 sm:px-6 lg:px-[220px]">
        {/* Filters Sidebar */}
        <aside className="hidden lg:block">
          <FilterSection onFiltersChange={handleFiltersChange} />
        </aside>

        {/* Products Grid */}
        <div className="flex flex-1 flex-col gap-8 rounded-lg bg-neutral-50 p-6 shadow-md">
          {/* Header */}
          <div className="flex items-end justify-between border-b border-black/50 pb-4">
            <div className="flex flex-col gap-2.5">
              <h2 className="font-roboto text-[26px] font-semibold text-black">
                Productos Disponibles
              </h2>
              <p className="font-inter text-base text-black/80">
                {totalProducts} productos encontrados
              </p>
            </div>
            <SortDropdown onSortChange={handleSortChange} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-yellow-50 p-4 text-yellow-800">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
                <p className="font-inter text-lg text-black/60">
                  Cargando productos...
                </p>
              </div>
            </div>
          ) : products.length === 0 ? (
            /* Empty State */
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <p className="mb-2 font-roboto text-xl font-semibold text-black">
                  No se encontraron productos
                </p>
                <p className="font-inter text-base text-black/60">
                  Intenta ajustar los filtros de búsqueda
                </p>
              </div>
            </div>
          ) : (
            /* Products Grid */
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.listing_id}
                  product={product}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && products.length > 0 && (
            <div className="flex justify-center pt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
