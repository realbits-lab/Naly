import { pgTable, serial, text, timestamp, jsonb, integer, uuid, numeric } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const agentConfigs = pgTable('agent_configs', {
  id: serial('id').primaryKey(),
  type: text('type').notNull().unique(), // 'REPORTER' | 'MARKETER'
  schedule: text('schedule').notNull(), // Cron expression or simple string
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'PAUSED'
  params: jsonb('params').notNull().default({}),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const agentRuns = pgTable('agent_runs', {
  id: serial('id').primaryKey(),
  agentType: text('agent_type').notNull(),
  status: text('status').notNull(), // 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  startTime: timestamp('start_time').defaultNow(),
  endTime: timestamp('end_time'),
  output: jsonb('output'),
  logs: jsonb('logs'), // Array of log entries
  editorReview: jsonb('editor_review'),
  designerOutput: jsonb('designer_output'),
  marketerOutput: jsonb('marketer_output'),
  // Token usage tracking
  reporterTokens: integer('reporter_tokens').default(0),
  editorTokens: integer('editor_tokens').default(0),
  designerTokens: integer('designer_tokens').default(0),
  marketerTokens: integer('marketer_tokens').default(0),
  totalTokens: integer('total_tokens').default(0),
  // Cost and ROI tracking
  estimatedCost: numeric('estimated_cost', { precision: 10, scale: 6 }).default('0'),
  adRevenue: numeric('ad_revenue', { precision: 10, scale: 2 }).default('0'),
  roi: numeric('roi', { precision: 10, scale: 2 }).default('0'),
});
