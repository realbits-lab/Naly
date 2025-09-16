import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { cronJobs } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const updateCronJobSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  type: z.enum(['MARKET_ANALYSIS', 'PORTFOLIO_UPDATE', 'PREDICTION_REFRESH', 'DATA_SYNC', 'CUSTOM_TASK']).optional(),
  cronExpression: z.string().min(1).optional(),
  taskConfig: z.record(z.any()).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'STOPPED', 'ERROR', 'COMPLETED']).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [job] = await db.select().from(cronJobs)
      .where(and(
        eq(cronJobs.id, params.id),
        eq(cronJobs.userId, session.user.id)
      ))

    if (!job) {
      return NextResponse.json({ error: 'Cron job not found' }, { status: 404 })
    }

    return NextResponse.json({ job })
  } catch (error) {
    console.error('Failed to fetch cron job:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cron job' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateCronJobSchema.parse(body)

    // Check if job exists and belongs to user
    const [existingJob] = await db.select().from(cronJobs)
      .where(and(
        eq(cronJobs.id, params.id),
        eq(cronJobs.userId, session.user.id)
      ))

    if (!existingJob) {
      return NextResponse.json({ error: 'Cron job not found' }, { status: 404 })
    }

    // Update the job
    const updateData: any = { ...validatedData, updatedAt: new Date() }

    // Recalculate next run if cron expression changed
    if (validatedData.cronExpression) {
      updateData.nextRun = calculateNextRun(validatedData.cronExpression)
    }

    const [updatedJob] = await db.update(cronJobs)
      .set(updateData)
      .where(and(
        eq(cronJobs.id, params.id),
        eq(cronJobs.userId, session.user.id)
      ))
      .returning()

    return NextResponse.json({ job: updatedJob })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Failed to update cron job:', error)
    return NextResponse.json(
      { error: 'Failed to update cron job' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if job exists and belongs to user
    const [existingJob] = await db.select().from(cronJobs)
      .where(and(
        eq(cronJobs.id, params.id),
        eq(cronJobs.userId, session.user.id)
      ))

    if (!existingJob) {
      return NextResponse.json({ error: 'Cron job not found' }, { status: 404 })
    }

    // Delete the job
    await db.delete(cronJobs)
      .where(and(
        eq(cronJobs.id, params.id),
        eq(cronJobs.userId, session.user.id)
      ))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete cron job:', error)
    return NextResponse.json(
      { error: 'Failed to delete cron job' },
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