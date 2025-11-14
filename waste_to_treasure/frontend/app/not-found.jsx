'use client'

import Link from 'next/link'
import { Home, Search, ArrowLeft, Recycle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Ilustración creativa */}
        <div className="relative mb-8">
          <div className="text-[200px] font-bold text-primary-100 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-full p-8 shadow-xl">
              <Recycle className="w-24 h-24 text-primary-500 animate-spin-slow" />
            </div>
          </div>
        </div>

        {/* Mensaje principal */}
        <h1 className="text-4xl font-bold text-neutral-900 mb-4 font-poppins">
          ¡Oops! Esta página se recicló
        </h1>
        
        <p className="text-lg text-gray-600 mb-8 font-inter max-w-md mx-auto">
          Parece que la página que buscas fue transformada en algo nuevo o ya no existe. 
          ¡Pero no te preocupes, hay muchos tesoros esperándote!
        </p>

        {/* Sugerencias */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="font-semibold text-neutral-900 mb-4 font-poppins">
            ¿Qué puedes hacer?
          </h3>
          <ul className="text-left space-y-3 text-gray-600 font-inter">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              Verifica que la URL esté escrita correctamente
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              Explora nuestro marketplace de materiales reciclados
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              Regresa al inicio y encuentra lo que necesitas
            </li>
          </ul>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors font-inter"
          >
            <Home className="w-5 h-5" />
            Ir al Inicio
          </Link>
          
          <Link
            href="/materials"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-primary-500 text-primary-500 font-semibold rounded-lg hover:bg-primary-50 transition-colors font-inter"
          >
            <Search className="w-5 h-5" />
            Explorar Materiales
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 font-semibold transition-colors font-inter"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver Atrás
          </button>
        </div>

        {/* Footer decorativo */}
        <div className="mt-12 text-sm text-gray-400 font-inter">
          <p>🌱 Cada recurso tiene un nuevo propósito en Waste to Treasure</p>
        </div>
      </div>
    </div>
  )
}