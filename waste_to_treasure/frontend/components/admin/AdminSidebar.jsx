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
        fixed inset-y-0 left-0 z-50 flex h-screen w-[275px] flex-shrink-0 flex-col 
        bg-neutral-900 text-white transition-transform duration-300 ease-in-out 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:static lg:translate-x-0
      `}
    >
      {/* Encabezado del Sidebar */}
      <div className="flex h-[120px] flex-shrink-0 items-center justify-between px-4">
        <div>
          <h1 className="font-roboto text-xl font-bold text-white">
            WASTE TO TREASURE
          </h1>
          <p className="font-inter text-base text-secondary-600">
            CONSOLA ADMIN
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-neutral-400 hover:text-white lg:hidden"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {menuItems.map(item => {
          const Icon = item.icon
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-6 py-4 font-semibold text-white transition-colors ${
                isActive
                  ? 'bg-primary-500'
                  : 'hover:bg-neutral-700'
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Pie de página del Sidebar (Perfil) */}
      <div className="h-[120px] flex-shrink-0 border-t border-white/20 px-4 pt-4">
        <p className="font-inter text-base text-white">
          Admin: {user?.name || user?.full_name || 'Usuario Admin'}
        </p>
        <button
          onClick={handleLogout}
          className="group mt-2 flex items-center gap-2 font-inter text-sm text-secondary-600 hover:underline"
        >
          <LogOut className="h-4 w-4 text-secondary-600" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}