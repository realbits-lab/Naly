import { NextRequest, NextResponse } from 'next/server';
import { apiKeyService, ApiScope } from '@/lib/services/api-key-service';
import { RateLimiter } from '@/lib/services/rate-limiter';
import { headers } from 'next/headers';

export interface ApiAuthContext {
  apiKey: {
    id: string;
    userId: string;
    scopes: string[];
    rateLimit: number | null;
  };
}

export async function withApiAuth(
  handler: (req: NextRequest, context: ApiAuthContext) => Promise<NextResponse>,
  requiredScope?: ApiScope
) {
  return async (req: NextRequest) => {
    const startTime = Date.now();

    try {
      // Extract API key from Authorization header
      const authHeader = req.headers.get('Authorization');

      if (!authHeader || !authHeader.startsWith('Bearer naly_')) {
        return NextResponse.json(
          { error: 'Missing or invalid API key' },
          {
            status: 401,
            headers: {
              'WWW-Authenticate': 'Bearer',
            }
          }
        );
      }

      const apiKey = authHeader.replace('Bearer ', '');

      // Validate the API key
      const keyRecord = await apiKeyService.validateApiKey(apiKey);

      if (!keyRecord) {
        return NextResponse.json(
          { error: 'Invalid or expired API key' },
          { status: 401 }
        );
      }

      // Check IP restrictions
      const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] ||
                       req.headers.get('x-real-ip') ||
                       'unknown';

      if (!apiKeyService.validateIpRestriction(keyRecord.ipRestrictions as string[], clientIp)) {
        return NextResponse.json(
          { error: 'Access denied from this IP address' },
          { status: 403 }
        );
      }

      // Check rate limit for this API key
      const rateLimitResult = await RateLimiter.checkApiKeyLimit(
        keyRecord.id,
        keyRecord.rateLimit || undefined
      );

      if (!rateLimitResult.allowed) {
        return RateLimiter.createErrorResponse(rateLimitResult);
      }

      // Check required scope if specified
      if (requiredScope && !apiKeyService.hasScope(keyRecord.scopes as string[], requiredScope)) {
        return NextResponse.json(
          { error: `Insufficient permissions. Required scope: ${requiredScope}` },
          { status: 403 }
        );
      }

      // Create context for the handler
      const context: ApiAuthContext = {
        apiKey: {
          id: keyRecord.id,
          userId: keyRecord.userId,
          scopes: keyRecord.scopes as string[],
          rateLimit: keyRecord.rateLimit,
        },
      };

      // Execute the handler
      const response = await handler(req, context);
      const responseTime = Date.now() - startTime;

      // Log API usage
      const endpoint = new URL(req.url).pathname;
      const method = req.method;
      const statusCode = response.status;
      const userAgent = req.headers.get('user-agent') || undefined;

      let requestBody = undefined;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        try {
          const clonedReq = req.clone();
          requestBody = await clonedReq.json();
        } catch {
          // Ignore if body can't be parsed
        }
      }

      // Log the API call asynchronously (don't await)
      apiKeyService.logApiKeyUsage(
        keyRecord.id,
        endpoint,
        method,
        statusCode,
        responseTime,
        clientIp,
        userAgent,
        requestBody,
        statusCode >= 400 ? response.statusText : undefined
      ).catch(console.error);

      // Add API usage headers to response
      response.headers.set('X-API-Key-ID', keyRecord.id);
      response.headers.set('X-Response-Time', `${responseTime}ms`);

      // Add rate limit headers
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        if (value) {
          response.headers.set(key, value);
        }
      });

      return response;

    } catch (error) {
      console.error('API authentication error:', error);

      const responseTime = Date.now() - startTime;

      return NextResponse.json(
        { error: 'Internal server error' },
        {
          status: 500,
          headers: {
            'X-Response-Time': `${responseTime}ms`,
          }
        }
      );
    }
  };
}

// Middleware helper for checking scopes
export function requireScope(scope: ApiScope) {
  return (context: ApiAuthContext): boolean => {
    return apiKeyService.hasScope(context.apiKey.scopes, scope);
  };
}

// Helper to extract API key from request
export function extractApiKey(req: NextRequest): string | null {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer naly_')) {
    return null;
  }

  return authHeader.replace('Bearer ', '');
}