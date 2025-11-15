'use client'

import { Loader2 } from 'lucide-react'
import StatCard from '@/components/dashboard/StatCard'
import PublicationStatus from '@/components/dashboard/PublicationStatus'
import TopProducts from '@/components/dashboard/TopProducts'
import QuickActions from '@/components/dashboard/QuickActions'
import RecentActivity from '@/components/dashboard/RecentActivity'
import { useDashboardData } from '@/hooks/useDashboardData'
import {
  DollarSign,
  Package,
  ClipboardList,
  Bell,
} from 'lucide-react'

export default function DashboardPage() {
  const { dashboardData, isLoading, error } = useDashboardData()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-red-500 text-lg">⚠️ Error al cargar el dashboard</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  // Preparar las tarjetas de estadísticas con los iconos
  const statsCards = [
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
      title: 'Notificaciones Nuevas',
      value: dashboardData.stats.newNotifications.toString(),
      icon: Bell,
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Sección 1: Tarjetas de Estadísticas (Ahora responsive) */}
      <section>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {statsCards.map(stat => (
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
        {/* Columna Izquierda (2/3) - Añadido min-w-0 */}
        <div className="flex flex-col gap-8 lg:col-span-2 min-w-0">
          <PublicationStatus
            pending={dashboardData.pendingListings.map(l => ({
              id: l.listing_id,
              title: l.title,
            }))}
            stockAlerts={dashboardData.lowStockListings.map(l => ({
              id: l.listing_id,
              title: l.title,
              stock: l.quantity || l.available_quantity,
            }))}
          />
          <TopProducts products={dashboardData.topProducts} />
        </div>

        {/* Columna Derecha (1/3) - Añadido min-w-0 */}
        <div className="flex flex-col gap-8 lg:col-span-1 min-w-0">
          <QuickActions />
          <RecentActivity activities={dashboardData.recentActivity} />
        </div>
      </section>
    </div>
  )
}