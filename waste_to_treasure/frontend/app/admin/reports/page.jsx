'use client'

import { useState, useEffect, useMemo } from 'react' // Agregar useMemo
import ReportList from '@/components/admin/ReportList'
import ReviewReportModal from '@/components/admin/ReviewReportModal'
import { useConfirmStore } from '@/stores/useConfirmStore'
import { adminService } from '@/lib/api/admin'

export default function AdminReportsPage() {
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  const openConfirmModal = useConfirmStore(state => state.open)

  // Cargar reportes
  const fetchReports = async () => {
    try {
      setIsLoading(true)
      const data = await adminService.getReports({ status: 'pending' })
      setReports(data.items || [])
    } catch (error) {
      console.error("Error al cargar reportes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])
  
  // Mapear datos al formato esperado
  const formattedReports = useMemo(() => {
    return reports.map(r => ({
      id: r.report_id,
      reason: r.reason,
      reportedBy: r.reporter_name,
      contentId: r.reported_entity_description,
      status: r.status.toUpperCase(),
      context: {
        title: r.reported_entity_description,
        seller: 'N/A (API no provee vendedor)',
        history: 'N/A (API no provee historial)',
        description: 'N/A (API no provee descripción)',
      },
    }))
  }, [reports])

  const handleOpenReview = (report) => {
    setSelectedReport(report)
    setIsReviewModalOpen(true)
  }

  const handleCloseModals = () => {
    setIsReviewModalOpen(false)
    setSelectedReport(null)
  }
  
  // Acción de Borrar Reporte - La API no tiene DELETE /reports/{id}
  // Dejamos el borrado local por ahora
  const createDeleteHandler = report => {
    return () => {
      console.log('Eliminando reporte (localmente):', report.id)
      setReports(prevReports =>
        prevReports.filter(r => r.report_id !== report.id)
      )
    }
  }
  
  const handleOpenDelete = (report) => {
    openConfirmModal(
      'Eliminar Reporte',
      `¿Estás seguro de que quieres eliminar este reporte?`,
      createDeleteHandler(report),
      { danger: true }
    )
  }

  const handleModerationAction = async (action, report) => {
    console.log(`Acción: ${action}, Reporte: ${report.id}`)
    
    // Mapear acción del modal a acción de API
    let apiAction = action
    if (action === 'resolve') apiAction = 'resolved'
    if (action === 'dismiss') apiAction = 'dismissed'

    if (apiAction === 'resolved' || apiAction === 'dismissed') {
      try {
        await adminService.resolveReport(report.id, {
          action: apiAction,
          resolution_notes: `Reporte marcado como ${apiAction} por admin.`
        })
        
        // Actualizar UI
        setReports(
          reports.map(r =>
            r.report_id === report.id ? { ...r, status: apiAction.toUpperCase() } : r
          )
        )
      } catch (error) {
         console.error("Error al resolver reporte:", error)
         // TODO: Mostrar error
      }
    }
    
    // TODO: Implementar otras acciones (remove_listing, suspend_user, warn_user)
    // que requerirían llamadas a usersService o listingsService
    
    handleCloseModals()
  }
  
  if (isLoading) {
     return (
       <div className="p-6">
         <h1 className="font-poppins text-5xl font-bold text-primary-500">
          Cargando Reportes...
        </h1>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="font-poppins text-5xl font-bold text-primary-500">
        Gestión de reportes
      </h1>
      
      <p className="mt-4 text-orange-600 font-semibold">
        Nota: La API de reportes no provee los mismos datos de 'contexto'
        que el mock. El modal de revisión mostrará 'N/A' en esos campos.
      </p>

      <div className="mt-10">
        <ReportList
          reports={formattedReports}
          onReview={handleOpenReview}
          onDelete={handleOpenDelete}
        />
      </div>

      <ReviewReportModal
        isOpen={isReviewModalOpen}
        onClose={handleCloseModals}
        report={selectedReport}
        onModerationAction={handleModerationAction}
      />
    </div>
  )
}