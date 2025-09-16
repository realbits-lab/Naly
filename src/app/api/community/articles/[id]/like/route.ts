import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { communityArticles, communityArticleLikes } from '@/lib/schema'
import { eq, and, sql } from 'drizzle-orm'

// POST /api/community/articles/[id]/like - Toggle article like
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const articleId = params.id

    // Check if article exists
    const [article] = await db
      .select({ id: communityArticles.id, likeCount: communityArticles.likeCount })
      .from(communityArticles)
      .where(eq(communityArticles.id, articleId))

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Check if user already liked this article
    const [existingLike] = await db
      .select()
      .from(communityArticleLikes)
      .where(
        and(
          eq(communityArticleLikes.articleId, articleId),
          eq(communityArticleLikes.userId, session.user.id)
        )
      )

    let isLiked: boolean
    let newLikeCount: number

    if (existingLike) {
      // Unlike: remove the like
      await db
        .delete(communityArticleLikes)
        .where(
          and(
            eq(communityArticleLikes.articleId, articleId),
            eq(communityArticleLikes.userId, session.user.id)
          )
        )

      // Decrease like count
      await db
        .update(communityArticles)
        .set({
          likeCount: sql`${communityArticles.likeCount} - 1`
        })
        .where(eq(communityArticles.id, articleId))

      isLiked = false
      newLikeCount = article.likeCount - 1

    } else {
      // Like: add the like
      await db
        .insert(communityArticleLikes)
        .values({
          articleId,
          userId: session.user.id,
        })

      // Increase like count
      await db
        .update(communityArticles)
        .set({
          likeCount: sql`${communityArticles.likeCount} + 1`
        })
        .where(eq(communityArticles.id, articleId))

      isLiked = true
      newLikeCount = article.likeCount + 1
    }

    return NextResponse.json({
      isLiked,
      likeCount: newLikeCount
    })

  } catch (error) {
    console.error('Failed to toggle like:', error)
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    )
  }
}