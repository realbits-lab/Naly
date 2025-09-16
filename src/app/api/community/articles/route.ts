import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { communityArticles, communitySections, userCommunityPermissions, users } from '@/lib/schema'
import { eq, and, desc, asc, sql } from 'drizzle-orm'
import { z } from 'zod'

const createArticleSchema = z.object({
  sectionId: z.string().min(1, 'Section is required'),
  title: z.string().min(1, 'Title is required').max(255),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(true),
  isPinned: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
})

const listArticlesSchema = z.object({
  sectionId: z.string().min(1),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  sort: z.enum(['newest', 'oldest', 'popular', 'views']).default('newest'),
})

// GET /api/community/articles - List articles by section
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    const validatedParams = listArticlesSchema.parse(params)
    const { sectionId, page, limit, sort } = validatedParams

    const session = await auth()
    const offset = (page - 1) * limit

    // Build order clause based on sort
    let orderBy
    switch (sort) {
      case 'oldest':
        orderBy = [asc(communityArticles.createdAt)]
        break
      case 'popular':
        orderBy = [desc(communityArticles.likeCount), desc(communityArticles.createdAt)]
        break
      case 'views':
        orderBy = [desc(communityArticles.viewCount), desc(communityArticles.createdAt)]
        break
      default: // newest
        orderBy = [desc(communityArticles.isPinned), desc(communityArticles.isFeatured), desc(communityArticles.createdAt)]
    }

    // Get articles with author information
    const articlesQuery = db
      .select({
        id: communityArticles.id,
        title: communityArticles.title,
        content: communityArticles.content,
        excerpt: communityArticles.excerpt,
        slug: communityArticles.slug,
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
          eq(communityArticles.sectionId, sectionId),
          eq(communityArticles.isActive, true),
          // Show published articles or user's own drafts
          session?.user?.id
            ? undefined
            : eq(communityArticles.publishedAt, sql`published_at IS NOT NULL`)
        )
      )
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset)

    const articles = await articlesQuery

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(communityArticles)
      .where(
        and(
          eq(communityArticles.sectionId, sectionId),
          eq(communityArticles.isActive, true),
          session?.user?.id
            ? undefined
            : eq(communityArticles.publishedAt, sql`published_at IS NOT NULL`)
        )
      )

    const totalPages = Math.ceil(count / limit)

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Failed to fetch articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}

// POST /api/community/articles - Create new article (login required)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createArticleSchema.parse(body)

    // Verify section exists and is active
    const [section] = await db
      .select()
      .from(communitySections)
      .where(
        and(
          eq(communitySections.id, validatedData.sectionId),
          eq(communitySections.isActive, true)
        )
      )

    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      )
    }

    // Check if user can write in this section (public sections or user has permission)
    if (!section.isPublic) {
      const [permission] = await db
        .select()
        .from(userCommunityPermissions)
        .where(
          and(
            eq(userCommunityPermissions.userId, session.user.id),
            eq(userCommunityPermissions.isActive, true)
          )
        )

      if (!permission) {
        return NextResponse.json(
          { error: 'Insufficient permissions to write in this section' },
          { status: 403 }
        )
      }
    }

    // Generate slug from title
    const baseSlug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 100)

    let slug = baseSlug
    let counter = 1

    // Ensure slug is unique
    while (true) {
      const [existingArticle] = await db
        .select({ id: communityArticles.id })
        .from(communityArticles)
        .where(eq(communityArticles.slug, slug))

      if (!existingArticle) break

      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create article
    const [newArticle] = await db
      .insert(communityArticles)
      .values({
        ...validatedData,
        slug,
        authorId: session.user.id,
        publishedAt: new Date().toISOString(), // Auto-publish for now
      })
      .returning()

    // Fetch the complete article with author info
    const [articleWithAuthor] = await db
      .select({
        id: communityArticles.id,
        title: communityArticles.title,
        content: communityArticles.content,
        excerpt: communityArticles.excerpt,
        slug: communityArticles.slug,
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
        isLiked: false,
        isBookmarked: false,
      })
      .from(communityArticles)
      .innerJoin(users, eq(communityArticles.authorId, users.id))
      .where(eq(communityArticles.id, newArticle.id))

    return NextResponse.json({ article: articleWithAuthor }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Failed to create article:', error)
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    )
  }
}