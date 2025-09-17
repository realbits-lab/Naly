import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	users,
} from "@/lib/schema/users";
import { createApplicationError, ErrorCode, ErrorSeverity } from "@/types/errors";
import {
	AudienceType,
	ComplexityLevel,
	InvestmentExperience,
	type UserProfile,
	UserRole,
} from "@/types/user";

export interface UserService {
	getUserById(userId: string): Promise<UserProfile | null>;
	getUserByEmail(email: string): Promise<UserProfile | null>;
	createUser(userData: CreateUserData): Promise<UserProfile>;
	updateUserProfile(
		userId: string,
		profileData: Partial<UserProfile>,
	): Promise<UserProfile>;
	updateUserSettings(userId: string, settings: any): Promise<void>;
	getUserPortfolios(userId: string): Promise<any[]>;
	logUserBehavior(
		userId: string,
		action: string,
		metadata?: any,
	): Promise<void>;
	validatePassword(
		plainPassword: string,
		hashedPassword: string,
	): Promise<boolean>;
	hashPassword(password: string): Promise<string>;
}

export interface CreateUserData {
	email: string;
	name: string;
	password?: string;
	role?: UserRole;
	audienceType?: AudienceType;
	experienceLevel?: InvestmentExperience;
}

/* TODO: Implement proper user service with correct schema
export class DatabaseUserService implements UserService {
	async getUserById(userId: string): Promise<UserProfile | null> {
		try {
			const result = await db
				.select()
				.from(users)
				.where(eq(users.id, userId))
				.limit(1);

			if (!result[0]) return null;

			return this.mapToUserProfile(result[0]);
		} catch (error) {
			throw new ApplicationError({
				code: ErrorCode.DATABASE_ERROR,
				message: `Failed to get user by ID: ${userId}`,
				severity: ErrorSeverity.HIGH,
				metadata: {
					timestamp: new Date(),
					service: "user-service",
					operation: "getUserById",
					additionalData: {
						userId,
						error: error instanceof Error ? error.message : String(error),
					},
				},
				retryable: true,
			});
		}
	}

	async getUserByEmail(email: string): Promise<UserProfile | null> {
		try {
			const result = await db
				.select({
					user: users,
					profile: userProfiles,
					settings: userSettings,
				})
				.from(users)
				.leftJoin(userProfiles, eq(users.id, userProfiles.userId))
				.leftJoin(userSettings, eq(users.id, userSettings.userId))
				.where(eq(users.email, email))
				.limit(1);

			if (!result[0]) return null;

			return this.mapToUserProfile(result[0]);
		} catch (error) {
			throw new ApplicationError({
				code: ErrorCode.DATABASE_ERROR,
				message: `Failed to get user by email: ${email}`,
				severity: ErrorSeverity.HIGH,
				metadata: {
					timestamp: new Date(),
					service: "user-service",
					operation: "getUserByEmail",
					additionalData: {
						email,
						error: error instanceof Error ? error.message : String(error),
					},
				},
				retryable: true,
			});
		}
	}

	async createUser(userData: CreateUserData): Promise<UserProfile> {
		try {
			const hashedPassword = userData.password
				? await this.hashPassword(userData.password)
				: null;

			// Create user record
			const [user] = await db
				.insert(users)
				.values({
					id: crypto.randomUUID(),
					email: userData.email,
					name: userData.name,
					password: hashedPassword,
					role: userData.role || UserRole.RETAIL_INDIVIDUAL,
					emailVerified: null,
					image: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			// Create user profile
			await db.insert(userProfiles).values({
				userId: user.id,
				displayName: userData.name,
				audienceType: userData.audienceType || AudienceType.RETAIL,
				experienceLevel:
					userData.experienceLevel || InvestmentExperience.BEGINNER,
				riskTolerance: "MODERATE",
				preferredComplexity: ComplexityLevel.INTERMEDIATE,
				timezone: "UTC",
				language: "en",
				interests: [],
				watchedTickers: [],
				notifications: {
					email: true,
					push: false,
					sms: false,
					priceAlerts: true,
					newsAlerts: true,
					portfolioUpdates: true,
				},
				privacySettings: {
					profileVisibility: "PRIVATE",
					shareAnalytics: false,
					allowRecommendations: true,
				},
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			// Create default user settings
			await db.insert(userSettings).values({
				userId: user.id,
				theme: "AUTO",
				dashboardLayout: "DEFAULT",
				defaultTimeframe: "1D",
				autoRefresh: true,
				showPredictions: true,
				showNarratives: true,
				enableNotifications: true,
				dataRetentionDays: 365,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			return (await this.getUserById(user.id)) as UserProfile;
		} catch (error) {
			throw new ApplicationError({
				code: ErrorCode.DATABASE_ERROR,
				message: "Failed to create user",
				severity: ErrorSeverity.HIGH,
				metadata: {
					timestamp: new Date(),
					service: "user-service",
					operation: "createUser",
					additionalData: {
						email: userData.email,
						error: error instanceof Error ? error.message : String(error),
					},
				},
				retryable: true,
			});
		}
	}

	async updateUserProfile(
		userId: string,
		profileData: Partial<UserProfile>,
	): Promise<UserProfile> {
		try {
			// Update user table if basic info changed
			if (profileData.name || profileData.email || profileData.image) {
				await db
					.update(users)
					.set({
						name: profileData.name,
						email: profileData.email,
						image: profileData.image,
						updatedAt: new Date(),
					})
					.where(eq(users.id, userId));
			}

			// Update user profile table
			const profileUpdate: any = {
				updatedAt: new Date(),
			};

			if (profileData.displayName)
				profileUpdate.displayName = profileData.displayName;
			if (profileData.audienceType)
				profileUpdate.audienceType = profileData.audienceType;
			if (profileData.experienceLevel)
				profileUpdate.experienceLevel = profileData.experienceLevel;
			if (profileData.riskTolerance)
				profileUpdate.riskTolerance = profileData.riskTolerance;
			if (profileData.preferredComplexity)
				profileUpdate.preferredComplexity = profileData.preferredComplexity;
			if (profileData.timezone) profileUpdate.timezone = profileData.timezone;
			if (profileData.language) profileUpdate.language = profileData.language;
			if (profileData.interests)
				profileUpdate.interests = profileData.interests;
			if (profileData.watchedTickers)
				profileUpdate.watchedTickers = profileData.watchedTickers;
			if (profileData.notifications)
				profileUpdate.notifications = profileData.notifications;
			if (profileData.privacySettings)
				profileUpdate.privacySettings = profileData.privacySettings;

			await db
				.update(userProfiles)
				.set(profileUpdate)
				.where(eq(userProfiles.userId, userId));

			return (await this.getUserById(userId)) as UserProfile;
		} catch (error) {
			throw new ApplicationError({
				code: ErrorCode.DATABASE_ERROR,
				message: "Failed to update user profile",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "user-service",
					operation: "updateUserProfile",
					additionalData: {
						userId,
						error: error instanceof Error ? error.message : String(error),
					},
				},
				retryable: true,
			});
		}
	}

	async updateUserSettings(userId: string, settings: any): Promise<void> {
		try {
			await db
				.update(userSettings)
				.set({
					...settings,
					updatedAt: new Date(),
				})
				.where(eq(userSettings.userId, userId));
		} catch (error) {
			throw new ApplicationError({
				code: ErrorCode.DATABASE_ERROR,
				message: "Failed to update user settings",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "user-service",
					operation: "updateUserSettings",
					additionalData: {
						userId,
						error: error instanceof Error ? error.message : String(error),
					},
				},
				retryable: true,
			});
		}
	}

	async getUserPortfolios(userId: string): Promise<any[]> {
		try {
			const portfolios = await db
				.select()
				.from(userPortfolios)
				.where(eq(userPortfolios.userId, userId));

			return portfolios;
		} catch (error) {
			throw new ApplicationError({
				code: ErrorCode.DATABASE_ERROR,
				message: "Failed to get user portfolios",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "user-service",
					operation: "getUserPortfolios",
					additionalData: {
						userId,
						error: error instanceof Error ? error.message : String(error),
					},
				},
				retryable: true,
			});
		}
	}

	async logUserBehavior(
		userId: string,
		action: string,
		metadata?: any,
	): Promise<void> {
		try {
			await db.insert(userBehaviorLogs).values({
				userId,
				action,
				metadata: metadata || {},
				createdAt: new Date(),
			});
		} catch (error) {
			// Don't throw for behavior logging failures - just log the error
			console.warn("Failed to log user behavior:", error);
		}
	}

	async validatePassword(
		plainPassword: string,
		hashedPassword: string,
	): Promise<boolean> {
		try {
			return await bcrypt.compare(plainPassword, hashedPassword);
		} catch (error) {
			throw new ApplicationError({
				code: ErrorCode.AUTHENTICATION_ERROR,
				message: "Failed to validate password",
				severity: ErrorSeverity.HIGH,
				metadata: {
					timestamp: new Date(),
					service: "user-service",
					operation: "validatePassword",
				},
				retryable: false,
			});
		}
	}

	async hashPassword(password: string): Promise<string> {
		try {
			const saltRounds = 12;
			return await bcrypt.hash(password, saltRounds);
		} catch (error) {
			throw new ApplicationError({
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "Failed to hash password",
				severity: ErrorSeverity.HIGH,
				metadata: {
					timestamp: new Date(),
					service: "user-service",
					operation: "hashPassword",
				},
				retryable: false,
			});
		}
	}

	private mapToUserProfile(data: any): UserProfile {
		const { user, profile, settings } = data;

		return {
			id: user.id,
			email: user.email,
			name: user.name,
			image: user.image,
			role: user.role,
			displayName: profile?.displayName || user.name,
			audienceType: profile?.audienceType || AudienceType.RETAIL,
			experienceLevel:
				profile?.experienceLevel || InvestmentExperience.BEGINNER,
			riskTolerance: profile?.riskTolerance || "MODERATE",
			preferredComplexity:
				profile?.preferredComplexity || ComplexityLevel.INTERMEDIATE,
			timezone: profile?.timezone || "UTC",
			language: profile?.language || "en",
			interests: profile?.interests || [],
			watchedTickers: profile?.watchedTickers || [],
			notifications: profile?.notifications || {
				email: true,
				push: false,
				sms: false,
				priceAlerts: true,
				newsAlerts: true,
				portfolioUpdates: true,
			},
			privacySettings: profile?.privacySettings || {
				profileVisibility: "PRIVATE",
				shareAnalytics: false,
				allowRecommendations: true,
			},
			settings: settings
				? {
						theme: settings.theme,
						dashboardLayout: settings.dashboardLayout,
						defaultTimeframe: settings.defaultTimeframe,
						autoRefresh: settings.autoRefresh,
						showPredictions: settings.showPredictions,
						showNarratives: settings.showNarratives,
						enableNotifications: settings.enableNotifications,
						dataRetentionDays: settings.dataRetentionDays,
					}
				: undefined,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt || profile?.updatedAt,
		};
	}
}
*/

// Placeholder implementation until proper schema is created
export const userService = {
	async getUserById(userId: string) {
		return null;
	},
	async getUserByEmail(email: string) {
		return null;
	},
	async createUser(userData: any) {
		return null;
	},
	async updateUser(userId: string, updates: any) {
		return null;
	},
	async deleteUser(userId: string) {
		return false;
	},
};
