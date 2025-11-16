'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import UserList from '@/components/admin/UserList'
import UserDetailModal from '@/components/admin/UserDetailModal'
import Toast from '@/components/ui/Toast'
import { useConfirmStore } from '@/stores/useConfirmStore'
import { adminService } from '@/lib/api/admin'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [toast, setToast] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)

  const openConfirmModal = useConfirmStore(state => state.open)
  
  // Debounce para el searchTerm
  useEffect(() => {
    const timer = setTimeout(() => {
      // Solo actualizamos la version 'debounced' cuando haya al menos 2
      // caracteres (para evitar peticiones al backend con 1 letra)
      // o cuando el string esté vacío (para limpiar la búsqueda)
      if (searchTerm.length >= 2 || searchTerm.length === 0) {
        setDebouncedSearchTerm(searchTerm)
      }
    }, 500) // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Cargar usuarios desde la API
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const skip = (currentPage - 1) * itemsPerPage
      
      const params = {
        limit: itemsPerPage,
        skip: skip
      }
      
      // Solo agregar filtros si tienen valores válidos
      if (roleFilter && roleFilter !== 'all') {
        params.role = roleFilter.toUpperCase()
      }
      
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter.toUpperCase()
      }
      
      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim()
      }
      
      if (process.env.NODE_ENV === 'development') {
        // Debug: help debugging debounce/Enter triggers in dev
        // eslint-disable-next-line no-console
        console.debug('[Admin Users] fetchUsers params', params)
      }
      const data = await adminService.getUsersList(params)
      
      setTotalUsers(data.total || 0)
      
      const formattedUsers = (data.items || []).map(user => ({
        id: user.user_id,
        name: user.full_name || 'Sin nombre',
        email: user.email || 'Sin email',
        role: (user.role || 'user').toLowerCase(),
        status: (user.status || 'active').toLowerCase(),
        registeredAt: user.created_at ? new Date(user.created_at).toLocaleDateString('es-MX') : 'N/A'
      }))
      
      setUsers(formattedUsers)
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
      setUsers([])
      setTotalUsers(0)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [debouncedSearchTerm, roleFilter, statusFilter, currentPage]) // eslint-disable-line react-hooks/exhaustive-deps

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, roleFilter, statusFilter])

  // Lógica de Modales
  const handleOpenDetail = (user) => {
    setSelectedUser({
      ...user,
      stats: {
        publications: 0,
        transactions: 0,
        memberSince: user.registeredAt,
        warnings: 0
      },
      incidents: []
    })
    setIsDetailModalOpen(true)
    
    // TODO: Implementar carga de estadísticas cuando el backend tenga el endpoint
    // const stats = await adminService.getUserDetailedStats(user.id)
    // setSelectedUser(prev => ({ ...prev, stats }))
  }

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false)
    setSelectedUser(null)
  }

  // Lógica de Acciones (CONECTADA A API)
  const setUserStatus = async (userId, newStatus) => {
    try {
      console.log(`Cambiando estado de ${userId} a ${newStatus}`)
      
      // Llamada a la API
      const updatedUser = await adminService.updateUser(userId, { 
        status: newStatus.toUpperCase() 
      })
      
      // Mostrar toast de éxito
      const statusText = newStatus === 'BLOCKED' ? 'bloqueado' : 'activado'
      setToast({ 
        message: `Usuario ${statusText} correctamente`, 
        type: 'success' 
      })
      
      // Recargar la lista
      await fetchUsers()
    } catch (error) {
      console.error("Error al actualizar estado de usuario", error)
      setToast({ 
        message: `Error al actualizar usuario: ${error.response?.data?.detail || error.message}`, 
        type: 'error' 
      })
    }
  }

  const handleBlockUser = user => {
    openConfirmModal(
      'Bloquear Usuario',
      `¿Estás seguro de que quieres bloquear a ${user.name}? El usuario no podrá iniciar sesión.`,
      () => setUserStatus(user.id, 'BLOCKED'),
      { danger: true }
    )
  }

  const handleUnblockUser = user => {
    openConfirmModal(
      'Desbloquear Usuario',
      `¿Estás seguro de que quieres desbloquear a ${user.name}? El usuario recuperará el acceso a su cuenta.`,
      () => setUserStatus(user.id, 'ACTIVE'),
      { danger: false }
    )
  }

  const handleChangeRole = async (user, newRole) => {
    try {
      console.log(`Cambiando rol de ${user.id} a ${newRole}`)
      
      // Normalizar rol a formato esperado por backend
      const normalizedRole = newRole.toUpperCase()
      
      // Llamada a la API
      await adminService.updateUser(user.id, { 
        role: normalizedRole 
      })
      
      // Mostrar toast de éxito
      const roleText = normalizedRole === 'ADMIN' ? 'Administrador' : 'Usuario'
      setToast({ 
        message: `Rol cambiado a ${roleText} correctamente`, 
        type: 'success' 
      })
      
      // Recargar la lista
      await fetchUsers()
    } catch (error) {
      console.error("Error al cambiar rol de usuario", error)
      setToast({ 
        message: `Error al cambiar rol: ${error.response?.data?.detail || error.message}`, 
        type: 'error' 
      })
    }
  }

  // Calcular información de paginación
  const totalPages = Math.ceil(totalUsers / itemsPerPage)
  const startItem = totalUsers > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0
  const endItem = Math.min(currentPage * itemsPerPage, totalUsers)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-900 font-medium">Cargando Usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <h1 className="font-poppins text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-500">
        Gestión de usuarios
      </h1>

      {/* Filtros y búsqueda */}
      <div className="mt-6 sm:mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // For users we allow Enter to force a search immediately
                setDebouncedSearchTerm(searchTerm)
                setCurrentPage(1)
              }
            }}
            className="w-full rounded-lg border border-neutral-300 py-2 pl-10 pr-4 font-inter text-sm focus:border-primary-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="appearance-none rounded-lg border border-neutral-300 bg-white py-2 pl-4 pr-10 font-inter text-sm focus:border-primary-500 focus:outline-none"
            >
              <option value="all">Todos los roles</option>
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-lg border border-neutral-300 bg-white py-2 pl-4 pr-10 font-inter text-sm focus:border-primary-500 focus:outline-none"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="blocked">Bloqueado</option>
              <option value="pending">Pendiente</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          </div>
        </div>
      </div>
      
      <div className="mt-6 sm:mt-8 rounded-xl bg-white shadow-md overflow-hidden overflow-x-auto">
        <UserList
          users={users}
          onView={handleOpenDetail}
          onBlock={handleBlockUser}
          onUnblock={handleUnblockUser}
        />
      </div>

      {/* Paginación */}
      {totalUsers > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
          {/* Información de registros */}
          <div className="text-sm text-neutral-600 font-inter">
            Mostrando <span className="font-semibold text-neutral-900">{startItem}</span> a{' '}
            <span className="font-semibold text-neutral-900">{endItem}</span> de{' '}
            <span className="font-semibold text-neutral-900">{totalUsers}</span> usuarios
          </div>

          {/* Controles de paginación */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-neutral-300 bg-white font-inter text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>

            {/* Números de página */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg font-inter text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-primary-500 text-white'
                        : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-neutral-300 bg-white font-inter text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <UserDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
        user={selectedUser}
        onBlock={handleBlockUser}
        onUnblock={handleUnblockUser}
        onChangeRole={handleChangeRole}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  )
}