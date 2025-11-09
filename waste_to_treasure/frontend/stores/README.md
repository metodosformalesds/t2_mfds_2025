# Stores# Stores - Estado Global con Zustand



State management global usando Zustand.## 🎯 Propósito

Gestión de **estado global** de la aplicación usando Zustand (alternativa ligera a Redux).

## Estructura

## 📂 Stores Principales

```- `useAuthStore.js` - Estado de autenticación (usuario actual)

stores/- `useCartStore.js` - Estado del carrito de compras

├── index.ts              # Re-exporta todos los stores- `useFilterStore.js` - Estado de filtros del marketplace

├── auth-store.ts         # Estado de autenticación

├── cart-store.ts         # Estado del carrito## 🔧 Patrón de Store

├── ui-store.ts           # Estado de UI (modales, sidebars)Cada store debe:

├── notifications-store.ts# Notificaciones/toasts1. Usar `create()` de Zustand

└── filters-store.ts      # Filtros de búsqueda/marketplace2. Incluir state y actions

```3. Persistir en localStorage si es necesario



## ¿Por qué Zustand?## 📝 Ejemplo: `useCartStore.js`

```javascript

- Más simple que Reduximport { create } from 'zustand'

- No requiere Context Providersimport { persist } from 'zustand/middleware'

- API minimalista

- TypeScript-friendlyexport const useCartStore = create(

- DevTools integradas  persist(

- Pequeño tamaño de bundle    (set, get) => ({

      items: [],

## Estructura de un Store      addItem: (item) => set((state) => ({

        items: [...state.items, item]

```typescript      })),

// stores/cart-store.ts      removeItem: (id) => set((state) => ({

import { create } from 'zustand';        items: state.items.filter(item => item.id !== id)

import { persist } from 'zustand/middleware';      })),

import type { CartItem, Listing } from '@/types';      clearCart: () => set({ items: [] }),

      getTotalPrice: () => {

interface CartState {        const items = get().items

  items: CartItem[];        return items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  total: number;      }

      }),

  addItem: (listing: Listing, quantity: number) => void;    { name: 'cart-storage' }

  removeItem: (listingId: string) => void;  )

  updateQuantity: (listingId: string, quantity: number) => void;)

  clearCart: () => void;```

  calculateTotal: () => number;

}## 🎯 Uso en Componentes

```javascript

export const useCartStore = create<CartState>()('use client'

  persist(import { useCartStore } from '@/stores/useCartStore'

    (set, get) => ({

      items: [],export default function CartButton() {

      total: 0,  const items = useCartStore(state => state.items)

        return <button>Cart ({items.length})</button>

      addItem: (listing, quantity) => {}

        set((state) => {```

          const existingItem = state.items.find(
            item => item.listing_id === listing.id
          );
          
          if (existingItem) {
            return {
              items: state.items.map(item =>
                item.listing_id === listing.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          
          return {
            items: [...state.items, {
              listing_id: listing.id,
              listing,
              quantity,
              price: listing.price,
            }],
          };
        });
        
        get().calculateTotal();
      },
      
      removeItem: (listingId) => {
        set((state) => ({
          items: state.items.filter(item => item.listing_id !== listingId),
        }));
        get().calculateTotal();
      },
      
      updateQuantity: (listingId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(listingId);
          return;
        }
        
        set((state) => ({
          items: state.items.map(item =>
            item.listing_id === listingId
              ? { ...item, quantity }
              : item
          ),
        }));
        get().calculateTotal();
      },
      
      clearCart: () => {
        set({ items: [], total: 0 });
      },
      
      calculateTotal: () => {
        const total = get().items.reduce(
          (sum, item) => sum + (item.price * item.quantity),
          0
        );
        set({ total });
        return total;
      },
    }),
    {
      name: 'cart-storage', // nombre en localStorage
      partialize: (state) => ({ items: state.items }), // solo persistir items
    }
  )
);
```

## Stores Principales

### auth-store.ts

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}
```

### cart-store.ts

```typescript
interface CartState {
  items: CartItem[];
  total: number;
  
  addItem: (listing: Listing, quantity: number) => void;
  removeItem: (listingId: string) => void;
  updateQuantity: (listingId: string, quantity: number) => void;
  clearCart: () => void;
}
```

### ui-store.ts

```typescript
interface UIState {
  sidebarOpen: boolean;
  cartDrawerOpen: boolean;
  currentModal: string | null;
  
  toggleSidebar: () => void;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}
```

### notifications-store.ts

```typescript
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface NotificationsState {
  notifications: Notification[];
  
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}
```

### filters-store.ts

```typescript
interface FiltersState {
  category: string | null;
  search: string;
  priceRange: [number, number];
  sortBy: 'newest' | 'price_asc' | 'price_desc';
  
  setCategory: (category: string | null) => void;
  setSearch: (search: string) => void;
  setPriceRange: (range: [number, number]) => void;
  setSortBy: (sortBy: FiltersState['sortBy']) => void;
  resetFilters: () => void;
}
```

## Uso en Componentes

```typescript
'use client';

import { useCartStore } from '@/stores';

export default function AddToCartButton({ listing }) {
  const addItem = useCartStore(state => state.addItem);
  const items = useCartStore(state => state.items);
  
  const handleClick = () => {
    addItem(listing, 1);
  };
  
  return (
    <button onClick={handleClick}>
      Agregar al carrito ({items.length})
    </button>
  );
}
```

## Selectores

Para optimizar re-renders, usar selectores específicos:

```typescript
// Mal - se re-renderiza cuando cambia cualquier cosa en el store
const store = useCartStore();

// Bien - solo se re-renderiza cuando cambia 'items'
const items = useCartStore(state => state.items);
const addItem = useCartStore(state => state.addItem);
```

## Middleware

### Persist

Guardar estado en localStorage:

```typescript
import { persist } from 'zustand/middleware';

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({ /* ... */ }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }), // solo persistir items
    }
  )
);
```

### DevTools

Integrar con Redux DevTools:

```typescript
import { devtools } from 'zustand/middleware';

export const useCartStore = create<CartState>()(
  devtools(
    (set, get) => ({ /* ... */ }),
    { name: 'CartStore' }
  )
);
```

### Combinar Middleware

```typescript
export const useCartStore = create<CartState>()(
  devtools(
    persist(
      (set, get) => ({ /* ... */ }),
      { name: 'cart-storage' }
    ),
    { name: 'CartStore' }
  )
);
```

## Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCartStore } from './cart-store';

describe('CartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], total: 0 });
  });
  
  test('should add item to cart', () => {
    const { result } = renderHook(() => useCartStore());
    
    act(() => {
      result.current.addItem(mockListing, 1);
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.total).toBe(mockListing.price);
  });
});
```

## Best Practices

- Mantener stores pequeños y enfocados
- Un store por dominio (auth, cart, ui, etc)
- Usar selectores específicos para optimizar re-renders
- Persistir solo lo necesario en localStorage
- Implementar acciones, no mutar estado directamente
- Usar TypeScript para type safety
- Nombrar stores con prefijo `use` (ej: `useCartStore`)
- Documentar acciones complejas
