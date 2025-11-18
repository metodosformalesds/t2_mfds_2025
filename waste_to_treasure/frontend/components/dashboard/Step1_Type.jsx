/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: Step1_Type
 * Descripción: primer paso del formulario de publicación para seleccionar tipo de item (Producto o Material) y categoría correspondiente con validación
 */

'use client';

import { useState } from 'react';
import { Package, Box } from 'lucide-react'; // Asumo que tienes lucide-react
import TypeCard from './TypeCard';
import CategorySelect from './CategorySelect';

/**
 * Componente que renderiza el formulario para el Paso 1.
 * Gestiona la validación de este paso.
 */
export default function Step1_Type({ onNext, listingData, updateListingData }) {
  const [error, setError] = useState('');

  // Estos manejadores ahora actualizan el estado central
  const handleTypeSelect = (type) => {
    // Al cambiar el tipo, resetear la categoría padre y la subcategoría
    updateListingData({ 
      type: type,
      category: '', // Resetear categoría padre
      category_id: '' // Resetear subcategoría también
    });
    setError('');
  };

  const handleCategoryChange = (e) => {
    updateListingData({ category: e.target.value });
    setError('');
  };

  const handleNextClick = () => {
    if (!listingData.type) {
      setError('Por favor, selecciona un tipo (Producto o Material).');
      return;
    }
    if (!listingData.category) {
      setError('Por favor, selecciona una categoría.');
      return;
    }
    setError('');
    onNext(); // Llama a la función del padre para ir al siguiente paso
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <div className="flex flex-col gap-6">
        {/* Títulos */}
        <h2 className="text-primary-500 text-2xl md:text-3xl font-poppins font-bold">
          Paso 1: ¿Qué vas a publicar?
        </h2>
        <p className="text-neutral-900 text-base font-inter">
          Selecciona si estás vendiendo materia prima o un producto terminado.
        </p>

        {/* Selección de Tipo */}
        <div className="flex flex-col sm:flex-row gap-6">
          <TypeCard
            icon={Package}
            title="Producto"
            description="Muebles, decoración, joyería (hechos de material reciclado)"
            isSelected={listingData.type === 'PRODUCT'}
            onClick={() => handleTypeSelect('PRODUCT')}
          />
          <TypeCard
            icon={Box}
            title="Material"
            description="Excedente de madera, retazos de textil, metal, plástico."
            isSelected={listingData.type === 'MATERIAL'}
            onClick={() => handleTypeSelect('MATERIAL')}
          />
        </div>

        {/* Selección de Categoría (usando el componente) */}
        {listingData.type && (
          <CategorySelect
            value={listingData.category}
            onChange={handleCategoryChange}
            type={listingData.type}
            onlyParents={true}
            className="md:w-2/3 lg:w-1/2"
          />
        )}

        {/* Error */}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Divisor y Botón */}
        <hr className="border-t border-gray-200 dark:border-gray-700" />
        <div className="flex justify-end">
          <button
            onClick={handleNextClick}
            className="
              px-8 py-3 bg-[#396530] text-white
              font-inter font-semibold rounded-lg
              hover:bg-green-900 dark:hover:bg-green-700 transition-colors
              disabled:bg-gray-400 disabled:cursor-not-allowed
            "
            // Deshabilitamos el botón si no se ha seleccionado tipo o categoría
            disabled={!listingData.type || !listingData.category}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}