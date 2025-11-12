/** @type {import('next').NextConfig} */
const nextConfig = {
  // NO usar output: 'export' - Para que Amplify Gen 1 detecte Next.js SSR
  // El administrador debe recrear la app seleccionando "Next.js - SSR"
  
  // Deshabilitar optimización de imágenes
  images: {
    unoptimized: true,
    remotePatterns: [
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
      ...(process.env.NODE_ENV === 'development' ? [{
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      }] : []),
    ],
  },
  
  // Variables de entorno
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
}

export default nextConfig