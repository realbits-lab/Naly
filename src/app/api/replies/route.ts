import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { replies } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

    const { contentId, content, parentReplyId } = await request.json();

    if (!contentId || !content) {
      return NextResponse.json(
        { error: 'Content ID and content are required' },
        { status: 400 }
      );
    }

    const replyId = crypto.randomUUID();
    const newReply = await db.insert(replies).values({
      id: replyId,
      userId: session.user.id,
      contentId,
      content,
      parentReplyId: parentReplyId || null,
    }).returning();

    return NextResponse.json({
      reply: newReply[0],
      user: {
        id: session.user.id,
        name: session.user.name || 'Anonymous',
        isAnonymous: session.user.isAnonymous,
      },
    });
  } catch (error) {
    console.error('Error creating reply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get replies for a content
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      );
    }

    const contentReplies = await db
      .select()
      .from(replies)
      .where(eq(replies.contentId, contentId));

    return NextResponse.json({
      replies: contentReplies,
      count: contentReplies.length,
    });
  } catch (error) {
    console.error('Error getting replies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
