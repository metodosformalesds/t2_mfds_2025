// Autor: Gabriel Florentino Reyes
// Fecha: 13-11-2025
// Descripción: Componente de manejo de errores para la aplicación.
//              Muestra una página de error amigable cuando ocurre un fallo en la aplicación.

'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import Link from 'next/link'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Error capturado:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-red-100 rounded-full mb-6">
            <AlertTriangle className="w-16 h-16 text-red-500" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-neutral-900 mb-4 font-poppins">
          ¡Algo salió mal!
        </h1>

        <p className="text-lg text-gray-600 mb-4 font-inter max-w-md mx-auto">
          Encontramos un obstáculo en el proceso de reciclaje. 
          Nuestro equipo ya fue notificado.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Bug className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-red-900 font-inter">Detalles del error (Dev):</span>
            </div>
            <pre className="text-sm text-red-700 overflow-auto font-mono">
              {error.message || 'Error desconocido'}
            </pre>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="font-semibold text-neutral-900 mb-4 font-poppins">
            Intenta lo siguiente:
          </h3>
          <ul className="text-left space-y-3 text-gray-600 font-inter">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-600 text-sm">1</span>
              </div>
              Recarga la página e intenta de nuevo
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-600 text-sm">2</span>
              </div>
              Verifica tu conexión a internet
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-600 text-sm">3</span>
              </div>
              Si el problema persiste, contáctanos
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors font-inter"
          >
            <RefreshCw className="w-5 h-5" />
            Intentar de nuevo
          </button>

          {/* CORREGIDO */}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-primary-500 text-primary-500 font-semibold rounded-lg hover:bg-primary-50 transition-colors font-inter"
          >
            <Home className="w-5 h-5" />
            Ir al Inicio
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-400 font-inter">
          <p>♻️ Incluso los errores pueden transformarse en oportunidades</p>
        </div>
      </div>
    </div>
  )
}
