import React from 'react'

/**
 * Badge para el estado del reporte
 */
const StatusBadge = ({ status }) => {
  let classes = ''
  switch (status) {
    case 'PENDIENTE':
      classes = 'bg-secondary-600 text-white'
      break
    case 'RESUELTO':
      classes = 'bg-primary-500 text-white'
      break
    default:
      classes = 'bg-neutral-500 text-white'
  }
  return (
    <span
      className={`rounded-lg px-3 py-1 text-sm font-medium ${classes}`}
    >
      {status}
    </span>
  )
}

/**
 * Muestra la tabla de reportes existentes.
 */
export default function ReportList({ reports, onReview, onDelete }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full table-auto">
        {/* Encabezado */}
        <thead className="border-b-2 border-neutral-100 bg-neutral-100">
          <tr>
            <th className="px-6 py-4 text-left font-inter text-base font-semibold text-neutral-900">
              ID reporte
            </th>
            <th className="px-6 py-4 text-left font-inter text-base font-semibold text-neutral-900">
              Motivo
            </th>
            <th className="px-6 py-4 text-left font-inter text-base font-semibold text-neutral-900">
              Reportado por
            </th>
            <th className="px-6 py-4 text-left font-inter text-base font-semibold text-neutral-900">
              Contenido reportado
            </th>
            <th className="px-6 py-4 text-left font-inter text-base font-semibold text-neutral-900">
              Estado
            </th>
            <th className="px-6 py-4 text-left font-inter text-base font-semibold text-neutral-900">
              Acciones
            </th>
          </tr>
        </thead>

        {/* Cuerpo */}
        <tbody className="divide-y divide-neutral-200">
          {reports.map(report => (
            <tr key={report.id} className="hover:bg-neutral-50">
              <td className="px-6 py-4 font-inter text-base text-neutral-900">
                {report.id}
              </td>
              <td className="px-6 py-4 font-inter text-base text-neutral-900">
                {report.reason}
              </td>
              <td className="px-6 py-4 font-inter text-base text-neutral-900">
                {report.reportedBy}
              </td>
              <td className="px-6 py-4 font-inter text-base text-neutral-900">
                {report.contentId}
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={report.status} />
              </td>
              <td className="flex gap-2 px-6 py-4">
                <button
                  onClick={() => onReview(report)}
                  className="rounded-lg bg-primary-500 px-5 py-2 font-inter text-sm font-semibold text-white transition-colors hover:bg-primary-600"
                >
                  Revisar
                </button>
                <button
                  onClick={() => onDelete(report)}
                  className="rounded-lg bg-secondary-600 px-5 py-2 font-inter text-sm font-semibold text-white transition-colors hover:bg-secondary-500"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}