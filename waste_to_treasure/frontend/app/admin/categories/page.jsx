'use client'

import { useState } from 'react'
import CreateCategoryForm from '@/components/admin/CreateCategoryForm'
import CategoryList from '@/components/admin/CategoryList'
import EditCategoryModal from '@/components/admin/EditCategoryModal'
import { useConfirmStore } from '@/stores/useConfirmStore'

// (Datos de initialCategories sin cambios...)
const initialCategories = [
  { id: 1, name: 'Plásticos', type: 'Material' },
  { id: 2, name: 'Metales', type: 'Material' },
  { id: 3, name: 'Sillas', type: 'Producto' },
  { id: 4, name: 'Textiles', type: 'Material' },
  { id: 5, name: 'Vidrio', type: 'Material' },
]

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState(initialCategories)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)

  const openConfirmModal = useConfirmStore(state => state.open)

  // Lógica de Modales (sin cambios)
  const handleOpenEditModal = category => {
    setSelectedCategory(category)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedCategory(null)
  }

  // Lógica de CRUD (sin cambios)
  const handleCreateCategory = ({ name, type }) => {
    console.log('Creando categoría:', { name, type })
    const newCategory = {
      id: categories.length + 1,
      name,
      type,
    }
    setCategories([...categories, newCategory])
  }

  const handleUpdateCategory = ({ id, newName, newType }) => {
    console.log('Actualizando categoría:', { id, newName, newType })
    setCategories(
      categories.map(cat =>
        cat.id === id ? { ...cat, name: newName, type: newType } : cat
      )
    )
    handleCloseEditModal()
  }

  // Lógica de Eliminación (sin cambios)
  const createDeleteHandler = category => {
    return () => {
      console.log('Eliminando categoría:', category.id)
      setCategories(prevCategories =>
        prevCategories.filter(cat => cat.id !== category.id)
      )
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

  return (
    <>
      {/* --- INICIO DE LA CORRECCIÓN --- */}
      {/* Eliminado el 'p-12' de aquí */}
      <h1 className="font-poppins text-5xl font-bold text-primary-500">
        Gestión de categorías
      </h1>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Columna de la Lista (ocupa 2/3) */}
        <div className="lg:col-span-2">
          <CategoryList
            categories={categories}
            onEdit={handleOpenEditModal}
            onDelete={handleOpenDeleteModal}
          />
        </div>

        {/* Columna del Formulario (ocupa 1/3) */}
        <div className="lg:col-span-1">
          <CreateCategoryForm onSubmit={handleCreateCategory} />
        </div>
      </div>
      {/* --- FIN DE LA CORRECCIÓN --- */}

      {/* Modal de Edición (se muestra sobre todo) */}
      <EditCategoryModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        category={selectedCategory}
        onUpdate={handleUpdateCategory}
      />
    </>
  )
}