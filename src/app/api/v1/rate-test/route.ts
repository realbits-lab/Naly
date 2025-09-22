import { NextRequest, NextResponse } from 'next/server';
import { apiKeyService } from '@/lib/services/api-key-service';
import { RateLimiter } from '@/lib/services/rate-limiter';

// GET /api/v1/rate-test - Test rate limiting
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer naly_')) {
      return NextResponse.json(
        { error: 'Missing or invalid API key' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.replace('Bearer ', '');
    const keyRecord = await apiKeyService.validateApiKey(apiKey);

    if (!keyRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired API key' },
        { status: 401 }
      );
    }

    // Check rate limit
    const rateLimitResult = await RateLimiter.checkApiKeyLimit(
      keyRecord.id,
      keyRecord.rateLimit || undefined
    );

    if (!rateLimitResult.allowed) {
      return RateLimiter.createErrorResponse(rateLimitResult);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Rate limit check passed!',
      rateLimit: {
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: new Date(rateLimitResult.reset).toISOString(),
      },
    });

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      if (value) {
        response.headers.set(key, value);
      }
    });

    return response;
  } catch (error) {
    console.error('Rate test error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}