/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: VerticalStepper
 * Descripción: indicador de progreso vertical para formulario de publicación mostrando 4 pasos (tipo, información, multimedia, revisión) con líneas conectoras y checkmark en pasos completados
 */

'use client';

import { Check } from 'lucide-react'; // Asumo que tienes lucide-react

/**
 * Muestra el indicador de pasos vertical (1, 2, 3, 4).
 * Recibe `currentStep` para saber qué paso resaltar.
 */
export default function VerticalStepper({ currentStep }) {
  const steps = [
    { id: 1, label: 'Tipo' },
    { id: 2, label: 'Información' },
    { id: 3, label: 'Multimedia' },
    { id: 4, label: 'Revisión' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full lg:w-32">
      {/* En móvil es horizontal (justify-between), en desktop es vertical (lg:flex-col) */}
      <nav className="flex lg:flex-col justify-between lg:justify-start lg:space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="flex lg:flex-col items-center flex-1"
          >
            {/* Círculo y Texto */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  font-poppins font-bold text-xl transition-colors
                  ${
                    step.id === currentStep
                      ? 'bg-primary-500 text-white' // Paso actual
                      : step.id < currentStep
                        ? 'bg-primary-500 text-white' // Pasos completados
                        : 'bg-gray-300 text-primary-500 dark:text-gray-400' // Pasos futuros
                  }
                `}
              >
                {step.id < currentStep ? <Check /> : step.id}
              </div>
              <span
                className={`
                  text-sm md:text-base font-inter font-semibold transition-colors
                  ${
                    step.id <= currentStep
                      ? 'text-primary-600 text-primary-500' // Actual o completado
                      : 'text-gray-400 dark:text-gray-500' // Futuro
                  }
                `}
              >
                {step.label}
              </span>
            </div>

            {/* Línea Conectora (visible en desktop y móvil) */}
            {index < steps.length - 1 && (
              <div className="h-px lg:h-8 w-full lg:w-px bg-gray-300 dark:bg-gray-600 mx-2 lg:mx-0 lg:my-2" />
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}