import {
	decimal,
	index,
	jsonb,
	pgEnum,
	pgTable,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

// Enums
export const eventTypeEnum = pgEnum("event_type_enum", [
	"PRICE_JUMP",
	"EARNINGS_RELEASE",
	"NEWS_BREAK",
	"FILING_SUBMISSION",
	"INSIDER_TRADE",
	"INSTITUTIONAL_CHANGE",
]);

export const significanceLevelEnum = pgEnum("significance_level_enum", [
	"LOW",
	"MEDIUM",
	"HIGH",
	"CRITICAL",
]);

export const dataSourceEnum = pgEnum("data_source_enum", [
	"FINANCIAL_DATASETS_API",
	"SEC_FILINGS",
	"NEWS_FEED",
	"INSIDER_TRADES",
	"INSTITUTIONAL_OWNERSHIP",
	"EARNINGS_RELEASES",
]);

export const dataTypeEnum = pgEnum("data_type_enum", [
	"STOCK_PRICE",
	"VOLUME",
	"FINANCIAL_METRIC",
	"SENTIMENT_SCORE",
	"NEWS_ITEM",
	"FILING_DATA",
	"TRADE_DATA",
]);

export const analysisTypeEnum = pgEnum("analysis_type_enum", [
	"CAUSAL_ANALYSIS",
	"PREDICTIVE_ANALYSIS",
	"SENTIMENT_ANALYSIS",
	"TECHNICAL_ANALYSIS",
]);


// Events table
export const events = pgTable(
	"events",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventType: eventTypeEnum("event_type").notNull(),
		ticker: varchar("ticker", { length: 10 }).notNull(),
		timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
		magnitude: decimal("magnitude", { precision: 10, scale: 4 }),
		significance: significanceLevelEnum("significance"),
		sourceDataIds: jsonb("source_data_ids").$type<string[]>(),
		relatedEventIds: jsonb("related_event_ids").$type<string[]>(),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		tickerTimestampIdx: index("idx_events_ticker_timestamp").on(
			table.ticker,
			table.timestamp,
		),
		significanceIdx: index("idx_events_significance").on(
			table.significance,
			table.timestamp,
		),
		typeIdx: index("idx_events_type").on(table.eventType, table.timestamp),
	}),
);

// Market Data Points table
export const marketDataPoints = pgTable(
	"market_data_points",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		source: dataSourceEnum("source").notNull(),
		ticker: varchar("ticker", { length: 10 }).notNull(),
		timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
		dataType: dataTypeEnum("data_type").notNull(),
		value: jsonb("value").notNull(),
		confidence: decimal("confidence", { precision: 3, scale: 2 }),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		tickerTimestampIdx: index("idx_market_data_ticker_timestamp").on(
			table.ticker,
			table.timestamp,
		),
		sourceTypeIdx: index("idx_market_data_source_type").on(
			table.source,
			table.dataType,
		),
		timestampIdx: index("idx_market_data_timestamp").on(table.timestamp),
	}),
);

// Analysis Results table
export const analysisResults = pgTable(
	"analysis_results",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		eventId: uuid("event_id").references(() => events.id),
		analysisType: analysisTypeEnum("analysis_type").notNull(),
		causalAnalysis: jsonb("causal_analysis"),
		predictiveAnalysis: jsonb("predictive_analysis"),
		explanation: jsonb("explanation"),
		confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
		methodology: varchar("methodology", { length: 100 }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		eventIdIdx: index("idx_analysis_event_id").on(table.eventId),
		typeIdx: index("idx_analysis_type").on(table.analysisType, table.createdAt),
	}),
);


// Alias exports for backwards compatibility
export const marketEvents = events;
export const causalAnalyses = analysisResults;
export const predictiveAnalyses = analysisResults;
export const modelPerformances = analysisResults;
