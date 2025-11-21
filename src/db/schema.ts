import { pgTable, serial, text, timestamp, jsonb, integer, uuid, index } from 'drizzle-orm/pg-core';

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
}, (table) => ({
  // Index for filtering by status (ACTIVE/PAUSED)
  statusIdx: index('agent_configs_status_idx').on(table.status),
}));

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
}, (table) => ({
  // Index for filtering by agent type
  agentTypeIdx: index('agent_runs_agent_type_idx').on(table.agentType),
  // Index for filtering by status
  statusIdx: index('agent_runs_status_idx').on(table.status),
  // Index for sorting by start time (most recent first)
  startTimeIdx: index('agent_runs_start_time_idx').on(table.startTime),
  // Composite index for common queries (type + status + time)
  typeStatusTimeIdx: index('agent_runs_type_status_time_idx').on(
    table.agentType,
    table.status,
    table.startTime
  ),
}));
