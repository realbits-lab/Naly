// Community schema with all required fields
import { pgEnum, pgTable, text, timestamp, uuid, varchar, jsonb, boolean, integer, decimal } from "drizzle-orm/pg-core";

// Enums
export const achievementCategoryEnum = pgEnum("achievement_category", ["TRADING", "ANALYSIS", "COMMUNITY", "LEARNING"]);
export const communityContentTypeEnum = pgEnum("community_content_type", ["POST", "COMMENT", "DISCUSSION"]);
export const difficultyLevelEnum = pgEnum("difficulty_level", ["EASY", "MEDIUM", "HARD"]);
export const rarityLevelEnum = pgEnum("rarity_level", ["COMMON", "RARE", "EPIC", "LEGENDARY"]);

// Tables
export const communityContent = pgTable("community_content", {
	id: uuid("id").primaryKey().defaultRandom(),
	content: text("content"),
	type: communityContentTypeEnum("type"),
	createdAt: timestamp("created_at").defaultNow(),
});

export const communityDiscussions = pgTable("community_discussions", {
	id: uuid("id").primaryKey().defaultRandom(),
	parentId: uuid("parent_id"),
	authorId: uuid("author_id"),
	title: varchar("title"),
	content: text("content"),
	relatedEventId: uuid("related_event_id"),
	relatedTicker: varchar("related_ticker"),
	tags: jsonb("tags").$type<string[]>(),
	upvotes: integer("upvotes").default(0),
	downvotes: integer("downvotes").default(0),
	replyCount: integer("reply_count").default(0),
	lastActivityAt: timestamp("last_activity_at"),
	isSticky: boolean("is_sticky").default(false),
	isLocked: boolean("is_locked").default(false),
	isModerated: boolean("is_moderated").default(false),
	moderationFlags: jsonb("moderation_flags"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export const challenges = pgTable("challenges", {
	id: uuid("id").primaryKey().defaultRandom(),
	title: varchar("title"),
	description: text("description"),
	category: varchar("category"),
	difficulty: difficultyLevelEnum("difficulty"),
	objectives: jsonb("objectives"),
	rewards: jsonb("rewards"),
	startDate: timestamp("start_date"),
	endDate: timestamp("end_date"),
	isActive: boolean("is_active").default(true),
	participantCount: integer("participant_count").default(0),
	completionCount: integer("completion_count").default(0),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export const leaderboards = pgTable("leaderboards", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id"),
	name: varchar("name"),
	description: text("description"),
	leaderboardType: varchar("leaderboard_type"),
	period: varchar("period"),
	score: decimal("score"),
	rank: integer("rank"),
	periodStart: timestamp("period_start"),
	periodEnd: timestamp("period_end"),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id"),
	achievementId: uuid("achievement_id"),
	achievementName: varchar("achievement_name"),
	description: text("description"),
	category: varchar("category"),
	rarity: varchar("rarity"),
	points: integer("points"),
	metadata: jsonb("metadata"),
	unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export const userChallengeProgress = pgTable("user_challenge_progress", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id"),
	challengeId: uuid("challenge_id"),
	progress: decimal("progress").default("0"),
	currentObjectives: jsonb("current_objectives"),
	completedObjectives: jsonb("completed_objectives"),
	isCompleted: boolean("is_completed").default(false),
	completedAt: timestamp("completed_at"),
	startedAt: timestamp("started_at").defaultNow(),
	lastProgressAt: timestamp("last_progress_at").defaultNow(),
});