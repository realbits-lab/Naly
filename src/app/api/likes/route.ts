import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { likes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { contentId } = await request.json();

    if (!contentId) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      );
    }

    // Check if already liked
    const existing = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.userId, session.user.id),
          eq(likes.contentId, contentId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Unlike
      await db
        .delete(likes)
        .where(
          and(
            eq(likes.userId, session.user.id),
            eq(likes.contentId, contentId)
          )
        );

      return NextResponse.json({ liked: false });
    } else {
      // Like
      await db.insert(likes).values({
        userId: session.user.id,
        contentId,
      });

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get like status for a content
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      );
    }

    // Get total likes
    const totalLikes = await db
      .select()
      .from(likes)
      .where(eq(likes.contentId, contentId));

    // Check if current user liked
    let userLiked = false;
    if (session?.user) {
      const userLike = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.userId, session.user.id),
            eq(likes.contentId, contentId)
          )
        )
        .limit(1);

      userLiked = userLike.length > 0;
    }

    return NextResponse.json({
      count: totalLikes.length,
      liked: userLiked,
    });
  } catch (error) {
    console.error('Error getting likes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
