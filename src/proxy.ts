import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // verificar si hay token jwt en rutas protegidas
  // el token se verifica en el servidor backend, aqui solo verificamos que exista
  const token = request.cookies.get("auth_token")?.value;

  // si no hay token y no esta en login o forbidden, redirigir
  if (
    !token &&
    !request.nextUrl.pathname.startsWith("/auth/login") &&
    !request.nextUrl.pathname.startsWith("/forbidden")
  ) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|auth/login|signup|forbidden).*)",
  ],
};
