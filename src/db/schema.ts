import { pgTable, serial, text, timestamp, jsonb, integer, uuid, boolean, primaryKey } from 'drizzle-orm/pg-core';

// Better-auth required tables
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: boolean('email_verified').default(false),
  image: text('image'),
  username: text('username').unique(),
  password: text('password'),
  isAnonymous: boolean('is_anonymous').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  expiresAt: timestamp('expires_at'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Legacy users table - keep for now during migration
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
});

// Content interaction tables
export const replies = pgTable('replies', {
  id: text('id').primaryKey(),
  contentId: text('content_id').notNull(), // References ContentCard.id
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  parentReplyId: text('parent_reply_id'), // For nested replies
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const likes = pgTable('likes', {
  contentId: text('content_id').notNull(), // References ContentCard.id
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  // Ensure a user can only like a content once - composite primary key
  pk: primaryKey({ columns: [table.userId, table.contentId] }),
}));
