import { db } from './db'
import { cronJobs, cronJobLogs } from './schema'
import { eq, and, lte, isNotNull } from 'drizzle-orm'

export class CronScheduler {
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false

  start() {
    if (this.isRunning) {
      console.log('Cron scheduler is already running')
      return
    }

    this.isRunning = true
    console.log('Starting cron scheduler...')

    // Check for jobs to run every minute
    this.intervalId = setInterval(() => {
      this.checkAndRunJobs()
    }, 60 * 1000) // Check every minute

    // Run immediately on start
    this.checkAndRunJobs()
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('Cron scheduler stopped')
  }

  private async checkAndRunJobs() {
    try {
      const now = new Date()

      // Find jobs that are due to run
      const dueJobs = await db
        .select()
        .from(cronJobs)
        .where(
          and(
            eq(cronJobs.status, 'ACTIVE'),
            eq(cronJobs.isActive, true),
            isNotNull(cronJobs.nextRun),
            lte(cronJobs.nextRun, now)
          )
        )

      for (const job of dueJobs) {
        console.log(`Running cron job: ${job.name} (${job.id})`)
        await this.executeJob(job)
      }
    } catch (error) {
      console.error('Error checking cron jobs:', error)
    }
  }

  private async executeJob(job: any) {
    const startTime = new Date()
    let status = 'SUCCESS'
    let output = ''
    let errorMessage = null

    try {
      // Execute the job based on its type
      switch (job.type) {
        case 'MARKET_ANALYSIS':
          output = await this.executeMarketAnalysis(job)
          break

        case 'PORTFOLIO_UPDATE':
          output = await this.executePortfolioUpdate(job)
          break

        case 'PREDICTION_REFRESH':
          output = await this.executePredictionRefresh(job)
          break

        case 'DATA_SYNC':
          output = await this.executeDataSync(job)
          break

        case 'CUSTOM_TASK':
          output = await this.executeCustomTask(job)
          break

        default:
          throw new Error(`Unknown job type: ${job.type}`)
      }

      // Update job with new run count and next run time
      const newRunCount = (parseInt(job.runCount) + 1).toString()
      const nextRun = this.calculateNextRun(job.cronExpression)

      await db
        .update(cronJobs)
        .set({
          runCount: newRunCount,
          lastRun: startTime,
          nextRun,
          updatedAt: new Date()
        })
        .where(eq(cronJobs.id, job.id))

    } catch (error) {
      status = 'FAILURE'
      errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Job ${job.id} failed:`, error)

      // Update job status to ERROR
      await db
        .update(cronJobs)
        .set({
          status: 'ERROR',
          lastRun: startTime,
          updatedAt: new Date()
        })
        .where(eq(cronJobs.id, job.id))
    }

    // Log the execution
    await db.insert(cronJobLogs).values({
      jobId: job.id,
      startTime,
      endTime: new Date(),
      status,
      output,
      errorMessage,
      metadata: { jobType: job.type }
    })
  }

  private async executeMarketAnalysis(job: any): Promise<string> {
    // Simulate market analysis
    console.log(`Executing market analysis for job ${job.id}`)

    // In a real implementation, this would:
    // - Fetch market data from APIs
    // - Run analysis algorithms
    // - Store results in the database
    // - Send notifications if needed

    await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate work

    return `Market analysis completed. Processed ${Math.floor(Math.random() * 1000)} data points.`
  }

  private async executePortfolioUpdate(job: any): Promise<string> {
    // Simulate portfolio update
    console.log(`Executing portfolio update for job ${job.id}`)

    // In a real implementation, this would:
    // - Sync with broker APIs
    // - Update portfolio values
    // - Calculate performance metrics
    // - Update user portfolios in database

    await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate work

    return `Portfolio update completed. Updated ${Math.floor(Math.random() * 50)} portfolios.`
  }

  private async executePredictionRefresh(job: any): Promise<string> {
    // Simulate prediction refresh
    console.log(`Executing prediction refresh for job ${job.id}`)

    // In a real implementation, this would:
    // - Run ML models
    // - Generate new predictions
    // - Update prediction tables
    // - Cache results

    await new Promise(resolve => setTimeout(resolve, 3000)) // Simulate work

    return `Prediction refresh completed. Generated ${Math.floor(Math.random() * 200)} new predictions.`
  }

  private async executeDataSync(job: any): Promise<string> {
    // Simulate data synchronization
    console.log(`Executing data sync for job ${job.id}`)

    // In a real implementation, this would:
    // - Sync with external data sources
    // - Update market data
    // - Refresh reference data
    // - Clean up old data

    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate work

    return `Data sync completed. Synchronized ${Math.floor(Math.random() * 500)} records.`
  }

  private async executeCustomTask(job: any): Promise<string> {
    // Execute custom task based on job configuration
    console.log(`Executing custom task for job ${job.id}`)

    const config = job.taskConfig || {}

    // In a real implementation, this would execute custom logic
    // based on the task configuration

    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate work

    return `Custom task completed with config: ${JSON.stringify(config)}`
  }

  private calculateNextRun(cronExpression: string): Date {
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
        nextRun.setHours(nextRun.getHours() + 1)
        return nextRun
      }

      // Handle jobs that run every N hours
      if (minute === '0' && hour.includes('/')) {
        const [, stepStr] = hour.split('/')
        const step = parseInt(stepStr, 10)
        const nextRun = new Date(now)
        nextRun.setMinutes(0, 0, 0)

        const currentHour = nextRun.getHours()
        const nextHour = Math.ceil((currentHour + 1) / step) * step

        if (nextHour >= 24) {
          nextRun.setDate(nextRun.getDate() + 1)
          nextRun.setHours(0)
        } else {
          nextRun.setHours(nextHour)
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

      // Handle weekly jobs
      if (minute === '0' && dayOfWeek !== '*') {
        const targetDayOfWeek = parseInt(dayOfWeek, 10)
        const targetHour = parseInt(hour, 10) || 0
        const nextRun = new Date(now)

        nextRun.setHours(targetHour, 0, 0, 0)

        const currentDay = nextRun.getDay()
        const daysUntilTarget = (targetDayOfWeek - currentDay + 7) % 7

        if (daysUntilTarget === 0 && nextRun <= now) {
          // If it's the same day but time has passed, schedule for next week
          nextRun.setDate(nextRun.getDate() + 7)
        } else if (daysUntilTarget > 0) {
          nextRun.setDate(nextRun.getDate() + daysUntilTarget)
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
}

// Global scheduler instance
export const globalCronScheduler = new CronScheduler()