import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { communitySections, userCommunityPermissions } from '@/lib/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { z } from 'zod'

const createSectionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(1000).optional(),
  slug: z.string().min(1, 'Slug is required').max(100),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  displayOrder: z.number().optional(),
  isPublic: z.boolean().default(true),
})

// GET /api/community/sections - Get all visible sections
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Get sections with article counts
    const sections = await db
      .select({
        id: communitySections.id,
        title: communitySections.title,
        description: communitySections.description,
        slug: communitySections.slug,
        icon: communitySections.icon,
        color: communitySections.color,
        displayOrder: communitySections.displayOrder,
        isActive: communitySections.isActive,
        isPublic: communitySections.isPublic,
        createdAt: communitySections.createdAt,
        // TODO: Add article count subquery when articles table is ready
        articleCount: sql<number>`0`,
      })
      .from(communitySections)
      .where(
        and(
          eq(communitySections.isActive, true),
          // Show all sections to logged in users, only public to non-logged in
          session?.user?.id ? undefined : eq(communitySections.isPublic, true)
        )
      )
      .orderBy(communitySections.displayOrder, communitySections.createdAt)

    return NextResponse.json({ sections })

  } catch (error) {
    console.error('Failed to fetch sections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    )
  }
}

// POST /api/community/sections - Create new section (managers only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is manager
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

    if (!permission) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Manager level required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createSectionSchema.parse(body)

    // Check if slug is unique
    const [existingSection] = await db
      .select({ id: communitySections.id })
      .from(communitySections)
      .where(eq(communitySections.slug, validatedData.slug))

    if (existingSection) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      )
    }

    // Create section
    const [newSection] = await db
      .insert(communitySections)
      .values({
        ...validatedData,
        createdById: session.user.id,
      })
      .returning()

    return NextResponse.json({ section: newSection }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Failed to create section:', error)
    return NextResponse.json(
      { error: 'Failed to create section' },
      { status: 500 }
    )
  }
}