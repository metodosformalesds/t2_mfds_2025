'use client'

import Link from 'next/link'
import { AlertCircle, Clock } from 'lucide-react'

/**
 * Muestra una fila de item de estado en el card.
 */
function StatusItem({ icon: Icon, title, description, buttonText, buttonLink }) {
  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
            buttonText === 'Revisar'
              ? 'bg-secondary-600/20'
              : 'bg-red-100'
          }`}
        >
          <Icon
            className={`h-5 w-5 ${
              buttonText === 'Revisar'
                ? 'text-secondary-600'
                : 'text-red-600'
            }`}
          />
        </div>
        <div>
          <h4 className="font-poppins text-base font-normal text-neutral-900">
            {title}
          </h4>
          <p className="font-poppins text-sm text-secondary-600">
            {description}
          </p>
        </div>
      </div>
      <Link
        href={buttonLink}
        className="flex-shrink-0 rounded-lg bg-primary-500 px-5 py-2.5 text-center font-inter text-base font-semibold text-white transition-colors hover:bg-primary-600 sm:w-auto w-full"
      >
        {buttonText}
      </Link>
    </div>
  )
}

/**
 * Card que muestra el estado de las publicaciones (pendientes, stock, etc.)
 */
export default function PublicationStatus({ pending = [], stockAlerts = [] }) {
  const pendingCount = pending.length
  const stockCount = stockAlerts.length

  // Genera la descripción para los pendientes
  const pendingDescription =
    pending.length > 0
      ? `"${pending[0].title}" ${
          pending.length > 1 ? `y ${pending.length - 1} más` : ''
        } esperando aprobación.`
      : 'No tienes publicaciones pendientes.'

  // Genera la descripción para las alertas de stock
  const stockDescription =
    stockAlerts.length > 0
      ? `"${stockAlerts[0].title}" ${
          stockAlerts.length > 1 ? `y ${stockAlerts.length - 1} más` : ''
        } tienen bajo stock.`
      : 'No tienes alertas de stock.'

  return (
    <div className="flex flex-col gap-6 rounded-xl bg-white p-6 shadow-lg">
      <h3 className="font-poppins text-2xl font-bold text-neutral-900">
        Estado de Publicaciones
      </h3>

      {pendingCount > 0 && (
        <StatusItem
          icon={Clock}
          title={`${pendingCount} Publicaciones Pendientes`}
          description={pendingDescription}
          buttonText="Revisar"
          buttonLink="/dashboard/publicaciones?status=pending"
        />
      )}

      {stockCount > 0 && (
        <StatusItem
          icon={AlertCircle}
          title={`${stockCount} Alertas de Stock`}
          description={stockDescription}
          buttonText="Actualizar Stock"
          buttonLink="/dashboard/publicaciones?status=low-stock"
        />
      )}

      {pendingCount === 0 && stockCount === 0 && (
        <p className="font-inter text-neutral-600">
          Todas tus publicaciones están activas y con buen stock.
        </p>
      )}
    </div>
  )
}