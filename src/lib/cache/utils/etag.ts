/**
 * ETag utility functions for generating and handling ETags
 */

import crypto from 'crypto';

/**
 * Generate ETag for data
 */
export function generateETag(data: any): string {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  const hash = crypto.createHash('md5').update(content).digest('hex');
  return `"${hash}"`;
}

/**
 * Generate weak ETag for data
 */
export function generateWeakETag(data: any): string {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  const hash = crypto.createHash('md5').update(content).digest('hex');
  return `W/"${hash}"`;
}

/**
 * Check if ETags match
 */
export function matchETag(etag1?: string | null, etag2?: string | null): boolean {
  if (!etag1 || !etag2) return false;

  // Strip W/ prefix for weak comparison
  const normalize = (etag: string) => etag.replace(/^W\//, '');

  return normalize(etag1) === normalize(etag2);
}

/**
 * Parse If-None-Match header
 */
export function parseIfNoneMatch(header?: string | null): string[] {
  if (!header) return [];

  // Handle multiple ETags separated by comma
  return header
    .split(',')
    .map(etag => etag.trim())
    .filter(Boolean);
}

/**
 * Check if request ETag matches
 */
export function checkETagMatch(
  currentETag: string,
  ifNoneMatch?: string | null
): boolean {
  if (!ifNoneMatch) return false;

  const etags = parseIfNoneMatch(ifNoneMatch);

  // Check for wildcard
  if (etags.includes('*')) return true;

  // Check for match
  return etags.some(etag => matchETag(currentETag, etag));
}

/**
 * Add cache headers to response
 */
export function addCacheHeaders(
  headers: Headers,
  options: {
    etag?: string;
    maxAge?: number;
    sMaxAge?: number;
    staleWhileRevalidate?: number;
    mustRevalidate?: boolean;
    private?: boolean;
  }
): void {
  const {
    etag,
    maxAge = 0,
    sMaxAge,
    staleWhileRevalidate,
    mustRevalidate = false,
    private: isPrivate = false
  } = options;

  // Add ETag
  if (etag) {
    headers.set('ETag', etag);
  }

  // Build Cache-Control header
  const directives: string[] = [];

  if (isPrivate) {
    directives.push('private');
  } else {
    directives.push('public');
  }

  if (maxAge > 0) {
    directives.push(`max-age=${maxAge}`);
  }

  if (sMaxAge !== undefined) {
    directives.push(`s-maxage=${sMaxAge}`);
  }

  if (staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }

  if (mustRevalidate) {
    directives.push('must-revalidate');
  }

  if (directives.length > 0) {
    headers.set('Cache-Control', directives.join(', '));
  }

  // Add Vary header for proper caching
  headers.set('Vary', 'Accept-Encoding, Authorization');
}