import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/middleware/api-auth';
import { db } from '@/lib/db';
import { events } from '@/lib/schema';
import { desc, eq, and, gte, lte, inArray } from 'drizzle-orm';
import { z } from 'zod';

// Schema for query parameters
const eventsQuerySchema = z.object({
  ticker: z.string().optional(),
  eventType: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// Schema for creating events
const createEventSchema = z.object({
  ticker: z.string(),
  eventType: z.string(),
  title: z.string().min(1).max(200),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  impact: z.object({
    priceChange: z.number().optional(),
    volumeChange: z.number().optional(),
    sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
  }).optional(),
  source: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// GET /api/v1/events - Get market events
export const GET = withApiAuth(
  async (req: NextRequest, context) => {
    try {
      const searchParams = Object.fromEntries(new URL(req.url).searchParams);
      const query = eventsQuerySchema.parse({
        ...searchParams,
        limit: searchParams.limit ? parseInt(searchParams.limit) : 20,
        offset: searchParams.offset ? parseInt(searchParams.offset) : 0,
      });

      // Build query conditions
      const conditions = [];

      if (query.ticker) {
        conditions.push(eq(events.ticker, query.ticker));
      }

      if (query.eventType) {
        conditions.push(eq(events.eventType, query.eventType));
      }

      if (query.severity) {
        conditions.push(eq(events.severity, query.severity));
      }

      if (query.startDate) {
        conditions.push(gte(events.timestamp, new Date(query.startDate)));
      }

      if (query.endDate) {
        conditions.push(lte(events.timestamp, new Date(query.endDate)));
      }

      // Fetch events
      const eventsData = await db.query.events.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(events.timestamp)],
        limit: query.limit,
        offset: query.offset,
      });

      // Get total count
      const totalCount = await db
        .select({ count: events.id })
        .from(events)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .then(result => result.length);

      // Group events by ticker if requested
      const groupedByTicker = searchParams.grouped === 'true'
        ? eventsData.reduce((acc, event) => {
            if (!acc[event.ticker]) {
              acc[event.ticker] = [];
            }
            acc[event.ticker].push(event);
            return acc;
          }, {} as Record<string, typeof eventsData>)
        : null;

      return NextResponse.json({
        success: true,
        data: groupedByTicker || eventsData,
        pagination: {
          total: totalCount,
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + query.limit < totalCount,
        },
        summary: {
          totalEvents: totalCount,
          bySeverity: {
            critical: eventsData.filter(e => e.severity === 'critical').length,
            high: eventsData.filter(e => e.severity === 'high').length,
            medium: eventsData.filter(e => e.severity === 'medium').length,
            low: eventsData.filter(e => e.severity === 'low').length,
          },
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Invalid query parameters',
            details: error.errors,
          },
          { status: 400 }
        );
      }

      console.error('Events API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }
  },
  'events:read'
);

// POST /api/v1/events - Create a new event
export const POST = withApiAuth(
  async (req: NextRequest, context) => {
    try {
      const body = await req.json();
      const data = createEventSchema.parse(body);

      // Create the event
      const newEvent = await db.insert(events).values({
        ticker: data.ticker,
        eventType: data.eventType,
        title: data.title,
        description: data.description,
        severity: data.severity,
        impact: data.impact,
        source: data.source || 'api',
        metadata: {
          ...data.metadata,
          apiKeyId: context.apiKey.id,
          createdBy: context.apiKey.userId,
        },
        timestamp: new Date(),
      }).returning();

      // Trigger any event processing workflows here
      // For example, update analytics, send notifications, etc.

      return NextResponse.json({
        success: true,
        data: newEvent[0],
        message: 'Event created successfully',
      }, { status: 201 });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Invalid request data',
            details: error.errors,
          },
          { status: 400 }
        );
      }

      console.error('Create event error:', error);
      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: 500 }
      );
    }
  },
  'events:write'
);