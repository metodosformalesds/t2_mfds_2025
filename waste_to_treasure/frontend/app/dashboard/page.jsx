'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign,
  Package,
  ClipboardList,
  MessageSquare,
  Loader2,
} from 'lucide-react'
import StatCard from '@/components/dashboard/StatCard'
import PublicationStatus from '@/components/dashboard/PublicationStatus'
import TopProducts from '@/components/dashboard/TopProducts'
import QuickActions from '@/components/dashboard/QuickActions'
import RecentActivity from '@/components/dashboard/RecentActivity'
import listingsService from '@/lib/api/listings'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    stats: [],
    publications: { pending: [], stockAlerts: [] },
    topProducts: [],
    activity: [],
  })

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true)

        // Obtener listings del usuario
        const response = await listingsService.getMyListings()
        const myListings = response?.items || [] // El backend retorna { items: [], total, page }

        // Calcular estadísticas
        const activeListings = myListings.filter(l => l.status === 'ACTIVE')
        const pendingListings = myListings.filter(l => l.status === 'PENDING')
        
        // TODO: Obtener datos reales de ventas y pedidos desde el backend
        // Por ahora calculamos con datos disponibles
        const stats = [
          {
            title: 'Ventas (Últimos 30d)',
            value: '$0.00', // TODO: Integrar con transacciones
            icon: DollarSign,
          },
          {
            title: 'Publicaciones Activas',
            value: activeListings.length.toString(),
            icon: Package,
          },
          {
            title: 'Pedidos Recibidos',
            value: '0', // TODO: Integrar con órdenes
            icon: ClipboardList,
          },
          {
            title: 'Consultas Nuevas',
            value: '0', // TODO: Integrar con mensajes
            icon: MessageSquare,
          },
        ]

        // Listings pendientes de aprobación
        const pending = pendingListings.map(l => ({
          id: l.listing_id,
          title: l.title,
        }))

        // Listings con stock bajo (< 5)
        const stockAlerts = activeListings
          .filter(l => l.available_quantity && l.available_quantity < 5)
          .map(l => ({
            id: l.listing_id,
            title: l.title,
            stock: l.available_quantity,
          }))

        // Top productos (ordenar por views o cantidad vendida si está disponible)
        const topProducts = activeListings
          .slice(0, 5)
          .map(l => ({
            id: l.listing_id,
            title: l.title,
            stats: `${l.available_quantity || 0} unidades disponibles`,
            price: `$${l.price?.toFixed(2) || '0.00'}`,
            imageUrl: l.images?.[0]?.image_url || 'https://via.placeholder.com/100x100.png?text=No+Image',
          }))

        // Actividad reciente (basado en created_at de listings)
        const activity = myListings
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
          .map(l => ({
            id: l.listing_id,
            type: 'listing',
            text: `Publicaste: ${l.title}`,
            time: getRelativeTime(l.created_at),
          }))

        setDashboardData({
          stats,
          publications: { pending, stockAlerts },
          topProducts,
          activity,
        })
      } catch (error) {
        console.error('Error cargando dashboard:', error)
        // En caso de error, mantener estructura vacía
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  // Helper para tiempo relativo
  const getRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`
    if (diffHours < 24) return `hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`
    return `hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Sección 1: Tarjetas de Estadísticas (Ahora responsive) */}
      <section>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {dashboardData.stats.map(stat => (
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
            pending={dashboardData.publications.pending}
            stockAlerts={dashboardData.publications.stockAlerts}
          />
          <TopProducts products={dashboardData.topProducts} />
        </div>

        {/* Columna Derecha (1/3) - Añadido min-w-0 */}
        <div className="flex flex-col gap-8 lg:col-span-1 min-w-0">
          <QuickActions />
          <RecentActivity activities={dashboardData.activity} />
        </div>
      </section>
    </div>
  )
}