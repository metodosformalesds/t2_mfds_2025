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

/**
 * Item individual del sidebar de navegación
 */
function SidebarItem({ href, icon: Icon, label, isActive, isLogout }) {
  const baseClasses =
    'flex items-center w-full px-4 py-3 rounded-lg transition-colors font-inter font-semibold text-base'
  
  const activeClasses = 'bg-primary-500 text-white'
  const inactiveClasses = 'text-gray-700 hover:bg-gray-100'
  const logoutClasses = 'text-red-500 hover:bg-red-50'

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

/**
 * Sidebar de navegación del dashboard
 * Componente island reutilizable con navegación completa
 */
function SidebarContent() {
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
      <div className="pt-2 mt-2 border-t border-gray-200">
        <SidebarItem
          href={logout}
          icon={LogOut}
          label="Cerrar Sesión"
          isLogout
        />
      </div>
    </nav>
  )
}

/**
 * Dashboard Sidebar Island Component
 * Versión responsiva con versión desktop y móvil
 */
export default function DashboardSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      {/* Botón para abrir menú en móvil - Esquina superior izquierda */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-20 left-4 z-30 p-3 mt-10 bg-primary-500 text-white rounded-lg shadow-lg hover:bg-primary-600 transition-colors"
        aria-label="Abrir menú de navegación"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar Desktop - Visible solo en pantallas grandes */}
      <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0 bg-white shadow-lg rounded-xl p-6 sticky top-6 h-fit">
        <SidebarContent />
      </aside>

      {/* Sidebar Móvil - Modal deslizable */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="fixed left-0 top-0 z-50 w-80 max-w-[85vw] h-full bg-white shadow-xl p-6 overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-poppins font-bold text-gray-800">
                Menú
              </h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:bg-gray-100 transition-colors"
                aria-label="Cerrar menú"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}
