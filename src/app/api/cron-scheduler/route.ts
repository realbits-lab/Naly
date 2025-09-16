import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { globalCronScheduler } from '@/lib/cron-scheduler'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow admin users to control the scheduler
    // In a real app, you'd check user roles from the database
    // For now, we'll allow any authenticated user

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'start':
        globalCronScheduler.start()
        return NextResponse.json({ message: 'Cron scheduler started', status: 'running' })

      case 'stop':
        globalCronScheduler.stop()
        return NextResponse.json({ message: 'Cron scheduler stopped', status: 'stopped' })

      case 'status':
        // In a real implementation, you'd track the scheduler status
        return NextResponse.json({ status: 'running' })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Scheduler control error:', error)
    return NextResponse.json(
      { error: 'Failed to control scheduler' },
      { status: 500 }
    )
  }
}