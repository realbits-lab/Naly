import { NextRequest, NextResponse } from 'next/server';
import { apiKeyService } from '@/lib/services/api-key-service';

// GET /api/v1/auth-test - Test API key validation directly
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

    // Validate the API key
    const keyRecord = await apiKeyService.validateApiKey(apiKey);

    if (!keyRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired API key' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'API key validated successfully!',
      keyInfo: {
        id: keyRecord.id,
        userId: keyRecord.userId,
        name: keyRecord.name,
        scopes: keyRecord.scopes,
        rateLimit: keyRecord.rateLimit,
        lastUsedAt: keyRecord.lastUsedAt,
      },
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}