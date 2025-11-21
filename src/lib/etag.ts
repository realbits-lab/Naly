/**
 * ETag utilities for HTTP caching
 * Implements ETag generation and validation for cache control
 */

import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate an ETag from data
 * Uses SHA-256 hash for strong ETags
 */
export function generateETag(data: string | object): string {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  const hash = createHash('sha256').update(content).digest('hex');
  return `"${hash.substring(0, 32)}"`;
}

/**
 * Check if ETag matches the If-None-Match header
 */
export function checkETag(request: NextRequest, etag: string): boolean {
  const ifNoneMatch = request.headers.get('if-none-match');
  return ifNoneMatch === etag;
}

/**
 * Create a 304 Not Modified response
 */
export function createNotModifiedResponse(etag: string): NextResponse {
  return new NextResponse(null, {
    status: 304,
    headers: {
      'ETag': etag,
      'Cache-Control': 'public, max-age=300, must-revalidate',
    },
  });
}

/**
 * Add cache headers to response
 */
export function addCacheHeaders(
  response: NextResponse,
  options: {
    etag?: string;
    maxAge?: number;
    swr?: number; // stale-while-revalidate
    public?: boolean;
  } = {}
): NextResponse {
  const {
    etag,
    maxAge = 300, // 5 minutes default
    swr = 600, // 10 minutes stale-while-revalidate
    public: isPublic = true,
  } = options;

  const cacheControl = [
    isPublic ? 'public' : 'private',
    `max-age=${maxAge}`,
    `stale-while-revalidate=${swr}`,
  ].join(', ');

  const headers = new Headers(response.headers);
  headers.set('Cache-Control', cacheControl);

  if (etag) {
    headers.set('ETag', etag);
  }

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Helper to handle ETag caching in API routes
 */
export function handleETagCache<T>(
  request: NextRequest,
  data: T
): NextResponse | null {
  const etag = generateETag(data);

  // Check if client has cached version
  if (checkETag(request, etag)) {
    return createNotModifiedResponse(etag);
  }

  return null; // Not cached, proceed with normal response
}

/**
 * Create a cached JSON response with ETag
 */
export function createCachedResponse<T>(
  data: T,
  options: {
    etag?: string;
    maxAge?: number;
    swr?: number;
    status?: number;
  } = {}
): NextResponse {
  const etag = options.etag ?? generateETag(data);

  const response = NextResponse.json(data, {
    status: options.status ?? 200,
  });

  return addCacheHeaders(response, {
    etag,
    maxAge: options.maxAge,
    swr: options.swr,
  });
}
