# Lib# Lib - Utilidades y Configuraciones



Utilidades, configuraciones y servicios compartidos.## 🎯 Propósito

Lógica compartida, configuraciones y helpers que no son componentes visuales.

## Estructura

## 📂 Estructura

```- `api/` - Cliente HTTP (Axios) con interceptors

lib/- `auth/` - Helpers de autenticación (Amplify)

├── api/                  # Cliente API y servicios- `stripe/` - Configuración de Stripe Elements

│   ├── client.ts        # Cliente axios/fetch configurado- `utils/` - Funciones auxiliares (formatters, validators)

│   ├── listings.ts      # Servicio de listings

│   ├── users.ts         # Servicio de usuarios## 🔌 API Client

│   ├── orders.ts        # Servicio de órdenesEl archivo `lib/api/axios.js` configura Axios con:

│   ├── payments.ts      # Servicio de pagos- Base URL del backend

│   ├── cart.ts          # Servicio de carrito- Interceptor de autenticación (JWT de Cognito)

│   ├── reviews.ts       # Servicio de reseñas- Manejo global de errores

│   ├── categories.ts    # Servicio de categorías

│   ├── shipping.ts      # Servicio de envíos## 🔐 Auth Helpers

│   └── notifications.ts # Servicio de notificacionesEl archivo `lib/auth/cognito.js` exporta:

│- `getCurrentUser()` - Obtener usuario actual

├── auth/                 # Autenticación y autorización- `signOut()` - Cerrar sesión

│   ├── cognito.ts       # Cliente AWS Cognito- `getToken()` - Obtener JWT token

│   ├── auth-context.tsx # Context de autenticación

│   ├── auth-provider.tsx# Provider de autenticación## 💳 Stripe Client

│   └── session.ts       # Gestión de sesiónEl archivo `lib/stripe/client.js` inicializa:

│```javascript

├── stripe/               # Integración Stripeimport { loadStripe } from '@stripe/stripe-js'

│   ├── client.ts        # Cliente Stripeexport const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

│   ├── checkout.ts      # Funciones de checkout```

│   └── webhooks.ts      # Procesamiento webhooks

│## 🛠️ Utils

└── utils/                # Funciones auxiliaresFunciones comunes como:

    ├── format.ts        # Formateo de datos- `formatPrice(amount)` → "$1,250.00 MXN"

    ├── validation.ts    # Validaciones- `formatDate(date)` → "08 Nov 2025"

    ├── date.ts          # Manejo de fechas- `validateEmail(email)` → boolean

    ├── currency.ts      # Formateo de moneda
    └── errors.ts        # Manejo de errores
```

## API Client

### client.ts

Cliente HTTP configurado con interceptors:

```typescript
import axios from 'axios';
import { API_CONFIG } from '@/config';

const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
});

// Interceptor para agregar token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirigir a login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Servicios por Recurso

Cada recurso tiene su archivo de servicio:

```typescript
// lib/api/listings.ts
import apiClient from './client';
import type { Listing, CreateListingData, ListingResponse } from '@/types';

export const listingsService = {
  // GET /listings
  getAll: async (params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ListingResponse> => {
    const { data } = await apiClient.get('/listings', { params });
    return data;
  },
  
  // GET /listings/:id
  getById: async (id: string): Promise<Listing> => {
    const { data } = await apiClient.get(`/listings/${id}`);
    return data;
  },
  
  // POST /listings
  create: async (listingData: CreateListingData): Promise<Listing> => {
    const { data } = await apiClient.post('/listings', listingData);
    return data;
  },
  
  // PATCH /listings/:id
  update: async (id: string, updates: Partial<Listing>): Promise<Listing> => {
    const { data } = await apiClient.patch(`/listings/${id}`, updates);
    return data;
  },
  
  // DELETE /listings/:id
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/listings/${id}`);
  },
};
```

## Auth

### Cognito Client

```typescript
// lib/auth/cognito.ts
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import { AWS_CONFIG } from '@/config';

const userPool = new CognitoUserPool({
  UserPoolId: AWS_CONFIG.cognito.userPoolId,
  ClientId: AWS_CONFIG.cognito.clientId,
});

export const cognitoAuth = {
  // Login
  signIn: async (email: string, password: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({ Username: email, Pool: userPool });
      const authDetails = new AuthenticationDetails({ Username: email, Password: password });
      
      user.authenticateUser(authDetails, {
        onSuccess: (result) => {
          const token = result.getIdToken().getJwtToken();
          resolve(token);
        },
        onFailure: (err) => reject(err),
      });
    });
  },
  
  // Register
  signUp: async (email: string, password: string, attributes: any) => {
    // implementación
  },
  
  // Logout
  signOut: () => {
    const user = userPool.getCurrentUser();
    user?.signOut();
  },
  
  // Get current user
  getCurrentUser: () => {
    return userPool.getCurrentUser();
  },
};
```

### Auth Context

```typescript
// lib/auth/auth-context.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { cognitoAuth } from './cognito';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Verificar sesión existente
    checkSession();
  }, []);
  
  const checkSession = async () => {
    try {
      const currentUser = cognitoAuth.getCurrentUser();
      if (currentUser) {
        // Fetch user data
        const userData = await fetchUserData();
        setUser(userData);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const login = async (email: string, password: string) => {
    const token = await cognitoAuth.signIn(email, password);
    localStorage.setItem('auth-token', token);
    await checkSession();
  };
  
  const logout = () => {
    cognitoAuth.signOut();
    localStorage.removeItem('auth-token');
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      register,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

## Utils

### Formateo

```typescript
// lib/utils/format.ts
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};
```

### Validación

```typescript
// lib/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePassword = (password: string): { 
  valid: boolean; 
  errors: string[] 
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Debe tener al menos 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una mayúscula');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Debe contener al menos un número');
  }
  
  return { valid: errors.length === 0, errors };
};
```

### Manejo de Errores

```typescript
// lib/utils/errors.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const handleAPIError = (error: any): string => {
  if (error.response) {
    return error.response.data?.detail || 'Error en el servidor';
  }
  if (error.request) {
    return 'No se pudo conectar con el servidor';
  }
  return error.message || 'Error desconocido';
};
```

## Best Practices

- Agrupar servicios por recurso/entidad
- Usar tipos TypeScript para requests/responses
- Centralizar configuración de clientes (axios, cognito)
- Manejar errores de forma consistente
- Implementar retry logic para requests fallidos
- Cachear resultados cuando sea apropiado
- Documentar funciones complejas
- Exportar funciones puras siempre que sea posible
