/** @type {import('next').NextConfig} */
const nextConfig = {
  // NO usar output: 'export' - Para que Amplify Gen 1 detecte Next.js SSR
  // El administrador debe recrear la app seleccionando "Next.js - SSR"
  // Configuración de imágenes
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'w2t-fastapi-assets-12345.s3.us-east-1.amazonaws.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'w2t-fastapi-assets-12345.s3.amazonaws.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
      },
    ],
  },
  
  // NO incluir 'env' aquí - Next.js ya toma automáticamente las variables NEXT_PUBLIC_*
  // Si las declaras aquí y son undefined, sobrescribe las de Amplify con undefined
}

export default nextConfig