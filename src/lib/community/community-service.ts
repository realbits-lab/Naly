import { generateText } from "ai";
import { and, desc, eq, sql } from "drizzle-orm";
import { openai } from "@/lib/ai/openai-client";
import { db } from "@/lib/db";
import {
	achievementCategoryEnum,
	challenges,
	communityContent,
	communityContentTypeEnum,
	communityDiscussions,
	difficultyLevelEnum,
	leaderboards,
	rarityLevelEnum,
	userAchievements,
	userChallengeProgress,
} from "@/lib/schema/community";
import { users } from "@/lib/schema/users";
import { ApplicationError, ErrorCode, ErrorSeverity } from "@/types/errors";

export interface CommunityService {
	// Discussion methods
	createDiscussion(params: CreateDiscussionParams): Promise<Discussion>;
	getDiscussions(filters: DiscussionFilters): Promise<DiscussionWithMetadata[]>;
	getDiscussion(id: string): Promise<DiscussionWithReplies | null>;
	replyToDiscussion(params: ReplyToDiscussionParams): Promise<Discussion>;
	voteOnDiscussion(params: VoteParams): Promise<void>;
	moderateContent(params: ModerationParams): Promise<void>;

	// Gamification methods
	getUserAchievements(userId: string): Promise<UserAchievement[]>;
	checkAndAwardAchievements(
		userId: string,
		context: AchievementContext,
	): Promise<UserAchievement[]>;
	getChallenges(filters?: ChallengeFilters): Promise<Challenge[]>;
	joinChallenge(
		userId: string,
		challengeId: string,
	): Promise<UserChallengeProgress>;
	updateChallengeProgress(
		userId: string,
		challengeId: string,
		progress: ChallengeProgressUpdate,
	): Promise<UserChallengeProgress>;
	getLeaderboards(
		type: string,
		period: string,
		limit?: number,
	): Promise<LeaderboardEntry[]>;
	updateUserScore(
		userId: string,
		scoreType: string,
		points: number,
	): Promise<void>;

	// Analytics methods
	getCommunityStats(): Promise<CommunityStats>;
	getUserCommunityProfile(userId: string): Promise<UserCommunityProfile>;
}

export interface CreateDiscussionParams {
	authorId: string;
	title?: string;
	content: string;
	relatedEventId?: string;
	relatedTicker?: string;
	tags?: string[];
}

export interface ReplyToDiscussionParams {
	authorId: string;
	parentId: string;
	content: string;
}

export interface DiscussionFilters {
	ticker?: string;
	tags?: string[];
	authorId?: string;
	sortBy?: "latest" | "popular" | "controversial";
	limit?: number;
	offset?: number;
}

export interface VoteParams {
	userId: string;
	discussionId: string;
	voteType: "up" | "down";
}

export interface ModerationParams {
	moderatorId: string;
	contentId: string;
	action: "approve" | "reject" | "flag";
	reason?: string;
}

export interface Discussion {
	id: string;
	parentId?: string;
	authorId: string;
	author?: {
		id: string;
		name: string;
		avatarUrl?: string;
		role?: string;
	};
	title?: string;
	content: string;
	relatedEventId?: string;
	relatedTicker?: string;
	upvotes: number;
	downvotes: number;
	replyCount: number;
	lastActivityAt: Date;
	isSticky: boolean;
	isLocked: boolean;
	tags?: string[];
	createdAt: Date;
	updatedAt: Date;
}

export interface DiscussionWithMetadata extends Discussion {
	author: {
		id: string;
		name: string;
		avatarUrl?: string;
		role?: string;
		communityRank?: number;
		totalPoints?: number;
	};
	userVote?: "up" | "down";
	isBookmarked?: boolean;
}

export interface DiscussionWithReplies extends DiscussionWithMetadata {
	replies: DiscussionWithMetadata[];
}

export interface UserAchievement {
	id: string;
	userId: string;
	achievementId: string;
	achievementName: string;
	description?: string;
	category: string;
	rarity: string;
	points: number;
	unlockedAt: Date;
	metadata?: any;
}

export interface Challenge {
	id: string;
	title: string;
	description: string;
	category: string;
	difficulty: string;
	objectives: any;
	rewards: any;
	startDate?: Date;
	endDate?: Date;
	isActive: boolean;
	participantCount: number;
	completionCount: number;
	metadata?: any;
	createdAt: Date;
	updatedAt: Date;
}

export interface UserChallengeProgress {
	id: string;
	userId: string;
	challengeId: string;
	progress: number;
	currentObjectives: any;
	completedObjectives?: any;
	isCompleted: boolean;
	completedAt?: Date;
	startedAt: Date;
	lastProgressAt: Date;
}

export interface ChallengeFilters {
	category?: string;
	difficulty?: string;
	isActive?: boolean;
	userId?: string;
}

export interface LeaderboardEntry {
	id: string;
	userId: string;
	user: {
		id: string;
		name: string;
		avatarUrl?: string;
	};
	score: number;
	rank: number;
	metadata?: any;
}

export interface AchievementContext {
	action: string;
	metadata?: any;
}

export interface ChallengeProgressUpdate {
	objectiveId: string;
	value: number;
	metadata?: any;
}

export interface CommunityStats {
	totalDiscussions: number;
	totalUsers: number;
	activeUsers: number;
	totalAchievements: number;
	activeChallenges: number;
	topContributors: LeaderboardEntry[];
}

export interface UserCommunityProfile {
	userId: string;
	totalPosts: number;
	totalUpvotes: number;
	totalAchievements: number;
	communityRank: number;
	joinedChallenges: number;
	completedChallenges: number;
	recentAchievements: UserAchievement[];
	activeChallenges: Challenge[];
}

export class CommunityServiceImpl implements CommunityService {
	async createDiscussion(params: CreateDiscussionParams): Promise<Discussion> {
		try {
			// Generate AI-powered title if not provided and content is substantial
			let title = params.title;
			if (!title && params.content.length > 100) {
				title = await this.generateDiscussionTitle(
					params.content,
					params.relatedTicker,
				);
			}

			const [discussion] = await db
				.insert(communityDiscussions)
				.values({
					authorId: params.authorId,
					title: title || "Community Discussion",
					content: params.content,
					relatedEventId: params.relatedEventId,
					relatedTicker: params.relatedTicker,
					tags: params.tags || [],
					lastActivityAt: new Date(),
				})
				.returning();

			// Award achievement for first post
			await this.checkAndAwardAchievements(params.authorId, {
				action: "create_discussion",
				metadata: { discussionId: discussion.id },
			});

			return this.mapDiscussion(discussion);
		} catch (error) {
			throw new ApplicationError({
				code: ErrorCode.DATABASE_ERROR,
				message: "Failed to create discussion",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "community-service",
					operation: "createDiscussion",
					additionalData: {
						error: error instanceof Error ? error.message : String(error),
					},
				},
				retryable: true,
			});
		}
	}

	async getDiscussions(
		filters: DiscussionFilters,
	): Promise<DiscussionWithMetadata[]> {
		try {
			const conditions = [];

			if (filters.ticker) {
				conditions.push(eq(communityDiscussions.relatedTicker, filters.ticker));
			}

			if (filters.authorId) {
				conditions.push(eq(communityDiscussions.authorId, filters.authorId));
			}

			let orderBy;
			switch (filters.sortBy) {
				case "popular":
					orderBy = desc(
						sql`${communityDiscussions.upvotes} - ${communityDiscussions.downvotes}`,
					);
					break;
				case "controversial":
					orderBy = desc(
						sql`${communityDiscussions.upvotes} + ${communityDiscussions.downvotes}`,
					);
					break;
				default:
					orderBy = desc(communityDiscussions.lastActivityAt);
			}

			const discussions = await db
				.select({
					discussion: communityDiscussions,
					author: {
						id: users.id,
						name: users.name,
						avatarUrl: users.avatarUrl,
						role: users.role,
					},
				})
				.from(communityDiscussions)
				.leftJoin(users, eq(communityDiscussions.authorId, users.id))
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(orderBy)
				.limit(filters.limit || 20)
				.offset(filters.offset || 0);

			return discussions.map(({ discussion, author }) => ({
				...this.mapDiscussion(discussion),
				author: {
					id: author?.id || "",
					name: author?.name || "Unknown User",
					avatarUrl: author?.avatarUrl,
					role: author?.role,
				},
			}));
		} catch (error) {
			throw new ApplicationError({
				code: ErrorCode.DATABASE_ERROR,
				message: "Failed to fetch discussions",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "community-service",
					operation: "getDiscussions",
					additionalData: {
						error: error instanceof Error ? error.message : String(error),
					},
				},
				retryable: true,
			});
		}
	}

	async getDiscussion(id: string): Promise<DiscussionWithReplies | null> {
		try {
			const [mainDiscussion] = await db
				.select({
					discussion: communityDiscussions,
					author: {
						id: users.id,
						name: users.name,
						avatarUrl: users.avatarUrl,
						role: users.role,
					},
				})
				.from(communityDiscussions)
				.leftJoin(users, eq(communityDiscussions.authorId, users.id))
				.where(eq(communityDiscussions.id, id));

			if (!mainDiscussion) return null;

			// Get replies
			const replies = await db
				.select({
					discussion: communityDiscussions,
					author: {
						id: users.id,
						name: users.name,
						avatarUrl: users.avatarUrl,
						role: users.role,
					},
				})
				.from(communityDiscussions)
				.leftJoin(users, eq(communityDiscussions.authorId, users.id))
				.where(eq(communityDiscussions.parentId, id))
				.orderBy(desc(communityDiscussions.createdAt));

			return {
				...this.mapDiscussion(mainDiscussion.discussion),
				author: {
					id: mainDiscussion.author?.id || "",
					name: mainDiscussion.author?.name || "Unknown User",
					avatarUrl: mainDiscussion.author?.avatarUrl,
					role: mainDiscussion.author?.role,
				},
				replies: replies.map(({ discussion, author }) => ({
					...this.mapDiscussion(discussion),
					author: {
						id: author?.id || "",
						name: author?.name || "Unknown User",
						avatarUrl: author?.avatarUrl,
						role: author?.role,
					},
				})),
			};
		} catch (error) {
			throw new ApplicationError({
				code: ErrorCode.DATABASE_ERROR,
				message: "Failed to fetch discussion",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "community-service",
					operation: "getDiscussion",
					additionalData: {
						error: error instanceof Error ? error.message : String(error),
					},
				},
				retryable: true,
			});
		}
	}

	async replyToDiscussion(
		params: ReplyToDiscussionParams,
	): Promise<Discussion> {
		try {
			const [reply] = await db
				.insert(communityDiscussions)
				.values({
					parentId: params.parentId,
					authorId: params.authorId,
					content: params.content,
					lastActivityAt: new Date(),
				})
				.returning();

			// Update parent discussion reply count and last activity
			await db
				.update(communityDiscussions)
				.set({
					replyCount: sql`${communityDiscussions.replyCount} + 1`,
					lastActivityAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(communityDiscussions.id, params.parentId));

			// Award achievement for active participation
			await this.checkAndAwardAchievements(params.authorId, {
				action: "reply_discussion",
				metadata: { replyId: reply.id, parentId: params.parentId },
			});

			return this.mapDiscussion(reply);
		} catch (error) {
			throw new ApplicationError({
				code: ErrorCode.DATABASE_ERROR,
				message: "Failed to create reply",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "community-service",
					operation: "replyToDiscussion",
					additionalData: {
						error: error instanceof Error ? error.message : String(error),
					},
				},
				retryable: true,
			});
		}
	}

	async voteOnDiscussion(params: VoteParams): Promise<void> {
		try {
			// Update vote counts
			const updateField = params.voteType === "up" ? "upvotes" : "downvotes";
			await db
				.update(communityDiscussions)
				.set({
					[updateField]: sql`${communityDiscussions[updateField]} + 1`,
					updatedAt: new Date(),
				})
				.where(eq(communityDiscussions.id, params.discussionId));

			// Award achievement for community engagement
			await this.checkAndAwardAchievements(params.userId, {
				action: "vote_discussion",
				metadata: {
					discussionId: params.discussionId,
					voteType: params.voteType,
				},
			});
		} catch (error) {
			throw new ApplicationError({
				code: ErrorCode.DATABASE_ERROR,
				message: "Failed to vote on discussion",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "community-service",
					operation: "voteOnDiscussion",
					additionalData: {
						error: error instanceof Error ? error.message : String(error),
					},
				},
				retryable: true,
			});
		}
	}

	async moderateContent(params: ModerationParams): Promise<void> {
		try {
			const moderationFlags = {
				action: params.action,
				moderatorId: params.moderatorId,
				reason: params.reason,
				timestamp: new Date(),
			};

			await db
				.update(communityDiscussions)
				.set({
					isModerated: params.action !== "approve",
					moderationFlags: moderationFlags,
					updatedAt: new Date(),
				})
				.where(eq(communityDiscussions.id, params.contentId));
		} catch (error) {
			throw new ApplicationError({
				code: ErrorCode.DATABASE_ERROR,
				message: "Failed to moderate content",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "community-service",
					operation: "moderateContent",
					additionalData: {
						error: error instanceof Error ? error.message : String(error),
					},
				},
				retryable: true,
			});
		}
	}

	async getUserAchievements(userId: string): Promise<UserAchievement[]> {
		try {
			const achievements = await db
				.select()
				.from(userAchievements)
				.where(eq(userAchievements.userId, userId))
				.orderBy(desc(userAchievements.unlockedAt));

			return achievements.map((achievement) => ({
				id: achievement.id,
				userId: achievement.userId,
				achievementId: achievement.achievementId,
				achievementName: achievement.achievementName,
				description: achievement.description || undefined,
				category: achievement.category,
				rarity: achievement.rarity,
				points: achievement.points || 0,
				unlockedAt: achievement.unlockedAt || new Date(),
				metadata: achievement.metadata,
			}));
		} catch (error) {
			throw new ApplicationError({
				code: ErrorCode.DATABASE_ERROR,
				message: "Failed to fetch user achievements",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "community-service",
					operation: "getUserAchievements",
					additionalData: {
						error: error instanceof Error ? error.message : String(error),
					},
				},
				retryable: true,
			});
		}
	}

	async checkAndAwardAchievements(
		userId: string,
		context: AchievementContext,
	): Promise<UserAchievement[]> {
		try {
			const newAchievements: UserAchievement[] = [];

			// Define achievement rules
			const achievementRules = await this.getAchievementRules(context);

			for (const rule of achievementRules) {
				const hasAchievement = await this.userHasAchievement(
					userId,
					rule.achievementId,
				);
				if (
					!hasAchievement &&
					(await this.meetsAchievementCriteria(userId, rule))
				) {
					const achievement = await this.awardAchievement(userId, rule);
					newAchievements.push(achievement);
				}
			}

			return newAchievements;
		} catch (error) {
			console.warn("Failed to check and award achievements:", error);
			return [];
		}
	}

	async getChallenges(filters?: ChallengeFilters): Promise<Challenge[]> {
		try {
			const conditions = [];

			if (filters?.category) {
				conditions.push(eq(challenges.category, filters.category));
			}

			if (filters?.difficulty) {
				conditions.push(eq(challenges.difficulty, filters.difficulty));
			}

			if (filters?.isActive !== undefined) {
				conditions.push(eq(challenges.isActive, filters.isActive));
			}

			const challengeList = await db
				.select()
				.from(challenges)
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(desc(challenges.startDate));

			return challengeList.map((challenge) => ({
				id: challenge.id,
				title: challenge.title,
				description: challenge.description,
				category: challenge.category,
				difficulty: challenge.difficulty,
				objectives: challenge.objectives,
				rewards: challenge.rewards,
				startDate: challenge.startDate || undefined,
				endDate: challenge.endDate || undefined,
				isActive: challenge.isActive || false,
				participantCount: challenge.participantCount || 0,
				completionCount: challenge.completionCount || 0,
				metadata: challenge.metadata,
				createdAt: challenge.createdAt || new Date(),
				updatedAt: challenge.updatedAt || new Date(),
			}));
		} catch (error) {
			throw new ApplicationError({
				code: ErrorCode.DATABASE_ERROR,
				message: "Failed to fetch challenges",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "community-service",
					operation: "getChallenges",
					additionalData: {
						error: error instanceof Error ? error.message : String(error),
					},
				},
				retryable: true,
			});
		}
	}

	async joinChallenge(
		userId: string,
		challengeId: string,
	): Promise<UserChallengeProgress> {
		try {
			// Get challenge objectives
			const [challenge] = await db
				.select()
				.from(challenges)
				.where(eq(challenges.id, challengeId));

			if (!challenge) {
				throw new Error("Challenge not found");
			}

			const [progress] = await db
				.insert(userChallengeProgress)
				.values({
					userId,
					challengeId,
					currentObjectives: challenge.objectives,
					startedAt: new Date(),
					lastProgressAt: new Date(),
				})
				.returning();

			// Update challenge participant count
			await db
				.update(challenges)
				.set({
					participantCount: sql`${challenges.participantCount} + 1`,
					updatedAt: new Date(),
				})
				.where(eq(challenges.id, challengeId));

			return {
				id: progress.id,
				userId: progress.userId,
				challengeId: progress.challengeId,
				progress: Number(progress.progress),
				currentObjectives: progress.currentObjectives,
				completedObjectives: progress.completedObjectives,
				isCompleted: progress.isCompleted || false,
				completedAt: progress.completedAt || undefined,
				startedAt: progress.startedAt || new Date(),
				lastProgressAt: progress.lastProgressAt || new Date(),
			};
		} catch (error) {
			throw new ApplicationError({
				code: ErrorCode.DATABASE_ERROR,
				message: "Failed to join challenge",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "community-service",
					operation: "joinChallenge",
					additionalData: {
						error: error instanceof Error ? error.message : String(error),
					},
				},
				retryable: true,
			});
		}
	}

	async updateChallengeProgress(
		userId: string,
		challengeId: string,
		progressUpdate: ChallengeProgressUpdate,
	): Promise<UserChallengeProgress> {
		try {
			// Implementation would update specific objective progress
			// This is a simplified version
			const [progress] = await db
				.update(userChallengeProgress)
				.set({
					progress: sql`LEAST(${userChallengeProgress.progress} + 0.1, 1.0)`,
					lastProgressAt: new Date(),
				})
				.where(
					and(
						eq(userChallengeProgress.userId, userId),
						eq(userChallengeProgress.challengeId, challengeId),
					),
				)
				.returning();

			return {
				id: progress.id,
				userId: progress.userId,
				challengeId: progress.challengeId,
				progress: Number(progress.progress),
				currentObjectives: progress.currentObjectives,
				completedObjectives: progress.completedObjectives,
				isCompleted: progress.isCompleted || false,
				completedAt: progress.completedAt || undefined,
				startedAt: progress.startedAt || new Date(),
				lastProgressAt: progress.lastProgressAt || new Date(),
			};
		} catch (error) {
			throw new ApplicationError({
				code: ErrorCode.DATABASE_ERROR,
				message: "Failed to update challenge progress",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "community-service",
					operation: "updateChallengeProgress",
					additionalData: {
						error: error instanceof Error ? error.message : String(error),
					},
				},
				retryable: true,
			});
		}
	}

	async getLeaderboards(
		type: string,
		period: string,
		limit: number = 10,
	): Promise<LeaderboardEntry[]> {
		try {
			const leaderboard = await db
				.select({
					entry: leaderboards,
					user: {
						id: users.id,
						name: users.name,
						avatarUrl: users.avatarUrl,
					},
				})
				.from(leaderboards)
				.leftJoin(users, eq(leaderboards.userId, users.id))
				.where(
					and(
						eq(leaderboards.leaderboardType, type),
						eq(leaderboards.period, period),
					),
				)
				.orderBy(leaderboards.rank)
				.limit(limit);

			return leaderboard.map(({ entry, user }) => ({
				id: entry.id,
				userId: entry.userId,
				user: {
					id: user?.id || "",
					name: user?.name || "Unknown User",
					avatarUrl: user?.avatarUrl,
				},
				score: Number(entry.score),
				rank: entry.rank,
				metadata: entry.metadata,
			}));
		} catch (error) {
			throw new ApplicationError({
				code: ErrorCode.DATABASE_ERROR,
				message: "Failed to fetch leaderboards",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "community-service",
					operation: "getLeaderboards",
					additionalData: {
						error: error instanceof Error ? error.message : String(error),
					},
				},
				retryable: true,
			});
		}
	}

	async updateUserScore(
		userId: string,
		scoreType: string,
		points: number,
	): Promise<void> {
		try {
			// This would update or insert leaderboard entries
			// Simplified implementation
			const now = new Date();
			const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
			const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

			// Update monthly leaderboard
			await db
				.insert(leaderboards)
				.values({
					userId,
					leaderboardType: scoreType,
					period: "monthly",
					score: String(points),
					rank: 1, // Would be calculated based on actual scores
					periodStart,
					periodEnd,
				})
				.onConflictDoUpdate({
					target: [
						leaderboards.userId,
						leaderboards.leaderboardType,
						leaderboards.period,
					],
					set: {
						score: sql`${leaderboards.score} + ${points}`,
						updatedAt: new Date(),
					},
				});
		} catch (error) {
			console.warn("Failed to update user score:", error);
		}
	}

	async getCommunityStats(): Promise<CommunityStats> {
		try {
			const [discussionCount] = await db
				.select({ count: sql<number>`count(*)` })
				.from(communityDiscussions);

			const [userCount] = await db
				.select({ count: sql<number>`count(*)` })
				.from(users);

			const [achievementCount] = await db
				.select({ count: sql<number>`count(*)` })
				.from(userAchievements);

			const [challengeCount] = await db
				.select({ count: sql<number>`count(*)` })
				.from(challenges)
				.where(eq(challenges.isActive, true));

			const topContributors = await this.getLeaderboards(
				"community_points",
				"monthly",
				5,
			);

			return {
				totalDiscussions: discussionCount.count,
				totalUsers: userCount.count,
				activeUsers: Math.floor(userCount.count * 0.3), // Estimate
				totalAchievements: achievementCount.count,
				activeChallenges: challengeCount.count,
				topContributors,
			};
		} catch (error) {
			throw new ApplicationError({
				code: ErrorCode.DATABASE_ERROR,
				message: "Failed to fetch community stats",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "community-service",
					operation: "getCommunityStats",
					additionalData: {
						error: error instanceof Error ? error.message : String(error),
					},
				},
				retryable: true,
			});
		}
	}

	async getUserCommunityProfile(userId: string): Promise<UserCommunityProfile> {
		try {
			const [userPosts] = await db
				.select({ count: sql<number>`count(*)` })
				.from(communityDiscussions)
				.where(eq(communityDiscussions.authorId, userId));

			const [userUpvotes] = await db
				.select({ total: sql<number>`sum(${communityDiscussions.upvotes})` })
				.from(communityDiscussions)
				.where(eq(communityDiscussions.authorId, userId));

			const userAchievementsList = await this.getUserAchievements(userId);
			const recentAchievements = userAchievementsList.slice(0, 5);

			// Get active challenges
			const activeChallenges = await db
				.select({
					challenge: challenges,
				})
				.from(userChallengeProgress)
				.leftJoin(
					challenges,
					eq(userChallengeProgress.challengeId, challenges.id),
				)
				.where(
					and(
						eq(userChallengeProgress.userId, userId),
						eq(userChallengeProgress.isCompleted, false),
					),
				);

			return {
				userId,
				totalPosts: userPosts.count,
				totalUpvotes: userUpvotes.total || 0,
				totalAchievements: userAchievementsList.length,
				communityRank: 1, // Would be calculated from leaderboards
				joinedChallenges: activeChallenges.length,
				completedChallenges: 0, // Would be calculated
				recentAchievements,
				activeChallenges: activeChallenges.map(({ challenge }) => ({
					id: challenge?.id || "",
					title: challenge?.title || "",
					description: challenge?.description || "",
					category: challenge?.category || "",
					difficulty: challenge?.difficulty || "EASY",
					objectives: challenge?.objectives || {},
					rewards: challenge?.rewards || {},
					startDate: challenge?.startDate,
					endDate: challenge?.endDate,
					isActive: challenge?.isActive || false,
					participantCount: challenge?.participantCount || 0,
					completionCount: challenge?.completionCount || 0,
					metadata: challenge?.metadata,
					createdAt: challenge?.createdAt || new Date(),
					updatedAt: challenge?.updatedAt || new Date(),
				})),
			};
		} catch (error) {
			throw new ApplicationError({
				code: ErrorCode.DATABASE_ERROR,
				message: "Failed to fetch user community profile",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "community-service",
					operation: "getUserCommunityProfile",
					additionalData: {
						error: error instanceof Error ? error.message : String(error),
					},
				},
				retryable: true,
			});
		}
	}

	// Private helper methods
	private async generateDiscussionTitle(
		content: string,
		ticker?: string,
	): Promise<string> {
		try {
			const prompt = `Generate a concise, engaging title for this financial discussion post${ticker ? ` about ${ticker}` : ""}:

"${content.substring(0, 300)}..."

Return only the title, no quotes or additional text.`;

			const result = await generateText({
				model: openai("gpt-4o-mini"),
				prompt,
				maxTokens: 50,
			});

			return result.text.trim().replace(/^["']|["']$/g, "");
		} catch (error) {
			return ticker ? `Discussion about ${ticker}` : "Community Discussion";
		}
	}

	private mapDiscussion(discussion: any): Discussion {
		return {
			id: discussion.id,
			parentId: discussion.parentId || undefined,
			authorId: discussion.authorId,
			title: discussion.title || undefined,
			content: discussion.content,
			relatedEventId: discussion.relatedEventId || undefined,
			relatedTicker: discussion.relatedTicker || undefined,
			upvotes: discussion.upvotes || 0,
			downvotes: discussion.downvotes || 0,
			replyCount: discussion.replyCount || 0,
			lastActivityAt: discussion.lastActivityAt || discussion.createdAt,
			isSticky: discussion.isSticky || false,
			isLocked: discussion.isLocked || false,
			tags: discussion.tags || [],
			createdAt: discussion.createdAt,
			updatedAt: discussion.updatedAt,
		};
	}

	private async getAchievementRules(context: AchievementContext) {
		// Define achievement rules based on context
		const rules = [];

		switch (context.action) {
			case "create_discussion":
				rules.push({
					achievementId: "first_post",
					name: "First Post",
					description: "Created your first discussion",
					category: "COMMUNITY_CONTRIBUTION",
					rarity: "COMMON",
					points: 10,
				});
				break;
			case "reply_discussion":
				rules.push({
					achievementId: "active_participant",
					name: "Active Participant",
					description: "Replied to 10 discussions",
					category: "COMMUNITY_CONTRIBUTION",
					rarity: "UNCOMMON",
					points: 25,
				});
				break;
			case "vote_discussion":
				rules.push({
					achievementId: "community_supporter",
					name: "Community Supporter",
					description: "Voted on 50 discussions",
					category: "CONTENT_ENGAGEMENT",
					rarity: "COMMON",
					points: 15,
				});
				break;
		}

		return rules;
	}

	private async userHasAchievement(
		userId: string,
		achievementId: string,
	): Promise<boolean> {
		const [existing] = await db
			.select()
			.from(userAchievements)
			.where(
				and(
					eq(userAchievements.userId, userId),
					eq(userAchievements.achievementId, achievementId),
				),
			)
			.limit(1);

		return !!existing;
	}

	private async meetsAchievementCriteria(
		userId: string,
		rule: any,
	): Promise<boolean> {
		// Simplified criteria checking
		switch (rule.achievementId) {
			case "first_post":
				return true; // If they just created a post, they meet this criteria

			case "active_participant": {
				const [replyCount] = await db
					.select({ count: sql<number>`count(*)` })
					.from(communityDiscussions)
					.where(
						and(
							eq(communityDiscussions.authorId, userId),
							sql`${communityDiscussions.parentId} IS NOT NULL`,
						),
					);
				return replyCount.count >= 10;
			}

			case "community_supporter":
				// Would need to track votes in a separate table
				return false; // Placeholder

			default:
				return false;
		}
	}

	private async awardAchievement(
		userId: string,
		rule: any,
	): Promise<UserAchievement> {
		const [achievement] = await db
			.insert(userAchievements)
			.values({
				userId,
				achievementId: rule.achievementId,
				achievementName: rule.name,
				description: rule.description,
				category: rule.category,
				rarity: rule.rarity,
				points: rule.points,
				unlockedAt: new Date(),
			})
			.returning();

		// Update user score
		await this.updateUserScore(userId, "community_points", rule.points);

		return {
			id: achievement.id,
			userId: achievement.userId,
			achievementId: achievement.achievementId,
			achievementName: achievement.achievementName,
			description: achievement.description || undefined,
			category: achievement.category,
			rarity: achievement.rarity,
			points: achievement.points || 0,
			unlockedAt: achievement.unlockedAt || new Date(),
			metadata: achievement.metadata,
		};
	}
}

// Singleton instance
export const communityService = new CommunityServiceImpl();
