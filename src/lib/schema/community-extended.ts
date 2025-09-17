import { pgTable, uuid, varchar, timestamp, jsonb, text, integer, boolean, pgEnum, index, serial } from 'drizzle-orm/pg-core'
import { users } from './users'

// User level enum - extending existing user system
export const userLevelEnum = pgEnum('user_level_enum', [
  'USER',
  'MANAGER'
])

// Community sections (left sidebar categories)
export const communitySections = pgTable('community_sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  icon: varchar('icon', { length: 50 }), // Lucide icon name
  color: varchar('color', { length: 20 }), // Color theme
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(true), // Public sections visible to non-login users
  createdById: uuid('created_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  slugIdx: index('idx_community_sections_slug').on(table.slug),
  activeIdx: index('idx_community_sections_active').on(table.isActive),
  orderIdx: index('idx_community_sections_order').on(table.displayOrder),
}))

// Community articles
export const communityArticles = pgTable('community_articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  sectionId: uuid('section_id').references(() => communitySections.id).notNull(),
  authorId: uuid('author_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt'), // Short summary
  slug: varchar('slug', { length: 200 }).notNull(),

  // Article metadata
  viewCount: integer('view_count').default(0),
  replyCount: integer('reply_count').default(0),
  likeCount: integer('like_count').default(0),

  // Publishing info
  isPublished: boolean('is_published').default(false),
  isPinned: boolean('is_pinned').default(false),
  isFeatured: boolean('is_featured').default(false),
  publishedAt: timestamp('published_at', { withTimezone: true }),

  // SEO and tags
  tags: jsonb('tags'), // Array of tag strings
  metaDescription: text('meta_description'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  sectionIdIdx: index('idx_community_articles_section_id').on(table.sectionId),
  authorIdIdx: index('idx_community_articles_author_id').on(table.authorId),
  slugIdx: index('idx_community_articles_slug').on(table.slug),
  publishedIdx: index('idx_community_articles_published').on(table.isPublished, table.publishedAt),
  pinnedIdx: index('idx_community_articles_pinned').on(table.isPinned),
  featuredIdx: index('idx_community_articles_featured').on(table.isFeatured),
}))

// Article replies/comments
export const articleReplies = pgTable('article_replies', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id').references(() => communityArticles.id, { onDelete: 'cascade' }).notNull(),
  authorId: uuid('author_id').references(() => users.id).notNull(),
  parentId: uuid('parent_id').references(() => articleReplies.id), // For threaded replies
  content: text('content').notNull(),

  // Reply metadata
  likeCount: integer('like_count').default(0),
  isEdited: boolean('is_edited').default(false),
  editedAt: timestamp('edited_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  articleIdIdx: index('idx_article_replies_article_id').on(table.articleId),
  authorIdIdx: index('idx_article_replies_author_id').on(table.authorId),
  parentIdIdx: index('idx_article_replies_parent_id').on(table.parentId),
  createdAtIdx: index('idx_article_replies_created_at').on(table.createdAt),
}))

// Article likes
export const articleLikes = pgTable('article_likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id').references(() => communityArticles.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  articleUserIdx: index('idx_article_likes_article_user').on(table.articleId, table.userId),
  userIdIdx: index('idx_article_likes_user_id').on(table.userId),
}))

// Reply likes
export const replyLikes = pgTable('reply_likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  replyId: uuid('reply_id').references(() => articleReplies.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  replyUserIdx: index('idx_reply_likes_reply_user').on(table.replyId, table.userId),
  userIdIdx: index('idx_reply_likes_user_id').on(table.userId),
}))

// Article views tracking
export const communityArticleViews = pgTable('community_article_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id').references(() => communityArticles.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id), // Can be null for anonymous users
  sessionId: varchar('session_id', { length: 100 }),
  ipAddress: varchar('ip_address', { length: 45 }), // For anonymous tracking
  userAgent: text('user_agent'),
  viewedAt: timestamp('viewed_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  articleIdIdx: index('idx_community_article_views_article_id').on(table.articleId),
  sessionIdx: index('idx_community_article_views_session').on(table.sessionId),
  viewedAtIdx: index('idx_community_article_views_viewed_at').on(table.viewedAt),
}))

// User community permissions (for managers)
export const userCommunityPermissions = pgTable('user_community_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  level: userLevelEnum('level').default('USER'),
  permissions: jsonb('permissions'), // Array of permission strings
  grantedById: uuid('granted_by_id').references(() => users.id),
  grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow(),
  isActive: boolean('is_active').default(true),
}, (table) => ({
  userIdIdx: index('idx_user_community_permissions_user_id').on(table.userId),
  levelIdx: index('idx_user_community_permissions_level').on(table.level),
  activeIdx: index('idx_user_community_permissions_active').on(table.isActive),
}))