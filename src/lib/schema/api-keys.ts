import { pgTable, uuid, varchar, jsonb, integer, timestamp, text, unique, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  keyHash: varchar('key_hash', { length: 64 }).notNull().unique(),
  lastFourChars: varchar('last_four_chars', { length: 4 }).notNull(),
  scopes: jsonb('scopes').$type<string[]>().notNull().default([]),
  rateLimit: integer('rate_limit').default(100), // requests per minute
  ipRestrictions: jsonb('ip_restrictions').$type<string[]>().default([]), // optional IP whitelist
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  expiresAt: timestamp('expires_at'),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
}, (table) => ({
  userIdIdx: index('api_keys_user_id_idx').on(table.userId),
  keyHashIdx: index('api_keys_key_hash_idx').on(table.keyHash),
  expiresAtIdx: index('api_keys_expires_at_idx').on(table.expiresAt),
  revokedAtIdx: index('api_keys_revoked_at_idx').on(table.revokedAt),
}));

export const apiKeyLogs = pgTable('api_key_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  apiKeyId: uuid('api_key_id').references(() => apiKeys.id, { onDelete: 'cascade' }).notNull(),
  endpoint: varchar('endpoint', { length: 500 }).notNull(),
  method: varchar('method', { length: 10 }).notNull(),
  statusCode: integer('status_code'),
  responseTime: integer('response_time'), // in milliseconds
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  requestBody: jsonb('request_body').$type<any>(),
  errorMessage: text('error_message'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  apiKeyIdIdx: index('api_key_logs_api_key_id_idx').on(table.apiKeyId),
  timestampIdx: index('api_key_logs_timestamp_idx').on(table.timestamp),
  statusCodeIdx: index('api_key_logs_status_code_idx').on(table.statusCode),
}));

export const apiKeyUsageStats = pgTable('api_key_usage_stats', {
  id: uuid('id').defaultRandom().primaryKey(),
  apiKeyId: uuid('api_key_id').references(() => apiKeys.id, { onDelete: 'cascade' }).notNull(),
  date: timestamp('date').notNull(),
  endpoint: varchar('endpoint', { length: 500 }).notNull(),
  requestCount: integer('request_count').default(0).notNull(),
  errorCount: integer('error_count').default(0).notNull(),
  avgResponseTime: integer('avg_response_time'), // in milliseconds
  uniqueIps: integer('unique_ips').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  apiKeyDateIdx: unique('api_key_date_endpoint_idx').on(table.apiKeyId, table.date, table.endpoint),
  dateIdx: index('api_key_usage_stats_date_idx').on(table.date),
}));

// Relations
export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  logs: many(apiKeyLogs),
  usageStats: many(apiKeyUsageStats),
}));

export const apiKeyLogsRelations = relations(apiKeyLogs, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [apiKeyLogs.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const apiKeyUsageStatsRelations = relations(apiKeyUsageStats, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [apiKeyUsageStats.apiKeyId],
    references: [apiKeys.id],
  }),
}));

// Type exports
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type ApiKeyLog = typeof apiKeyLogs.$inferSelect;
export type NewApiKeyLog = typeof apiKeyLogs.$inferInsert;
export type ApiKeyUsageStats = typeof apiKeyUsageStats.$inferSelect;
export type NewApiKeyUsageStats = typeof apiKeyUsageStats.$inferInsert;