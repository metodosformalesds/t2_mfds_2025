/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: TypeCard
 * Descripción: tarjeta seleccionable para elegir tipo de item (Producto o Material) con icono, título y descripción, incluye efecto de escala y resaltado cuando está seleccionada
 */

'use client';

import { Package, Box } from 'lucide-react'; // Importamos iconos por defecto

/**
 * Tarjeta seleccionable para "Producto" o "Material".
 */
export default function TypeCard({
  icon: Icon,
  title,
  description,
  isSelected,
  onClick,
}) {
  // Usamos un icono por defecto si no se provee uno
  const IconComponent = Icon || (title === 'Producto' ? Package : Box);

  return (
    <button
      onClick={onClick}
      className={`
        flex-1 p-6 rounded-xl text-center
        border-2 transition-all duration-200
        flex flex-col items-center gap-4 shadow-md
        neutral-100 
        ${
          isSelected
            ? 'bg-primary-500 scale-105 shadow-lg'
            : 'border-gray-300 dark:border-gray-600 hover:shadow-lg hover:border-[#396530] dark:hover:border-green-500 '
        }
      `}
    >
      {/* Icono */}
      <IconComponent
        className={`w-10 h-10 ${
          isSelected ? 'text-white' : 'text-dark'
        }`}
      />
      
      {/* Título */}
      <h3
        className={`
          text-2xl md:text-3xl font-roboto font-bold
          ${
            isSelected
              ? 'text-white'
              : 'text-primary-500 '
          }
        `}
      >
        {title}
      </h3>
      
      {/* Descripción */}
      <p 
        className={`
          text-sm mod:text-base font-inter font-medium
          ${
            isSelected
              ? 'text-white'
              : 'text-dark'
          }
        `}
      >
        {description}
      </p>
    </button>
  );
}