// Export all schema definitions
export * from './events'
export * from './analytics'
export * from './cron'
export * from './articles'

// Re-export all tables for easier access
import * as eventsSchema from './events'
import * as analyticsSchema from './analytics'
import * as cronSchema from './cron'
import * as articlesSchema from './articles'

export const schema = {
  ...eventsSchema,
  ...analyticsSchema,
  ...cronSchema,
  ...articlesSchema,
}