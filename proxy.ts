import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Route yang memerlukan autentikasi
const PROTECTED_PATHS = ['/dashboard']
// Route yang hanya bisa diakses saat BELUM login
const AUTH_ONLY_PATHS = ['/login', '/forgot-password', '/reset-password']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionToken = request.cookies.get('session')?.value
  const hasSession = Boolean(sessionToken)

  // Protect dashboard: redirect ke /login jika tidak ada cookie session
  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  )
  if (isProtected && !hasSession) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Jika sudah ada session dan membuka halaman auth, redirect ke dashboard
  const isAuthOnly = AUTH_ONLY_PATHS.some((path) => pathname.startsWith(path))
  if (isAuthOnly && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
