'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import CreateCategoryForm from '@/components/admin/CreateCategoryForm'
import CategoryList from '@/components/admin/CategoryList'
import EditCategoryModal from '@/components/admin/EditCategoryModal'
import { useConfirmStore } from '@/stores/useConfirmStore'
import { categoriesService } from '@/lib/api/categories'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [totalCategories, setTotalCategories] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)

  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)

  const openConfirmModal = useConfirmStore(state => state.open)

  // Función para cargar categorías
  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const skip = (currentPage - 1) * itemsPerPage
      
      console.log('[Categories] Intentando cargar categorías...')
      console.log('[Categories] Paginación:', { skip, limit: itemsPerPage, page: currentPage })
      
      const data = await categoriesService.getAll({ 
        skip: skip,
        limit: itemsPerPage 
      })
      console.log('[Categories] Datos recibidos:', data)
      
      // Guardar total para paginación
      setTotalCategories(data.total || 0)
      
      // Mapear category_id a id para compatibilidad con componentes
      const mappedCategories = (data.items || []).map(cat => ({
        ...cat,
        id: cat.category_id,
        name: cat.name || 'Sin nombre',
        type: cat.type || 'MATERIAL'
      }))
      
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
  }

  // Cargar datos al montar y cuando cambie la página
  useEffect(() => {
    fetchCategories()
  }, [currentPage])

  const handleOpenEditModal = category => {
    setSelectedCategory(category)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedCategory(null)
  }

  // Conectar CRUD a la API
  const handleCreateCategory = async ({ name, type }) => {
    try {
      console.log('Creando categoría:', { name, type })
      const newCategory = await categoriesService.create({ name, type })
      
      // Recargar lista completa después de crear
      await fetchCategories()
    } catch (error) {
      console.error('Error al crear categoría:', error)
    }
  }

  const handleUpdateCategory = async ({ id, newName, newType }) => {
    try {
      console.log('Actualizando categoría:', { id, newName, newType })
      await categoriesService.update(id, { 
        name: newName, 
        type: newType 
      })
      
      // Recargar lista completa después de actualizar
      await fetchCategories()
      handleCloseEditModal()
    } catch (error) {
      console.error('Error al actualizar categoría:', error)
    }
  }

  const createDeleteHandler = (category) => {
    return async () => {
      try {
        console.log('Eliminando categoría:', category.id)
        await categoriesService.delete(category.id)
        
        // Recargar lista completa después de eliminar
        await fetchCategories()
      } catch (error) {
        console.error('Error al eliminar categoría:', error)
        // TODO: Mostrar error (ej. si tiene listings asociados)
      }
    }
  }

  const handleOpenDeleteModal = category => {
    openConfirmModal(
      'Eliminar Categoría',
      `¿Estás seguro de que quieres eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`,
      createDeleteHandler(category),
      { danger: true }
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
        <div className="mt-10 rounded-xl bg-red-50 border border-red-200 p-6">
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
      </div>
    )
  }

  // Calcular información de paginación
  const totalPages = Math.ceil(totalCategories / itemsPerPage)
  const startItem = totalCategories > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0
  const endItem = Math.min(currentPage * itemsPerPage, totalCategories)

  return (
    <div>
      <h1 className="font-poppins text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-500">
        Gestión de categorías
      </h1>

      <div className="mt-6 sm:mt-10 grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CategoryList
            categories={categories}
            onEdit={handleOpenEditModal}
            onDelete={handleOpenDeleteModal}
          />
          
          {/* Paginación */}
          {totalCategories > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
              {/* Información de registros */}
              <div className="text-sm text-neutral-600 font-inter">
                Mostrando <span className="font-semibold text-neutral-900">{startItem}</span> a{' '}
                <span className="font-semibold text-neutral-900">{endItem}</span> de{' '}
                <span className="font-semibold text-neutral-900">{totalCategories}</span> categorías
              </div>

              {/* Controles de paginación */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-neutral-300 bg-white font-inter text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
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
                        className={`px-3 py-2 rounded-lg font-inter text-sm font-medium transition-colors ${
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
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-neutral-300 bg-white font-inter text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <CreateCategoryForm onSubmit={handleCreateCategory} />
        </div>
      </div>

      <EditCategoryModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        category={selectedCategory}
        onUpdate={handleUpdateCategory}
      />
    </div>
  )
}