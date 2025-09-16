import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { communityArticles } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'

// POST /api/community/articles/[id]/view - Track article view
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const articleId = params.id

    // Check if article exists
    const [article] = await db
      .select({ id: communityArticles.id, viewCount: communityArticles.viewCount })
      .from(communityArticles)
      .where(eq(communityArticles.id, articleId))

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await db
      .update(communityArticles)
      .set({
        viewCount: sql`${communityArticles.viewCount} + 1`
      })
      .where(eq(communityArticles.id, articleId))

    return NextResponse.json({
      message: 'View tracked',
      viewCount: article.viewCount + 1
    })

  } catch (error) {
    console.error('Failed to track view:', error)
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    )
  }
}