'use client'

import { useState, useEffect } from 'react'
import CreateCategoryForm from '@/components/admin/CreateCategoryForm'
import CategoryList from '@/components/admin/CategoryList'
import EditCategoryModal from '@/components/admin/EditCategoryModal'
import { useConfirmStore } from '@/stores/useConfirmStore'
import { categoriesService } from '@/lib/api/categories'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)

  const openConfirmModal = useConfirmStore(state => state.open)

  // Función para cargar categorías
  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const data = await categoriesService.getAll({ limit: 200 }) 
      setCategories(data.items || [])
    } catch (error) {
      console.error('Error al cargar categorías:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar datos al montar
  useEffect(() => {
    fetchCategories()
  }, [])

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
      setCategories([...categories, newCategory])
    } catch (error) {
      console.error('Error al crear categoría:', error)
      // TODO: Mostrar error al usuario
    }
  }

  const handleUpdateCategory = async ({ id, newName, newType }) => {
    try {
      console.log('Actualizando categoría:', { id, newName, newType })
      const updatedCategory = await categoriesService.update(id, { 
        name: newName, 
        type: newType 
      })
      
      setCategories(
        categories.map(cat => (cat.id === id ? updatedCategory : cat))
      )
      handleCloseEditModal()
    } catch (error) {
      console.error('Error al actualizar categoría:', error)
      // TODO: Mostrar error al usuario
    }
  }

  const createDeleteHandler = (category) => {
    return async () => {
      try {
        console.log('Eliminando categoría:', category.id)
        await categoriesService.delete(category.id)
        setCategories(prevCategories =>
          prevCategories.filter(cat => cat.id !== category.id)
        )
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
      <div className="p-6">
        <h1 className="font-poppins text-5xl font-bold text-primary-500">
          Cargando Categorías...
        </h1>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="font-poppins text-5xl font-bold text-primary-500">
        Gestión de categorías
      </h1>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CategoryList
            categories={categories}
            onEdit={handleOpenEditModal}
            onDelete={handleOpenDeleteModal}
          />
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