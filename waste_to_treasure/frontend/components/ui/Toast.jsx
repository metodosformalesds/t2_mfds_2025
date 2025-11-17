/**
 * Autor: Oscar Alonso Nava Rivera
 * Fecha: 16/11/2025
 * Componente: Toast
 * Descripción: Componente para mostrar toasts/notifications en la UI.
 */

'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, AlertCircle } from 'lucide-react'

export default function Toast({ message, type = 'info', onClose, unit = '' }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof onClose === 'function') onClose()
    }, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = {
    success: 'bg-primary-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-primary-500',
  }[type]

  const IconComponent = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
    info: AlertCircle,
  }[type]

  const node = (
    <div className={`fixed top-6 right-6 ${bgColor} rounded-xl p-5 flex items-center gap-4 shadow-2xl z-[9999] animate-in fade-in slide-in-from-right max-w-sm`} role="status" aria-live="polite">
      <IconComponent size={28} className="text-white flex-shrink-0" />
      <div className="flex flex-col gap-1">
        <p className="text-white font-inter font-bold text-base">{message}</p>
        {unit && <p className="text-white/90 font-inter text-sm">{unit}</p>}
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(node, document.body)
  }

  return null
}
