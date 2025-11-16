/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: AdminMobileHeader
 * Descripción: encabezado móvil de la consola admin con logo y botón hamburguesa para abrir el sidebar
 */

'use client'

import { Menu } from 'lucide-react'

export default function AdminMobileHeader({ onOpen }) {
  return (
    <header className="flex h-16 w-full flex-shrink-0 items-center justify-between bg-white px-4 shadow-md lg:hidden">
      {/* Logo o Título para Móvil */}
      <div>
        <h1 className="font-roboto text-lg font-bold text-primary-500">
          W2T CONSOLA ADMIN
        </h1>
      </div>

      {/* Botón de Hamburguesa */}
      <button
        onClick={onOpen}
        className="p-2 text-neutral-700 hover:text-primary-500"
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6" />
      </button>
    </header>
  )
}