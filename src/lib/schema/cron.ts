import { pgTable, uuid, varchar, timestamp, jsonb, text, boolean, pgEnum, index } from 'drizzle-orm/pg-core'
import { users } from './users'

// Enums for cron job types and statuses
export const cronJobStatusEnum = pgEnum('cron_job_status_enum', [
  'ACTIVE',
  'PAUSED',
  'STOPPED',
  'ERROR',
  'COMPLETED'
])

export const cronJobTypeEnum = pgEnum('cron_job_type_enum', [
  'MARKET_ANALYSIS',
  'PORTFOLIO_UPDATE',
  'PREDICTION_REFRESH',
  'DATA_SYNC',
  'CUSTOM_TASK'
])

// Cron Jobs table
export const cronJobs = pgTable('cron_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: cronJobTypeEnum('type').notNull(),
  cronExpression: varchar('cron_expression', { length: 100 }).notNull(), // e.g., "0 * * * *" for hourly
  taskConfig: jsonb('task_config'), // Configuration for the specific task
  status: cronJobStatusEnum('status').default('ACTIVE'),
  isActive: boolean('is_active').default(true),
  lastRun: timestamp('last_run', { withTimezone: true }),
  nextRun: timestamp('next_run', { withTimezone: true }),
  runCount: varchar('run_count', { length: 10 }).default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_cron_jobs_user_id').on(table.userId),
  statusIdx: index('idx_cron_jobs_status').on(table.status),
  nextRunIdx: index('idx_cron_jobs_next_run').on(table.nextRun),
  activeIdx: index('idx_cron_jobs_active').on(table.isActive),
}))

// Cron Job Execution Logs table
export const cronJobLogs = pgTable('cron_job_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').references(() => cronJobs.id, { onDelete: 'cascade' }).notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }),
  status: varchar('status', { length: 20 }).notNull(), // 'SUCCESS', 'FAILURE', 'RUNNING'
  output: text('output'), // Job output/result
  errorMessage: text('error_message'), // Error details if failed
  metadata: jsonb('metadata'), // Additional execution metadata
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  jobIdIdx: index('idx_cron_job_logs_job_id').on(table.jobId),
  startTimeIdx: index('idx_cron_job_logs_start_time').on(table.startTime),
  statusIdx: index('idx_cron_job_logs_status').on(table.status),
}))