/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: CategorySelect
 * Descripción: dropdown para seleccionar categoría de producto con carga desde API, muestra opciones como Madera, Textil, Metal, Plástico, Vidrio, etc.
 */

'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react'; // Asumo que tienes lucide-react

/**
 * Dropdown para seleccionar la categoría.
 * Este componente podría cargar las categorías desde la API.
 */
export default function CategorySelect({ value, onChange, disabled }) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Aquí es donde cargarías las categorías desde tu backend
  useEffect(() => {
    // Simulamos una carga de API
    setIsLoading(true);
    // const fetchedCategories = await api.get('/api/v1/categories');
    // setCategories(fetchedCategories.items); [cite: back/app/api/v1/endpoints/categories.py]
    
    // Datos de ejemplo (reemplazar con API)
    setTimeout(() => {
      setCategories([
        { id: 'madera', name: 'Madera' },
        { id: 'textil', name: 'Textil' },
        { id: 'metal', name: 'Metal' },
        { id: 'plastico', name: 'Plástico' },
        { id: 'vidrio', name: 'Vidrio' },
        { id: 'otro', name: 'Otro' },
      ]);
      setIsLoading(false);
    }, 500); // Simula 0.5s de carga
  }, []);

  return (
    <div className="relative w-full md:w-2/3 lg:w-1/2">
      <label
        htmlFor="category"
        className="block text-sm font-medium text-dark mb-1"
      >
        Categoría
      </label>
      <select
        id="category"
        value={value}
        onChange={onChange} // El padre gestiona el evento
        disabled={isLoading || disabled}
        className={`
          w-full p-3 border border-gray-400 dark:border-gray-600 rounded-xl appearance-none
          bg-white text-dark
          focus:ring-2 focus:ring-[#396530] focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${
            value
              ? 'text-black dark:text-black'
              : 'text-black'
          }
        `}
      >
        <option value="" disabled>
          {isLoading ? 'Cargando categorías...' : 'Selecciona una categoría...'}
        </option>
        
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
      <ChevronDown className="w-5 h-5 text-gray-400 absolute right-4 top-[42px] pointer-events-none" />
    </div>
  );
}