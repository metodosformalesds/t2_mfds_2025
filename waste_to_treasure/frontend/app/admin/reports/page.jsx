'use client'

import { useState } from 'react'
import ReportList from '@/components/admin/ReportList'
import ReviewReportModal from '@/components/admin/ReviewReportModal'
import { useConfirmStore } from '@/stores/useConfirmStore'

// (Datos de initialReports sin cambios...)
const initialReports = [
  {
    id: 'R123',
    reason: 'Fraude',
    reportedBy: 'correo@example.com',
    contentId: 'Publicación #P502',
    status: 'PENDIENTE',
    context: {
      title: 'Lote de PET',
      seller: 'vendedor@example.com',
      history: '3 reportes previos',
      description: '“Plástico PET de alta calidad...”',
    },
  },
  {
    id: 'R134',
    reason: 'Fraude',
    reportedBy: 'correo@example.com',
    contentId: 'Publicación #P502',
    status: 'RESUELTO',
    context: {
      title: 'Lote de PET',
      seller: 'vendedor@example.com',
      history: '3 reportes previos',
      description: '“Plástico PET de alta calidad...”',
    },
  },
  {
    id: 'R124',
    reason: 'Fraude',
    reportedBy: 'correo@example.com',
    contentId: 'Publicación #P502',
    status: 'PENDIENTE',
    context: {
      title: 'Lote de PET',
      seller: 'vendedor@example.com',
      history: '3 reportes previos',
      description: '“Plástico PET de alta calidad...”',
    },
  },
]

export default function AdminReportsPage() {
  const [reports, setReports] = useState(initialReports)
  const [selectedReport, setSelectedReport] = useState(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  const openConfirmModal = useConfirmStore(state => state.open)

  // Lógica de Modales (sin cambios)
  const handleOpenReview = report => {
    setSelectedReport(report)
    setIsReviewModalOpen(true)
  }

  const handleCloseModals = () => {
    setSelectedReport(null)
    setIsReviewModalOpen(false)
  }

  // Lógica de Acciones (sin cambios)
  const createDeleteHandler = report => {
    return () => {
      console.log('Eliminando reporte:', report.id)
      setReports(prevReports =>
        prevReports.filter(r => r.id !== report.id)
      )
    }
  }

  const handleOpenDelete = report => {
    openConfirmModal(
      'Eliminar Reporte',
      `¿Estás seguro de que quieres eliminar el reporte #${report.id}? Esta acción no se puede deshacer.`,
      createDeleteHandler(report),
      { danger: true }
    )
  }

  const handleModerationAction = (action, report) => {
    console.log(`Acción: ${action}, Reporte: ${report.id}`)
    if (action === 'resolve' || action === 'dismiss') {
      setReports(
        reports.map(r =>
          r.id === report.id ? { ...r, status: 'RESUELTO' } : r
        )
      )
    }
    handleCloseModals()
  }

  return (
    <>
      {/* --- INICIO DE LA CORRECCIÓN --- */}
      {/* Eliminado el 'p-12' de aquí */}
      <h1 className="font-poppins text-5xl font-bold text-primary-500">
        Gestión de reportes
      </h1>

      <div className="mt-10">
        <ReportList
          reports={reports}
          onReview={handleOpenReview}
          onDelete={handleOpenDelete}
        />
      </div>
      {/* --- FIN DE LA CORRECCIÓN --- */}

      {/* Modal para Revisar Reporte */}
      <ReviewReportModal
        isOpen={isReviewModalOpen}
        onClose={handleCloseModals}
        report={selectedReport}
        onModerationAction={handleModerationAction}
      />
    </>
  )
}