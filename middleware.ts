import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, getBestMatchingLocale } from './src/i18n/config';

// Create the internationalization middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // Only add prefix for non-default locales
  localeDetection: false, // We'll handle detection manually
});

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if the pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If pathname doesn't have locale, detect and redirect
  if (!pathnameHasLocale) {
    // Get user's language preference from cookie
    const userLocale = request.cookies.get('user-locale')?.value;

    // Get Accept-Language header
    const acceptLanguage = request.headers.get('accept-language');

    // Determine the best locale
    const bestLocale = getBestMatchingLocale(acceptLanguage, userLocale);

    // If it's not the default locale, redirect with locale prefix
    if (bestLocale !== defaultLocale) {
      const redirectUrl = new URL(`/${bestLocale}${pathname}`, request.url);
      redirectUrl.search = request.nextUrl.search;
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Handle API routes and static files without locale processing
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Apply intl middleware for other routes
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - API routes
  // - Static files (_next/static)
  // - Image optimization files (_next/image)
  // - Favicon and other static assets
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',

    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(ko|en)/:path*',

    // Enable redirects that add missing locales
    // (e.g. `/pathnames` -> `/en/pathnames`)
    '/((?!_next|_vercel|.*\\..*).*)'
  ]
};