# Components

Componentes React reutilizables organizados por funcionalidad.

## Estructura

```
components/
├── ui/                   # Componentes base de UI
│   ├── button.jsx
│   ├── input.jsx
│   ├── card.jsx
│   ├── modal.jsx
│   ├── dropdown.jsx
│   ├── badge.jsx
│   ├── avatar.jsx
│   ├── skeleton.jsx
│   ├── toast.jsx
│   └── ...
│
├── layout/               # Componentes de layout
│   ├── header.jsx
│   ├── footer.jsx
│   ├── sidebar.jsx
│   ├── navbar.jsx
│   └── container.jsx
│
├── marketplace/          # Componentes del marketplace
│   ├── listing-card.jsx
│   ├── listing-grid.jsx
│   ├── listing-filters.jsx
│   ├── listing-search.jsx
│   ├── category-card.jsx
│   └── featured-listings.jsx
│
├── cart/                 # Componentes del carrito
│   ├── cart-item.jsx
│   ├── cart-summary.jsx
│   └── cart-drawer.jsx
│
├── checkout/             # Componentes de checkout
│   ├── checkout-form.jsx
│   ├── payment-form.jsx
│   ├── shipping-form.jsx
│   └── order-summary.jsx
│
├── dashboard/            # Componentes del dashboard
│   ├── stats-card.jsx
│   ├── recent-orders.jsx
│   ├── sales-chart.jsx
│   └── listing-table.jsx
│
├── forms/                # Componentes de formularios
│   ├── listing-form.jsx
│   ├── profile-form.jsx
│   ├── address-form.jsx
│   └── review-form.jsx
│
├── reviews/              # Componentes de reseñas
│   ├── review-card.jsx
│   ├── review-list.jsx
│   ├── rating-stars.jsx
│   └── review-stats.jsx
│
└── shared/               # Componentes compartidos
    ├── loading-spinner.jsx
    ├── error-message.jsx
    ├── empty-state.jsx
    ├── pagination.jsx
    └── image-upload.jsx
```

## Convenciones

### Nomenclatura

- Archivos en kebab-case: `listing-card.jsx`
- Componentes en PascalCase: `export default function ListingCard()`
- Props interfaces con sufijo `Props`: `interface ListingCardProps`

### Estructura de Componente

```jsx
'use client'; // Solo si necesita interactividad

import { useState } from 'react';
import { Button } from '@/components/ui';
import type { Listing } from '@/types';

interface ListingCardProps {
  listing: Listing;
  onFavorite?: (id: string) => void;
  className?: string;
}

export default function ListingCard({ 
  listing, 
  onFavorite,
  className = '' 
}: ListingCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  
  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    onFavorite?.(listing.id);
  };
  
  return (
    <div className={`card ${className}`}>
      {/* contenido */}
    </div>
  );
}
```

## Categorías de Componentes

### UI Components

Componentes base sin lógica de negocio:

```jsx
// components/ui/button.jsx
export default function Button({ 
  children, 
  variant = 'primary',
  size = 'md',
  ...props 
}) {
  const baseStyles = 'rounded-lg font-medium transition';
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    secondary: 'bg-secondary text-white hover:bg-secondary-dark',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  };
  
  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

### Feature Components

Componentes con lógica de negocio específica:

```jsx
// components/marketplace/listing-card.jsx
'use client';

import { useCart } from '@/hooks';
import { Button, Badge } from '@/components/ui';

export default function ListingCard({ listing }) {
  const { addItem } = useCart();
  
  const handleAddToCart = () => {
    addItem({
      listing_id: listing.id,
      quantity: 1,
      price: listing.price,
    });
  };
  
  return (
    <div className="listing-card">
      <img src={listing.image_url} alt={listing.title} />
      <h3>{listing.title}</h3>
      <Badge>{listing.category}</Badge>
      <p className="price">${listing.price}</p>
      <Button onClick={handleAddToCart}>
        Agregar al carrito
      </Button>
    </div>
  );
}
```

### Layout Components

Componentes estructurales:

```jsx
// components/layout/header.jsx
'use client';

import { useAuth } from '@/hooks';
import { Button } from '@/components/ui';
import Link from 'next/link';

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  
  return (
    <header className="header">
      <Link href="/">Waste to Treasure</Link>
      <nav>
        <Link href="/marketplace">Marketplace</Link>
        {isAuthenticated ? (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <Button>Logout</Button>
          </>
        ) : (
          <Link href="/login">Login</Link>
        )}
      </nav>
    </header>
  );
}
```

## Composición

Preferir composición sobre props complejas:

```jsx
// Mal
<Card 
  title="Title"
  content="Content"
  footer="Footer"
  showHeader={true}
/>

// Bien
<Card>
  <Card.Header>
    <Card.Title>Title</Card.Title>
  </Card.Header>
  <Card.Content>
    Content
  </Card.Content>
  <Card.Footer>
    Footer
  </Card.Footer>
</Card>
```

## Server vs Client Components

Por defecto, todos los componentes son Server Components (más rápidos).

Marcar con `'use client'` solo si necesita:
- Event handlers (onClick, onChange, etc)
- React hooks (useState, useEffect, etc)
- Browser APIs (window, localStorage, etc)
- Context providers/consumers

## Estilos

Usar Tailwind CSS:

```jsx
<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md">
  {/* contenido */}
</div>
```

Para estilos complejos, extraer a constantes:

```jsx
const cardStyles = {
  base: 'rounded-lg shadow-md transition-all',
  variants: {
    default: 'bg-white',
    highlighted: 'bg-primary-light',
  },
};
```

## Testing

```jsx
import { render, screen } from '@testing-library/react';
import ListingCard from './listing-card';

test('renders listing card', () => {
  const listing = { id: '1', title: 'Test', price: 100 };
  render(<ListingCard listing={listing} />);
  
  expect(screen.getByText('Test')).toBeInTheDocument();
  expect(screen.getByText('$100')).toBeInTheDocument();
});
```

## Best Practices

- Mantener componentes pequeños y enfocados
- Extraer lógica compleja a hooks personalizados
- Documentar props con TypeScript interfaces
- Usar prop spreading con cuidado
- Implementar error boundaries donde sea necesario
- Optimizar re-renders con React.memo cuando sea relevante
- Usar fragmentos (<>) para evitar divs innecesarios
