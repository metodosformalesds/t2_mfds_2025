/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: StatCard
 * Descripción: tarjeta de estadística para dashboard responsiva que muestra icono personalizado, valor numérico grande y título descriptivo con diseño adaptable a mobile
 */

'use client'
import { DollarSign } from 'lucide-react'

/**
 * Tarjeta de estadística para el dashboard de usuario.
 * Muestra un ícono, un valor y un título.
 * --- AHORA ES RESPONSIVE ---
 */
export default function StatCard({ icon: Icon, title, value }) {
  const IconComponent = Icon || DollarSign // Icono por defecto

  return (
    <div className="flex h-auto sm:h-32 items-start sm:items-center gap-4 rounded-xl bg-white p-6 shadow-lg flex-col sm:flex-row">
      <IconComponent className="h-5 w-5 sm:h-8 sm:w-8 flex-shrink-0 text-primary-500" />
      {/* Añadido min-w-0 para forzar el truncado de texto si es necesario */}
      <div className="flex flex-col min-w-0">
        <span className="font-roboto text-2xl sm:text-xl font-bold text-neutral-900/70 truncate">
          {value}
        </span>
        <span className="font-roboto text-base font-bold text-secondary-600">
          {title}
        </span>
      </div>
    </div>
  )
}