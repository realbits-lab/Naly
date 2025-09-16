import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { UserRole } from '@/types/user'

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/portfolio',
  '/narratives/personal',
  '/settings',
  '/api/user',
  '/api/portfolios',
  '/api/recommendations'
]

// Admin routes that require admin role
const adminRoutes = [
  '/admin',
  '/api/admin'
]

// B2B routes that require institutional role
const institutionalRoutes = [
  '/institutional',
  '/api/institutional'
]

// Public routes that should redirect to dashboard if authenticated
const publicRoutes = [
  '/',
  '/auth/signin',
  '/auth/signup'
]

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  const isInstitutionalRoute = institutionalRoutes.some(route => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.includes(pathname)

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !session) {
    const signInUrl = new URL('/auth/signin', req.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Check admin route access
  if (isAdminRoute && (!session || session.user.role !== UserRole.ADMIN)) {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  // Check institutional route access
  if (isInstitutionalRoute && (!session || ![UserRole.INSTITUTIONAL, UserRole.ADMIN].includes(session.user.role))) {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  // Redirect authenticated users from public routes to dashboard
  if (isPublicRoute && session && pathname !== '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Add authentication headers for API routes
  if (pathname.startsWith('/api/') && session) {
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-id', session.user.id)
    requestHeaders.set('x-user-role', session.user.role)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}