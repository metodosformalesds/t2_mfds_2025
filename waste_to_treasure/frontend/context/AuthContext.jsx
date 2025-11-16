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
    try {
      const authenticated = await checkAuth();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const cognitoUser = await getCurrentUser();
        
        // Fetch user profile from backend to get role and other data
        try {
          const backendUser = await usersService.getMe();
          setUser({
            ...cognitoUser,
            ...backendUser,
            name: backendUser.full_name || cognitoUser.attributes?.given_name || 'Usuario',
            email: backendUser.email || cognitoUser.attributes?.email,
            role: backendUser.role || 'USER',
          });
        } catch (error) {
          // Si el backend falla (ej. 401), caer silenciosamente en páginas públicas
          console.warn('No se pudo obtener perfil del backend:', error.message || error);
          
          // Fallback to Cognito data only si hay un usuario válido en Cognito
          if (cognitoUser && cognitoUser.attributes) {
            setUser({
              ...cognitoUser,
              name: cognitoUser.attributes?.given_name || 'Usuario',
              email: cognitoUser.attributes?.email,
              role: 'USER', // Default role
            });
          } else {
            // Si ni siquiera Cognito tiene usuario, marcar como no autenticado
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } else {
        // Usuario no autenticado - esto es normal en páginas públicas
        setUser(null);
      }
    } catch (error) {
      console.warn('Error checking auth status:', error.message || error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
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