'use client'

import { Bell, Star } from 'lucide-react'

/**
 * Card que muestra un feed de actividad reciente.
 */
export default function RecentActivity({ activities = [] }) {
  const getIcon = type => {
    switch (type) {
      case 'sale':
        return (
          <Bell className="h-5 w-5 flex-shrink-0 text-secondary-600" />
        )
      case 'review':
        return <Star className="h-5 w-5 flex-shrink-0 text-yellow-500" />
      default:
        return <Bell className="h-5 w-5 flex-shrink-0 text-neutral-500" />
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-lg">
      <h3 className="font-poppins text-2xl font-bold text-neutral-900">
        Actividad Reciente
      </h3>
      <div className="flex flex-col divide-y divide-neutral-200">
        {activities.length > 0 ? (
          activities.map(activity => (
            <div key={activity.id} className="flex items-center gap-4 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1">
                <p className="font-poppins text-base font-normal text-neutral-900">
                  {activity.text}
                </p>
                <p className="font-poppins text-sm text-secondary-600">
                  {activity.time}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="py-4 font-inter text-neutral-600">
            No hay actividad reciente.
          </p>
        )}
      </div>
    </div>
  )
}