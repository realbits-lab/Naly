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

// Generated Articles table
export const generatedArticles = pgTable(
	"generated_articles",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id").notNull(), // User who generated this article
		title: varchar("title", { length: 500 }).notNull(),
		content: text("content").notNull(),
		summary: text("summary"),
		keyPoints: jsonb("key_points"), // Array of strings
		marketAnalysis: text("market_analysis"),
		investmentImplications: text("investment_implications"),

		// Source news information
		sourceTitle: varchar("source_title", { length: 500 }),
		sourceContent: text("source_content"),
		sourceUrl: varchar("source_url", { length: 1000 }),
		sourcePublisher: varchar("source_publisher", { length: 255 }),
		sourceCategory: varchar("source_category", { length: 100 }),

		// Analysis metadata
		sentiment: varchar("sentiment", { length: 20 }), // 'positive', 'negative', 'neutral'
		keywords: jsonb("keywords"), // Array of strings
		entities: jsonb("entities"), // Array of strings
		marketImpact: text("market_impact"),

		// Article metadata
		wordCount: integer("word_count"),
		readingTime: integer("reading_time"), // in minutes
		aiModel: varchar("ai_model", { length: 100 }), // e.g., 'gpt-4', 'mock'
		generationMethod: varchar("generation_method", { length: 50 }), // 'ai', 'mock', 'hybrid'

		// Multi-language support
		sourceLanguage: varchar("source_language", { length: 5 }).notNull().default("en"), // 'en', 'ko'
		hasTranslations: text("has_translations").notNull().default("false"), // 'true', 'false'

		// Infographic content - temporarily disabled due to schema sync issue
		// infographicContent: text("infographic_content"), // Standalone HTML with embedded CSS/JS
		// hasInfographic: boolean("has_infographic").default(false),

		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		createdAtIdx: index("idx_generated_articles_created_at").on(
			table.createdAt,
		),
		categoryIdx: index("idx_generated_articles_category").on(
			table.sourceCategory,
		),
		sentimentIdx: index("idx_generated_articles_sentiment").on(table.sentiment),
		sourceLanguageIdx: index("idx_generated_articles_source_language").on(table.sourceLanguage),
		// hasInfographicIdx: index("idx_generated_articles_has_infographic").on(table.hasInfographic),
	}),
);

// Article Views table (for tracking engagement without user authentication)
export const articleViews = pgTable(
	"article_views",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		articleId: uuid("article_id")
			.references(() => generatedArticles.id, { onDelete: "cascade" })
			.notNull(),
		viewedAt: timestamp("viewed_at", { withTimezone: true }).defaultNow(),
		readingTime: integer("reading_time"), // time spent reading in seconds
		completionPercentage: integer("completion_percentage"), // 0-100
		sessionId: varchar("session_id", { length: 100 }),
	},
	(table) => ({
		articleIdIdx: index("idx_article_views_article_id").on(table.articleId),
		viewedAtIdx: index("idx_article_views_viewed_at").on(table.viewedAt),
		sessionIdIdx: index("idx_article_views_session_id").on(table.sessionId),
	}),
);
