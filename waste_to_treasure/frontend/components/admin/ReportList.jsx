import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

/**
 * Badge para el estado del reporte
 */
const StatusBadge = ({ status }) => {
  const normalizedStatus = (status || 'PENDING').toUpperCase()
  let classes = ''
  let displayText = normalizedStatus
  
  switch (normalizedStatus) {
    case 'PENDING':
    case 'PENDIENTE':
      classes = 'bg-yellow-500 text-white'
      displayText = 'PENDIENTE'
      break
    case 'RESOLVED':
    case 'RESUELTO':
      classes = 'bg-primary-500 text-white'
      displayText = 'RESUELTO'
      break
    case 'DISMISSED':
    case 'DESESTIMADO':
      classes = 'bg-secondary-600 text-white'
      displayText = 'DESESTIMADO'
      break
    default:
      classes = 'bg-neutral-500 text-white'
  }
  return (
    <span
      className={`rounded-lg px-3 py-1 text-sm font-medium ${classes}`}
    >
      {displayText}
    </span>
  )
}

/**
 * Muestra la tabla de reportes existentes con paginación.
 */
export default function ReportList({ 
  reports, 
  onReview, 
  onDelete,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  isLoading = false
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-md">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-md">
        <p className="text-neutral-600 font-inter text-center">No hay reportes para mostrar.</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden rounded-xl bg-white shadow-md">

      {/* Tabla scrolleable */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
        {/* Encabezado */}
        <thead className="border-b-2 border-neutral-200 bg-neutral-100">
          <tr>
            <th className="px-6 py-4 text-left font-inter text-sm font-semibold text-neutral-900">
              ID
            </th>
            <th className="px-6 py-4 text-left font-inter text-sm font-semibold text-neutral-900">
              Motivo
            </th>
            <th className="px-6 py-4 text-left font-inter text-sm font-semibold text-neutral-900">
              Reportado por
            </th>
            <th className="px-6 py-4 text-left font-inter text-sm font-semibold text-neutral-900">
              Contenido
            </th>
            <th className="px-6 py-4 text-left font-inter text-sm font-semibold text-neutral-900">
              Estado
            </th>
            <th className="px-6 py-4 text-center font-inter text-sm font-semibold text-neutral-900">
              Acciones
            </th>
          </tr>
        </thead>

        {/* Cuerpo */}
        <tbody className="divide-y divide-neutral-200">
          {reports.map(report => (
            <tr key={report.id} className="hover:bg-neutral-50 transition-colors">
              <td className="px-6 py-4 font-inter text-sm text-neutral-900 font-medium">
                #{report.id}
              </td>
              <td className="px-6 py-4 font-inter text-sm text-neutral-900 max-w-xs truncate">
                {report.reason}
              </td>
              <td className="px-6 py-4 font-inter text-sm text-neutral-600">
                {report.reportedBy}
              </td>
              <td className="px-6 py-4 font-inter text-sm text-neutral-600 max-w-xs truncate">
                {report.contentId}
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={report.status} />
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => onReview(report)}
                    className="rounded-lg bg-primary-500 px-4 py-2 font-inter text-sm font-semibold text-white transition-colors hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    Revisar
                  </button>
                  <button
                    onClick={() => onDelete(report)}
                    className="rounded-lg bg-secondary-600 px-4 py-2 font-inter text-sm font-semibold text-white transition-colors hover:bg-secondary-700 focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="border-t border-neutral-200 p-4">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={clsx(
                'flex items-center gap-2 rounded-lg px-4 py-2 font-inter text-sm font-medium transition-colors',
                currentPage === 1
                  ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>

            <span className="font-inter text-sm text-neutral-600">
              Página {currentPage} de {totalPages}
            </span>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={clsx(
                'flex items-center gap-2 rounded-lg px-4 py-2 font-inter text-sm font-medium transition-colors',
                currentPage === totalPages
                  ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              )}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}