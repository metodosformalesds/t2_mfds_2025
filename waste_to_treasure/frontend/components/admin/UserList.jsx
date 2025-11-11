import React from 'react'

/**
 * Badge para el estado del usuario (ACTIVO / BLOQUEADO)
 */
const StatusBadge = ({ status }) => {
  let classes = ''
  switch (status) {
    case 'ACTIVO':
      classes = 'bg-primary-500 text-white' // Verde
      break
    case 'BLOQUEADO':
      classes = 'bg-secondary-600 text-white' // Naranja/Marrón
      break
    default:
      classes = 'bg-neutral-500 text-white'
  }
  return (
    <span
      className={`block w-fit rounded-lg px-3 py-1 text-center text-sm font-medium ${classes}`}
    >
      {status}
    </span>
  )
}

/**
 * Muestra la tabla de usuarios existentes.
 */
export default function UserList({ users, onView, onBlock, onUnblock }) {
  return (
    // --- INICIO DE LA CORRECCIÓN DE LAYOUT ---
    // El 'card' ahora está en la página (page.jsx)
    // Este componente solo renderiza el contenido de la tabla.
    <>
      {/* Encabezado */}
      <div className="w-full overflow-x-auto rounded-t-xl bg-neutral-100 px-6 py-4">
        <table className="min-w-full table-auto">
          <thead>
            <tr>
              <th className="w-1/12 px-6 py-2 text-left font-inter text-base font-semibold text-neutral-900">
                ID
              </th>
              <th className="w-2/12 px-0 py-2 text-left font-inter text-base font-semibold text-neutral-900">
                Nombre
              </th>
              <th className="w-2/12 px-4 py-2 text-left font-inter text-base font-semibold text-neutral-900">
                Email
              </th>
              <th className="w-1/12 px-8 py-2 text-left font-inter text-base font-semibold text-neutral-900">
                Rol
              </th>
              <th className="w-2/12 px-0 py-2 text-left font-inter text-base font-semibold text-neutral-900">
                Fecha de registro
              </th>
              <th className="w-1/12 px-2 py-2 text-left font-inter text-base font-semibold text-neutral-900">
                Estado
              </th>
              <th className="w-3/12 px-8 py-2 text-left font-inter text-base font-semibold text-neutral-900">
                Acciones
              </th>
            </tr>
          </thead>
        </table>
      </div>

      {/* Cuerpo */}
      <div className="w-full overflow-x-auto rounded-b-xl">
        <table className="min-w-full table-auto">
          <tbody className="divide-y divide-neutral-200">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-neutral-50">
                <td className="w-1/12 px-12 py-4  font-inter text-base text-neutral-900">
                  {user.id}
                </td>
                <td className="w-2/12 px-2 py-4 font-inter text-base text-neutral-900">
                  {user.name}
                </td>
                <td className="w-2/12 px-5 py-4 font-inter text-base text-neutral-900">
                  {user.email}
                </td>
                <td className="w-1/12 px-8 py-4 font-inter text-base text-neutral-900">
                  {user.role}
                </td>
                <td className="w-2/12 px-0 py-4 font-inter text-base text-neutral-900">
                  {user.registerDate}
                </td>
                <td className="w-1/12 px-0 py-4">
                  <StatusBadge status={user.status} />
                </td>
                {/* Botones ahora con flex-nowrap y flex-shrink-0 */}
                <td className="flex w-3/12 flex-nowrap gap-2 px-4 py-4">
                  <button
                    onClick={() => onView(user)}
                    className="flex-shrink-0 rounded-lg bg-primary-500 px-5 py-2 font-inter text-sm font-semibold text-white transition-colors hover:bg-primary-600"
                  >
                    Ver
                  </button>
                  {user.status === 'ACTIVO' ? (
                    <button
                      onClick={() => onBlock(user)}
                      className="flex-shrink-0 rounded-lg bg-secondary-600 px-5 py-2 font-inter text-sm font-semibold text-white transition-colors hover:bg-secondary-500"
                    >
                      Bloquear
                    </button>
                  ) : (
                    <button
                      onClick={() => onUnblock(user)}
                      className="flex-shrink-0 rounded-lg bg-primary-500 px-5 py-2 font-inter text-sm font-semibold text-white transition-colors hover:bg-primary-600"
                    >
                      Desbloquear
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
    // --- FIN DE LA CORRECCIÓN DE LAYOUT ---
  )
}