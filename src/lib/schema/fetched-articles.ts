import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

// Fetched Articles table - for storing full article content when users click on articles
export const fetchedArticles = pgTable(
	"fetched_articles",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// Article metadata
		url: varchar("url", { length: 2000 }).notNull().unique(),
		title: varchar("title", { length: 1000 }),
		description: text("description"),

		// Full article content
		content: text("content"), // Raw HTML content
		textContent: text("text_content"), // Cleaned text content
		wordCount: integer("word_count"),
		readingTimeMinutes: integer("reading_time_minutes"),

		// Author and publication info
		author: varchar("author", { length: 500 }),
		publisher: varchar("publisher", { length: 255 }),
		publishedAt: timestamp("published_at", { withTimezone: true }),

		// Media and images
		featuredImage: varchar("featured_image", { length: 1000 }),
		images: jsonb("images"), // Array of image URLs found in article

		// Metadata
		meta: jsonb("meta"), // Open graph, meta tags, etc.

		// Processing status
		status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending', 'processing', 'completed', 'failed'
		fetchStartedAt: timestamp("fetch_started_at", { withTimezone: true }),
		fetchCompletedAt: timestamp("fetch_completed_at", { withTimezone: true }),

		// Error handling
		errorMessage: text("error_message"),
		retryCount: integer("retry_count").default(0),

		// User tracking
		requestedBy: uuid("requested_by"), // User ID who requested the fetch
		sessionId: varchar("session_id", { length: 100 }), // Session ID for anonymous users

		// Content analysis (optional - can be populated by AI later)
		summary: text("summary"),
		keywords: jsonb("keywords"), // Array of extracted keywords
		entities: jsonb("entities"), // Named entities
		sentiment: varchar("sentiment", { length: 20 }), // 'positive', 'negative', 'neutral'
		topics: jsonb("topics"), // Array of topics/categories

		// Engagement tracking
		viewCount: integer("view_count").default(0),
		isBookmarked: boolean("is_bookmarked").default(false),

		// Cache control
		cacheUntil: timestamp("cache_until", { withTimezone: true }),
		isStale: boolean("is_stale").default(false),

		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		urlIdx: index("idx_fetched_articles_url").on(table.url),
		statusIdx: index("idx_fetched_articles_status").on(table.status),
		requestedByIdx: index("idx_fetched_articles_requested_by").on(table.requestedBy),
		sessionIdIdx: index("idx_fetched_articles_session_id").on(table.sessionId),
		fetchStartedAtIdx: index("idx_fetched_articles_fetch_started_at").on(table.fetchStartedAt),
		publishedAtIdx: index("idx_fetched_articles_published_at").on(table.publishedAt),
		createdAtIdx: index("idx_fetched_articles_created_at").on(table.createdAt),
		cacheUntilIdx: index("idx_fetched_articles_cache_until").on(table.cacheUntil),
		isStaleIdx: index("idx_fetched_articles_is_stale").on(table.isStale),
	}),
);

// Article fetch queue - for managing fetch requests
export const articleFetchQueue = pgTable(
	"article_fetch_queue",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		url: varchar("url", { length: 2000 }).notNull(),
		priority: integer("priority").default(1), // 1 = low, 5 = high
		requestedBy: uuid("requested_by"),
		sessionId: varchar("session_id", { length: 100 }),

		// Queue status
		status: varchar("status", { length: 20 }).notNull().default("queued"), // 'queued', 'processing', 'completed', 'failed'
		attempts: integer("attempts").default(0),
		maxAttempts: integer("max_attempts").default(3),

		// Timing
		scheduledFor: timestamp("scheduled_for", { withTimezone: true }).defaultNow(),
		startedAt: timestamp("started_at", { withTimezone: true }),
		completedAt: timestamp("completed_at", { withTimezone: true }),

		// Results
		fetchedArticleId: uuid("fetched_article_id").references(() => fetchedArticles.id),
		errorMessage: text("error_message"),

		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		urlIdx: index("idx_article_fetch_queue_url").on(table.url),
		statusIdx: index("idx_article_fetch_queue_status").on(table.status),
		priorityIdx: index("idx_article_fetch_queue_priority").on(table.priority),
		scheduledForIdx: index("idx_article_fetch_queue_scheduled_for").on(table.scheduledFor),
		requestedByIdx: index("idx_article_fetch_queue_requested_by").on(table.requestedBy),
		sessionIdIdx: index("idx_article_fetch_queue_session_id").on(table.sessionId),
	}),
);

// User article interactions
export const userArticleInteractions = pgTable(
	"user_article_interactions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		articleId: uuid("article_id")
			.references(() => fetchedArticles.id, { onDelete: "cascade" })
			.notNull(),
		userId: uuid("user_id"), // Optional - for authenticated users
		sessionId: varchar("session_id", { length: 100 }), // For anonymous users

		// Interaction types
		action: varchar("action", { length: 50 }).notNull(), // 'view', 'bookmark', 'share', 'like', 'download'

		// Additional data
		metadata: jsonb("metadata"), // Extra data depending on action type

		// Reading behavior
		readingProgress: integer("reading_progress"), // Percentage of article read (0-100)
		timeSpent: integer("time_spent"), // Time spent in seconds

		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		articleIdIdx: index("idx_user_article_interactions_article_id").on(table.articleId),
		userIdIdx: index("idx_user_article_interactions_user_id").on(table.userId),
		sessionIdIdx: index("idx_user_article_interactions_session_id").on(table.sessionId),
		actionIdx: index("idx_user_article_interactions_action").on(table.action),
		createdAtIdx: index("idx_user_article_interactions_created_at").on(table.createdAt),
	}),
);