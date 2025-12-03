import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // verificar si hay token jwt en rutas protegidas
  // el token se verifica en el servidor backend, aqui solo verificamos que exista
  const token = request.cookies.get('auth_token')?.value
  
  // si no hay token y no esta en login o 403, redirigir
  if (!token && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/403')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|signup|403).*)',
  ],
};