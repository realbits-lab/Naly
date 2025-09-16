import { pgTable, uuid, varchar, timestamp, jsonb, decimal, boolean, integer, pgEnum, index } from 'drizzle-orm/pg-core'
import { users } from './users'

// Enums
export const communityContentTypeEnum = pgEnum('community_content_type_enum', [
  'COMMENT',
  'ANALYSIS',
  'PREDICTION',
  'QUESTION',
  'EDUCATIONAL_CONTENT',
  'MARKET_INSIGHT'
])

export const achievementCategoryEnum = pgEnum('achievement_category_enum', [
  'PREDICTION_ACCURACY',
  'LEARNING_PROGRESS',
  'COMMUNITY_CONTRIBUTION',
  'BIAS_MITIGATION',
  'PORTFOLIO_PERFORMANCE',
  'CONTENT_ENGAGEMENT'
])

export const rarityLevelEnum = pgEnum('rarity_level_enum', [
  'COMMON',
  'UNCOMMON',
  'RARE',
  'EPIC',
  'LEGENDARY'
])

export const difficultyLevelEnum = pgEnum('difficulty_level_enum', [
  'EASY',
  'MEDIUM',
  'HARD',
  'EXPERT'
])

// Community Content table
export const communityContent = pgTable('community_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  contentType: communityContentTypeEnum('content_type').notNull(),
  title: varchar('title', { length: 255 }),
  content: varchar('content').notNull(),
  relatedEventId: uuid('related_event_id'),
  relatedTicker: varchar('related_ticker', { length: 10 }),
  metadata: jsonb('metadata'),
  upvotes: integer('upvotes').default(0),
  downvotes: integer('downvotes').default(0),
  isModerated: boolean('is_moderated').default(false),
  moderationFlags: jsonb('moderation_flags'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_community_content_user_id').on(table.userId),
  contentTypeIdx: index('idx_community_content_type').on(table.contentType, table.createdAt),
  tickerIdx: index('idx_community_content_ticker').on(table.relatedTicker),
}))

// Community Discussions table
export const communityDiscussions = pgTable('community_discussions', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id'), // For threaded discussions
  authorId: uuid('author_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }),
  content: varchar('content').notNull(),
  relatedEventId: uuid('related_event_id'),
  relatedTicker: varchar('related_ticker', { length: 10 }),
  upvotes: integer('upvotes').default(0),
  downvotes: integer('downvotes').default(0),
  replyCount: integer('reply_count').default(0),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).defaultNow(),
  isSticky: boolean('is_sticky').default(false),
  isLocked: boolean('is_locked').default(false),
  tags: jsonb('tags').$type<string[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  authorIdIdx: index('idx_discussions_author_id').on(table.authorId),
  parentIdIdx: index('idx_discussions_parent_id').on(table.parentId),
  tickerIdx: index('idx_discussions_ticker').on(table.relatedTicker),
  activityIdx: index('idx_discussions_activity').on(table.lastActivityAt),
}))

// User Achievements table
export const userAchievements = pgTable('user_achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  achievementId: uuid('achievement_id').notNull(),
  achievementName: varchar('achievement_name', { length: 100 }).notNull(),
  description: varchar('description', { length: 255 }),
  category: achievementCategoryEnum('category').notNull(),
  rarity: rarityLevelEnum('rarity').notNull(),
  points: integer('points').default(0),
  unlockedAt: timestamp('unlocked_at', { withTimezone: true }).defaultNow(),
  metadata: jsonb('metadata'),
}, (table) => ({
  userIdIdx: index('idx_user_achievements_user_id').on(table.userId),
  categoryIdx: index('idx_user_achievements_category').on(table.category),
  rarityIdx: index('idx_user_achievements_rarity').on(table.rarity),
}))

// Challenges table
export const challenges = pgTable('challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: varchar('description').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  difficulty: difficultyLevelEnum('difficulty').notNull(),
  objectives: jsonb('objectives').notNull(),
  rewards: jsonb('rewards').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  participantCount: integer('participant_count').default(0),
  completionCount: integer('completion_count').default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  categoryIdx: index('idx_challenges_category').on(table.category),
  difficultyIdx: index('idx_challenges_difficulty').on(table.difficulty),
  activeIdx: index('idx_challenges_active').on(table.isActive, table.startDate),
}))

// User Challenge Progress table
export const userChallengeProgress = pgTable('user_challenge_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  challengeId: uuid('challenge_id').references(() => challenges.id).notNull(),
  progress: decimal('progress', { precision: 3, scale: 2 }).default('0'), // 0.00 to 1.00
  currentObjectives: jsonb('current_objectives').notNull(),
  completedObjectives: jsonb('completed_objectives'),
  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
  lastProgressAt: timestamp('last_progress_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_challenge_progress_user_id').on(table.userId),
  challengeIdIdx: index('idx_user_challenge_progress_challenge_id').on(table.challengeId),
  completedIdx: index('idx_user_challenge_progress_completed').on(table.isCompleted),
}))

// Leaderboards table
export const leaderboards = pgTable('leaderboards', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  leaderboardType: varchar('leaderboard_type', { length: 50 }).notNull(),
  period: varchar('period', { length: 20 }).notNull(), // 'daily', 'weekly', 'monthly', 'all_time'
  score: decimal('score', { precision: 10, scale: 4 }).notNull(),
  rank: integer('rank').notNull(),
  metadata: jsonb('metadata'),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  typeRankIdx: index('idx_leaderboards_type_rank').on(table.leaderboardType, table.period, table.rank),
  userIdIdx: index('idx_leaderboards_user_id').on(table.userId),
  scoreIdx: index('idx_leaderboards_score').on(table.score),
}))