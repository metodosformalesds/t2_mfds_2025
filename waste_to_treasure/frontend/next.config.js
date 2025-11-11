/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow next/image to load images from remote hosts
  images: {
    // Using remotePatterns instead of deprecated domains
    remotePatterns: [
      // Bing image CDN (used in carousel and products)
      {
        protocol: 'https',
        hostname: '**.bing.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'th.bing.com',
        pathname: '/**',
      },
      // Image hosting sites (carousel)
      {
        protocol: 'https',
        hostname: 'diaonia.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'thumbs.dreamstime.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.reciclajecontemar.es',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'blog.oxfamintermon.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.elnacional.cat',
        pathname: '/**',
      },
      // Mock product images
      {
        protocol: 'https',
        hostname: 'okdiario.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'mmedia.notitarde.com.ve',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'irisveterinaria.com.br',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'mininos.es',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'michigato.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.xlsemanal.com',
        pathname: '/**',
      },
      // Unsplash images
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
