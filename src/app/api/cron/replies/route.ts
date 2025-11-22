import { NextResponse } from 'next/server';
import { generatePeriodicReplies } from '@/lib/services/reply-generator';

// Vercel Cron endpoint to generate periodic AI replies
export async function GET() {
  try {
    const count = await generatePeriodicReplies(3);
    return NextResponse.json({
      success: true,
      repliesGenerated: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in replies cron job:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate replies',
      },
      { status: 500 }
    );
  }
}
