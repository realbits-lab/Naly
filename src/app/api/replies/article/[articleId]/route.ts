import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { replies, aiReporters } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Reply } from '@/lib/types/reporter';

// GET /api/replies/article/[articleId] - Get all replies for an article
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  try {
    const { articleId } = await params;

    // Fetch all replies with their reporters
    const allReplies = await db
      .select({
        reply: replies,
        reporter: aiReporters,
      })
      .from(replies)
      .leftJoin(aiReporters, eq(replies.reporterId, aiReporters.id))
      .where(eq(replies.articleId, parseInt(articleId)));

    // Build nested reply structure
    const replyMap = new Map<number, Reply>();
    const rootReplies: Reply[] = [];

    // First pass: Create all reply objects
    allReplies.forEach(({ reply, reporter }) => {
      const replyObj: Reply = {
        id: reply.id,
        articleId: reply.articleId,
        reporterId: reply.reporterId,
        content: reply.content,
        parentReplyId: reply.parentReplyId || undefined,
        createdAt: reply.createdAt!,
        reporter: reporter || undefined,
        replies: [],
      };
      replyMap.set(reply.id, replyObj);
    });

    // Second pass: Build hierarchy
    replyMap.forEach((reply) => {
      if (reply.parentReplyId) {
        const parent = replyMap.get(reply.parentReplyId);
        if (parent) {
          parent.replies!.push(reply);
        }
      } else {
        rootReplies.push(reply);
      }
    });

    return NextResponse.json({ replies: rootReplies });
  } catch (error) {
    console.error('Error fetching replies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch replies' },
      { status: 500 }
    );
  }
}
