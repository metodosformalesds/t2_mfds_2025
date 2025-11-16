'use client'

import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react'

/**
 * Modal de confirmación personalizado con diseño acorde a la página
 *
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {function} onClose - Función para cerrar el modal
 * @param {function} onConfirm - Función a ejecutar al confirmar
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje del modal
 * @param {string} confirmText - Texto del botón de confirmación
 * @param {string} cancelText - Texto del botón de cancelación
 * @param {string} variant - Variante del modal: 'danger', 'success', 'info'
 * @param {boolean} isLoading - Si está procesando la acción
 */
export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'info',
  isLoading = false,
}) {
  if (!isOpen) return null

  const variants = {
    danger: {
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      iconBg: 'bg-red-100',
      confirmBtn: 'bg-red-500 hover:bg-red-600',
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-500',
      iconBg: 'bg-green-100',
      confirmBtn: 'bg-green-500 hover:bg-green-600',
    },
    info: {
      icon: Info,
      iconColor: 'text-primary-500',
      iconBg: 'bg-primary-100',
      confirmBtn: 'bg-primary-500 hover:bg-primary-600',
    },
  }

  const config = variants[variant] || variants.info
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 p-6">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 ${config.iconBg}`}>
              <Icon className={`h-6 w-6 ${config.iconColor}`} />
            </div>
            <h3 className="font-poppins text-xl font-bold text-neutral-900">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="font-inter text-base leading-relaxed text-neutral-600">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-neutral-200 p-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-lg border-2 border-neutral-300 bg-white px-4 py-3 font-inter text-base font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 rounded-lg px-4 py-3 font-inter text-base font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${config.confirmBtn}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Procesando...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
