import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)
  ) {
    return NextResponse.next();
  }

  // Check if accessing admin routes
  if (pathname.startsWith('/admin')) {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Allow access to login page
    if (pathname === '/admin/login') {
      // Redirect to dashboard if already logged in
      if (session?.user && !session.user.isAnonymous) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.next();
    }

    // Protect other admin routes - require authenticated (non-anonymous) user
    if (!session?.user || session.user.isAnonymous) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // For all other routes, create anonymous session if none exists
  // This allows guests to interact with content
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    // Create anonymous session for guest users
    // This will be handled by the client-side auth
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
