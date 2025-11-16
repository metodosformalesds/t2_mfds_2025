import React from 'react'
import UserAvatar from '@/components/ui/UserAvatar'

/**
 * Badge para el estado del usuario (ACTIVO / BLOQUEADO)
 */
const StatusBadge = ({ status }) => {
  const normalizedStatus = (status || 'active').toUpperCase()
  let classes = ''
  let displayText = normalizedStatus
  
  switch (normalizedStatus) {
    case 'ACTIVE':
    case 'ACTIVO':
      classes = 'bg-primary-500 text-white'
      displayText = 'ACTIVO'
      break
    case 'BLOCKED':
    case 'BLOQUEADO':
      classes = 'bg-secondary-600 text-white'
      displayText = 'BLOQUEADO'
      break
    case 'PENDING':
    case 'PENDIENTE':
      classes = 'bg-yellow-500 text-white'
      displayText = 'PENDIENTE'
      break
    default:
      classes = 'bg-neutral-500 text-white'
  }
  return (
    <span
      className={`block w-fit rounded-lg px-3 py-1 text-center text-sm font-medium ${classes}`}
    >
      {displayText}
    </span>
  )
}

/**
 * Muestra la tabla de usuarios existentes.
 */
export default function UserList({ users, onView, onBlock, onUnblock }) {
  if (!users || users.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-md">
        <p className="text-neutral-600 font-inter text-center">No hay usuarios para mostrar.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-md">
      {/* Tabla con scroll horizontal en móvil */}
      <div className="w-full overflow-x-auto">
        <table className="min-w-full table-auto">
          {/* Encabezado */}
          <thead className="border-b-2 border-neutral-100 bg-neutral-100">
            <tr>
              <th className="px-6 py-4 text-left font-inter text-base font-semibold text-neutral-900">
                Usuario
              </th>
              <th className="px-6 py-4 text-left font-inter text-base font-semibold text-neutral-900">
                Email
              </th>
              <th className="px-6 py-4 text-center font-inter text-base font-semibold text-neutral-900">
                Rol
              </th>
              <th className="px-6 py-4 text-left font-inter text-base font-semibold text-neutral-900">
                Fecha registro
              </th>
              <th className="px-6 py-4 text-center font-inter text-base font-semibold text-neutral-900">
                Estado
              </th>
              <th className="px-6 py-4 text-center font-inter text-base font-semibold text-neutral-900">
                Acciones
              </th>
            </tr>
          </thead>

          {/* Cuerpo */}
          <tbody className="divide-y divide-neutral-200">
            {users.map(user => {
              const userStatus = (user.status || 'active').toLowerCase()
              return (
                <tr key={user.id} className="hover:bg-neutral-50">
                  {/* Usuario con avatar */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        imageUrl={user.profile_image_url}
                        fullName={user.name}
                        userId={user.id}
                        size="sm"
                      />
                      <span className="font-inter text-sm text-neutral-900 font-medium">
                        {user.name}
                      </span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4 font-inter text-sm text-neutral-700">
                    {user.email}
                  </td>

                  {/* Rol con badge */}
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                      user.role?.toUpperCase() === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role?.toUpperCase() || 'USER'}
                    </span>
                  </td>

                  {/* Fecha */}
                  <td className="px-6 py-4 font-inter text-sm text-neutral-700 whitespace-nowrap">
                    {user.registeredAt}
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4 text-center">
                    <StatusBadge status={user.status} />
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onView(user)}
                        className="whitespace-nowrap rounded-lg bg-primary-500 px-4 py-2 font-inter text-sm font-semibold text-white transition-colors hover:bg-primary-600"
                      >
                        Ver
                      </button>
                      {userStatus === 'active' || userStatus === 'activo' ? (
                        <button
                          onClick={() => onBlock(user)}
                          className="whitespace-nowrap rounded-lg bg-secondary-600 px-4 py-2 font-inter text-sm font-semibold text-white transition-colors hover:bg-secondary-500"
                        >
                          Bloquear
                        </button>
                      ) : (
                        <button
                          onClick={() => onUnblock(user)}
                          className="whitespace-nowrap rounded-lg bg-green-600 px-4 py-2 font-inter text-sm font-semibold text-white transition-colors hover:bg-green-700"
                        >
                          Activar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}