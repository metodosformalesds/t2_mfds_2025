'use client'

import { useState, useEffect, useMemo } from 'react' // Agregar useMemo
import ReportList from '@/components/admin/ReportList'
import ReviewReportModal from '@/components/admin/ReviewReportModal'
import { useConfirmStore } from '@/stores/useConfirmStore'
import { adminService } from '@/lib/api/admin'

export default function AdminReportsPage() {
  const [reports, setReports] = useState([])
  const [totalReports, setTotalReports] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [error, setError] = useState('')

  const itemsPerPage = 6
  const openConfirmModal = useConfirmStore(state => state.open)

  // Cargar reportes con paginación
  const fetchReports = async (page = 1) => {
    try {
      setIsLoading(true)
      setError('')
      const skip = (page - 1) * itemsPerPage
      const data = await adminService.getReports({ 
        status: 'pending',
        skip,
        limit: itemsPerPage 
      })
      setReports(data.items || [])
      setTotalReports(data.total || 0)
      setCurrentPage(page)
    } catch (error) {
      console.error("Error al cargar reportes:", error)
      setError('Error al cargar los reportes')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReports(1)
  }, [])
  
  // Mapear datos al formato esperado
  const formattedReports = useMemo(() => {
    return (reports || []).map(r => ({
      id: r.report_id || 0,
      reason: r.reason || 'Sin razón especificada',
      reportedBy: r.reporter_name || 'Desconocido',
      contentId: r.reported_entity_description || 'N/A',
      status: r.status ? r.status.toUpperCase() : 'PENDING',
      createdAt: r.created_at || new Date().toISOString(),
      context: {
        title: r.reported_entity_description || 'N/A',
        seller: 'N/A',
        history: 'N/A',
        description: r.reason || 'Sin descripción',
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
    if (!report) return
    
    try {
      setError('')
      
      // Mapear acciones a formato de API
      if (action === 'resolve' || action === 'dismiss') {
        await adminService.resolveReport(report.id, {
          action: action === 'resolve' ? 'resolved' : 'dismissed',
          resolution_notes: `Reporte ${action === 'resolve' ? 'resuelto' : 'desestimado'} por administrador.`
        })
        
        // Recargar la página actual
        await fetchReports(currentPage)
        setError('')
      } else {
        // Otras acciones (suspend_user, warn_user, remove_listing)
        // TODO: Implementar cuando el backend tenga estos endpoints
        console.log(`Acción ${action} pendiente de implementación en backend`)
        setError(`La acción "${action}" aún no está implementada en el backend`)
      }
    } catch (error) {
      console.error("Error al procesar acción:", error)
      setError(error.response?.data?.detail || 'Error al procesar la acción')
    } finally {
      handleCloseModals()
    }
  }
  
  if (isLoading) {
     return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-900 font-medium">Cargando Reportes...</p>
        </div>
      </div>
    )
  }

  const totalPages = Math.ceil(totalReports / itemsPerPage)

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchReports(newPage)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="font-poppins text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-500">
          Gestión de reportes
        </h1>
        <div className="flex items-center gap-2 text-neutral-600">
          <span className="font-roboto text-lg font-semibold">{totalReports}</span>
          <span className="font-inter text-sm">reportes pendientes</span>
        </div>
      </div>

      {/* Error global */}
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-red-800 font-inter text-sm">{error}</p>
        </div>
      )}

      <div className="mt-6 sm:mt-10">
        <ReportList
          reports={formattedReports}
          onReview={handleOpenReview}
          onDelete={handleOpenDelete}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          isLoading={isLoading}
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