'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import UserList from '@/components/admin/UserList'
import UserDetailModal from '@/components/admin/UserDetailModal'
import { useConfirmStore } from '@/stores/useConfirmStore'
import { usersService } from '@/lib/api/users' // 1. Importar servicio

// (Datos de initialUsers SE MANTIENEN por falta de API)
const initialUsers = [
  // ... (datos mock sin cambios)
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

  // 2. AVISO: Lógica de fetchAll no se puede implementar
  useEffect(() => {
    // const fetchUsers = async () => {
    //   // const data = await usersService.getAll() <-- Este endpoint no existe
    //   // setUsers(data.items)
    // }
    // fetchUsers()
    
    // Por ahora, solo filtramos los datos mock
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

  // 3. Lógica de Modales (Mejorada para fetchear datos reales)
  const handleOpenDetail = async (user) => {
    try {
      // Fetchear los detalles completos de la API
      // Nota: La API /users/{user_id} retorna UserPublic, que es limitado.
      // Usaremos los datos mock + el ID real por ahora.
      // const detailedUser = await usersService.getById(user.id) 
      // setSelectedUser({ ...user, ...detailedUser })
      
      // Como la API de detalle es limitada, solo pasamos el mock por ahora.
      setSelectedUser(user) 
      setIsDetailModalOpen(true)
    } catch (error) {
      console.error("Error al cargar detalles del usuario", error)
    }
  }

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false)
    setSelectedUser(null)
  }

  // 4. Lógica de Acciones (CONECTADA A API)
  const setUserStatus = async (userId, newStatus) => {
    try {
      console.log(`Cambiando estado de ${userId} a ${newStatus}`)
      // ¡Llamada a la API!
      const updatedUser = await usersService.updateUser(userId, { status: newStatus })
      
      // Actualizar estado local
      setUsers(
        users.map(u => (u.id === userId ? { ...u, status: updatedUser.status } : u))
      )
    } catch (error) {
      console.error("Error al actualizar estado de usuario", error)
      // TODO: Mostrar error
    }
  }

  const handleBlockUser = user => {
    openConfirmModal(
      'Bloquear Usuario',
      `¿Estás seguro de que quieres bloquear a ${user.name}? El usuario no podrá iniciar sesión.`,
      () => setUserStatus(user.id, 'BLOCKED'), // 'BLOCKED' según UserStatusEnum
      { danger: true }
    )
  }

  const handleUnblockUser = user => {
    openConfirmModal(
      'Desbloquear Usuario',
      `¿Estás seguro de que quieres desbloquear a ${user.name}? El usuario recuperará el acceso a su cuenta.`,
      () => setUserStatus(user.id, 'ACTIVE'), // 'ACTIVE' según UserStatusEnum
      { danger: false }
    )
  }

  return (
    <>
      <h1 className="font-poppins text-5xl font-bold text-primary-500">
        Gestión de usuarios
      </h1>
      <p className="mt-4 text-red-600 font-semibold">
        Nota: La lista de usuarios es estática (mock). La API no provee un endpoint
        para listar todos los usuarios. Las acciones (Bloquear/Desbloquear) sí
        están conectadas a la API.
      </p>

      {/* ... (JSX de filtros sin cambios) ... */}
      
      <div className="mt-8 rounded-xl bg-white shadow-md overflow-hidden">
        <UserList
          users={filteredUsers}
          onView={handleOpenDetail}
          onBlock={handleBlockUser}
          onUnblock={handleUnblockUser}
        />
      </div>

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