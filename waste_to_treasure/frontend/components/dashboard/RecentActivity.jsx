/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: RecentActivity
 * Descripción: feed de actividad reciente del usuario con iconografía por tipo de actividad, fechas formateadas y enlace para ver todas las notificaciones
 */

'use client'

import { 
  DollarSign, 
  ShoppingBag, 
  CheckCircle, 
  Check, 
  XCircle, 
  Star, 
  AlertTriangle, 
  Bell,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

/**
 * Card que muestra un feed de actividad reciente.
 */
export default function RecentActivity({ activities = [] }) {
  const getActivityConfig = (type) => {
    const configs = {
      'sale': {
        icon: DollarSign,
        bgColor: 'bg-green-100',
        iconColor: 'text-green-600',
        label: 'Venta'
      },
      'ORDER_CREATED': {
        icon: ShoppingBag,
        bgColor: 'bg-blue-100',
        iconColor: 'text-blue-600',
        label: 'Pedido'
      },
      'ORDER_COMPLETED': {
        icon: CheckCircle,
        bgColor: 'bg-green-100',
        iconColor: 'text-green-600',
        label: 'Completado'
      },
      'LISTING_APPROVED': {
        icon: Check,
        bgColor: 'bg-green-100',
        iconColor: 'text-green-600',
        label: 'Aprobado'
      },
      'LISTING_REJECTED': {
        icon: XCircle,
        bgColor: 'bg-red-100',
        iconColor: 'text-red-600',
        label: 'Rechazado'
      },
      'NEW_REVIEW': {
        icon: Star,
        bgColor: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        label: 'Reseña'
      },
      'LOW_STOCK': {
        icon: AlertTriangle,
        bgColor: 'bg-orange-100',
        iconColor: 'text-orange-600',
        label: 'Stock Bajo'
      },
      'default': {
        icon: Bell,
        bgColor: 'bg-gray-100',
        iconColor: 'text-gray-600',
        label: 'Notificación'
      }
    }
    return configs[type] || configs.default
  }

  return (
    <div className="flex flex-col rounded-xl bg-white shadow-md border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-poppins text-xl font-bold text-neutral-900">
            Actividad Reciente
            <Link 
              href="/dashboard/notifications"
              className="text-sm font-inter font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              Ver todo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </h3>
        </div>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-gray-100">
        {activities.length > 0 ? (
          activities.map(activity => {
            const config = getActivityConfig(activity.type)
            const Icon = config.icon

            const handleClick = () => {
              if (activity.link_url) {
                window.location.href = activity.link_url
              }
            }

            return (
              <div 
                key={activity.id} 
                onClick={handleClick}
                className={`p-4 hover:bg-gray-50 transition-colors ${activity.link_url ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${config.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold font-inter px-2 py-0.5 rounded-full ${config.bgColor} ${config.iconColor}`}>
                        {config.label}
                      </span>
                      {!activity.isRead && (
                        <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="font-inter text-sm text-neutral-900 mb-1 line-clamp-2">
                      {activity.text}
                    </p>
                    <p className="font-inter text-xs text-gray-500">
                      {activity.time}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-inter text-gray-500">
              No hay actividad reciente
            </p>
          </div>
        )}
      </div>
    </div>
  )
}