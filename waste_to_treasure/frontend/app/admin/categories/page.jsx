'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, Filter, Search, Layers } from 'lucide-react'
import CategoryList from '@/components/admin/CategoryList'
import CreateCategoryModal from '@/components/admin/CreateCategoryModal'
import EditCategoryModal from '@/components/admin/EditCategoryModal'
import { useConfirmStore } from '@/stores/useConfirmStore'
import { categoriesService } from '@/lib/api/categories'
import Toast from '@/components/ui/Toast'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [allCategories, setAllCategories] = useState([]) // Todas las categorías para el modal
  const [totalCategories, setTotalCategories] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [toast, setToast] = useState(null)
  
  // Filtros
  const [typeFilter, setTypeFilter] = useState('ALL') // ALL, MATERIAL, PRODUCT
  const [hierarchyFilter, setHierarchyFilter] = useState('ALL') // ALL, PARENT, CHILD
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const openConfirmModal = useConfirmStore(state => state.open)
  
  // Debounce para el searchTerm
  useEffect(() => {
    const timer = setTimeout(() => {
      // Solo actualizar si tiene 2+ caracteres o está vacío
      if (searchTerm.length >= 2 || searchTerm.length === 0) {
        setDebouncedSearchTerm(searchTerm)
      }
    }, 500) // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Función para cargar TODAS las categorías (para el modal)
  const fetchAllCategories = useCallback(async () => {
    try {
      const data = await categoriesService.getAll({ limit: 100, skip: 0 })
      
      const mappedCategories = (data.items || []).map(cat => ({
        ...cat,
        id: cat.category_id,
        name: cat.name || 'Sin nombre',
        type: cat.type || 'MATERIAL',
        product_count: cat.listing_count || 0,
        children_count: cat.children_count || 0
      }))
      
      setAllCategories(mappedCategories)
    } catch (error) {
      console.error('[Categories] Error al cargar todas las categorías:', error)
    }
  }, [])

  // Función para cargar categorías usando useCallback
  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Para filtros de jerarquía, necesitamos cargar todas las categorías
      // porque el backend no tiene ese filtro
      const limit = hierarchyFilter !== 'ALL' ? 100 : itemsPerPage
      const skip = hierarchyFilter !== 'ALL' ? 0 : (currentPage - 1) * itemsPerPage
      
      const params = { 
        skip: skip,
        limit: limit
      }
      
      // Agregar filtro de tipo si no es 'ALL'
      if (typeFilter !== 'ALL') {
        params.type = typeFilter
      }
      
      // Agregar búsqueda si existe y tiene mínimo 2 caracteres
      if (debouncedSearchTerm.trim() && debouncedSearchTerm.trim().length >= 2) {
        params.search = debouncedSearchTerm.trim()
      }
      
      const data = await categoriesService.getAll(params)
      if (process.env.NODE_ENV === 'development') {
        // Debug: help track fetch calls when pressing Enter or typing
        // eslint-disable-next-line no-console
        console.debug('[Admin Categories] fetchCategories params', params)
      }
      
      // Mapear category_id a id para compatibilidad con componentes
      let mappedCategories = (data.items || []).map(cat => ({
        ...cat,
        id: cat.category_id,
        name: cat.name || 'Sin nombre',
        type: cat.type || 'MATERIAL',
        product_count: cat.listing_count || 0,
        children_count: cat.children_count || 0
      }))
      
      // Aplicar filtro de jerarquía en el cliente
      if (hierarchyFilter === 'PARENT') {
        mappedCategories = mappedCategories.filter(cat => !cat.parent_category_id)
      } else if (hierarchyFilter === 'CHILD') {
        mappedCategories = mappedCategories.filter(cat => cat.parent_category_id)
      }
      
      // Si hay filtro de jerarquía, aplicar paginación manual
      if (hierarchyFilter !== 'ALL') {
        const total = mappedCategories.length
        setTotalCategories(total)
        
        const start = (currentPage - 1) * itemsPerPage
        const end = start + itemsPerPage
        mappedCategories = mappedCategories.slice(start, end)
      } else {
        setTotalCategories(data.total || 0)
      }
      
      setCategories(mappedCategories)
    } catch (error) {
      console.error('[Categories] Error al cargar categorías:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Error desconocido al cargar categorías'
      setError(errorMessage)
      setCategories([])
      setTotalCategories(0)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, itemsPerPage, typeFilter, debouncedSearchTerm, hierarchyFilter])

  // Cargar todas las categorías al montar (para el modal)
  useEffect(() => {
    fetchAllCategories()
  }, [fetchAllCategories])

  // Cargar datos al montar y cuando cambie la página
  useEffect(() => {
    fetchCategories()
  }, [currentPage, fetchCategories])
  
  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, typeFilter, hierarchyFilter])

  // Recargar cuando se cierra el modal de creación (para actualizar padres disponibles)
  useEffect(() => {
    if (!isCreateModalOpen && !isLoading) {
      // Solo recargar si el modal se cerró (no en mount inicial)
      const timer = setTimeout(() => {
        fetchCategories()
        fetchAllCategories() // También recargar todas las categorías
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isCreateModalOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenEditModal = category => {
    setSelectedCategory(category)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedCategory(null)
  }

  // Conectar CRUD a la API
  const handleCreateCategory = async (categoryData) => {
    try {
      // Normalizar tipo antes de enviar
      let normalizedType = categoryData.type
      if (typeof categoryData.type === 'string') {
        const t = categoryData.type.trim().toLowerCase()
        if (t === 'material' || t === 'materiales') normalizedType = 'MATERIAL'
        else if (t === 'producto' || t === 'productos' || t === 'product') normalizedType = 'PRODUCT'
        else normalizedType = categoryData.type.toUpperCase()
      }
      
      const payload = {
        name: categoryData.name,
        type: normalizedType,
        parent_category_id: categoryData.parent_category_id || null
      }
      
      const newCategory = await categoriesService.create(payload)
      
      // Mensaje de éxito
      const createdName = (newCategory && newCategory.name) ? newCategory.name : categoryData.name
      const hierarchyText = categoryData.parent_category_id ? ' (subcategoría)' : ' (padre)'
      setToast({ message: `Categoría "${createdName}"${hierarchyText} creada correctamente.`, type: 'success' })
      
      // Recargar lista completa después de crear
      // Pequeño delay para asegurar consistencia con el backend
      await new Promise(resolve => setTimeout(resolve, 200))
      await fetchCategories()
    } catch (error) {
      console.error('Error al crear categoría:', error)
      setToast({ message: `Error al crear categoría: ${error.response?.data?.detail || error.message}`, type: 'error' })
      throw error // Re-throw para que el modal sepa que falló
    }
  }

  const handleUpdateCategory = async ({ id, newName, newType }) => {
    try {
      console.log('Actualizando categoría:', { id, newName, newType })
      // Normalizar tipo
      let normalizedType = newType
      if (typeof newType === 'string') {
        const t = newType.trim().toLowerCase()
        if (t === 'material' || t === 'materiales') normalizedType = 'MATERIAL'
        else if (t === 'producto' || t === 'productos' || t === 'product') normalizedType = 'PRODUCT'
        else normalizedType = newType.toUpperCase()
      }
      await categoriesService.update(id, { 
        name: newName, 
        type: normalizedType 
      })
      
      // Recargar lista completa después de actualizar
      await fetchCategories()
      handleCloseEditModal()
      setToast({ message: 'Categoría actualizada correctamente', type: 'success' })
    } catch (error) {
      console.error('Error al actualizar categoría:', error)
      setToast({ message: `Error al actualizar categoría: ${error.response?.data?.detail || error.message}`, type: 'error' })
    }
  }

  const createDeleteHandler = (category) => {
    return async () => {
      try {
        console.log('Eliminando categoría:', category.id)
        await categoriesService.delete(category.id)
        
        // Recargar lista completa después de eliminar
        await fetchCategories()
        setToast({ message: `Categoría "${category.name}" eliminada`, type: 'success' })
      } catch (error) {
        console.error('Error al eliminar categoría:', error)
        
        // Manejo específico de error 400 (categoría con relaciones)
        if (error.response?.status === 400) {
          const errorDetail = error.response?.data?.detail || ''
          
          // Parsear el mensaje de error para determinar el tipo
          if (errorDetail.includes('publicaciones asociadas')) {
            const match = errorDetail.match(/tiene (\d+) publicaciones/)
            const count = match ? match[1] : 'varias'
            setToast({ 
              message: `No se puede eliminar "${category.name}". Tiene ${count} producto(s) asociado(s). Primero debes eliminar o reasignar estos productos.`, 
              type: 'warning' 
            })
          } else if (errorDetail.includes('subcategorías asociadas')) {
            const match = errorDetail.match(/tiene (\d+) subcategorías/)
            const count = match ? match[1] : 'varias'
            setToast({ 
              message: `No se puede eliminar "${category.name}". Tiene ${count} subcategoría(s) asociada(s). Primero debes eliminar estas subcategorías.`, 
              type: 'warning' 
            })
          } else {
            setToast({ 
              message: `No se puede eliminar "${category.name}": ${errorDetail}`, 
              type: 'warning' 
            })
          }
        } else {
          setToast({ 
            message: `Error al eliminar categoría: ${error.response?.data?.detail || error.message}`, 
            type: 'error' 
          })
        }
      }
    }
  }

  const handleOpenDeleteModal = category => {
    const productCount = category.product_count || 0
    const childrenCount = category.children_count || 0
    const canDelete = productCount === 0 && childrenCount === 0
    
    // Construir mensaje con información sobre productos y subcategorías
    let message = `¿Estás seguro de que quieres eliminar la categoría "${category.name}"?`
    
    if (!canDelete) {
      message = `⚠️ No se puede eliminar la categoría "${category.name}"`
      
      const reasons = []
      if (productCount > 0) {
        reasons.push(`${productCount} producto${productCount > 1 ? 's' : ''} asociado${productCount > 1 ? 's' : ''}`)
      }
      if (childrenCount > 0) {
        reasons.push(`${childrenCount} subcategoría${childrenCount > 1 ? 's' : ''} asociada${childrenCount > 1 ? 's' : ''}`)
      }
      
      message += `\n\nTiene ${reasons.join(' y ')}.`
      message += '\n\nPara eliminar esta categoría, primero debes:'
      if (productCount > 0) {
        message += '\n• Reasignar o eliminar los productos asociados'
      }
      if (childrenCount > 0) {
        message += '\n• Eliminar las subcategorías asociadas'
      }
    } else {
      message += '\n\n✓ Esta categoría no tiene productos ni subcategorías asociadas.'
      message += '\n\nEsta acción no se puede deshacer.'
    }
    
    openConfirmModal(
      canDelete ? 'Eliminar Categoría' : 'No se puede eliminar',
      message,
      canDelete ? createDeleteHandler(category) : null,
      { danger: canDelete }
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-900 font-medium">Cargando Categorias...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 className="font-poppins text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-500">
          Gestión de categorías
        </h1>
        
          <h2 className="text-red-700 font-semibold text-xl mb-2">Error al cargar categorías</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchCategories}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Reintentar
          </button>
          <div className="mt-4 text-sm text-red-500">
            <p><strong>Posibles causas:</strong></p>
            <ul className="list-disc list-inside mt-2">
              <li>El servidor backend no está corriendo</li>
              <li>URL del backend incorrecta: {process.env.NEXT_PUBLIC_API_URL}</li>
              <li>Problemas de red o CORS</li>
            </ul>
          </div>
      </div>
    )
  }

  // Calcular información de paginación
  const totalPages = Math.ceil(totalCategories / itemsPerPage)
  const startItem = totalCategories > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0
  const endItem = Math.min(currentPage * itemsPerPage, totalCategories)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-poppins text-3xl sm:text-4xl font-bold text-neutral-900">
          Gestión de Categorías
        </h1>
        <p className="mt-1 font-inter text-sm text-neutral-600">
          Organiza materiales y productos en categorías jerárquicas
        </p>
      </div>

      {/* Buscador y Filtros */}
      <div className="space-y-4">
        {/* Barra de búsqueda */}
        <div className="rounded-xl bg-white p-4 shadow-sm border border-neutral-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar categorías por nombre..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1) // Reset a página 1 al buscar
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Solo permitir Enter si cumple validación del backend (2+) o esta vacío
                    if (searchTerm.length >= 2 || searchTerm.length === 0) {
                      setDebouncedSearchTerm(searchTerm)
                      setCurrentPage(1)
                    }
                  }
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-300 font-inter text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 font-inter text-sm font-semibold text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 whitespace-nowrap"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Nueva Categoría</span>
              <span className="sm:hidden">Nueva</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="rounded-xl bg-white p-4 shadow-sm border border-neutral-200">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Filtro por tipo */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Filter className="h-4 w-4 text-neutral-500" />
                <span className="font-inter text-sm font-medium text-neutral-700">Tipo:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['ALL', 'MATERIAL', 'PRODUCT'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setTypeFilter(filter)
                      setCurrentPage(1)
                    }}
                    className={`rounded-lg px-3 py-1.5 font-inter text-xs font-medium transition-colors ${
                      typeFilter === filter
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {filter === 'ALL' ? 'Todas' : filter === 'MATERIAL' ? 'Materiales' : 'Productos'}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro por jerarquía */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Layers className="h-4 w-4 text-neutral-500" />
                <span className="font-inter text-sm font-medium text-neutral-700">Jerarquía:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'ALL', label: 'Todas' },
                  { value: 'PARENT', label: 'Solo Padres' },
                  { value: 'CHILD', label: 'Solo Hijos' }
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setHierarchyFilter(filter.value)
                      setCurrentPage(1)
                    }}
                    className={`rounded-lg px-3 py-1.5 font-inter text-xs font-medium transition-colors ${
                      hierarchyFilter === filter.value
                        ? 'bg-secondary-500 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contador */}
            {totalCategories > 0 && (
              <div className="flex items-end lg:items-center">
                <span className="font-inter text-sm text-neutral-600 whitespace-nowrap">
                  <span className="font-semibold text-neutral-900">{totalCategories}</span> {totalCategories === 1 ? 'categoría' : 'categorías'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de categorías - Ancho completo */}
      <div className="max-w-full">
        <CategoryList
          categories={categories}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteModal}
        />
      </div>

      {/* Paginación */}
      {totalCategories > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm border border-neutral-200">
          {/* Información de registros */}
          <div className="text-sm text-neutral-600 font-inter">
            Mostrando <span className="font-semibold text-neutral-900">{startItem}</span> a{' '}
            <span className="font-semibold text-neutral-900">{endItem}</span> de{' '}
            <span className="font-semibold text-neutral-900">{totalCategories}</span>
          </div>

          {/* Controles de paginación */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-neutral-300 bg-white font-inter text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            {/* Números de página */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 rounded-lg font-inter text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-primary-500 text-white'
                        : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-neutral-300 bg-white font-inter text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modales */}
      <CreateCategoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCategory}
        existingCategories={allCategories}
      />

      <EditCategoryModal
        key={selectedCategory?.id || 'new'}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        category={selectedCategory}
        onUpdate={handleUpdateCategory}
      />

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}