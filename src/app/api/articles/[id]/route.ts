import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { generatedArticles, articleViews } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    const [article] = await db
      .select()
      .from(generatedArticles)
      .where(eq(generatedArticles.id, params.id))

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Track the view if user is logged in
    if (session?.user?.id) {
      await db.insert(articleViews).values({
        articleId: params.id,
        userId: session.user.id,
        sessionId: request.headers.get('x-session-id') || 'anonymous',
      })
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the article belongs to the user
    const [article] = await db
      .select({ id: generatedArticles.id })
      .from(generatedArticles)
      .where(and(
        eq(generatedArticles.id, params.id),
        eq(generatedArticles.userId, session.user.id)
      ))

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Delete the article (cascade will handle related records)
    await db
      .delete(generatedArticles)
      .where(and(
        eq(generatedArticles.id, params.id),
        eq(generatedArticles.userId, session.user.id)
      ))

    return NextResponse.json({ success: true, message: 'Article deleted successfully' })

  } catch (error) {
    console.error('Failed to delete article:', error)
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    )
  }
}