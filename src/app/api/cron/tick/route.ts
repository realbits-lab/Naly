import { checkAndTriggerJobs } from '@/lib/scheduler';
import { checkAllDuePredictions } from '@/lib/prediction-checker';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check and trigger scheduled agent jobs
    await checkAndTriggerJobs();

    // Check and verify predictions that are due
    await checkAllDuePredictions();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
