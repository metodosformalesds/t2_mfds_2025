'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Users, Package, DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react'
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
    { 
      title: 'Total de usuarios', 
      value: stats?.total_users || 0,
      icon: Users,
      color: 'blue',
      subtext: `${stats?.active_users || 0} activos`
    },
    { 
      title: 'Publicaciones totales', 
      value: stats?.total_listings || 0,
      icon: Package,
      color: 'green',
      subtext: `${stats?.approved_listings || 0} aprobadas`
    },
    { 
      title: 'Ingresos totales', 
      value: `$${Number(stats?.total_revenue || 0).toLocaleString('es-MX', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`,
      icon: DollarSign,
      color: 'emerald',
      subtext: 'Total acumulado'
    },
    { 
      title: 'Pendientes de moderar', 
      value: stats?.pending_listings || 0,
      icon: Clock,
      color: 'yellow',
      subtext: 'Requieren revisión'
    },
  ]

  // Calcular métricas adicionales
  const activeUsersRate = stats?.total_users > 0 
    ? ((stats?.active_users / stats?.total_users) * 100).toFixed(1)
    : 0
    
  const approvalRate = stats?.total_listings > 0
    ? ((stats?.approved_listings / stats?.total_listings) * 100).toFixed(1)
    : 0

  const additionalMetrics = [
    {
      title: 'Tasa de usuarios activos',
      value: `${activeUsersRate}%`,
      description: `${stats?.active_users || 0} de ${stats?.total_users || 0} usuarios`,
      icon: TrendingUp,
      trend: activeUsersRate >= 50 ? 'up' : 'down'
    },
    {
      title: 'Tasa de aprobación',
      value: `${approvalRate}%`,
      description: `${stats?.approved_listings || 0} de ${stats?.total_listings || 0} publicaciones`,
      icon: CheckCircle,
      trend: approvalRate >= 70 ? 'up' : 'down'
    },
    {
      title: 'Reportes pendientes',
      value: stats?.pending_reports || 0,
      description: 'Requieren atención',
      icon: AlertCircle,
      trend: (stats?.pending_reports || 0) > 5 ? 'down' : 'up'
    },
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-poppins text-3xl sm:text-4xl font-bold text-neutral-900">
            Dashboard Administrativo
          </h1>
          <p className="mt-1 font-inter text-sm text-neutral-600">
            Resumen general del sistema Waste to Treasure
          </p>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4">
          <p className="text-red-700 font-inter">{error}</p>
          <button
            onClick={fetchStats}
            className="mt-2 text-red-600 hover:underline font-inter text-sm font-medium"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* KPIs principales */}
      <section>
        <h2 className="font-poppins text-2xl font-semibold text-neutral-900 mb-4">
          Métricas Principales
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((item) => {
            const Icon = item.icon
            const colorClasses = {
              blue: 'bg-blue-100 text-blue-600',
              green: 'bg-green-100 text-green-600',
              emerald: 'bg-emerald-100 text-emerald-600',
              yellow: 'bg-yellow-100 text-yellow-600',
            }
            
            return (
              <div 
                key={item.title}
                className="rounded-xl bg-white p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-inter text-sm text-neutral-600 mb-1">
                      {item.title}
                    </p>
                    <p className="font-poppins text-3xl font-bold text-neutral-900">
                      {item.value}
                    </p>
                    <p className="mt-1 font-inter text-xs text-neutral-500">
                      {item.subtext}
                    </p>
                  </div>
                  <div className={`rounded-lg p-3 ${colorClasses[item.color]}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Métricas adicionales */}
      <section>
        <h2 className="font-poppins text-2xl font-semibold text-neutral-900 mb-4">
          Analytics del Sistema
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {additionalMetrics.map((metric) => {
            const Icon = metric.icon
            const trendColor = metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
            const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown
            
            return (
              <div 
                key={metric.title}
                className="rounded-xl bg-white p-5 shadow-sm border border-neutral-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon className="h-5 w-5 text-neutral-500" />
                  <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                </div>
                <p className="font-inter text-sm text-neutral-600 mb-1">
                  {metric.title}
                </p>
                <p className="font-poppins text-2xl font-bold text-neutral-900 mb-1">
                  {metric.value}
                </p>
                <p className="font-inter text-xs text-neutral-500">
                  {metric.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Colas de tarea */}
      <section>
        <h2 className="font-poppins text-2xl font-semibold text-neutral-900 mb-4">
          Acciones Pendientes
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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