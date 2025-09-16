import { pgTable, uuid, varchar, timestamp, jsonb, text, integer, index } from 'drizzle-orm/pg-core'
import { users } from './users'

// Generated Articles table
export const generatedArticles = pgTable('generated_articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  summary: text('summary'),
  keyPoints: jsonb('key_points'), // Array of strings
  marketAnalysis: text('market_analysis'),
  investmentImplications: text('investment_implications'),

  // Source news information
  sourceTitle: varchar('source_title', { length: 500 }),
  sourceContent: text('source_content'),
  sourceUrl: varchar('source_url', { length: 1000 }),
  sourcePublisher: varchar('source_publisher', { length: 255 }),
  sourceCategory: varchar('source_category', { length: 100 }),

  // Analysis metadata
  sentiment: varchar('sentiment', { length: 20 }), // 'positive', 'negative', 'neutral'
  keywords: jsonb('keywords'), // Array of strings
  entities: jsonb('entities'), // Array of strings
  marketImpact: text('market_impact'),

  // Article metadata
  wordCount: integer('word_count'),
  readingTime: integer('reading_time'), // in minutes
  aiModel: varchar('ai_model', { length: 100 }), // e.g., 'gpt-4', 'mock'
  generationMethod: varchar('generation_method', { length: 50 }), // 'ai', 'mock', 'hybrid'

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_generated_articles_user_id').on(table.userId),
  createdAtIdx: index('idx_generated_articles_created_at').on(table.createdAt),
  categoryIdx: index('idx_generated_articles_category').on(table.sourceCategory),
  sentimentIdx: index('idx_generated_articles_sentiment').on(table.sentiment),
}))

// Article Feedback table (for user ratings and comments)
export const articleFeedback = pgTable('article_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id').references(() => generatedArticles.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  rating: integer('rating'), // 1-5 scale
  feedback: text('feedback'),
  isHelpful: varchar('is_helpful', { length: 10 }), // 'yes', 'no', 'neutral'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  articleIdIdx: index('idx_article_feedback_article_id').on(table.articleId),
  userIdIdx: index('idx_article_feedback_user_id').on(table.userId),
}))

// Article Views table (for tracking engagement)
export const articleViews = pgTable('article_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id').references(() => generatedArticles.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id),
  viewedAt: timestamp('viewed_at', { withTimezone: true }).defaultNow(),
  readingTime: integer('reading_time'), // time spent reading in seconds
  completionPercentage: integer('completion_percentage'), // 0-100
  sessionId: varchar('session_id', { length: 100 }),
}, (table) => ({
  articleIdIdx: index('idx_article_views_article_id').on(table.articleId),
  userIdIdx: index('idx_article_views_user_id').on(table.userId),
  viewedAtIdx: index('idx_article_views_viewed_at').on(table.viewedAt),
}))