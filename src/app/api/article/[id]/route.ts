import { NextRequest, NextResponse } from 'next/server';
import { ContentCard } from '@/lib/feed/types';
import { db } from '@/db';
import { agentRuns } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCache, setCache, CACHE_TTL } from '@/lib/cache';
import { handleETagCache, createCachedResponse } from '@/lib/etag';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ContentCard | { error: string }>> {
  const { id } = await params;
  const runId = parseInt(id, 10);

  if (isNaN(runId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  // Create cache key for this article
  const cacheKey = `article:${runId}`;

  // Try to get from Redis cache first
  const cachedArticle = await getCache<ContentCard>(cacheKey, {
    prefix: 'api',
    ttl: CACHE_TTL.MEDIUM, // 1 hour cache for articles
  });

  if (cachedArticle) {
    // Check ETag for 304 Not Modified
    const notModified = handleETagCache(request, cachedArticle);
    if (notModified) {
      return notModified;
    }

    // Return cached article with ETag
    return createCachedResponse(cachedArticle, {
      maxAge: 3600, // 1 hour
      swr: 7200, // 2 hours stale-while-revalidate
    });
  }

  const runs = await db.select()
    .from(agentRuns)
    .where(eq(agentRuns.id, runId))
    .limit(1);

  if (runs.length === 0) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  const run = runs[0];
  const output = run.output as any;
  const editorReview = run.editorReview as any;
  const designerOutput = run.designerOutput as any;
  const marketerOutput = run.marketerOutput as any;

  const title = editorReview?.title || output?.title || 'Untitled Report';
  const summary = editorReview?.content
    ? (editorReview.content.substring(0, 200) + '...')
    : (output?.content?.substring(0, 200) + '...' || 'No content available.');

  const category: ContentCard['category'] = 'stock'; // Defaulting as topic isn't explicitly stored in output yet

  const article: ContentCard = {
    id: String(run.id),
    title: title,
    summary: summary,
    content: editorReview?.content || output?.content || '',
    thumbnailUrl: designerOutput?.assets?.[0]?.url || null,
    category: category,
    createdAt: run.startTime ? new Date(run.startTime).toISOString() : new Date().toISOString(),
    viewCount: marketerOutput?.predictedMetrics?.views || 0,
    predictedEngagement: marketerOutput?.predictedMetrics?.retention || 0,
    trends: output?.trends || [],
    sources: output?.sources || [],
    dataTables: output?.dataTables || [],
    charts: output?.charts || [],
  };

  // Cache the article in Redis
  await setCache(cacheKey, article, {
    prefix: 'api',
    ttl: CACHE_TTL.MEDIUM, // 1 hour
  });

  // Return article with ETag and cache headers
  return createCachedResponse(article, {
    maxAge: 3600, // 1 hour
    swr: 7200, // 2 hours stale-while-revalidate
  });
}
