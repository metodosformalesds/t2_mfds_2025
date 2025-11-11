'use client'

import { createContext, useContext, useState, useEffect } from 'react'
// IMPORTAMOS EL NUEVO SERVICIO DE USUARIO
import { usersService } from '@/lib/api/users'
import {
  getCurrentUser,
  signOut as cognitoSignOut,
  isAuthenticated as checkAuth,
} from '@/lib/auth/cognito'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const authenticatedInCognito = await checkAuth()
      
      if (authenticatedInCognito) {
        // 1. Obtener datos de Cognito (para email, sub, etc.)
        const cognitoUser = await getCurrentUser()
        
        // 2. Obtener datos de nuestra BD (¡IMPORTANTE PARA EL ROL!)
        // El endpoint /users/me crea el usuario en nuestra BD si no existe.
        const dbUser = await usersService.getMe()

        // 3. Combinar datos
        const fullUser = {
          ...cognitoUser, // Contiene 'username', 'attributes'
          ...dbUser, // Contiene 'user_id', 'role', 'status', 'full_name'
          // Aseguramos que el nombre de la BD (full_name) tenga prioridad
          name: dbUser.full_name || cognitoUser?.attributes?.given_name,
        }
        
        setUser(fullUser)
        setIsAuthenticated(true)
        return fullUser // RETORNAR el usuario completo
      } else {
        setIsAuthenticated(false)
        setUser(null)
        return null
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      // Si falla (ej. API caída o token inválido), forzamos logout
      await cognitoSignOut()
      setIsAuthenticated(false)
      setUser(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Login ahora retorna el usuario actualizado
  const login = async () => {
    setIsLoading(true)
    const updatedUser = await checkAuthStatus() // Vuelve a verificar todo
    setIsLoading(false)
    return updatedUser // RETORNAR el usuario
  }

  const logout = async () => {
    try {
      await cognitoSignOut()
      setUser(null)
      setIsAuthenticated(false)
      
      // Clear localStorage
      localStorage.removeItem('rememberMe')
      localStorage.removeItem('userEmail')
      
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuthStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}