/** @type {import('next').NextConfig} */
const nextConfig = {
  // Deshabilitar static export temporalmente para usar SSR/SSG
  // output: 'export',
  
  // Trailing slash para mejor compatibilidad con Amplify
  trailingSlash: true,
  
  // Deshabilitar optimización de imágenes para mejor rendimiento en Amplify
  images: {
    unoptimized: true,
    remotePatterns: [
      // Dominios de S3 (para producción)
      {
        protocol: 'https',
        hostname: 'waste-to-treasure-images.s3.us-east-2.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        pathname: '/**',
      },
      
      // Dominios de prueba locales (solo en desarrollo)
      ...(process.env.NODE_ENV === 'development' ? [{
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      }] : []),
    ],
  },
  
  // Variables de entorno expuestas al cliente
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
}

export default nextConfig