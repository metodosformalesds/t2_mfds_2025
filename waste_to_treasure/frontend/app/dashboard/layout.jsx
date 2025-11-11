'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard,
  User,
  Package,
  ShoppingCart,
  DollarSign,
  CreditCard,
  LogOut,
  ChevronLeft,
  Menu,
} from 'lucide-react'
import NavBar from '@/components/layout/NavBar'

import GlobalConfirmModal from '@/components/admin/GlobalConfirmModal'

// --- INICIO DE LA CORRECCIÓN DE ESTÉTICA (SidebarItem) ---
function SidebarItem({ href, icon: Icon, label, isActive, isLogout }) {
  // Clases actualizadas para coincidir con el diseño de sidebar oscura
  const baseClasses =
    'flex items-center w-full px-4 py-3 rounded-lg transition-colors font-inter font-semibold text-base'
  
  const activeClasses = 'bg-primary-500 text-white'
  const inactiveClasses =
    'black hover:bg-neutral-500 hover:text-white'
  const logoutClasses =
    'text-red-500 hover:bg-red-500/10'

  const classes = `
    ${baseClasses}
    ${
      isLogout
        ? logoutClasses
        : isActive
          ? activeClasses
          : inactiveClasses
    }
  `

  if (isLogout) {
    return (
      <button onClick={href} className={`${classes} text-left`}>
        <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
        <span>{label}</span>
      </button>
    )
  }

  return (
    <Link href={href} className={classes}>
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span>{label}</span>
    </Link>
  )
}
// --- FIN DE LA CORRECCIÓN DE ESTÉTICA (SidebarItem) ---

// --- INICIO DE LA CORRECCIÓN DE ESTÉTICA (DashboardSidebar) ---
function DashboardSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()

  const navItems = [
    {
      href: '/dashboard',
      icon: LayoutDashboard,
      label: 'Mi Panel',
      exact: true,
    },
    {
      href: '/dashboard/profile',
      icon: User,
      label: 'Gestión de perfil',
    },
    {
      href: '/dashboard/publicaciones',
      icon: Package,
      label: 'Mis Publicaciones',
    },
    {
      href: '/dashboard/purchases',
      icon: ShoppingCart,
      label: 'Mis Compras',
    },
    {
      href: '/dashboard/sales',
      icon: DollarSign,
      label: 'Mis Ventas',
    },
    {
      href: '/dashboard/subscription',
      icon: CreditCard,
      label: 'Gestión de Suscripciones',
    },
  ]

  return (
    // Fondo oscuro, texto blanco, padding actualizado
    <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 shadow-lg rounded-xl p-4">
      <nav className="flex flex-col space-y-2">
        {navItems.map(item => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <SidebarItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActive}
            />
          )
        })}
        {/* Separador */}
        <div className="pt-2 mt-2 border-t border-neutral-700">
          <SidebarItem
            href={logout}
            icon={LogOut}
            label="Cerrar Sesión"
            isLogout
          />
        </div>
      </nav>
    </aside>
  )
}
// --- FIN DE LA CORRECCIÓN DE ESTÉTICA (DashboardSidebar) ---

// Layout Principal del Dashboard (Sin cambios funcionales, solo hereda el fondo)
export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()

  return (
    <div className="min-h-screen">
      {/* 1. NavBar Principal (el blanco) */}
      <NavBar />

      {/* 2. Cabecera Verde del Panel */}
      <header className="bg-[#396530] shadow-md -mt-px">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-28">
            <h1 className="text-white text-4xl md:text-5xl font-poppins font-bold">
              Mi Panel
            </h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-white hover:bg-white/20"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. Contenido Principal (Sidebar + Children) */}
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="hidden lg:block">
            <DashboardSidebar />
          </div>
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </main>

      {/* Sidebar Móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          {/* Fondo oscuro para el sidebar móvil */}
          <div
            className="fixed left-0 top-0 z-50 w-80 h-full bg-white shadow-xl p-4 content-center"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-md text-gray-400 hover:bg-neutral-700"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <DashboardSidebar />
          </div>
        </div>
      )}

      <GlobalConfirmModal/>

    </div>
  )
}