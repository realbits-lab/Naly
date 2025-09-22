import { NextRequest, NextResponse } from 'next/server';
import { apiKeyService } from '@/lib/services/api-key-service';
import { db } from '@/lib/db';
import { users, narratives, events } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/v1/working - Working endpoint with API key auth
export async function GET(req: NextRequest) {
  try {
    // API Key Authentication
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

    // Get user info
    const user = await db.query.users.findFirst({
      where: eq(users.id, keyRecord.userId),
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // Get recent narratives
    const recentNarratives = await db.query.narratives.findMany({
      limit: 5,
      orderBy: [desc(narratives.createdAt)],
      columns: {
        id: true,
        title: true,
        ticker: true,
        createdAt: true,
      },
    });

    // Get recent events
    const recentEvents = await db.query.events.findMany({
      limit: 5,
      orderBy: [desc(events.timestamp)],
      columns: {
        id: true,
        ticker: true,
        eventType: true,
        timestamp: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'API authentication successful!',
      authentication: {
        keyId: keyRecord.id,
        keyName: keyRecord.name,
        scopes: keyRecord.scopes,
        rateLimit: keyRecord.rateLimit,
      },
      user: user || null,
      data: {
        narratives: recentNarratives,
        events: recentEvents,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/v1/working - Create a narrative with API key auth
export async function POST(req: NextRequest) {
  try {
    // API Key Authentication
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

    // Check if user has write scope
    if (!apiKeyService.hasScope(keyRecord.scopes as string[], 'narratives:write') &&
        !apiKeyService.hasScope(keyRecord.scopes as string[], '*')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Required scope: narratives:write' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await req.json();

    // Create narrative
    const [newNarrative] = await db.insert(narratives).values({
      headline: body.headline || body.title || `API Generated Narrative - ${new Date().toISOString()}`,
      summary: body.summary || body.content || 'Test narrative content created via API',
      explanation: body.explanation,
      prediction: body.prediction,
      deepDive: body.deepDive,
      ticker: body.ticker || 'AAPL',
      userId: keyRecord.userId,
      createdAt: new Date(),
    }).returning();

    return NextResponse.json({
      success: true,
      message: 'Narrative created successfully',
      data: newNarrative,
    }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}