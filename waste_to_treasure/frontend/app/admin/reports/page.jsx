'use client'

import { useState, useEffect, useMemo } from 'react'
import ReportList from '@/components/admin/ReportList'
import ReviewReportModal from '@/components/admin/ReviewReportModal'
import Toast from '@/components/ui/Toast'
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
  const [toast, setToast] = useState(null)
  
  // Nuevos estados para filtros
  const [statusFilter, setStatusFilter] = useState('pending')
  const [stats, setStats] = useState({ pending: 0, resolved: 0, dismissed: 0 })

  const itemsPerPage = 6
  const openConfirmModal = useConfirmStore(state => state.open)

  // Cargar estadísticas
  const fetchStats = async () => {
    try {
      const [pendingData, resolvedData, dismissedData] = await Promise.all([
        adminService.getReports({ status: 'pending', skip: 0, limit: 1 }),
        adminService.getReports({ status: 'resolved', skip: 0, limit: 1 }),
        adminService.getReports({ status: 'dismissed', skip: 0, limit: 1 })
      ])
      
      setStats({
        pending: pendingData.total || 0,
        resolved: resolvedData.total || 0,
        dismissed: dismissedData.total || 0
      })
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    }
  }

  // Cargar reportes con paginación y filtros
  const fetchReports = async (page = 1) => {
    try {
      setIsLoading(true)
      setError('')
      const skip = (page - 1) * itemsPerPage
      const data = await adminService.getReports({ 
        status: statusFilter,
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
    fetchStats()
  }, [])

  useEffect(() => {
    fetchReports(1)
  }, [statusFilter])
  
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
  
  // Acción de Desestimar Reporte usando la API
  const handleOpenDelete = (report) => {
    openConfirmModal(
      'Desestimar Reporte',
      `¿Estás seguro de que quieres desestimar este reporte? Esta acción marcará el reporte como desestimado.`,
      async () => {
        try {
          await adminService.resolveReport(report.id, {
            action: 'dismissed',
            resolution_notes: 'Reporte desestimado por administrador'
          })
          setToast({ message: 'Reporte desestimado correctamente', type: 'info' })
          // Recargar reportes y estadísticas
          await fetchReports(currentPage)
          await fetchStats()
        } catch (error) {
          console.error('Error al desestimar reporte:', error)
          setToast({ 
            message: `Error al desestimar reporte: ${error.response?.data?.detail || error.message}`, 
            type: 'error' 
          })
        }
      },
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
        
        setToast({ 
          message: `Reporte ${action === 'resolve' ? 'resuelto' : 'desestimado'} correctamente`, 
          type: 'success' 
        })
        
        // Recargar la página actual y estadísticas
        await fetchReports(currentPage)
        await fetchStats()
        setError('')
      } else {
        // Otras acciones (suspend_user, warn_user, remove_listing)
        // TODO: Implementar cuando el backend tenga estos endpoints
        console.log(`Acción ${action} pendiente de implementación en backend`)
        setToast({ 
          message: `La acción "${action}" aún no está implementada en el backend`, 
          type: 'warning' 
        })
      }
    } catch (error) {
      console.error("Error al procesar acción:", error)
      const errorMsg = error.response?.data?.detail || 'Error al procesar la acción'
      setError(errorMsg)
      setToast({ message: errorMsg, type: 'error' })
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
      {/* Header con título y descripción */}
      <div className="mb-6 sm:mb-8">
        <h1 className="font-poppins text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-500">
          Gestión de reportes
        </h1>
        <p className="mt-2 text-neutral-600 font-inter">
          Administra los reportes de usuarios y toma acciones sobre contenido reportado
        </p>
      </div>
      
      {/* Filtros y estadísticas integrados */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          {/* Filtros de estado */}
          <div className="flex-1 w-full lg:w-auto">
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Estado de reportes
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === 'pending'
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Pendientes
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === 'resolved'
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Resueltos
              </button>
              <button
                onClick={() => setStatusFilter('dismissed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === 'dismissed'
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Desestimados
              </button>
            </div>
          </div>
          
          {/* Estadísticas compactas */}
          <div className="flex gap-6 items-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.pending}</div>
              <div className="text-xs text-neutral-600 mt-0.5">Pendientes</div>
            </div>
            <div className="h-10 w-px bg-neutral-200"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              <div className="text-xs text-neutral-600 mt-0.5">Resueltos</div>
            </div>
            <div className="h-10 w-px bg-neutral-200"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-600">{stats.dismissed}</div>
              <div className="text-xs text-neutral-600 mt-0.5">Desestimados</div>
            </div>
          </div>
        </div>
        
        {/* Contador actual */}
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <p className="text-sm text-neutral-600">
            Mostrando <span className="font-semibold text-neutral-900">{totalReports}</span> reportes{' '}
            {statusFilter === 'pending' ? 'pendientes de revisión' : 
             statusFilter === 'resolved' ? 'resueltos' : 'desestimados'}
          </p>
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

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}