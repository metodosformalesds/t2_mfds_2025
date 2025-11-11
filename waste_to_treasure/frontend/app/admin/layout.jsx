'use client'

import { useState } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminMobileHeader from '@/components/admin/AdminMobileHeader'
import GlobalConfirmModal from '@/components/admin/GlobalConfirmModal'

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-neutral-100">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <AdminMobileHeader onOpen={() => setSidebarOpen(true)} />

        {/* --- INICIO DE LA CORRECCIÓN --- */}
        {/* El 'main' ahora es el contenedor scrollable */}
        <main className="flex-1 overflow-y-auto overflow-x-auto">
          {/* Este div interno asegura que el contenido no se encoja menos de 1024px */}
          <div className="min-w-[1024px] p-12">
            {children}
          </div>
        </main>
        {/* --- FIN DE LA CORRECCIÓN --- */}
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <GlobalConfirmModal />
    </div>
  )
}