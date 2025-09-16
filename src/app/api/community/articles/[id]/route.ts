import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { communityArticles, users, userCommunityPermissions } from '@/lib/schema'
import { eq, and, sql } from 'drizzle-orm'
import { z } from 'zod'

const updateArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255).optional(),
  content: z.string().min(1, 'Content is required').optional(),
  excerpt: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
})

// GET /api/community/articles/[id] - Get single article
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    const articleId = params.id

    // Get article with author information
    const [article] = await db
      .select({
        id: communityArticles.id,
        title: communityArticles.title,
        content: communityArticles.content,
        excerpt: communityArticles.excerpt,
        slug: communityArticles.slug,
        sectionId: communityArticles.sectionId,
        viewCount: communityArticles.viewCount,
        replyCount: communityArticles.replyCount,
        likeCount: communityArticles.likeCount,
        isPinned: communityArticles.isPinned,
        isFeatured: communityArticles.isFeatured,
        publishedAt: communityArticles.publishedAt,
        createdAt: communityArticles.createdAt,
        updatedAt: communityArticles.updatedAt,
        tags: communityArticles.tags,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        },
        // Check if current user liked this article
        isLiked: session?.user?.id
          ? sql<boolean>`EXISTS(
              SELECT 1 FROM community_article_likes
              WHERE article_id = ${communityArticles.id}
              AND user_id = ${session.user.id}
            )`
          : sql<boolean>`false`,
        // Check if current user bookmarked this article
        isBookmarked: session?.user?.id
          ? sql<boolean>`EXISTS(
              SELECT 1 FROM community_article_bookmarks
              WHERE article_id = ${communityArticles.id}
              AND user_id = ${session.user.id}
            )`
          : sql<boolean>`false`,
      })
      .from(communityArticles)
      .innerJoin(users, eq(communityArticles.authorId, users.id))
      .where(
        and(
          eq(communityArticles.id, articleId),
          eq(communityArticles.isActive, true),
          // Show published articles to everyone
          sql`published_at IS NOT NULL`
        )
      )

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ article })

  } catch (error) {
    console.error('Failed to fetch article:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    )
  }
}

// PATCH /api/community/articles/[id] - Update article (author or manager)
export async function PATCH(
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
    const [existingArticle] = await db
      .select({
        id: communityArticles.id,
        authorId: communityArticles.authorId,
        title: communityArticles.title,
      })
      .from(communityArticles)
      .where(eq(communityArticles.id, articleId))

    if (!existingArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Check permissions: author can edit their own, managers can edit any
    const isAuthor = existingArticle.authorId === session.user.id
    let isManager = false

    if (!isAuthor) {
      const [permission] = await db
        .select()
        .from(userCommunityPermissions)
        .where(
          and(
            eq(userCommunityPermissions.userId, session.user.id),
            eq(userCommunityPermissions.level, 'MANAGER'),
            eq(userCommunityPermissions.isActive, true)
          )
        )

      isManager = !!permission
    }

    if (!isAuthor && !isManager) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateArticleSchema.parse(body)

    // Update slug if title changed
    let updateData = { ...validatedData, updatedAt: new Date().toISOString() }

    if (validatedData.title && validatedData.title !== existingArticle.title) {
      const baseSlug = validatedData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 100)

      let slug = baseSlug
      let counter = 1

      // Ensure slug is unique (excluding current article)
      while (true) {
        const [conflictingArticle] = await db
          .select({ id: communityArticles.id })
          .from(communityArticles)
          .where(
            and(
              eq(communityArticles.slug, slug),
              sql`id != ${articleId}`
            )
          )

        if (!conflictingArticle) break

        slug = `${baseSlug}-${counter}`
        counter++
      }

      updateData = { ...updateData, slug }
    }

    // Only managers can set pinned/featured
    if (!isManager) {
      delete updateData.isPinned
      delete updateData.isFeatured
    }

    // Update article
    const [updatedArticle] = await db
      .update(communityArticles)
      .set(updateData)
      .where(eq(communityArticles.id, articleId))
      .returning()

    return NextResponse.json({ article: updatedArticle })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Failed to update article:', error)
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    )
  }
}

// DELETE /api/community/articles/[id] - Delete article (author or manager)
export async function DELETE(
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
    const [existingArticle] = await db
      .select({
        id: communityArticles.id,
        authorId: communityArticles.authorId,
      })
      .from(communityArticles)
      .where(eq(communityArticles.id, articleId))

    if (!existingArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Check permissions: author can delete their own, managers can delete any
    const isAuthor = existingArticle.authorId === session.user.id
    let isManager = false

    if (!isAuthor) {
      const [permission] = await db
        .select()
        .from(userCommunityPermissions)
        .where(
          and(
            eq(userCommunityPermissions.userId, session.user.id),
            eq(userCommunityPermissions.level, 'MANAGER'),
            eq(userCommunityPermissions.isActive, true)
          )
        )

      isManager = !!permission
    }

    if (!isAuthor && !isManager) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Soft delete: set isActive to false
    await db
      .update(communityArticles)
      .set({
        isActive: false,
        updatedAt: new Date().toISOString()
      })
      .where(eq(communityArticles.id, articleId))

    return NextResponse.json({ message: 'Article deleted successfully' })

  } catch (error) {
    console.error('Failed to delete article:', error)
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    )
  }
}