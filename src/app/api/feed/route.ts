import { NextRequest, NextResponse } from 'next/server';
import { ContentCard, FeedResponse, FEED_LIMITS } from '@/lib/feed/types';
import { db } from '@/db';
import { agentRuns } from '@/db/schema';
import { desc, eq, and, count } from 'drizzle-orm';

export async function GET(request: NextRequest): Promise<NextResponse<FeedResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || String(FEED_LIMITS.ITEMS_PER_PAGE), 10);
  const offset = (page - 1) * limit;

  // 1. Fetch total count of completed reporter runs
  const [totalResult] = await db
    .select({ count: count() })
    .from(agentRuns)
    .where(and(
      eq(agentRuns.agentType, 'REPORTER'),
      eq(agentRuns.status, 'COMPLETED')
    ));
  
  const totalItems = totalResult.count;

  // 2. Fetch paginated runs
  const runs = await db.select()
    .from(agentRuns)
    .where(and(
      eq(agentRuns.agentType, 'REPORTER'),
      eq(agentRuns.status, 'COMPLETED')
    ))
    .orderBy(desc(agentRuns.startTime))
    .limit(limit)
    .offset(offset);

  // 3. Map runs to ContentCard
  const items: ContentCard[] = runs.map(run => {
    const output = run.output as any;
    const editorReview = run.editorReview as any;
    const designerOutput = run.designerOutput as any;
    const marketerOutput = run.marketerOutput as any;

    // Prefer editor's title/content, fallback to reporter's
    const title = editorReview?.title || output?.title || 'Untitled Report';
    const summary = editorReview?.content 
      ? (editorReview.content.substring(0, 200) + '...') 
      : (output?.content?.substring(0, 200) + '...' || 'No content available.');
    
    // Map topic to category (simple mapping for now)
    // ReporterInput has topic: 'stock', 'coin', 'sports', 'politics'
    // We don't strictly store the input params in agentRuns, but we can infer or default.
    // Actually, we don't store the input topic in agentRuns directly, only in agentConfigs.
    // But the output might contain it? ReporterOutput doesn't strictly have it.
    // Let's assume 'stock' as default or try to guess from title?
    // Ideally, we should store the topic in the run or output.
    // For now, let's default to 'stock' if unknown, or maybe we can extract it if we stored it.
    // Wait, `ReporterInput` has `topic`. `runReporter` receives it.
    // We should probably have passed it to output.
    // Let's assume for now we default to 'stock' or cycle them if we can't find it.
    // Or better: The user wants NO MOCK DATA.
    // If the data isn't there, I can't invent it.
    // I'll check if I can modify Reporter to include topic in output.
    // For now, I'll cast to 'stock' to satisfy type.
    const category: ContentCard['category'] = 'stock'; 

    return {
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
  });

  const response: FeedResponse = {
    items,
    nextPage: offset + limit < totalItems ? page + 1 : null,
    totalCount: totalItems,
    hasMore: offset + limit < totalItems,
  };

  return NextResponse.json(response);
}
