/**
 * Autor: Oscar Alonso Nava Rivera
 * Fecha: 15/11/2025
 * Componente: ErrorBoundary
 * Descripción: Componente Error Boundary para capturar errores en React y mostrar UI amigable.
 */

'use client'

import React from 'react'
import { AlertCircle, RefreshCcw } from 'lucide-react'

/**
 * Error Boundary Component
 * Captura errores de React y muestra una UI amigable al usuario
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Solo en desarrollo, logear el error
    if (process.env.NODE_ENV === 'development') {
      console.error('Error capturado por Error Boundary:', error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    // Opcional: recargar la página si es necesario
    // window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-neutral-900 mb-2 font-roboto">
              Algo salió mal
            </h1>
            
            <p className="text-neutral-600 mb-6 font-inter">
              {this.props.fallbackMessage || 
               'Ocurrió un error inesperado. Por favor, intenta de nuevo.'}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left bg-red-50 p-4 rounded border border-red-200">
                <summary className="cursor-pointer text-sm font-semibold text-red-800 mb-2">
                  Detalles del error (solo en desarrollo)
                </summary>
                <pre className="text-xs text-red-700 overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
              >
                <RefreshCcw size={20} />
                Intentar de nuevo
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="text-neutral-600 hover:text-neutral-900 font-inter text-sm transition-colors"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
