import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { likes, replies, user } from '@/db/schema';
import { sql, gte, and, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated admin
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.isAnonymous) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d, all

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Get total counts
    const [totalLikes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(likes);

    const [totalReplies] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(replies);

    const [totalUsers] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(user);

    const [anonymousUsers] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(user)
      .where(eq(user.isAnonymous, true));

    // Get period-specific counts
    const [periodLikes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(likes)
      .where(gte(likes.createdAt, startDate));

    const [periodReplies] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(replies)
      .where(gte(replies.createdAt, startDate));

    // Get daily stats for the period (for charts)
    const dailyLikes = await db
      .select({
        date: sql<string>`DATE(${likes.createdAt})`,
        count: sql<number>`count(*)::int`,
      })
      .from(likes)
      .where(gte(likes.createdAt, startDate))
      .groupBy(sql`DATE(${likes.createdAt})`)
      .orderBy(sql`DATE(${likes.createdAt})`);

    const dailyReplies = await db
      .select({
        date: sql<string>`DATE(${replies.createdAt})`,
        count: sql<number>`count(*)::int`,
      })
      .from(replies)
      .where(gte(replies.createdAt, startDate))
      .groupBy(sql`DATE(${replies.createdAt})`)
      .orderBy(sql`DATE(${replies.createdAt})`);

    // Get top engaged content (most likes + replies)
    const topContent = await db
      .select({
        contentId: likes.contentId,
        likeCount: sql<number>`count(DISTINCT ${likes.userId})::int`,
        replyCount: sql<number>`0`,
      })
      .from(likes)
      .groupBy(likes.contentId)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    // Get engagement by user type (anonymous vs authenticated)
    const [anonymousLikes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(likes)
      .leftJoin(user, eq(likes.userId, user.id))
      .where(eq(user.isAnonymous, true));

    const [anonymousReplies] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(replies)
      .leftJoin(user, eq(replies.userId, user.id))
      .where(eq(user.isAnonymous, true));

    return NextResponse.json({
      overview: {
        totalLikes: totalLikes?.count || 0,
        totalReplies: totalReplies?.count || 0,
        totalUsers: totalUsers?.count || 0,
        anonymousUsers: anonymousUsers?.count || 0,
        authenticatedUsers: (totalUsers?.count || 0) - (anonymousUsers?.count || 0),
      },
      period: {
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        likes: periodLikes?.count || 0,
        replies: periodReplies?.count || 0,
      },
      timeSeries: {
        dailyLikes: dailyLikes.map(item => ({
          date: item.date,
          count: item.count,
        })),
        dailyReplies: dailyReplies.map(item => ({
          date: item.date,
          count: item.count,
        })),
      },
      engagement: {
        anonymousLikes: anonymousLikes?.count || 0,
        anonymousReplies: anonymousReplies?.count || 0,
        authenticatedLikes: (totalLikes?.count || 0) - (anonymousLikes?.count || 0),
        authenticatedReplies: (totalReplies?.count || 0) - (anonymousReplies?.count || 0),
      },
      topContent,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
