import { pgTable, uuid, varchar, timestamp, jsonb, decimal, date, pgEnum, index } from 'drizzle-orm/pg-core'

// Enums
export const subscriptionTierEnum = pgEnum('subscription_tier_enum', [
  'free',
  'premium',
  'enterprise'
])

export const userActionEnum = pgEnum('user_action_enum', [
  'VIEW_PAGE',
  'CLICK_LINK',
  'SEARCH',
  'FILTER_DATA',
  'EXPORT_DATA',
  'SHARE_CONTENT',
  'SAVE_TO_WATCHLIST',
  'UPDATE_PORTFOLIO',
  'MAKE_PREDICTION',
  'COMMENT',
  'LIKE',
  'BOOKMARK'
])

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  demographics: jsonb('demographics'),
  preferences: jsonb('preferences'),
  subscriptionTier: subscriptionTierEnum('subscription_tier').default('free'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  subscriptionIdx: index('idx_users_subscription').on(table.subscriptionTier),
}))

// User Portfolios table
export const userPortfolios = pgTable('user_portfolios', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  ticker: varchar('ticker', { length: 10 }).notNull(),
  quantity: decimal('quantity', { precision: 15, scale: 4 }).notNull(),
  averageCost: decimal('average_cost', { precision: 10, scale: 4 }),
  acquiredDate: date('acquired_date'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_portfolios_user_id').on(table.userId),
  tickerIdx: index('idx_user_portfolios_ticker').on(table.ticker),
}))

// User Behavior table
export const userBehavior = pgTable('user_behavior', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  sessionId: uuid('session_id'),
  actionType: userActionEnum('action_type').notNull(),
  resourceId: uuid('resource_id'),
  resourceType: varchar('resource_type', { length: 50 }),
  metadata: jsonb('metadata'),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdTimestampIdx: index('idx_user_behavior_user_id').on(table.userId, table.timestamp),
  actionIdx: index('idx_user_behavior_action').on(table.actionType, table.timestamp),
}))

// User Watchlist table
export const userWatchlists = pgTable('user_watchlists', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  ticker: varchar('ticker', { length: 10 }).notNull(),
  notes: varchar('notes'),
  alertSettings: jsonb('alert_settings'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_watchlists_user_id').on(table.userId),
  tickerIdx: index('idx_user_watchlists_ticker').on(table.ticker),
}))

// User Predictions table
export const userPredictions = pgTable('user_predictions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  eventId: uuid('event_id'),
  ticker: varchar('ticker', { length: 10 }).notNull(),
  predictionType: varchar('prediction_type', { length: 50 }).notNull(),
  predictedValue: jsonb('predicted_value').notNull(),
  confidence: decimal('confidence', { precision: 3, scale: 2 }),
  timeHorizon: varchar('time_horizon', { length: 20 }),
  rationale: varchar('rationale'),
  actualOutcome: jsonb('actual_outcome'),
  accuracy: decimal('accuracy', { precision: 3, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  evaluatedAt: timestamp('evaluated_at', { withTimezone: true }),
}, (table) => ({
  userIdIdx: index('idx_user_predictions_user_id').on(table.userId),
  tickerIdx: index('idx_user_predictions_ticker').on(table.ticker),
  createdAtIdx: index('idx_user_predictions_created_at').on(table.createdAt),
}))