import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/middleware/api-auth';
import { db } from '@/lib/db';
import { narratives } from '@/lib/schema';
import { desc, eq, and, like, or, isNull } from 'drizzle-orm';
import { z } from 'zod';

// Schema for query parameters
const narrativesQuerySchema = z.object({
  ticker: z.string().optional(),
  type: z.enum(['daily', 'weekly', 'monthly', 'custom']).optional(),
  search: z.string().optional(),
  published: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// Schema for creating narratives
const createNarrativeSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10),
  ticker: z.string().optional(),
  type: z.enum(['daily', 'weekly', 'monthly', 'custom']).default('custom'),
  summary: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  published: z.boolean().default(false),
});

// GET /api/v1/narratives - Get narratives
export const GET = withApiAuth(
  async (req: NextRequest, context) => {
    try {
      const searchParams = Object.fromEntries(new URL(req.url).searchParams);
      const query = narrativesQuerySchema.parse({
        ...searchParams,
        published: searchParams.published === 'true',
        limit: searchParams.limit ? parseInt(searchParams.limit) : 20,
        offset: searchParams.offset ? parseInt(searchParams.offset) : 0,
      });

      // Build query conditions
      const conditions = [];

      if (query.ticker) {
        conditions.push(eq(narratives.ticker, query.ticker));
      }

      if (query.type) {
        conditions.push(eq(narratives.type, query.type));
      }

      if (query.search) {
        conditions.push(
          or(
            like(narratives.title, `%${query.search}%`),
            like(narratives.content, `%${query.search}%`)
          )
        );
      }

      if (query.published !== undefined) {
        if (query.published) {
          conditions.push(eq(narratives.isPublished, true));
        } else {
          conditions.push(or(eq(narratives.isPublished, false), isNull(narratives.isPublished)));
        }
      }

      // Fetch narratives
      const narrativesData = await db.query.narratives.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(narratives.createdAt)],
        limit: query.limit,
        offset: query.offset,
        columns: {
          id: true,
          title: true,
          summary: true,
          ticker: true,
          type: true,
          tags: true,
          isPublished: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          // Optionally include content based on scope
          content: context.apiKey.scopes.includes('narratives:read') ||
                   context.apiKey.scopes.includes('*'),
        },
      });

      // Get total count
      const totalCount = await db
        .select({ count: narratives.id })
        .from(narratives)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .then(result => result.length);

      return NextResponse.json({
        success: true,
        data: narrativesData,
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

      console.error('Narratives API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch narratives' },
        { status: 500 }
      );
    }
  },
  'narratives:read'
);

// POST /api/v1/narratives - Create a new narrative
export const POST = withApiAuth(
  async (req: NextRequest, context) => {
    try {
      const body = await req.json();
      const data = createNarrativeSchema.parse(body);

      // Create the narrative
      const newNarrative = await db.insert(narratives).values({
        title: data.title,
        content: data.content,
        summary: data.summary || data.content.substring(0, 200),
        ticker: data.ticker,
        type: data.type,
        tags: data.tags || [],
        metadata: {
          ...data.metadata,
          apiKeyId: context.apiKey.id,
          source: 'api',
        },
        isPublished: data.published,
        publishedAt: data.published ? new Date() : null,
        createdBy: context.apiKey.userId,
      }).returning();

      return NextResponse.json({
        success: true,
        data: newNarrative[0],
        message: 'Narrative created successfully',
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

      console.error('Create narrative error:', error);
      return NextResponse.json(
        { error: 'Failed to create narrative' },
        { status: 500 }
      );
    }
  },
  'narratives:write'
);