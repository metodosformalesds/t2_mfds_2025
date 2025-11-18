/**
 * Autor: Arturo Perez Gonzalez
 * Fecha: 09/11/2024
 * Componente: SearchBar
 * Descripción: Barra de búsqueda con filtros de categoría para materiales y productos.
 *              Carga categorías dinámicamente desde la API según el modo (B2B/B2C).
 *              Permite búsqueda por texto y filtrado por categoría con callbacks al padre.
 */

'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import categoriesService from '@/lib/api/categories'

export default function SearchBar({ onSearch, onCategoryChange, isProductMode = false }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [categories, setCategories] = useState([
    { id: null, name: 'Todos' } // Opción por defecto
  ])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)

  // Cargar categorías desde la API al montar el componente
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true)
      try {
        // Obtener árbol de categorías
        const tree = await categoriesService.getTree()

        // Extraer categorías según el modo (productos o materiales)
        const categoryList = isProductMode
          ? (tree.products || [])
          : (tree.materials || [])

        // Formatear categorías para el componente
        const formattedCategories = [
          { id: null, name: 'Todos' },
          ...categoryList.map(cat => ({
            id: cat.category_id,
            name: cat.name
          }))
        ]

        setCategories(formattedCategories)
      } catch (error) {
        console.error('Error al cargar categorías:', error)
        // Mantener categorías por defecto en caso de error según el modo
        if (isProductMode) {
          setCategories([
            { id: null, name: 'Todos' },
            { id: 1, name: 'Mueble' },
            { id: 2, name: 'Accesorio' },
            { id: 3, name: 'Ropa' },
            { id: 4, name: 'Arte' },
            { id: 5, name: 'Misclaneo' },
          ])
        } else {
          setCategories([
            { id: null, name: 'Todos' },
            { id: 1, name: 'Metal' },
            { id: 2, name: 'Madera' },
            { id: 3, name: 'Plásticos' },
            { id: 4, name: 'Textil' },
            { id: 5, name: 'Vidrio' },
          ])
        }
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [isProductMode])

  const handleSearch = () => {
    onSearch?.(searchTerm)
  }

  const handleCategoryClick = (category) => {
    setSelectedCategory(category.name)
    onCategoryChange?.(category.name, category.id)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="flex w-full flex-col gap-6 rounded-lg bg-neutral-50 p-6 shadow-md">
      {/* Search Input */}
      <div className="flex gap-6">
        <div className="flex flex-1 items-center gap-2.5 rounded-lg border-2 border-neutral-300 bg-white px-4 py-1.5">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isProductMode
              ? "Buscar productos por tipo, empresa o palabra clave..."
              : "Buscar materiales por tipo, empresa o palabra clave..."
            }
            className="flex-1 font-inter text-base text-black outline-none placeholder:text-neutral-500"
          />
        </div>
        <button
          onClick={handleSearch}
          className="rounded-lg bg-primary-500 px-5 py-4 font-inter text-base font-semibold text-white transition-colors hover:bg-primary-600"
        >
          Buscar
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-6">
        {isLoadingCategories ? (
          <p className="font-inter text-sm text-neutral-500">
            Cargando categorías...
          </p>
        ) : (
          categories.map((category, index) => (
            <button
              key={category.id !== null ? category.id : `category-${index}`}
              onClick={() => handleCategoryClick(category)}
              className={`rounded-full px-4 py-2.5 font-inter text-base font-medium transition-colors ${
                selectedCategory === category.name
                  ? 'bg-primary-500 text-white'
                  : 'border border-neutral-300 bg-neutral-100 text-black hover:bg-neutral-200'
              }`}
            >
              {category.name}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
