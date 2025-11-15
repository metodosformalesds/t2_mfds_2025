'use client'

import { X } from 'lucide-react'
import { useConfirmStore } from '@/stores/useConfirmStore'

// Pequeño componente para las tarjetas de estadísticas
const StatCard = ({ title, value }) => (
  <div className="flex-1 rounded-lg bg-white p-4 shadow-md">
    <h4 className="font-roboto text-sm font-bold text-neutral-900/70">
      {title}
    </h4>
    <p className="mt-1 font-roboto text-2xl font-bold text-primary-500">
      {value}
    </p>
  </div>
)

// Botón de acción de moderación
const ActionButton = ({ text, color, onClick }) => (
  <button
    onClick={onClick}
    className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${color}`}
  >
    {text}
  </button>
)

export default function UserDetailModal({
  isOpen,
  onClose,
  user,
  onBlock,
  onUnblock,
}) {
  const openConfirmModal = useConfirmStore(state => state.open)

  if (!isOpen || !user) return null

  const stats = user.stats || {
    publications: 0,
    transactions: 0,
    memberSince: user.registeredAt || 'N/A',
    warnings: 0
  }
  
  const incidents = user.incidents || []
  const displayName = user.name || 'Sin nombre'
  const displayEmail = user.email || 'Sin email'

  const handleBlock = () => {
    onClose() // Cierra el modal de detalles
    onBlock(user) // Llama a la función de bloqueo (que abre el modal de confirmación)
  }

  const handleUnblock = () => {
    onClose() // Cierra el modal de detalles
    onUnblock(user) // Llama a la función de desbloqueo (que abre el modal de confirmación)
  }
  
  // Acciones placeholder
  const handleWarn = () => {
    openConfirmModal(
      'Enviar Advertencia',
      `¿Estás seguro de que quieres enviar una advertencia a ${displayName}?`,
      () => console.log('Advirtiendo a', user.id),
      false // No es una acción peligrosa
    )
  }
  
  const handleResetPassword = () => {
    openConfirmModal(
      'Resetear Contraseña',
      `¿Estás seguro de que quieres forzar un reseteo de contraseña para ${displayName}? El usuario recibirá un email.`,
      () => console.log('Reseteando contraseña de', user.id),
      false // No es una acción peligrosa
    )
  }

  return (
    // Fondo oscuro (Backdrop)
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      {/* Contenedor del Modal */}
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-3xl rounded-xl bg-white p-6 shadow-lg"
      >
        <h2 className="font-poppins text-3xl font-semibold text-neutral-900">
          Detalles usuario
        </h2>

        <hr className="my-4" />

        {/* Info y Badges */}
        <div className="mb-4">
          <h3 className="font-roboto text-lg font-medium text-neutral-900">
            {displayName}
          </h3>
          <p className="font-inter text-base text-neutral-700">{displayEmail}</p>
          <div className="mt-2 flex gap-2">
            <span
              className={`inline-block rounded-lg px-3 py-1 text-xs font-semibold ${
                user.status?.toUpperCase() === 'ACTIVE' || user.status?.toUpperCase() === 'ACTIVO'
                  ? 'bg-primary-500 text-white'
                  : 'bg-secondary-600 text-white'
              }`}
            >
              {user.status?.toUpperCase() === 'ACTIVE' ? 'ACTIVO' : user.status?.toUpperCase() === 'BLOCKED' ? 'BLOQUEADO' : user.status}
            </span>
            <span className="inline-block rounded-lg bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
              {user.role?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Grid de Stats e Incidencias */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Columna Izquierda: Stats */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <StatCard
                title="Publicaciones"
                value={stats.publications}
              />
              <StatCard
                title="Transacciones"
                value={stats.transactions}
              />
            </div>
            <div className="flex gap-4">
              <StatCard
                title="Miembro desde"
                value={stats.memberSince}
              />
              <StatCard title="Advertencias" value={stats.warnings} />
            </div>
          </div>

          {/* Columna Derecha: Incidencias */}
          <div>
            <h3 className="font-roboto text-lg font-medium text-neutral-900">
              Historial de incidencias
            </h3>
            <div className="mt-2 h-48 max-h-48 space-y-2 overflow-y-auto rounded-lg bg-neutral-100 p-3">
              {incidents.length > 0 ? (
                incidents.map(incident => (
                  <div
                    key={incident.id}
                    className="rounded bg-white p-2 text-sm text-neutral-700 shadow-sm"
                  >
                    {incident.text}
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-neutral-500">
                  Sin incidencias
                </p>
              )}
            </div>
          </div>
        </div>

        <hr className="my-4" />

        {/* Acciones de Moderación */}
        <div>
          <h3 className="font-roboto text-lg font-medium text-neutral-900">
            Acciones de moderación:
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {user.status?.toLowerCase() === 'active' || user.status?.toLowerCase() === 'activo' ? (
              <ActionButton
                text="Bloquear usuario"
                color="bg-red-600 text-white hover:bg-red-700"
                onClick={handleBlock}
              />
            ) : (
              <ActionButton
                text="Desbloquear usuario"
                color="bg-primary-500 text-white hover:bg-primary-600"
                onClick={handleUnblock}
              />
            )}
            <ActionButton
              text="Enviar advertencia"
              color="bg-yellow-400 text-black hover:bg-yellow-500"
              onClick={handleWarn}
            />
            <ActionButton
              text="Resetear contraseña"
              color="bg-secondary-600 text-white hover:bg-secondary-500"
              onClick={handleResetPassword}
            />
          </div>
        </div>

        <hr className="my-4" />

        {/* Footer */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-neutral-900 px-5 py-2 font-inter text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}