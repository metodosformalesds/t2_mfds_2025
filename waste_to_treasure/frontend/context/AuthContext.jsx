'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, signOut as cognitoSignOut, isAuthenticated as checkAuth } from '@/lib/auth/cognito';
import { usersService } from '@/lib/api/users';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    console.log('🔍 [AuthContext] Iniciando checkAuthStatus...');
    try {
      const authenticated = await checkAuth();
      console.log('🔐 [AuthContext] Autenticado en Cognito:', authenticated);
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const cognitoUser = await getCurrentUser();
        console.log('👤 [AuthContext] Usuario de Cognito obtenido:', cognitoUser?.attributes?.email);

        // Fetch user profile from backend to get role and other data
        try {
          console.log('📡 [AuthContext] Llamando a backend /users/me...');
          const backendUser = await usersService.getMe();
          console.log('✅ [AuthContext] Usuario del backend obtenido:', {
            email: backendUser.email,
            role: backendUser.role,
            status: backendUser.status
          });

          setUser({
            ...cognitoUser,
            ...backendUser,
            name: backendUser.full_name || cognitoUser.attributes?.given_name || 'Usuario',
            email: backendUser.email || cognitoUser.attributes?.email,
            role: backendUser.role || 'USER',
          });
          console.log('✅ [AuthContext] Usuario establecido exitosamente');
        } catch (error) {
          // Si el backend falla (ej. 401), caer silenciosamente en páginas públicas
          console.warn('⚠️ [AuthContext] No se pudo obtener perfil del backend:', error.message || error);
          console.warn('⚠️ [AuthContext] Status code:', error.response?.status);

          // Fallback to Cognito data only si hay un usuario válido en Cognito
          if (cognitoUser && cognitoUser.attributes) {
            console.log('🔄 [AuthContext] Usando fallback con datos de Cognito');
            setUser({
              ...cognitoUser,
              name: cognitoUser.attributes?.given_name || 'Usuario',
              email: cognitoUser.attributes?.email,
              role: 'USER', // Default role
            });
          } else {
            // Si ni siquiera Cognito tiene usuario, marcar como no autenticado
            console.error('❌ [AuthContext] No hay usuario en Cognito, marcando como no autenticado');
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } else {
        // Usuario no autenticado - esto es normal en páginas públicas
        console.log('ℹ️ [AuthContext] Usuario no autenticado');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ [AuthContext] Error checking auth status:', error.message || error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
      console.log('✅ [AuthContext] checkAuthStatus completado');
    }
  };

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await cognitoSignOut();
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear localStorage
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('userEmail');
      
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}