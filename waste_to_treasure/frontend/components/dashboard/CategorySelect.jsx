/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: CategorySelect
 * Descripción: dropdown para seleccionar categoría de producto con carga desde API, muestra opciones como Madera, Textil, Metal, Plástico, Vidrio, etc.
 */

'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import categoriesService from '@/lib/api/categories';

/**
 * Dropdown para seleccionar la categoría.
 * Carga las categorías desde la API del backend.
 * 
 * @param {boolean} onlyParents - Si es true, solo muestra categorías padre
 * @param {number} parentCategoryId - Si se proporciona, solo muestra categorías hijas de este padre
 * @param {string} label - Etiqueta personalizada para el select
 * @param {string} className - Clases CSS adicionales para el contenedor
 */
export default function CategorySelect({ 
  value, 
  onChange, 
  disabled, 
  type = 'MATERIAL', 
  onlyParents = false, 
  parentCategoryId = null,
  label = 'Categoría',
  className = ''
}) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noSubcategories, setNoSubcategories] = useState(false);

  // Cargar categorías desde el backend
  useEffect(() => {
    if (!type) {
      return;
    }
    
    // Si necesitamos subcategorías pero no hay padre, no cargar nada
    if (!onlyParents && !parentCategoryId) {
      setCategories([]);
      setNoSubcategories(false);
      return;
    }
    
    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);
      setNoSubcategories(false);
      
      try {
        const params = { 
          type: type.toUpperCase(),
          limit: 100 
        };
        
        // Pasar parent_id al backend para filtrado eficiente
        if (onlyParents) {
          params.parent_id = -1; // Solo raíces
        } else if (parentCategoryId) {
          params.parent_id = parentCategoryId; // Solo hijas de este padre
        }
        
        const data = await categoriesService.getAll(params);
        const items = data.items || [];
        setCategories(items);
        
        // Detectar si no hay subcategorías
        if (!onlyParents && parentCategoryId && items.length === 0) {
          setNoSubcategories(true);
        }
      } catch (err) {
        console.error('[CategorySelect] Error:', err.message);
        setError('No se pudieron cargar las categorías');
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [type, onlyParents, parentCategoryId]);

  return (
    <div className={`relative w-full ${className}`}>
      <label
        htmlFor="category"
        className="block text-sm font-medium text-dark mb-1"
      >
        {label}
      </label>
      
      <select
        id="category"
        value={value}
        onChange={onChange}
        disabled={isLoading || disabled || error || noSubcategories}
        className={`
          w-full p-3 border rounded-xl appearance-none
          bg-white text-dark
          focus:ring-2 focus:ring-[#396530] focus:border-transparent
          transition-colors
          ${
            isLoading || disabled || error || noSubcategories
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-60'
              : 'border-gray-400 dark:border-gray-600'
          }
          ${value ? 'text-black dark:text-black' : 'text-gray-500'}
        `}
      >
        <option value="" disabled>
          {isLoading 
            ? 'Cargando categorías...' 
            : error 
            ? error
            : noSubcategories
            ? 'Esta categoría no tiene subcategorías'
            : 'Selecciona una categoría...'}
        </option>
        
        {categories.map((cat) => (
          <option key={cat.category_id} value={cat.category_id}>
            {cat.name}
          </option>
        ))}
      </select>
      <ChevronDown className="w-5 h-5 text-gray-400 absolute right-4 top-[42px] pointer-events-none" />
      
      {/* Mensaje informativo cuando no hay subcategorías */}
      {noSubcategories && !onlyParents && (
        <p className="text-blue-600 text-sm mt-1">
          ¡La categoría seleccionada no tiene subcategorías. Puedes continuar al siguiente paso!.
        </p>
      )}
    </div>
  );
}