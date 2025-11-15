'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Home, UserCircle, RefreshCw } from 'lucide-react'
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
    { title: 'Nuevos usuarios (24h)', value: stats?.new_users_24h || 'N/A' },
    { title: 'Transacciones (24h)', value: stats?.transactions_24h || 'N/A' },
    { title: 'Ingresos por comisión (mes)', value: `$${(stats?.total_revenue || 0).toFixed(2)}` },
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
      title: 'Reportes de usuario pendientes',
      value: stats?.pending_reports || 0,
      linkText: 'Revisar reportes de usuario',
      linkHref: '/admin/reports',
    },
    {
      title: 'Usuarios Totales',
      value: stats?.total_users || 0,
      linkText: 'Gestionar usuarios',
      linkHref: '/admin/users',
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
    <div className="p-6">
      {/* Header con navegación rápida */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-poppins text-5xl font-bold text-primary-500">
          Dashboard
        </h1>
        
        {/* Enlaces rápidos - visibles en desktop */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-inter text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Home className="h-4 w-4" />
            Homepage
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-primary-500 bg-primary-50 px-4 py-2 font-inter text-sm font-medium text-primary-600 transition-colors hover:bg-primary-100"
          >
            <UserCircle className="h-4 w-4" />
            Panel de Usuario
          </Link>
        </div>
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

      <section className="mt-12">
        <h2 className="font-poppins text-4xl font-semibold text-neutral-900">
          KPI's del sistema
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {kpiData.map(item => (
            <StatCard key={item.title} title={item.title} value={item.value} />
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-poppins text-4xl font-semibold text-neutral-900">
          Colas de tarea
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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