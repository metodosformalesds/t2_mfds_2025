# Styles

Estilos globales y configuración de Tailwind CSS.

## Estructura

```
styles/
├── globals.css          # Estilos globales y reset
├── tailwind.css         # Directivas de Tailwind
├── fonts.css            # Imports de fuentes
└── animations.css       # Animaciones custom
```

## globals.css

Estilos base y variables CSS:

```css
@import './fonts.css';
@import './animations.css';

:root {
  /* Primary Colors */
  --color-primary: #396539;
  --color-primary-dark: #294730;
  
  /* Secondary Colors */
  --color-secondary: #69391E;
  --color-secondary-light: #A2704F;
  
  /* Neutral Colors */
  --color-neutral-dark: #262C32;
  --color-neutral-white: #FCFCFC;
  --color-neutral-light: #F3F3F3;
  --color-neutral-black: #000000;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
  --transition-slow: 500ms ease;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--color-neutral-black);
  background-color: var(--color-neutral-white);
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  line-height: 1.2;
}

a {
  color: inherit;
  text-decoration: none;
  transition: color var(--transition-fast);
}

a:hover {
  color: var(--color-primary);
}

button {
  font-family: inherit;
  cursor: pointer;
}

img {
  max-width: 100%;
  height: auto;
}

/* Scrollbar personalizado */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-neutral-light);
}

::-webkit-scrollbar-thumb {
  background: var(--color-primary);
  border-radius: var(--radius-md);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary-dark);
}
```

## fonts.css

Importar fuentes de Google Fonts:

```css
/* Poppins - Para headings */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

/* Roboto - Para subheadings */
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

/* Inter - Para body text */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
```

## animations.css

Animaciones custom:

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease;
}

.animate-slide-in {
  animation: slideIn 0.3s ease;
}

.animate-slide-in-right {
  animation: slideInRight 0.3s ease;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-spin {
  animation: spin 1s linear infinite;
}
```

## tailwind.css

Directivas de Tailwind:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  /* Botones */
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-all;
  }
  
  .btn-primary {
    @apply bg-primary text-white hover:bg-primary-dark;
  }
  
  .btn-secondary {
    @apply bg-secondary text-white hover:bg-secondary-dark;
  }
  
  .btn-outline {
    @apply border-2 border-primary text-primary hover:bg-primary hover:text-white;
  }
  
  /* Cards */
  .card {
    @apply bg-white rounded-lg shadow-md p-4;
  }
  
  .card-hover {
    @apply card hover:shadow-lg transition-shadow;
  }
  
  /* Inputs */
  .input {
    @apply w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent;
  }
  
  /* Container */
  .container-custom {
    @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

## Configuración Tailwind

Ver `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#396539',
          dark: '#294730',
        },
        secondary: {
          DEFAULT: '#69391E',
          light: '#A2704F',
        },
        neutral: {
          dark: '#262C32',
          white: '#FCFCFC',
          light: '#F3F3F3',
          black: '#000000',
        },
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        subheading: ['Roboto', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease',
        'slide-in': 'slideIn 0.3s ease',
        'slide-in-right': 'slideInRight 0.3s ease',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

## Uso

### En Layout Raíz

```jsx
// app/layout.jsx
import '@/styles/globals.css';
import '@/styles/tailwind.css';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
```

### En Componentes

```jsx
// Usando clases de Tailwind
<div className="container-custom">
  <h1 className="text-3xl font-heading text-primary">
    Waste to Treasure
  </h1>
  <button className="btn btn-primary">
    Click me
  </button>
</div>

// Usando variables CSS
<div style={{
  backgroundColor: 'var(--color-primary)',
  padding: 'var(--spacing-md)',
  borderRadius: 'var(--radius-md)',
}}>
  Content
</div>
```

## Responsive Design

Usar breakpoints de Tailwind:

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsivo: 1 col en móvil, 2 en tablet, 3 en desktop */}
</div>
```

Breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## Dark Mode (Futuro)

Para implementar dark mode:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-neutral-white: #1a1a1a;
    --color-neutral-black: #ffffff;
  }
}
```

O con Tailwind:

```jsx
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Content
</div>
```

## Best Practices

- Usar Tailwind para la mayoría de estilos
- Variables CSS para valores reutilizables (colores, spacing)
- Extraer componentes reutilizables con `@layer components`
- Usar clases semánticas (btn-primary vs bg-blue-500)
- Mantener consistencia en spacing y colores
- Optimizar para mobile-first
- Usar animaciones con moderación
- Testear en múltiples navegadores
