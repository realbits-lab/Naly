import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/middleware/api-auth';

// GET /api/v1/test - Simple test endpoint
export const GET = withApiAuth(
  async (req: NextRequest, context) => {
    return NextResponse.json({
      success: true,
      message: 'API key authentication successful!',
      user: {
        id: context.apiKey.userId,
        scopes: context.apiKey.scopes,
        rateLimit: context.apiKey.rateLimit,
      },
      timestamp: new Date().toISOString(),
    });
  }
);