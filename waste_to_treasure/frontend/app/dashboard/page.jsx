'use client'

// import { useState, useEffect } from 'react'
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

// --- DATOS DE PRUEBA (Sin cambios) ---
const mockData = {
  stats: [
    {
      title: 'Ventas (Últimos 30d)',
      value: '$4,850.50',
      icon: DollarSign,
    },
    {
      title: 'Publicaciones Activas',
      value: '12',
      icon: Package,
    },
    {
      title: 'Pedidos Recibidos',
      value: '8',
      icon: ClipboardList,
    },
    {
      title: 'Consultas Nuevas',
      value: '2',
      icon: MessageSquare,
    },
  ],
  publications: {
    pending: [
      {
        id: 1,
        title: 'Sillas de Madera',
      },
      {
        id: 2,
        title: 'Lote de llantas',
      },
    ],
    stockAlerts: [
      {
        id: 3,
        title: 'Retazos de Tela',
        stock: 2,
      },
    ],
  },
  topProducts: [
    {
      id: 1,
      title: 'Lote de Retazos de Tela',
      stats: '12 ventas • $4,500.00 generados',
      price: '$4.5k',
      imageUrl: 'https://via.placeholder.com/100x100.png?text=Tela',
    },
    {
      id: 2,
      title: 'Madera Reciclada de Pino',
      stats: '3 ventas • $3,600.00 generados',
      price: '$3.6k',
      imageUrl: 'https://via.placeholder.com/100x100.png?text=Madera',
    },
  ],
  activity: [
    {
      id: 1,
      type: 'sale',
      text: '¡Nueva Venta! Lote de retazos...',
      time: 'hace 15 minutos',
    },
    {
      id: 2,
      type: 'review',
      text: 'Arturo P. ha dejado una reseña de 5 estrellas...',
      time: 'hace 2 horas',
    },
  ],
}
// --- FIN DE DATOS DE PRUEBA ---

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Sección 1: Tarjetas de Estadísticas (Ahora responsive) */}
      <section>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {mockData.stats.map(stat => (
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
            pending={mockData.publications.pending}
            stockAlerts={mockData.publications.stockAlerts}
          />
          <TopProducts products={mockData.topProducts} />
        </div>

        {/* Columna Derecha (1/3) - Añadido min-w-0 */}
        <div className="flex flex-col gap-8 lg:col-span-1 min-w-0">
          <QuickActions />
          <RecentActivity activities={mockData.activity} />
        </div>
      </section>
    </div>
  )
}