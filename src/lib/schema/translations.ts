import {
	index,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { generatedArticles } from "./articles";
import { users } from "./users";

// Article translations table for multi-language support
export const articleTranslations = pgTable(
	"article_translations",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		articleId: uuid("article_id")
			.references(() => generatedArticles.id, { onDelete: "cascade" })
			.notNull(),
		languageCode: varchar("language_code", { length: 5 }).notNull(), // 'en', 'ko'

		// Translated content fields
		title: varchar("title", { length: 500 }).notNull(),
		content: text("content").notNull(),
		summary: text("summary"),
		marketAnalysis: text("market_analysis"),
		investmentImplications: text("investment_implications"),

		// Translation metadata
		translatedBy: varchar("translated_by", { length: 50 }), // 'ai', 'human', 'hybrid'
		translationQuality: varchar("translation_quality", { length: 20 }), // 'draft', 'reviewed', 'approved'

		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		articleIdIdx: index("idx_article_translations_article_id").on(table.articleId),
		languageCodeIdx: index("idx_article_translations_language_code").on(table.languageCode),
		// Ensure one translation per language per article
		articleLanguageIdx: index("idx_article_translations_article_language").on(
			table.articleId,
			table.languageCode,
		),
	}),
);

// User language preferences
export const userLanguagePreferences = pgTable(
	"user_language_preferences",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
		languageCode: varchar("language_code", { length: 5 }).notNull().default("en"), // 'en', 'ko'
		isDefault: text("is_default").notNull().default("true"), // 'true', 'false' - string because boolean in text format

		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		userIdIdx: index("idx_user_language_preferences_user_id").on(table.userId),
		languageCodeIdx: index("idx_user_language_preferences_language_code").on(table.languageCode),
		// Ensure one default language per user
		userDefaultIdx: index("idx_user_language_preferences_user_default").on(
			table.userId,
			table.isDefault,
		),
	}),
);

// Supported languages configuration
export const supportedLanguages = pgTable(
	"supported_languages",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		languageCode: varchar("language_code", { length: 5 }).notNull().unique(),
		languageName: varchar("language_name", { length: 100 }).notNull(), // 'English', 'Korean'
		nativeName: varchar("native_name", { length: 100 }).notNull(), // 'English', '한국어'
		isActive: text("is_active").notNull().default("true"), // 'true', 'false'
		displayOrder: text("display_order").notNull().default("0"),

		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => ({
		languageCodeIdx: index("idx_supported_languages_code").on(table.languageCode),
		activeIdx: index("idx_supported_languages_active").on(table.isActive),
		orderIdx: index("idx_supported_languages_order").on(table.displayOrder),
	}),
);