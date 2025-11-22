import { db } from '@/db';
import { agentRuns, replies, aiReporters } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { getRandomReporter, addReporterMemory } from './reporter-selector';
import { ReporterOutput } from '../agents/types';

/**
 * Generate an AI reply to a specific article or reply
 */
export async function generateAIReply(
  articleId: number,
  reporterId?: number,
  parentReplyId?: number
): Promise<{ replyId: number; content: string }> {
  // Get the article
  const [article] = await db
    .select()
    .from(agentRuns)
    .where(eq(agentRuns.id, articleId));

  if (!article) {
    throw new Error('Article not found');
  }

  // Get reporter (random if not specified)
  const reporter = reporterId
    ? (await db.select().from(aiReporters).where(eq(aiReporters.id, reporterId)))[0]
    : await getRandomReporter();

  if (!reporter) {
    throw new Error('Reporter not found');
  }

  const articleOutput = article.output as ReporterOutput;

  // Get parent reply content if replying to another reply
  let parentContext = '';
  if (parentReplyId) {
    const [parentReply] = await db
      .select()
      .from(replies)
      .where(eq(replies.id, parentReplyId));

    if (parentReply) {
      parentContext = `\n\nYou are replying to this comment: "${parentReply.content}"`;
    }
  }

  // Get recent replies for context
  const recentReplies = await db
    .select()
    .from(replies)
    .where(eq(replies.articleId, articleId))
    .orderBy(desc(replies.createdAt))
    .limit(5);

  const recentContext = recentReplies.length > 0
    ? `\n\nRecent discussion:\n${recentReplies.map(r => `- ${r.content.substring(0, 100)}...`).join('\n')}`
    : '';

  // Build context from reporter's memory
  const memoryContext = reporter.memory && (reporter.memory as any[]).length > 0
    ? `\n\nYour recent memories:\n${(reporter.memory as any[]).slice(-3).map((m: any) => `- ${m.event}: ${m.context}`).join('\n')}`
    : '';

  // Generate reply using AI
  const systemPrompt = `You are ${reporter.name}, an AI reporter.
Your personality: ${reporter.personality}
${memoryContext}

You are writing a thoughtful reply to an article. Your reply should:
- Be relevant and add value to the discussion
- Reflect your personality and expertise
- Be concise (2-3 sentences)
- Be engaging and conversational
- Not just summarize the article`;

  const prompt = `Article Title: "${articleOutput.title}"

Article Summary: ${articleOutput.content.substring(0, 500)}...
${parentContext}
${recentContext}

Write a brief, insightful reply to this article. Keep it conversational and add value to the discussion.`;

  const { text } = await generateText({
    model: google('gemini-2.0-flash'),
    system: systemPrompt,
    prompt,
  });

  // Create the reply
  const [newReply] = await db.insert(replies).values({
    articleId,
    reporterId: reporter.id,
    content: text,
    parentReplyId,
  }).returning();

  // Update reporter's memory
  await addReporterMemory(
    reporter.id,
    'reply_generated',
    `Replied to article "${articleOutput.title}": ${text.substring(0, 100)}...`,
    articleId
  );

  return {
    replyId: newReply.id,
    content: text,
  };
}

/**
 * Select random articles and generate replies periodically
 */
export async function generatePeriodicReplies(count: number = 3): Promise<number> {
  try {
    // Get recent completed articles (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentArticles = await db
      .select()
      .from(agentRuns)
      .where(
        and(
          eq(agentRuns.agentType, 'REPORTER'),
          eq(agentRuns.status, 'COMPLETED'),
          sql`${agentRuns.startTime} >= ${oneDayAgo}`
        )
      )
      .orderBy(desc(agentRuns.startTime))
      .limit(10);

    if (recentArticles.length === 0) {
      console.log('No recent articles found for reply generation');
      return 0;
    }

    let repliesGenerated = 0;

    // Generate replies for random articles
    for (let i = 0; i < Math.min(count, recentArticles.length); i++) {
      const randomIndex = Math.floor(Math.random() * recentArticles.length);
      const article = recentArticles[randomIndex];

      try {
        await generateAIReply(article.id);
        repliesGenerated++;
        console.log(`Generated reply for article ${article.id}`);
      } catch (error) {
        console.error(`Error generating reply for article ${article.id}:`, error);
      }
    }

    return repliesGenerated;
  } catch (error) {
    console.error('Error in generatePeriodicReplies:', error);
    return 0;
  }
}
