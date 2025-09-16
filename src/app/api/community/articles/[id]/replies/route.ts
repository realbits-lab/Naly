import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { communityArticleReplies, communityArticles, users } from '@/lib/schema'
import { eq, and, isNull, desc, sql } from 'drizzle-orm'
import { z } from 'zod'

const createReplySchema = z.object({
  content: z.string().min(1, 'Content is required').max(2000),
  parentId: z.string().optional(),
})

interface Reply {
  id: string
  content: string
  author: {
    id: string
    name: string
    email: string
    image?: string
  }
  likeCount: number
  isLiked: boolean
  parentId?: string
  isEdited: boolean
  editedAt?: string
  createdAt: string
  replies?: Reply[]
}

// GET /api/community/articles/[id]/replies - Get article replies
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    const articleId = params.id

    // Check if article exists
    const [article] = await db
      .select({ id: communityArticles.id })
      .from(communityArticles)
      .where(eq(communityArticles.id, articleId))

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Get all replies with author info and like status
    const allReplies = await db
      .select({
        id: communityArticleReplies.id,
        content: communityArticleReplies.content,
        parentId: communityArticleReplies.parentId,
        isEdited: communityArticleReplies.isEdited,
        editedAt: communityArticleReplies.editedAt,
        createdAt: communityArticleReplies.createdAt,
        likeCount: communityArticleReplies.likeCount,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        },
        isLiked: session?.user?.id
          ? sql<boolean>`EXISTS(
              SELECT 1 FROM community_reply_likes
              WHERE reply_id = ${communityArticleReplies.id}
              AND user_id = ${session.user.id}
            )`
          : sql<boolean>`false`,
      })
      .from(communityArticleReplies)
      .innerJoin(users, eq(communityArticleReplies.authorId, users.id))
      .where(
        and(
          eq(communityArticleReplies.articleId, articleId),
          eq(communityArticleReplies.isActive, true)
        )
      )
      .orderBy(desc(communityArticleReplies.createdAt))

    // Build nested reply structure
    const replyMap = new Map<string, Reply>()
    const rootReplies: Reply[] = []

    // First pass: create reply objects
    allReplies.forEach(reply => {
      const replyObj: Reply = {
        id: reply.id,
        content: reply.content,
        author: reply.author,
        likeCount: reply.likeCount,
        isLiked: reply.isLiked,
        parentId: reply.parentId || undefined,
        isEdited: reply.isEdited,
        editedAt: reply.editedAt || undefined,
        createdAt: reply.createdAt,
        replies: [],
      }
      replyMap.set(reply.id, replyObj)
    })

    // Second pass: build tree structure
    allReplies.forEach(reply => {
      const replyObj = replyMap.get(reply.id)!
      if (reply.parentId) {
        const parent = replyMap.get(reply.parentId)
        if (parent) {
          parent.replies!.push(replyObj)
        }
      } else {
        rootReplies.push(replyObj)
      }
    })

    // Sort replies by creation date (newest first for root, oldest first for nested)
    rootReplies.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const sortNestedReplies = (replies: Reply[]) => {
      replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      replies.forEach(reply => {
        if (reply.replies && reply.replies.length > 0) {
          sortNestedReplies(reply.replies)
        }
      })
    }

    rootReplies.forEach(reply => {
      if (reply.replies && reply.replies.length > 0) {
        sortNestedReplies(reply.replies)
      }
    })

    return NextResponse.json({ replies: rootReplies })

  } catch (error) {
    console.error('Failed to fetch replies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch replies' },
      { status: 500 }
    )
  }
}

// POST /api/community/articles/[id]/replies - Create new reply
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
      .select({ id: communityArticles.id, replyCount: communityArticles.replyCount })
      .from(communityArticles)
      .where(eq(communityArticles.id, articleId))

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = createReplySchema.parse(body)

    // If parentId provided, check if parent reply exists
    if (validatedData.parentId) {
      const [parentReply] = await db
        .select({ id: communityArticleReplies.id })
        .from(communityArticleReplies)
        .where(eq(communityArticleReplies.id, validatedData.parentId))

      if (!parentReply) {
        return NextResponse.json(
          { error: 'Parent reply not found' },
          { status: 404 }
        )
      }
    }

    // Create reply
    const [newReply] = await db
      .insert(communityArticleReplies)
      .values({
        articleId,
        authorId: session.user.id,
        content: validatedData.content,
        parentId: validatedData.parentId || null,
      })
      .returning()

    // Update article reply count
    await db
      .update(communityArticles)
      .set({
        replyCount: sql`${communityArticles.replyCount} + 1`
      })
      .where(eq(communityArticles.id, articleId))

    // Fetch the reply with author info
    const [replyWithAuthor] = await db
      .select({
        id: communityArticleReplies.id,
        content: communityArticleReplies.content,
        parentId: communityArticleReplies.parentId,
        isEdited: communityArticleReplies.isEdited,
        editedAt: communityArticleReplies.editedAt,
        createdAt: communityArticleReplies.createdAt,
        likeCount: communityArticleReplies.likeCount,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        },
        isLiked: false,
      })
      .from(communityArticleReplies)
      .innerJoin(users, eq(communityArticleReplies.authorId, users.id))
      .where(eq(communityArticleReplies.id, newReply.id))

    return NextResponse.json({ reply: replyWithAuthor }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Failed to create reply:', error)
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    )
  }
}