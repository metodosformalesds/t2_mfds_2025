'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Edit,
  Flag,
  Folder,
  LogOut,
  X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const menuItems = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/admin/users',
    label: 'Usuarios',
    icon: Users,
  },
  {
    href: '/admin/moderation',
    label: 'Moderación de contenido',
    icon: Edit,
  },
  {
    href: '/admin/reports',
    label: 'Cola de reportes',
    icon: Flag,
  },
  {
    href: '/admin/categories',
    label: 'Categorías',
    icon: Folder,
  },
]

export default function AdminSidebar({ isOpen, onClose }) {
  const pathname = usePathname()
  const { logout, user } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <aside
      className={`
        fixed top-4 left-4 bottom-4 z-50 w-[300px] flex-shrink-0 flex-col 
        bg-gradient-to-b from-neutral-900 to-neutral-800 text-white 
        transition-transform duration-300 ease-in-out 
        rounded-2xl shadow-2xl border border-white/10
        ${isOpen ? 'flex translate-x-0' : 'hidden -translate-x-full'}
        lg:flex lg:static lg:translate-x-0 lg:top-0 lg:left-0 lg:bottom-0 
        lg:ml-12 lg:my-4 lg:mr-1 lg:rounded-3xl
      `}
    >
      {/* Encabezado del Sidebar */}
      <div className="flex h-[120px] flex-shrink-0 items-center justify-between px-6 pt-6">
        <div>
          <h1 className="font-roboto text-xl font-bold text-white">
            WASTE TO TREASURE
          </h1>
          <p className="font-inter text-sm text-secondary-400 mt-1">
            CONSOLA ADMIN
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors lg:hidden"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-4 content-center">
        {menuItems.map(item => {
          const Icon = item.icon
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-start gap-3 rounded-xl px-5 py-3.5 font-medium text-sm transition-all ${
                isActive
                  ? 'bg-primary-500 text-white text shadow-lg shadow-primary-500/30 scale-[1.02]'
                  : 'text-neutral-200 hover:bg-white/10 hover:text-white hover:scale-[1.01]'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Pie de página del Sidebar (Perfil) */}
      <div className="flex-shrink-0 border-t border-white/10 px-4 py-6 mb-2">
        <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm">
          <p className="font-inter text-sm text-white font-medium mb-1">
            {user?.name || user?.full_name || 'Usuario Admin'}
          </p>
          <p className="font-inter text-xs text-neutral-300 mb-3">
            Administrador
          </p>
          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 font-inter text-sm text-secondary-400 hover:text-secondary-300 transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  )
}