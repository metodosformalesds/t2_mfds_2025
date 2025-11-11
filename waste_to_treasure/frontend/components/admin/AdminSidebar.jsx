'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Edit,
  Flag,
  Boxes,
  LogOut,
  X,
} from 'lucide-react'
// 1. Importar useAuth
import { useAuth } from '@/context/AuthContext'

// (navLinks y NavLink sin cambios...)
const navLinks = [
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
    icon: Boxes,
  },
]

function NavLink({ href, label, icon: Icon, isActive }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-6 py-4 font-semibold text-white transition-colors ${
        isActive
          ? 'bg-primary-500' // Estilo activo
          : 'hover:bg-neutral-700' // Estilo inactivo
      }`}
    >
      <Icon className="h-6 w-6" />
      <span className="truncate">{label}</span>
    </Link>
  )
}


export default function AdminSidebar({ isOpen, onClose }) {
  const pathname = usePathname()
  // 2. Obtener la función de logout del contexto
  const { logout } = useAuth()

  // 3. handleLogout ahora llama a la función del contexto
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
      {/* Encabezado del Sidebar (sin cambios) */}
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

      {/* Navegación Principal (sin cambios) */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {navLinks.map(link => {
          const isActive = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href)

          return (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              icon={link.icon}
              isActive={isActive}
            />
          )
        })}
      </nav>

      {/* --- CORRECCIÓN DE LOGOUT --- */}
      {/* Pie de página del Sidebar (Perfil) (botón actualizado) */}
      <div className="h-[120px] flex-shrink-0 border-t border-white/20 px-4 pt-4">
        <p className="font-inter text-base text-white">Admin: Arturo Pérez</p>
        <button
          onClick={handleLogout}
          className="group mt-2 flex items-center gap-2 font-inter text-sm text-secondary-600 hover:underline"
        >
          <LogOut className="h-4 w-4 text-secondary-600" />
          Cerrar sesión
        </button>
      </div>
      {/* --- FIN DE LA CORRECCIÓN --- */}
    </aside>
  )
}