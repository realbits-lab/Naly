import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { replies, aiReporters } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { CreateReplyInput } from '@/lib/types/reporter';

// POST /api/replies - Create a new reply
export async function POST(request: NextRequest) {
  try {
    const body: CreateReplyInput = await request.json();

    // Validate reporter exists
    const [reporter] = await db
      .select()
      .from(aiReporters)
      .where(eq(aiReporters.id, body.reporterId));

    if (!reporter) {
      return NextResponse.json(
        { error: 'Reporter not found' },
        { status: 404 }
      );
    }

    const [newReply] = await db.insert(replies).values({
      articleId: body.articleId,
      reporterId: body.reporterId,
      content: body.content,
      parentReplyId: body.parentReplyId,
    }).returning();

    // Update reporter's memory with this interaction
    const newMemory = {
      timestamp: new Date().toISOString(),
      event: 'reply_created',
      context: `Replied to article ${body.articleId}: ${body.content.substring(0, 100)}...`,
      articleId: body.articleId,
    };

    const existingMemory = (reporter.memory as any[]) || [];
    await db
      .update(aiReporters)
      .set({
        memory: [...existingMemory, newMemory],
        updatedAt: new Date(),
      })
      .where(eq(aiReporters.id, body.reporterId));

    return NextResponse.json({ reply: newReply }, { status: 201 });
  } catch (error) {
    console.error('Error creating reply:', error);
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    );
  }
}
