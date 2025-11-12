'use client'

import { useState } from 'react'
import FormInput from './FormInput' // Importamos el input reutilizable
import { ChevronDown } from 'lucide-react'

/**
 * Componente que renderiza el formulario para el Paso 2.
 * Gestiona la validación de este paso.
 */
export default function Step2_Info({
  onNext,
  onBack,
  listingData,
  updateListingData,
}) {
  const [errors, setErrors] = useState({})

  const handleChange = e => {
    const { name, value } = e.target
    updateListingData({ [name]: value })
    // Limpiar error al escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validateStep = () => {
    const newErrors = {}
    if (!listingData.title) newErrors.title = 'El título es obligatorio.'
    if (!listingData.description)
      newErrors.description = 'La descripción es obligatoria.'
    if (!listingData.price || parseFloat(listingData.price) <= 0)
      newErrors.price = 'Ingresa un precio válido.'
    if (!listingData.quantity || parseInt(listingData.quantity) <= 0)
      newErrors.quantity = 'Ingresa una cantidad válida.'
    
    // --- INICIO DE CORRECCIÓN FUNCIONAL ---
    if (!listingData.location)
      newErrors.location = 'La ubicación es obligatoria.'
    // --- FIN DE CORRECCIÓN FUNCIONAL ---

    if (!listingData.condition)
      newErrors.condition = 'Selecciona una condición.'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextClick = () => {
    if (validateStep()) {
      onNext()
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <div className="flex flex-col gap-6">
        <h2 className="text-primary-500 text-2xl md:text-3xl font-poppins font-bold">
          Paso 2: Información Detallada
        </h2>

        {/* Formulario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            id="title"
            name="title" // <-- FUNCIONAL: Añadido
            label="Título de la publicación"
            value={listingData.title}
            onChange={handleChange}
            placeholder="Ej. Silla de madera reciclada"
            required
            className="md:col-span-2"
          />
          {errors.title && (
            <p className="text-red-500 text-sm -mt-4 md:col-span-2">
              {errors.title}
            </p>
          )}

          <FormInput
            id="description"
            name="description" // <-- FUNCIONAL: Añadido
            label="Descripción"
            type="textarea"
            value={listingData.description}
            onChange={handleChange}
            placeholder="Detalla tu producto o material..."
            required
            className="md:col-span-2"
          />
          {errors.description && (
            <p className="text-red-500 text-sm -mt-4 md:col-span-2">
              {errors.description}
            </p>
          )}

          <FormInput
            id="price"
            name="price" // <-- FUNCIONAL: Añadido
            label="Precio (USD)"
            type="number"
            value={listingData.price}
            onChange={handleChange}
            placeholder="0.00"
            required
            min="0.01"
            step="0.01"
          />
          {errors.price && (
            <p className="text-red-500 text-sm -mt-4">{errors.price}</p>
          )}

          <FormInput
            id="quantity"
            name="quantity" // <-- FUNCIONAL: Añadido
            label="Cantidad disponible"
            type="number"
            value={listingData.quantity}
            onChange={handleChange}
            required
            min="1"
            step="1"
          />
          {errors.quantity && (
            <p className="text-red-500 text-sm -mt-4">{errors.quantity}</p>
          )}

          {/* --- INICIO DE CORRECCIÓN FUNCIONAL --- */}
          <FormInput
            id="location"
            name="location" // <-- FUNCIONAL: Añadido
            label="Ubicación del ítem"
            value={listingData.location}
            onChange={handleChange}
            placeholder="Dirección, colonia, ciudad."
            required
            className="md:col-span-2"
          />
          {errors.location && (
            <p className="text-red-500 text-sm -mt-4 md:col-span-2">
              {errors.location}
            </p>
          )}
          {/* --- FIN DE CORRECCIÓN FUNCIONAL --- */}

          {/* Selector de Condición */}
          <div className="relative w-full md:col-span-2">
            <label
              htmlFor="condition"
              className="block text-sm font-medium text-dark mb-1"
            >
              Condición {<span className="text-red-500">*</span>}
            </label>
            <select
              id="condition"
              name="condition"
              value={listingData.condition}
              onChange={handleChange}
              className={`w-full p-3 border border-gray-400 dark:border-gray-600 rounded-xl appearance-none
                          bg-white
                          focus:ring-2 focus:ring-[#396530] focus:border-transparent
                          ${
                            !listingData.condition
                              ? 'text-gray-500'
                              : 'text-black'
                          }`}
            >
              <option value="" disabled>
                Selecciona una condición...
              </option>
              <option value="NEW">Nuevo (Sin usar)</option>
              <option value="USED">Usado (En buenas condiciones)</option>
              <option value="REFURBISHED">Restaurado / Reciclado</option>
            </select>
            <ChevronDown className="w-5 h-5 text-gray-400 absolute right-4 top-[42px] pointer-events-none" />
            {errors.condition && (
              <p className="text-red-500 text-sm mt-1">{errors.condition}</p>
            )}
          </div>
        </div>

        {/* Divisor y Botones */}
        <hr className="border-t border-gray-200 dark:border-gray-700" />
        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="px-8 py-3 bg-gray-200 text-gray-800 font-inter font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            Volver
          </button>
          <button
            onClick={handleNextClick}
            className="px-8 py-3 bg-[#396530] text-white font-inter font-semibold rounded-lg hover:bg-green-900 dark:hover:bg-green-700 transition-colors"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  )
}