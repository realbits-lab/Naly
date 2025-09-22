import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/middleware/api-auth';
import { db } from '@/lib/db';
import { predictions, marketData } from '@/lib/schema';
import { desc, eq, and, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';

// Schema for query parameters
const predictionsQuerySchema = z.object({
  ticker: z.string().optional(),
  confidence: z.number().min(0).max(100).optional(),
  horizon: z.enum(['short', 'medium', 'long']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// Schema for creating predictions
const createPredictionSchema = z.object({
  ticker: z.string(),
  prediction: z.object({
    direction: z.enum(['up', 'down', 'neutral']),
    confidence: z.number().min(0).max(100),
    targetPrice: z.number().positive().optional(),
    timeframe: z.string(),
  }),
  analysis: z.object({
    reasoning: z.string(),
    factors: z.array(z.string()),
    risks: z.array(z.string()).optional(),
  }),
});

// GET /api/v1/predictions - Get predictions
export const GET = withApiAuth(
  async (req: NextRequest, context) => {
    try {
      const searchParams = Object.fromEntries(new URL(req.url).searchParams);
      const query = predictionsQuerySchema.parse({
        ...searchParams,
        confidence: searchParams.confidence ? parseFloat(searchParams.confidence) : undefined,
        limit: searchParams.limit ? parseInt(searchParams.limit) : 20,
        offset: searchParams.offset ? parseInt(searchParams.offset) : 0,
      });

      // Build query conditions
      const conditions = [];

      if (query.ticker) {
        conditions.push(eq(predictions.ticker, query.ticker));
      }

      if (query.confidence !== undefined) {
        conditions.push(gte(predictions.confidence, query.confidence));
      }

      if (query.startDate) {
        conditions.push(gte(predictions.createdAt, new Date(query.startDate)));
      }

      if (query.endDate) {
        conditions.push(lte(predictions.createdAt, new Date(query.endDate)));
      }

      // Fetch predictions
      const predictionsData = await db.query.predictions.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(predictions.createdAt)],
        limit: query.limit,
        offset: query.offset,
        with: {
          marketData: true,
        },
      });

      // Calculate accuracy metrics for each prediction
      const predictionsWithMetrics = predictionsData.map(pred => {
        // Here you would calculate actual accuracy based on historical data
        // This is a placeholder implementation
        return {
          ...pred,
          metrics: {
            accuracy: null, // Would be calculated based on actual vs predicted
            status: 'pending', // pending, correct, incorrect
          },
        };
      });

      // Get total count
      const totalCount = await db
        .select({ count: predictions.id })
        .from(predictions)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .then(result => result.length);

      return NextResponse.json({
        success: true,
        data: predictionsWithMetrics,
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

      console.error('Predictions API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch predictions' },
        { status: 500 }
      );
    }
  },
  'predictions:read'
);

// POST /api/v1/predictions - Create a new prediction
export const POST = withApiAuth(
  async (req: NextRequest, context) => {
    try {
      const body = await req.json();
      const data = createPredictionSchema.parse(body);

      // Create the prediction
      const newPrediction = await db.insert(predictions).values({
        ticker: data.ticker,
        prediction: data.prediction,
        confidence: data.prediction.confidence,
        analysis: data.analysis,
        createdBy: context.apiKey.userId,
        metadata: {
          apiKeyId: context.apiKey.id,
          source: 'api',
        },
      }).returning();

      return NextResponse.json({
        success: true,
        data: newPrediction[0],
        message: 'Prediction created successfully',
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

      console.error('Create prediction error:', error);
      return NextResponse.json(
        { error: 'Failed to create prediction' },
        { status: 500 }
      );
    }
  },
  'predictions:write'
);