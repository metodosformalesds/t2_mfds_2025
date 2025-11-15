import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

/**
 * Hook personalizado para proteger rutas de administrador.
 * * Verifica que:
 * 1. El usuario esté autenticado
 * 2. El usuario tenga rol de ADMIN
 * * Si no cumple, redirige automáticamente.
 * * @returns {Object} { isAuthorized, isLoading }
 */
export function useAdminGuard() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    // Esperar a que termine de cargar
    if (isLoading) return

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated) {
      console.log('🔒 Acceso denegado: Usuario no autenticado')
      router.replace('/login?redirect=' + window.location.pathname)
      return
    }

    // Si está autenticado pero no es ADMIN, redirigir a materials
    if (user && user.role !== 'ADMIN') {
      console.log('🔒 Acceso denegado: Usuario no es ADMIN')
      router.replace('/materials')
      return
    }

    // Si está autenticado y es ADMIN, autorizar
    if (user && user.role === 'ADMIN') {
      console.log('✅ Acceso autorizado: Usuario ADMIN')
      setIsAuthorized(true)
    }
  }, [isAuthenticated, isLoading, user, router])

  return { isAuthorized, isLoading }
}

/**
 * Hook para proteger rutas que requieren solo autenticación
 * (no necesariamente ADMIN).
 * * @returns {Object} { isAuthorized, isLoading }
 */
export function useAuthGuard() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      console.log('🔒 Acceso denegado: Usuario no autenticado')
      // Guardar la ruta a la que se intentaba acceder
      const redirectPath = window.location.pathname
      router.replace(`/login?redirect=${redirectPath}`)
      return
    }

    setIsAuthorized(true)
  }, [isAuthenticated, isLoading, router])

  return { isAuthorized, isLoading }
}