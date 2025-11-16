'use client'

// --- INICIO DE CORRECCIÓN: Importar icono de Check ---
import { X, AlertTriangle, CheckCircle } from 'lucide-react'
// --- FIN DE CORRECCIÓN ---
import { useConfirmStore } from '@/stores/useConfirmStore'

export default function GlobalConfirmModal({
  confirmText: defaultConfirmText = 'Confirmar',
  cancelText = 'Cancelar',
}) {
  const {
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    danger,
    confirmText: storeConfirmText, // Texto de confirmación desde el store
    close,
  } = useConfirmStore()

  if (!isOpen) return null

  const handleConfirm = () => {
    if (onConfirm) {
      console.log('[GlobalConfirmModal] handleConfirm ejecutado')
      onConfirm()
    }
    close()
  }

  const handleCancel = () => {
    console.log('[GlobalConfirmModal] handleCancel ejecutado')
    onCancel()
    close()
  }

  // Determinar el texto del botón de confirmación
  const CfmText = storeConfirmText || defaultConfirmText

  // --- INICIO DE CORRECCIÓN: Clases y botón de confirmación ---
  const confirmClasses = danger
    ? 'bg-red-600 text-white hover:bg-red-700'
    : 'bg-primary-500 text-white hover:bg-primary-600' // Botón verde si no es 'danger'

  const finalConfirmText = danger ? defaultConfirmText : CfmText
  // --- FIN DE CORRECCIÓN ---


  return (
    <div
      onClick={handleCancel}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
      >
        <div className="flex items-start">
          {/* --- INICIO DE CORRECCIÓN: Icono condicional --- */}
          {danger ? (
            <div className="mr-4 flex-shrink-0 rounded-full bg-red-100 p-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          ) : (
            <div className="mr-4 flex-shrink-0 rounded-full bg-green-100 p-2">
              <CheckCircle className="h-6 w-6 text-primary-500" />
            </div>
          )}
          {/* --- FIN DE CORRECCIÓN --- */}

          <div className="flex-1">
            <h2 className="font-poppins text-2xl font-semibold text-neutral-900">
              {title}
            </h2>
            <p className="mt-2 font-inter text-base text-neutral-600 whitespace-pre-line">
              {message}
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="-mt-2 -mr-2 ml-4 text-neutral-400 hover:text-neutral-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Botones de Acción */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 font-inter text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50"
          >
            {onConfirm ? cancelText : 'Entendido'}
          </button>
          {onConfirm && (
            <button
              type="button"
              onClick={handleConfirm}
              className={`rounded-lg px-4 py-2 font-inter text-sm font-semibold transition-colors ${confirmClasses}`}
            >
              {finalConfirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}