import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { cronJobs } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const actionSchema = z.object({
  action: z.enum(['resume', 'pause', 'stop'])
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = actionSchema.parse(body)

    // Check if job exists and belongs to user
    const [existingJob] = await db.select().from(cronJobs)
      .where(and(
        eq(cronJobs.id, params.id),
        eq(cronJobs.userId, session.user.id)
      ))

    if (!existingJob) {
      return NextResponse.json({ error: 'Cron job not found' }, { status: 404 })
    }

    // Apply the action
    let updateData: any = { updatedAt: new Date() }

    switch (action) {
      case 'resume':
        updateData.status = 'ACTIVE'
        updateData.isActive = true
        // Recalculate next run time
        updateData.nextRun = calculateNextRun(existingJob.cronExpression)
        break

      case 'pause':
        updateData.status = 'PAUSED'
        // Keep isActive true so it can be resumed
        break

      case 'stop':
        updateData.status = 'STOPPED'
        updateData.isActive = false
        updateData.nextRun = null
        break
    }

    const [updatedJob] = await db.update(cronJobs)
      .set(updateData)
      .where(and(
        eq(cronJobs.id, params.id),
        eq(cronJobs.userId, session.user.id)
      ))
      .returning()

    return NextResponse.json({
      job: updatedJob,
      message: `Job ${action}d successfully`
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid action', details: error.errors },
        { status: 400 }
      )
    }

    console.error(`Failed to ${action} cron job:`, error)
    return NextResponse.json(
      { error: `Failed to perform action: ${action}` },
      { status: 500 }
    )
  }
}

function calculateNextRun(cronExpression: string): Date {
  // Simple implementation - in production, use a proper cron parser like node-cron
  const now = new Date()

  try {
    const parts = cronExpression.split(' ')
    if (parts.length !== 5) {
      throw new Error('Invalid cron expression')
    }

    const [minute, hour, day, month, dayOfWeek] = parts

    // Handle hourly jobs (most common case)
    if (minute === '0' && hour === '*') {
      const nextRun = new Date(now)
      nextRun.setMinutes(0, 0, 0)
      if (nextRun <= now) {
        nextRun.setHours(nextRun.getHours() + 1)
      }
      return nextRun
    }

    // Handle daily jobs at specific hour
    if (minute === '0' && !hour.includes('*') && !hour.includes('/')) {
      const targetHour = parseInt(hour, 10)
      const nextRun = new Date(now)
      nextRun.setHours(targetHour, 0, 0, 0)
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1)
      }
      return nextRun
    }

    // Default: run in 1 hour
    const nextRun = new Date(now.getTime() + 60 * 60 * 1000)
    return nextRun
  } catch (error) {
    console.error('Failed to parse cron expression:', error)
    // Fallback: run in 1 hour
    return new Date(now.getTime() + 60 * 60 * 1000)
  }
}