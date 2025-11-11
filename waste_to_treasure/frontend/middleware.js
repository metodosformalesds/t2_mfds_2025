import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Solo aplicar middleware a rutas de admin
  if (pathname.startsWith('/admin')) {
    // NOTA: En el middleware de Next.js no podemos acceder directamente
    // al AuthContext ni a las cookies de Cognito de forma síncrona.
    // La protección real se hace en el layout del cliente.
    
    // Esta es una capa adicional opcional que podrías usar
    // si implementas tokens en cookies HTTP-only.
    
    // Por ahora, dejamos que el layout maneje la protección
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*', // Aplica a todas las rutas /admin/*
  ],
}