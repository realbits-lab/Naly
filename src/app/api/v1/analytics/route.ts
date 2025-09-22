import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/middleware/api-auth';
import { db } from '@/lib/db';
import { marketData, predictions, narratives } from '@/lib/schema';
import { desc, eq, and, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

// Schema for query parameters
const analyticsQuerySchema = z.object({
  ticker: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// GET /api/v1/analytics - Get market analytics data
export const GET = withApiAuth(
  async (req: NextRequest, context) => {
    try {
      // Parse query parameters
      const searchParams = Object.fromEntries(new URL(req.url).searchParams);
      const query = analyticsQuerySchema.parse({
        ...searchParams,
        limit: searchParams.limit ? parseInt(searchParams.limit) : 20,
        offset: searchParams.offset ? parseInt(searchParams.offset) : 0,
      });

      // Build query conditions
      const conditions = [];

      if (query.ticker) {
        conditions.push(eq(marketData.ticker, query.ticker));
      }

      if (query.startDate) {
        conditions.push(gte(marketData.timestamp, new Date(query.startDate)));
      }

      if (query.endDate) {
        conditions.push(lte(marketData.timestamp, new Date(query.endDate)));
      }

      // Fetch analytics data
      const analyticsData = await db.query.marketData.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(marketData.timestamp)],
        limit: query.limit,
        offset: query.offset,
      });

      // Get total count for pagination
      const totalCount = await db
        .select({ count: marketData.id })
        .from(marketData)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .then(result => result.length);

      return NextResponse.json({
        success: true,
        data: analyticsData,
        pagination: {
          total: totalCount,
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + query.limit < totalCount,
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

      console.error('Analytics API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }
  },
  'analytics:read'
);