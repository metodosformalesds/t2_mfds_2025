# Hooks

Custom React hooks para lógica reutilizable.

## Organización

```
hooks/
├── index.ts              # Re-exporta todos los hooks
├── use-auth.ts           # Autenticación y usuario actual
├── use-cart.ts           # Gestión del carrito
├── use-listings.ts       # Consultas de listings
├── use-orders.ts         # Consultas de órdenes
├── use-payments.ts       # Gestión de pagos
├── use-notifications.ts  # Notificaciones del usuario
├── use-reviews.ts        # Reviews y ratings
├── use-categories.ts     # Categorías
├── use-shipping.ts       # Métodos de envío
├── use-subscriptions.ts  # Planes y suscripciones
├── use-debounce.ts       # Debounce para búsquedas
├── use-media-query.ts    # Responsive breakpoints
└── use-toast.ts          # Notificaciones toast
```

## Tipos de Hooks

### Data Fetching Hooks

Hooks que obtienen datos del backend:

```typescript
// Ejemplo: use-listings.ts
export function useListings(params?: ListingQueryParams) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    // fetch listings
  }, [params]);
  
  return { listings, loading, error, refetch };
}
```

### State Management Hooks

Hooks que conectan con stores de Zustand:

```typescript
// Ejemplo: use-cart.ts
export function useCart() {
  const items = useCartStore(state => state.items);
  const addItem = useCartStore(state => state.addItem);
  const removeItem = useCartStore(state => state.removeItem);
  
  return { items, addItem, removeItem, total };
}
```

### Utility Hooks

Hooks de utilidad general:

```typescript
// Ejemplo: use-debounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}
```

## Convenciones

- Nombrar con prefijo `use` (camelCase)
- Retornar objetos con nombres descriptivos
- Incluir estados de loading y error para data fetching
- Documentar parámetros y valores de retorno
- Optimizar re-renders con useMemo/useCallback donde sea necesario

## Uso

```typescript
import { useAuth, useCart, useListings } from '@/hooks';

function MyComponent() {
  const { user, isAuthenticated } = useAuth();
  const { items, addItem } = useCart();
  const { listings, loading } = useListings({ category: 'electronics' });
  
  // ...
}
```

## Testing

Testear hooks con `@testing-library/react-hooks`:

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useCart } from './use-cart';

test('should add item to cart', () => {
  const { result } = renderHook(() => useCart());
  
  act(() => {
    result.current.addItem(mockItem);
  });
  
  expect(result.current.items).toHaveLength(1);
});
```
