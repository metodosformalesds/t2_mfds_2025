/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: QuickNavigation
 * Descripción: barra de navegación rápida con enlaces a la homepage y panel de usuario del admin
 */

'use client'

import Link from 'next/link'
import { Home, UserCircle } from 'lucide-react'

export default function QuickNavigation() {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-2.5 font-inter text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-400 hover:shadow-md hover:scale-[1.02]"
      >
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">Homepage</span>
      </Link>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-2.5 font-inter text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-400 hover:shadow-md hover:scale-[1.02]"
      >
        <UserCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Panel de Usuario</span>
      </Link>
    </div>
  )
}
