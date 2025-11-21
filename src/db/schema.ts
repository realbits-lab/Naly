import { pgTable, serial, text, timestamp, jsonb, integer, uuid } from 'drizzle-orm/pg-core';

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
  predictionCheckTime: timestamp('prediction_check_time'), // When to verify predictions
  predictionResults: jsonb('prediction_results'), // Actual metrics and accuracy
});
