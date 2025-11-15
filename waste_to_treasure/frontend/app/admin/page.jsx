'use client'

import { useState, useEffect } from 'react'
import StatCard from '@/components/admin/StatCard'
import TaskCard from '@/components/admin/TaskCard'
import { adminService } from '@/lib/api/admin'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await adminService.getDashboardStats()
      setStats(data)
    } catch (error) {
      console.error('Error al cargar stats del admin:', error)
      setError('Error al cargar las estadísticas')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const kpiData = [
    { title: 'Total de usuarios', value: stats?.total_users || 0 },
    { title: 'Usuarios activos', value: stats?.active_users || 0 },
    { 
      title: 'Ingresos totales', 
      value: `$${Number(stats?.total_revenue || 0).toLocaleString('es-MX', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}` 
    },
    { title: 'Publicaciones totales', value: stats?.total_listings || 0 },
  ]

  const taskData = [
    {
      title: 'Publicaciones por moderar',
      value: stats?.pending_listings || 0,
      linkText: 'Revisar publicaciones',
      linkHref: '/admin/moderation',
    },
    {
      title: 'Reportes pendientes',
      value: stats?.pending_reports || 0,
      linkText: 'Revisar reportes',
      linkHref: '/admin/reports',
    },
    {
      title: 'Publicaciones aprobadas',
      value: stats?.approved_listings || 0,
      linkText: 'Ver publicaciones activas',
      linkHref: '/admin/moderation',
    },
  ]
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-900 font-medium">Cargando Dasboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="font-poppins text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-500">
          Dashboard
        </h1>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mt-6 rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-red-700 font-inter">{error}</p>
          <button
            onClick={fetchStats}
            className="mt-2 text-red-600 hover:underline font-inter text-sm"
          >
            Reintentar
          </button>
        </div>
      )}

      <section className="mt-8 sm:mt-12">
        <h2 className="font-poppins text-3xl sm:text-4xl font-semibold text-neutral-900">
          KPI's del sistema
        </h2>
        <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
          {kpiData.map(item => (
            <StatCard key={item.title} title={item.title} value={item.value} />
          ))}
        </div>
      </section>

      <section className="mt-12 sm:mt-16">
        <h2 className="font-poppins text-3xl sm:text-4xl font-semibold text-neutral-900">
          Colas de tarea
        </h2>
        <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {taskData.map(item => (
            <TaskCard
              key={item.title}
              title={item.title}
              value={item.value}
              linkText={item.linkText}
              linkHref={item.linkHref}
            />
          ))}
        </div>
      </section>
    </div>
  )
}