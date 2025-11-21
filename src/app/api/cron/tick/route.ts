import { checkAndTriggerJobs } from '@/lib/scheduler';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await checkAndTriggerJobs();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
