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

// RSS Sources table
export const rssSources = pgTable(
	"rss_sources",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: varchar("name", { length: 255 }).notNull(), // e.g., "CNBC", "Reuters"
		description: text("description"),
		feedUrl: varchar("feed_url", { length: 1000 }).notNull(),
		websiteUrl: varchar("website_url", { length: 1000 }),
		category: varchar("category", { length: 100 }).notNull().default("general"), // e.g., "finance", "technology"
		isActive: boolean("is_active").notNull().default(true),
		logoUrl: varchar("logo_url", { length: 500 }),

		// Feed metadata
		language: varchar("language", { length: 5 }).notNull().default("en"),
		country: varchar("country", { length: 2 }),
		updateFrequency: integer("update_frequency").default(60), // minutes

		// Fetch status
		lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }),
		lastSuccessfulFetch: timestamp("last_successful_fetch", { withTimezone: true }),
		fetchErrorCount: integer("fetch_error_count").default(0),
		lastFetchError: text("last_fetch_error"),

		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		categoryIdx: index("idx_rss_sources_category").on(table.category),
		isActiveIdx: index("idx_rss_sources_is_active").on(table.isActive),
		lastFetchedAtIdx: index("idx_rss_sources_last_fetched_at").on(table.lastFetchedAt),
	}),
);

// RSS Articles table
export const rssArticles = pgTable(
	"rss_articles",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		sourceId: uuid("source_id")
			.references(() => rssSources.id, { onDelete: "cascade" })
			.notNull(),

		// Article content
		title: varchar("title", { length: 500 }).notNull(),
		description: text("description"),
		content: text("content"),
		fullContent: text("full_content"), // Full article content fetched from link
		link: varchar("link", { length: 1000 }).notNull(),
		guid: varchar("guid", { length: 500 }), // Unique identifier from RSS feed

		// Publication info
		author: varchar("author", { length: 255 }),
		publishedAt: timestamp("published_at", { withTimezone: true }),

		// Categories and tags
		categories: jsonb("categories"), // Array of strings from RSS feed
		tags: jsonb("tags"), // Extracted or processed tags

		// Media
		imageUrl: varchar("image_url", { length: 1000 }),
		mediaContent: jsonb("media_content"), // Array of media objects

		// Analysis (can be populated later by AI)
		sentiment: varchar("sentiment", { length: 20 }), // 'positive', 'negative', 'neutral'
		keywords: jsonb("keywords"), // Array of extracted keywords
		entities: jsonb("entities"), // Named entities
		marketImpact: text("market_impact"),

		// Processing status
		isProcessed: boolean("is_processed").notNull().default(false),
		processedAt: timestamp("processed_at", { withTimezone: true }),

		// Engagement tracking
		viewCount: integer("view_count").default(0),
		isArchived: boolean("is_archived").notNull().default(false),

		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		sourceIdIdx: index("idx_rss_articles_source_id").on(table.sourceId),
		publishedAtIdx: index("idx_rss_articles_published_at").on(table.publishedAt),
		createdAtIdx: index("idx_rss_articles_created_at").on(table.createdAt),
		guidIdx: index("idx_rss_articles_guid").on(table.guid),
		isProcessedIdx: index("idx_rss_articles_is_processed").on(table.isProcessed),
		sentimentIdx: index("idx_rss_articles_sentiment").on(table.sentiment),
		isArchivedIdx: index("idx_rss_articles_is_archived").on(table.isArchived),
	}),
);

// RSS Article Views table (for tracking engagement)
export const rssArticleViews = pgTable(
	"rss_article_views",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		articleId: uuid("article_id")
			.references(() => rssArticles.id, { onDelete: "cascade" })
			.notNull(),
		userId: uuid("user_id"), // Optional - for authenticated users
		viewedAt: timestamp("viewed_at", { withTimezone: true }).defaultNow(),
		readingTime: integer("reading_time"), // time spent reading in seconds
		sessionId: varchar("session_id", { length: 100 }),
		ipAddress: varchar("ip_address", { length: 45 }), // For anonymous tracking
	},
	(table) => ({
		articleIdIdx: index("idx_rss_article_views_article_id").on(table.articleId),
		userIdIdx: index("idx_rss_article_views_user_id").on(table.userId),
		viewedAtIdx: index("idx_rss_article_views_viewed_at").on(table.viewedAt),
		sessionIdIdx: index("idx_rss_article_views_session_id").on(table.sessionId),
	}),
);