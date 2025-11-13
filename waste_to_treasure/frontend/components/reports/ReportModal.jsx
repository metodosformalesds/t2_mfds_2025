'use client'

import { useState, useEffect } from 'react'
import { Flag, X, Send, Clock, Check, ChevronDown, AlertCircle } from 'lucide-react'
import { reportsService } from '@/lib/api/reports'

/**
 * Estados del modal de reporte
 */
const MODAL_STATES = {
  INITIAL: 'initial',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
}

/**
 * Componente Modal para reportar una publicación
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {number} props.listingId - ID de la publicación a reportar
 */
export default function ReportModal({ isOpen, onClose, listingId }) {
  const [modalState, setModalState] = useState(MODAL_STATES.INITIAL)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [error, setError] = useState(null)
  const [characterCount, setCharacterCount] = useState(0)

  const reasons = reportsService.getReportReasons()
  const maxCharacters = 500

  // Reset form cuando se abre el modal
  useEffect(() => {
    if (!isOpen) return

    // Reset state after render to avoid cascading renders
    const timeoutId = setTimeout(() => {
      setModalState(MODAL_STATES.INITIAL)
      setReason('')
      setDescription('')
      setError(null)
      setCharacterCount(0)
      setIsDropdownOpen(false)
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [isOpen])

  const handleDescriptionChange = (e) => {
    const text = e.target.value
    if (text.length <= maxCharacters) {
      setDescription(text)
      setCharacterCount(text.length)
    }
  }

  const handleSubmit = async () => {
    // Validación
    if (!reason) {
      setError('Por favor selecciona un motivo del reporte')
      return
    }

    setError(null)
    setModalState(MODAL_STATES.LOADING)

    try {
      await reportsService.createReport({
        reported_listing_id: listingId,
        reason: reason,
        description: description || undefined,
      })

      setModalState(MODAL_STATES.SUCCESS)
    } catch (err) {
      console.error('Error al enviar reporte:', err)
      setModalState(MODAL_STATES.INITIAL)
      setError(
        err.response?.data?.detail ||
          'No se pudo enviar el reporte. Por favor, inténtalo de nuevo más tarde.'
      )
    }
  }

  const handleClose = () => {
    if (modalState === MODAL_STATES.LOADING) return // No cerrar mientras carga
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-[960px] overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-neutral-200 px-[60px] py-[60px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[10px]">
              <Flag size={48} className="text-neutral-900" />
              <h2 className="font-inter text-[56px] font-bold leading-normal text-neutral-900">
                Reportar Publicación
              </h2>
            </div>
            <button
              onClick={handleClose}
              disabled={modalState === MODAL_STATES.LOADING}
              className="rounded-full p-2 hover:bg-neutral-100 disabled:opacity-50"
              aria-label="Cerrar modal"
            >
              <X size={32} className="text-neutral-900" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-[60px] px-[60px] py-[60px]">
          {/* Warning Info */}
          <div className="flex items-center gap-[10px] rounded-lg border-l-[10px] border-[#fbbc05] bg-amber-100 p-[30px]">
            <div className="font-inter text-[24px] text-neutral-600">
              <p className="mb-0 font-bold">
                Tu reporte nos ayuda a mantener la comunidad segura.
              </p>
              <p className="font-normal">
                Revisaremos tu reporte dentro de las próximas 24 horas.
              </p>
            </div>
          </div>

          {/* Error Message - Mostrar solo en estado inicial si hay error */}
          {modalState === MODAL_STATES.INITIAL && error && (
            <div className="flex items-center gap-[10px] rounded-lg border-l-[10px] border-red-500 bg-red-50 p-[30px]">
              <AlertCircle size={24} className="text-red-500" />
              <div className="font-inter text-[20px] text-red-700">
                <p className="font-semibold">{error}</p>
              </div>
            </div>
          )}

          {/* Success State */}
          {modalState === MODAL_STATES.SUCCESS && (
            <div className="flex items-center justify-center gap-[2px] rounded-lg border-4 border-[#396530] bg-[rgba(90,164,75,0.3)] p-[30px]">
              <Check size={48} className="text-[#396530]" />
              <p className="flex-1 text-center font-inter text-[24px] font-bold leading-normal text-[#396530]">
                Tu reporte ha sido enviado exitosamente. Gracias por ayudarnos a mantener la
                plataforma segura
              </p>
            </div>
          )}

          {/* Form - Solo mostrar en estado inicial */}
          {modalState === MODAL_STATES.INITIAL && (
            <>
              {/* Reason Dropdown */}
              <div className="flex w-full flex-col items-start justify-center gap-[10px]">
                <p className="font-inter text-[26px] font-bold leading-normal text-neutral-900">
                  Motivo del reporte <span className="text-red-500">*</span>
                </p>

                <div className="relative w-full max-w-[840px]">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex h-[79px] w-full items-center justify-between rounded-lg border border-neutral-400/25 px-[25px] py-[25px] hover:border-neutral-400/50"
                  >
                    <span className="font-inter text-[24px] font-normal text-neutral-900">
                      {reason || 'Selecciona un motivo'}
                    </span>
                    <ChevronDown
                      size={25}
                      className={`text-neutral-900 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full rounded-b-lg border border-t-0 border-neutral-400/25 bg-neutral-50">
                      {reasons.map((r) => (
                        <button
                          key={r}
                          onClick={() => {
                            setReason(r)
                            setIsDropdownOpen(false)
                            setError(null)
                          }}
                          className="w-full px-[25px] py-3 text-left font-inter text-[24px] font-normal text-neutral-900 hover:bg-neutral-100"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <p className="font-inter text-[22px] font-normal text-neutral-800/80">
                  Selecciona la razón que mejor describe el problema
                </p>
              </div>

              {/* Additional Details Textarea */}
              <div className="flex w-full flex-col items-start justify-center gap-[10px]">
                <p className="font-inter text-[26px] font-bold leading-normal text-neutral-900">
                  Detalles adicionales
                </p>

                <textarea
                  value={description}
                  onChange={handleDescriptionChange}
                  placeholder="Por favor proporciona más información sobre tu reporte. Esto nos ayudará a tomar la acción correcta."
                  className="min-h-[250px] w-full resize-none rounded-lg border border-neutral-400/25 px-[25px] py-[25px] font-inter text-[24px] font-normal leading-[1.4] text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none"
                  maxLength={maxCharacters}
                />

                <div className="flex w-full items-center justify-end">
                  <p className="font-inter text-[20px] font-normal text-neutral-800/80">
                    {characterCount}/{maxCharacters} caracteres
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 px-[60px] py-[40px]">
          <div className="flex items-center justify-end gap-[25px]">
            {/* Show buttons based on state */}
            {modalState === MODAL_STATES.SUCCESS ? (
              <button
                onClick={handleClose}
                className="rounded-lg border border-neutral-400/30 bg-white px-[30px] py-[25px] font-inter text-[20px] font-semibold text-neutral-900 hover:bg-neutral-50"
              >
                Cerrar
              </button>
            ) : (
              <>
                <button
                  onClick={handleClose}
                  disabled={modalState === MODAL_STATES.LOADING}
                  className="rounded-lg border border-neutral-400/30 bg-white px-[30px] py-[25px] font-inter text-[20px] font-semibold text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={modalState === MODAL_STATES.LOADING}
                  className="flex items-center justify-center gap-[10px] rounded-lg bg-[#ea0000] px-[30px] py-[25px] font-inter text-[20px] font-bold text-white transition-colors hover:bg-[#c00000] disabled:cursor-not-allowed disabled:bg-neutral-400/35"
                >
                  {modalState === MODAL_STATES.LOADING ? (
                    <>
                      <Clock size={20} className="animate-spin" />
                      <span>Cargando...</span>
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      <span>Enviar Reporte</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
