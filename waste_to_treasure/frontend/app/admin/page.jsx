'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import StatCard from '@/components/admin/StatCard'
import TaskCard from '@/components/admin/TaskCard'
import { adminService } from '@/lib/api/admin'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Cargar datos al montar el componente
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        const data = await adminService.getDashboardStats()
        setStats(data)
      } catch (error) {
        console.error('Error al cargar stats del admin:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  // Mapear datos reales o de carga/default
  const kpiData = [
    { title: 'Nuevos usuarios (24h)', value: 'N/A' },
    { title: 'Transacciones (24h)', value: 'N/A' },
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
      <div className="p-6">
        <h1 className="font-poppins text-5xl font-bold text-primary-500">
          Cargando Dashboard...
        </h1>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="font-poppins text-5xl font-bold text-primary-500">
        Dashboard
      </h1>

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