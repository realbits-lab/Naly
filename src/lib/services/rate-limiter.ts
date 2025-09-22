import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Redis client using KV environment variables
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different rate limiters for different use cases
const rateLimiters = {
  // Default API key rate limiter
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
    analytics: true,
    prefix: '@upstash/ratelimit:api',
  }),

  // Strict rate limiter for authentication endpoints
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(5, '15 m'), // 5 attempts per 15 minutes
    analytics: true,
    prefix: '@upstash/ratelimit:auth',
  }),

  // Generous rate limiter for public endpoints
  public: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1 h'), // 1000 requests per hour
    analytics: true,
    prefix: '@upstash/ratelimit:public',
  }),

  // Custom rate limiter for specific API keys
  custom: (limit: number, window: string) => new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window as `${number} ${'s' | 'm' | 'h' | 'd'}`),
    analytics: true,
    prefix: '@upstash/ratelimit:custom',
  }),
};

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  headers: Record<string, string>;
}

export class RateLimiter {
  /**
   * Check rate limit for API key
   */
  static async checkApiKeyLimit(
    apiKeyId: string,
    customLimit?: number
  ): Promise<RateLimitResult> {
    const identifier = `api_key_${apiKeyId}`;

    // Use custom limit if provided, otherwise use default
    const limiter = customLimit
      ? rateLimiters.custom(customLimit, '1 m')
      : rateLimiters.api;

    const result = await limiter.limit(identifier);

    return {
      allowed: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.reset).toISOString(),
        'Retry-After': result.success ? '' : Math.round((result.reset - Date.now()) / 1000).toString(),
      },
    };
  }

  /**
   * Check rate limit for authentication attempts
   */
  static async checkAuthLimit(identifier: string): Promise<RateLimitResult> {
    const result = await rateLimiters.auth.limit(identifier);

    return {
      allowed: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.reset).toISOString(),
        'Retry-After': result.success ? '' : Math.round((result.reset - Date.now()) / 1000).toString(),
      },
    };
  }

  /**
   * Check rate limit for public endpoints
   */
  static async checkPublicLimit(identifier: string): Promise<RateLimitResult> {
    const result = await rateLimiters.public.limit(identifier);

    return {
      allowed: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.reset).toISOString(),
      },
    };
  }

  /**
   * Apply rate limit headers to response
   */
  static applyHeaders(response: NextResponse, headers: Record<string, string>): NextResponse {
    Object.entries(headers).forEach(([key, value]) => {
      if (value) {
        response.headers.set(key, value);
      }
    });
    return response;
  }

  /**
   * Create rate limit error response
   */
  static createErrorResponse(result: RateLimitResult): NextResponse {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        limit: result.limit,
        reset: new Date(result.reset).toISOString(),
        retryAfter: Math.round((result.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: result.headers,
      }
    );
  }

  /**
   * Get rate limit analytics for an identifier
   */
  static async getAnalytics(identifier: string, type: 'api' | 'auth' | 'public' = 'api') {
    const limiter = rateLimiters[type];
    // Analytics would be fetched from Upstash dashboard or via API
    // This is a placeholder for the analytics implementation
    return {
      identifier,
      type,
      // Add analytics data here when implementing
    };
  }

  /**
   * Reset rate limit for an identifier (admin use)
   */
  static async resetLimit(identifier: string, type: 'api' | 'auth' | 'public' = 'api') {
    const prefix = `@upstash/ratelimit:${type}`;
    const key = `${prefix}:${identifier}`;
    await redis.del(key);
    return { success: true, message: `Rate limit reset for ${identifier}` };
  }
}

/**
 * Middleware function for rate limiting
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  type: 'api' | 'auth' | 'public' = 'api',
  getIdentifier?: (req: NextRequest) => string
) {
  return async (req: NextRequest) => {
    // Get identifier for rate limiting
    const identifier = getIdentifier
      ? getIdentifier(req)
      : req.headers.get('x-forwarded-for')?.split(',')[0] ||
        req.headers.get('x-real-ip') ||
        'unknown';

    // Check rate limit based on type
    let result: RateLimitResult;

    switch (type) {
      case 'auth':
        result = await RateLimiter.checkAuthLimit(identifier);
        break;
      case 'public':
        result = await RateLimiter.checkPublicLimit(identifier);
        break;
      default:
        result = await RateLimiter.checkApiKeyLimit(identifier);
    }

    // If rate limit exceeded, return error
    if (!result.allowed) {
      return RateLimiter.createErrorResponse(result);
    }

    // Execute handler and add rate limit headers
    const response = await handler(req);
    return RateLimiter.applyHeaders(response, result.headers);
  };
}