import { NextResponse } from 'next/server'

export function middleware(request) {
  // Obtener token de Cognito desde cookies
  const token = request.cookies.get('cognito-token')
  
  // Rutas protegidas que requieren autenticación
  const protectedPaths = ['/dashboard', '/checkout']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )
  
  // Redirigir a login si no hay token
  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/checkout/:path*'
  ]
}
