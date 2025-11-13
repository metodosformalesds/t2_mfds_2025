'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminMobileHeader from '@/components/admin/AdminMobileHeader'
import AdminLoading from '@/components/admin/AdminLoading'
import GlobalConfirmModal from '@/components/admin/GlobalConfirmModal'

export default function AdminLayout({ children }) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    // Esperar a que termine de cargar el estado de autenticación
    if (isLoading) return

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated) {
      console.log('[AdminLayout] Usuario no autenticado, redirigiendo a /login')
      router.replace('/login')
      return
    }

    // Si está autenticado pero no es ADMIN, redirigir a materials
    if (user && user.role !== 'ADMIN') {
      console.log('[AdminLayout] Usuario no es ADMIN, redirigiendo a /materials')
      router.replace('/materials')
      return
    }

    // Si está autenticado y es ADMIN, autorizar acceso
    if (user && user.role === 'ADMIN') {
      console.log('[AdminLayout] Usuario ADMIN autorizado')
      setIsAuthorized(true)
    }
  }, [isAuthenticated, isLoading, user, router])

  // Funciones para controlar el sidebar en móvil
  const handleOpenSidebar = () => setIsSidebarOpen(true)
  const handleCloseSidebar = () => setIsSidebarOpen(false)

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading && (user && user.role === 'ADMIN')) {
    return <AdminLoading message="Accediendo..." />
  }

  // Si no está autorizado, no mostrar nada (ya se redirigió)
  if (!isAuthorized) {
    return <AdminLoading message="Redirigiendo..." />
  }

  // Si está autorizado, mostrar el layout de admin
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Oculto en móvil, visible en desktop */}
      <AdminSidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header - Solo visible en móvil */}
        <AdminMobileHeader onOpen={handleOpenSidebar} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay para cerrar sidebar en móvil */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={handleCloseSidebar}
        />
      )}

      {/* Modal de confirmación global */}
      <GlobalConfirmModal />
    </div>
  )
}