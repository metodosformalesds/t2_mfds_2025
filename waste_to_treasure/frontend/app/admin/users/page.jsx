'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import UserList from '@/components/admin/UserList'
import UserDetailModal from '@/components/admin/UserDetailModal'
import { useConfirmStore } from '@/stores/useConfirmStore'

// (Datos de initialUsers sin cambios...)
const initialUsers = [
  {
    id: 123,
    name: 'Oscar Nava Rivera',
    email: 'correo@example.com',
    role: 'Admin',
    registerDate: '2025-10-28',
    status: 'ACTIVO',
    stats: {
      publications: 12,
      transactions: 45,
      memberSince: '2025-01-01',
      warnings: 2,
    },
    incidents: [
      { id: 'R-001', text: 'Reporte #R-001 (FRAUDE) - Resuelto' },
      { id: 'R-002', text: 'Reporte #R-002 (SPAM) - Resuelto' },
      { id: 'A-001', text: 'Advertencia enviada (2025-01-25)' },
    ],
  },
  {
    id: 134,
    name: 'Arturo Perez Gonzales',
    email: 'correo@example.com',
    role: 'User',
    registerDate: '2025-10-28',
    status: 'ACTIVO',
    stats: {
      publications: 5,
      transactions: 10,
      memberSince: '2025-03-15',
      warnings: 0,
    },
    incidents: [],
  },
  {
    id: 124,
    name: 'Juanito Perez',
    email: 'correo@example.com',
    role: 'User',
    registerDate: '2025-10-28',
    status: 'BLOQUEADO',
    stats: {
      publications: 1,
      transactions: 1,
      memberSince: '2025-02-10',
      warnings: 3,
    },
    incidents: [
      { id: 'A-001', text: 'Advertencia enviada (2025-03-01)' },
      { id: 'A-002', text: 'Advertencia enviada (2025-04-15)' },
      { id: 'A-003', text: 'Advertencia enviada (2025-05-20)' },
    ],
  },
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState(initialUsers)
  const [filteredUsers, setFilteredUsers] = useState(initialUsers)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const openConfirmModal = useConfirmStore(state => state.open)

  // Lógica de Filtros (sin cambios)
  useEffect(() => {
    let result = users
      .filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(user =>
        roleFilter === 'all' ? true : user.role === roleFilter
      )
      .filter(user =>
        statusFilter === 'all' ? true : user.status === statusFilter
      )
    setFilteredUsers(result)
  }, [searchTerm, roleFilter, statusFilter, users])

  // Lógica de Modales (sin cambios)
  const handleOpenDetail = user => {
    setSelectedUser(user)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false)
    setSelectedUser(null)
  }

  // Lógica de Acciones (actualizada para usar la firma correcta de 'open')
  const setUserStatus = (userId, newStatus) => {
    console.log(`Cambiando estado de ${userId} a ${newStatus}`)
    setUsers(
      users.map(u => (u.id === userId ? { ...u, status: newStatus } : u))
    )
  }

  const handleBlockUser = user => {
    openConfirmModal(
      'Bloquear Usuario',
      `¿Estás seguro de que quieres bloquear a ${user.name}? El usuario no podrá iniciar sesión.`,
      () => setUserStatus(user.id, 'BLOQUEADO'),
      { danger: true } // Botón rojo
    )
  }

  const handleUnblockUser = user => {
    openConfirmModal(
      'Desbloquear Usuario',
      `¿Estás seguro de que quieres desbloquear a ${user.name}? El usuario recuperará el acceso a su cuenta.`,
      () => setUserStatus(user.id, 'ACTIVO'),
      { danger: false } // Botón verde
    )
  }

  return (
    <>
      {/* --- INICIO DE LA CORRECCIÓN DE LAYOUT --- */}
      {/* El padding p-12 ahora está en el layout */}
      <h1 className="font-poppins text-5xl font-bold text-primary-500">
        Gestión de usuarios
      </h1>

      {/* Barra de Filtros (Directamente sobre el fondo gris, como en la imagen) */}
      <div className="mt-8 flex flex-wrap items-center gap-8 rounded-xl bg-white p-5 shadow-md">
        {/* Input de Búsqueda */}
        <div className="relative flex-grow" style={{ maxWidth: '1000px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por email o nombre..."
            className="w-full rounded-xl border border-neutral-900 bg-white py-2.5 pl-10 pr-4 font-inter text-neutral-900/70 placeholder-neutral-900/70 focus:ring-2 focus:ring-primary-500"
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-900/70" />
        </div>

        {/* Select de Rol */}
        <div className="relative">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-full appearance-none rounded-xl border border-neutral-900 bg-white px-4 py-2.5 pr-10 font-inter text-neutral-900/70 focus:ring-2 focus:ring-primary-500 md:w-auto"
          >
            <option value="all">Filtrar por rol</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-900" />
        </div>

        {/* Select de Estado */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full appearance-none rounded-xl border border-neutral-900 bg-white px-4 py-2.5 pr-10 font-inter text-neutral-900/70 focus:ring-2 focus:ring-primary-500 md:w-auto"
          >
            <option value="all">Filtrar por estado</option>
            <option value="ACTIVO">Activo</option>
            <option value="BLOQUEADO">Bloqueado</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-900" />
        </div>
      </div>

      {/* Lista de Usuarios (Este es el Card blanco) */}
      <div className="mt-8 rounded-xl bg-white shadow-md overflow-hidden">
        <UserList
          users={filteredUsers}
          onView={handleOpenDetail}
          onBlock={handleBlockUser}
          onUnblock={handleUnblockUser}
        />
      </div>
      {/* --- FIN DE LA CORRECCIÓN DE LAYOUT --- */}

      {/* Modal de Detalles */}
      <UserDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
        user={selectedUser}
        onBlock={handleBlockUser}
        onUnblock={handleUnblockUser}
      />
    </>
  )
}