# Public

Assets estáticos servidos directamente por Next.js.

## Estructura

```
public/
├── images/              # Imágenes generales
│   ├── logo.svg
│   ├── logo-dark.svg
│   ├── hero-bg.jpg
│   └── placeholder.jpg
│
├── icons/               # Iconos y favicons
│   ├── favicon.ico
│   ├── icon-192.png
│   ├── icon-512.png
│   └── apple-touch-icon.png
│
├── fonts/               # (Opcional) Fuentes custom locales
│
└── documents/           # PDFs, términos, políticas
    ├── terms.pdf
    └── privacy.pdf
```

## Acceso

Los archivos en `/public` son accesibles desde la raíz:

```jsx
// public/images/logo.svg
<img src="/images/logo.svg" alt="Logo" />

// public/icons/favicon.ico
// Automáticamente usado por navegadores

// public/documents/terms.pdf
<a href="/documents/terms.pdf" download>
  Descargar términos
</a>
```

## Next.js Image Optimization

Para imágenes, preferir el componente `Image` de Next.js:

```jsx
import Image from 'next/image';

<Image
  src="/images/hero-bg.jpg"
  alt="Hero background"
  width={1920}
  height={1080}
  priority // Para imágenes above-the-fold
/>
```

Ventajas:
- Optimización automática
- Lazy loading por defecto
- Responsive images
- Formatos modernos (WebP, AVIF)

## Imágenes de Usuario (S3)

Las imágenes subidas por usuarios NO van en `/public`.
Se almacenan en AWS S3 y se acceden por URL:

```jsx
// Imagen de listing desde S3
<img src={listing.image_url} alt={listing.title} />
// listing.image_url = "https://bucket.s3.amazonaws.com/listings/123.jpg"
```

## Favicon y Metadata

Iconos para diferentes plataformas:

```
icons/
├── favicon.ico          # 16x16, 32x32
├── icon-192.png         # Android Chrome
├── icon-512.png         # Android Chrome
├── apple-touch-icon.png # iOS Safari (180x180)
└── manifest.json        # PWA manifest
```

Configurar en `app/layout.jsx`:

```jsx
export const metadata = {
  title: 'Waste to Treasure',
  description: 'Marketplace sostenible',
  icons: {
    icon: '/icons/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
};
```

## manifest.json

Para Progressive Web App (PWA):

```json
{
  "name": "Waste to Treasure",
  "short_name": "W2T",
  "description": "Marketplace sostenible",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#396539",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## robots.txt

Control de crawling para SEO:

```
# public/robots.txt
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /api/

Sitemap: https://wastetrotreasure.com/sitemap.xml
```

## sitemap.xml

Mapa del sitio para SEO (generado dinámicamente es mejor):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://wastetrotreasure.com/</loc>
    <lastmod>2025-11-08</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://wastetrotreasure.com/marketplace</loc>
    <lastmod>2025-11-08</lastmod>
    <priority>0.8</priority>
  </url>
</urlset>
```

## Optimización

### Formato de Imágenes

- **SVG**: Para logos, iconos (escalable)
- **PNG**: Para imágenes con transparencia
- **JPG**: Para fotografías (menor tamaño)
- **WebP**: Moderno, buen balance (Next.js lo genera automático)

### Compresión

Comprimir imágenes antes de subirlas:
- TinyPNG (https://tinypng.com)
- ImageOptim
- Squoosh (https://squoosh.app)

### Tamaños Recomendados

- **Logo**: 200-300px ancho (SVG preferido)
- **Favicon**: 32x32px
- **Apple Touch Icon**: 180x180px
- **Android Icons**: 192x192px, 512x512px
- **Hero Images**: 1920x1080px (max 200KB)
- **Thumbnails**: 400x400px

## Best Practices

- Mantener archivos organizados por tipo
- Usar nombres descriptivos (hero-bg.jpg no img1.jpg)
- Comprimir todas las imágenes
- Usar SVG para logos e iconos
- Implementar lazy loading para imágenes below-the-fold
- Usar Next.js Image component cuando sea posible
- No versionar imágenes grandes (>500KB)
- Implementar CDN para assets en producción
