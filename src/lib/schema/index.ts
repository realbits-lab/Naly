// Export all schema definitions
export * from './events'
export * from './users'
export * from './analytics'
export * from './community'
export * from './cron'
export * from './articles'

// Re-export all tables for easier access
import * as eventsSchema from './events'
import * as usersSchema from './users'
import * as analyticsSchema from './analytics'
import * as communitySchema from './community'
import * as cronSchema from './cron'
import * as articlesSchema from './articles'

export const schema = {
  ...eventsSchema,
  ...usersSchema,
  ...analyticsSchema,
  ...communitySchema,
  ...cronSchema,
  ...articlesSchema,
}