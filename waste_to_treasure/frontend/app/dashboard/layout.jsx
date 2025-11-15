'use client'

import NavBar from '@/components/layout/NavBar'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'
import GlobalConfirmModal from '@/components/admin/GlobalConfirmModal'

/**
 * Layout Principal del Dashboard
 * Sin header grande, solo NavBar + Sidebar Island + Contenido
 */
export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen">
      {/* NavBar Principal */}
      <NavBar />

      {/* Contenido Principal: Sidebar Island + Children */}
      <main className="max-w-7xl mx-auto pt-10 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Island (Responsivo) */}
          <DashboardSidebar />
          
          {/* Contenido Dinámico */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </main>

      <GlobalConfirmModal />
    </div>
  )
}