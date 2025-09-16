import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { communityArticleReplies, communityReplyLikes } from '@/lib/schema'
import { eq, and, sql } from 'drizzle-orm'

// POST /api/community/replies/[id]/like - Toggle reply like
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const replyId = params.id

    // Check if reply exists
    const [reply] = await db
      .select({ id: communityArticleReplies.id, likeCount: communityArticleReplies.likeCount })
      .from(communityArticleReplies)
      .where(eq(communityArticleReplies.id, replyId))

    if (!reply) {
      return NextResponse.json(
        { error: 'Reply not found' },
        { status: 404 }
      )
    }

    // Check if user already liked this reply
    const [existingLike] = await db
      .select()
      .from(communityReplyLikes)
      .where(
        and(
          eq(communityReplyLikes.replyId, replyId),
          eq(communityReplyLikes.userId, session.user.id)
        )
      )

    let isLiked: boolean
    let newLikeCount: number

    if (existingLike) {
      // Unlike: remove the like
      await db
        .delete(communityReplyLikes)
        .where(
          and(
            eq(communityReplyLikes.replyId, replyId),
            eq(communityReplyLikes.userId, session.user.id)
          )
        )

      // Decrease like count
      await db
        .update(communityArticleReplies)
        .set({
          likeCount: sql`${communityArticleReplies.likeCount} - 1`
        })
        .where(eq(communityArticleReplies.id, replyId))

      isLiked = false
      newLikeCount = reply.likeCount - 1

    } else {
      // Like: add the like
      await db
        .insert(communityReplyLikes)
        .values({
          replyId,
          userId: session.user.id,
        })

      // Increase like count
      await db
        .update(communityArticleReplies)
        .set({
          likeCount: sql`${communityArticleReplies.likeCount} + 1`
        })
        .where(eq(communityArticleReplies.id, replyId))

      isLiked = true
      newLikeCount = reply.likeCount + 1
    }

    return NextResponse.json({
      isLiked,
      likeCount: newLikeCount
    })

  } catch (error) {
    console.error('Failed to toggle reply like:', error)
    return NextResponse.json(
      { error: 'Failed to toggle reply like' },
      { status: 500 }
    )
  }
}