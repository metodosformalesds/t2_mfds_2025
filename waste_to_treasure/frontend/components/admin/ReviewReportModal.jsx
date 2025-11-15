'use client'

import { X } from 'lucide-react'
import React from 'react'
import { useConfirmStore } from '@/stores/useConfirmStore'

const StatusBadge = ({ status }) => (
  <span
    className={`inline-block rounded-lg px-3 py-1 text-sm font-medium ${
      status === 'PENDIENTE'
        ? 'bg-secondary-600 text-white'
        : 'bg-primary-500 text-white'
    }`}
  >
    {status || 'PENDIENTE'}
  </span>
)

const ContextDetail = ({ label, value }) => (
  <p className="font-inter text-base">
    <span className="font-semibold text-neutral-900">{label}: </span>
    <span className="italic text-neutral-700">{value}</span>
  </p>
)

const ActionButton = ({ text, color, onClick }) => (
  <button
    onClick={onClick}
    className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${color}`}
  >
    {text}
  </button>
)

export default function ReviewReportModal({
  isOpen,
  onClose,
  report,
  onModerationAction,
}) {
  const openConfirmModal = useConfirmStore(state => state.open)

  if (!isOpen || !report) return null

  const handleConfirmAction = (
    actionName,
    title,
    message,
    options = {}
  ) => {
    openConfirmModal(title, message, () => {
      onModerationAction(actionName, report)
    }, options)
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      {/* Contenedor del Modal - Ahora con max-height y overflow */}
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-white shadow-lg"
      >
        {/* Header fijo */}
        <div className="flex-shrink-0 p-6 border-b">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-poppins text-2xl md:text-3xl font-semibold text-neutral-900 mb-2">
                Reporte #{report.id}
              </h2>
              <StatusBadge status={report.status} />
            </div>
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-900 p-1"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Detalles del Reporte */}
          <div className="space-y-3">
            <div>
              <h3 className="font-roboto text-lg font-medium text-neutral-900">
                Reportado por
              </h3>
              <p className="font-inter text-base text-neutral-700">
                {report.reportedBy}
              </p>
            </div>
            <div>
              <h3 className="font-roboto text-lg font-medium text-neutral-900">
                Motivo
              </h3>
              <p className="font-inter text-base text-neutral-700">
                {report.reason}
              </p>
            </div>
            <div>
              <h3 className="font-roboto text-lg font-medium text-neutral-900">
                Contenido reportado
              </h3>
              <p className="font-inter text-base text-neutral-700">
                {report.contentId}
              </p>
            </div>
          </div>

          {/* Contexto */}
          <div className="rounded-lg bg-neutral-100 p-4">
            <h4 className="font-roboto text-lg font-medium text-neutral-900/70">
              Contexto del reporte
            </h4>
            <div className="mt-2 space-y-1">
              <ContextDetail label="Titulo" value={report.context.title} />
              <ContextDetail label="Vendedor" value={report.context.seller} />
              <ContextDetail label="Historial" value={report.context.history} />
              <ContextDetail
                label="Descripción"
                value={report.context.description}
              />
            </div>
          </div>

          <hr />

          {/* Acciones */}
          <div className="space-y-4">
            {/* Acciones de moderación */}
            <div>
              <h3 className="font-roboto text-lg font-medium text-neutral-900">
                Acciones de moderación:
              </h3>
              <div className="mt-2">
                <ActionButton
                  text="Quitar publicación"
                  color="bg-red-600 text-white hover:bg-red-700"
                  onClick={() =>
                    handleConfirmAction(
                      'remove_listing',
                      'Quitar Publicación',
                      `¿Estás seguro de que quieres quitar la publicación "${report.context.title}"?`
                    )
                  }
                />
              </div>
            </div>

            {/* Sobre el usuario */}
            <div>
              <h3 className="font-roboto text-lg font-medium text-neutral-900">
                Sobre el usuario reportado:
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <ActionButton
                  text="Suspender cuenta"
                  color="bg-red-600 text-white hover:bg-red-700"
                  onClick={() =>
                    handleConfirmAction(
                      'suspend_user',
                      'Suspender Usuario',
                      `¿Estás seguro de que quieres suspender la cuenta de ${report.context.seller}?`
                    )
                  }
                />
                <ActionButton
                  text="Enviar advertencia"
                  color="bg-yellow-400 text-black hover:bg-yellow-500"
                  onClick={() =>
                    handleConfirmAction(
                      'warn_user',
                      'Enviar Advertencia',
                      `¿Estás seguro de que quieres enviar una advertencia a ${report.context.seller}?`,
                      { danger: false }
                    )
                  }
                />
              </div>
            </div>

            {/* Sobre el reporte */}
            <div>
              <h3 className="font-roboto text-lg font-medium text-neutral-900">
                Sobre el reporte:
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <ActionButton
                  text="Marcar resuelto"
                  color="bg-primary-500 text-white hover:bg-primary-600"
                  onClick={() =>
                    handleConfirmAction(
                      'resolve',
                      'Marcar como Resuelto',
                      '¿Estás seguro de que quieres marcar este reporte como resuelto?',
                      { danger: false }
                    )
                  }
                />
                <ActionButton
                  text="Desestimar"
                  color="bg-neutral-900 text-white hover:bg-neutral-700"
                  onClick={() =>
                    handleConfirmAction(
                      'dismiss',
                      'Desestimar Reporte',
                      '¿Estás seguro de que quieres desestimar este reporte?',
                      { danger: false }
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}