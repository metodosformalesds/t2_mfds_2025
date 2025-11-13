// app/dashboard/page.jsx
'use client'

import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import {
  DollarSign,
  Package,
  ClipboardList,
  MessageSquare,
} from 'lucide-react'
import StatCard from '@/components/dashboard/StatCard'
import PublicationStatus from '@/components/dashboard/PublicationStatus'
import TopProducts from '@/components/dashboard/TopProducts'
import QuickActions from '@/components/dashboard/QuickActions'
import RecentActivity from '@/components/dashboard/RecentActivity'
import { useDashboardData } from '@/hooks/useDashboardData'

export default function DashboardPage() {
  const { dashboardData, isLoading, error, refresh } = useDashboardData()

  // Mostrar loader mientras carga por primera vez
  if (isLoading && !dashboardData.stats.totalSales) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  // Preparar datos para las estadísticas
  const stats = [
    {
      title: 'Ventas (Últimos 30d)',
      value: `$${dashboardData.stats.totalSales}`,
      icon: DollarSign,
    },
    {
      title: 'Publicaciones Activas',
      value: dashboardData.stats.activeListings.toString(),
      icon: Package,
    },
    {
      title: 'Pedidos Recibidos',
      value: dashboardData.stats.receivedOrders.toString(),
      icon: ClipboardList,
    },
    {
      title: 'Consultas Nuevas',
      value: dashboardData.stats.newNotifications.toString(),
      icon: MessageSquare,
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Mensaje de error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700 font-inter">{error}</span>
          </div>
          <button
            onClick={refresh}
            className="px-4 py-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      )}

      {/* Sección 1: Tarjetas de Estadísticas */}
      <section>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map(stat => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
            />
          ))}
        </div>
      </section>

      {/* Sección 2: Contenido Principal (3 columnas) */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Columna Izquierda (2/3) */}
        <div className="flex flex-col gap-8 lg:col-span-2 min-w-0">
          <PublicationStatus
            pending={dashboardData.pendingListings}
            stockAlerts={dashboardData.lowStockListings}
          />
          <TopProducts products={dashboardData.topProducts} />
        </div>

        {/* Columna Derecha (1/3) */}
        <div className="flex flex-col gap-8 lg:col-span-1 min-w-0">
          <QuickActions />
          <RecentActivity activities={dashboardData.recentActivity} />
        </div>
      </section>
    </div>
  )
}