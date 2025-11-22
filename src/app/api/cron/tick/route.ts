import { checkAndTriggerJobs } from '@/lib/scheduler';
import { checkAllDuePredictions } from '@/lib/prediction-checker';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { cronExecutions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const startTime = Date.now();

  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('[CRON] Unauthorized access attempt');
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Create execution record
  const [execution] = await db.insert(cronExecutions).values({
    startTime: new Date(),
    status: 'RUNNING',
  }).returning();

  try {
    console.log('[CRON] Starting scheduled job check at', new Date().toISOString());

    // Check and trigger scheduled agent jobs
    const result = await checkAndTriggerJobs();

    // Check and verify predictions that are due
    await checkAllDuePredictions();

    const duration = Date.now() - startTime;

    console.log('[CRON] Completed in', duration, 'ms');

    // Update execution record with success
    await db.update(cronExecutions).set({
      endTime: new Date(),
      status: 'SUCCESS',
      jobsTriggered: result?.jobsTriggered || 0,
      duration,
    }).where(eq(cronExecutions.id, execution.id));

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration,
      jobsTriggered: result?.jobsTriggered || 0
    });
  } catch (error: any) {
    console.error('[CRON] Failed:', error);
    const duration = Date.now() - startTime;

    // Update execution record with failure
    await db.update(cronExecutions).set({
      endTime: new Date(),
      status: 'FAILED',
      errorMessage: error.message,
      duration,
    }).where(eq(cronExecutions.id, execution.id));

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Ensure the route is dynamic and not cached
export const dynamic = 'force-dynamic';
