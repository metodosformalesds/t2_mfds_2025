/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: QuickActions
 * Descripción: tarjeta con botones de acciones rápidas en el dashboard para publicar nuevo item, ver publicaciones y ver ventas
 */

'use client'

import Link from 'next/link'

/**
 * Card con botones para acciones rápidas en el dashboard.
 */
export default function QuickActions() {
  const actions = [
    {
      text: 'Publicar Nuevo',
      href: '/dashboard/publicaciones/nuevo', // <-- RUTA CORREGIDA
      variant: 'primary',
    },
    {
      text: 'Ver Mis Publicaciones',
      href: '/dashboard/publicaciones', // <-- RUTA CORREGIDA
      variant: 'outline',
    },
    {
      text: 'Ver Mis Ventas',
      href: '/dashboard/sales',
      variant: 'outline',
    },
  ]

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-lg">
      <h3 className="font-poppins text-2xl font-bold text-neutral-900">
        Acciones Rápidas
      </h3>
      <div className="flex flex-col gap-3">
        {actions.map(action => (
          <Link
            key={action.text}
            href={action.href}
            className={`
              w-full rounded-lg px-5 py-3 text-center
              font-inter text-base font-semibold transition-colors
              ${
                action.variant === 'primary'
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'border-2 border-primary-500 text-primary-500 hover:bg-primary-500/10'
              }
            `}
          >
            {action.text}
          </Link>
        ))}
      </div>
    </div>
  )
}