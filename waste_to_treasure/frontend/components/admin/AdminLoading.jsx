
/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: AdminLoading
 * Descripción: muestra un spinner animado con mensaje de carga en pantalla completa, usado mientras se cargan datos en la consola admin
 */

'use client'

export default function AdminLoading({ message = 'Cargando...' }) {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        {/* Spinner */}
        <div className="relative mx-auto mb-6 h-16 w-16">
          <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
          <div className="absolute inset-2 h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-300 border-l-transparent animation-delay-150"></div>
        </div>

        {/* Message */}
        <p className="text-lg font-semibold text-gray-700">{message}</p>
        
        {/* Optional subtext */}
        <p className="mt-2 text-sm text-gray-500">
          Por favor espera un momento...
        </p>
      </div>
    </div>
  )
}