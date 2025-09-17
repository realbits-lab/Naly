import { generateText } from "ai";
import { openai } from "@/lib/ai/openai-client";
import { ApplicationError, ErrorCode, ErrorSeverity } from "@/types/errors";
import { MarketEvent } from "@/types/market";
import type {
	AudienceType,
	InvestmentExperience,
	UserProfile,
} from "@/types/user";

export interface RecommendationEngine {
	generateRecommendations(
		userId: string,
		context: RecommendationContext,
	): Promise<Recommendation[]>;
	getPersonalizedContent(
		userId: string,
		contentType: ContentType,
	): Promise<PersonalizedContent[]>;
	trackInteraction(userId: string, interaction: UserInteraction): Promise<void>;
	calculateSimilarity(userA: string, userB: string): Promise<number>;
	updateUserProfile(
		userId: string,
		preferences: UserPreferences,
	): Promise<void>;
}

export interface Recommendation {
	id: string;
	type: RecommendationType;
	title: string;
	description: string;
	confidence: number;
	priority: "low" | "medium" | "high" | "urgent";
	category: string;
	actionable: boolean;
	expiresAt?: Date;
	metadata: {
		ticker?: string;
		expectedReturn?: number;
		riskLevel?: "low" | "medium" | "high";
		timeframe?: string;
		reasoning: string;
		sources: string[];
	};
	personalizedFor: {
		userId: string;
		audienceType: AudienceType;
		experienceLevel: InvestmentExperience;
	};
}

export interface RecommendationContext {
	userProfile: UserProfile;
	portfolioData: any;
	marketConditions: any;
	recentActivity: UserInteraction[];
	preferences: UserPreferences;
}

export interface PersonalizedContent {
	id: string;
	type: ContentType;
	title: string;
	summary: string;
	relevanceScore: number;
	personalizedReasons: string[];
	estimatedReadingTime: number;
	difficulty: "beginner" | "intermediate" | "advanced" | "expert";
}

export interface UserInteraction {
	userId: string;
	type: InteractionType;
	objectId: string;
	objectType: "narrative" | "prediction" | "visualization" | "recommendation";
	timestamp: Date;
	metadata: Record<string, any>;
}

export interface UserPreferences {
	topics: string[];
	tickers: string[];
	riskTolerance: "conservative" | "moderate" | "aggressive";
	investmentStyle: "value" | "growth" | "dividend" | "momentum" | "mixed";
	timeHorizon: "short" | "medium" | "long";
	notificationFrequency: "realtime" | "daily" | "weekly";
	contentComplexity: "basic" | "intermediate" | "advanced" | "expert";
}

export type RecommendationType =
	| "INVESTMENT_OPPORTUNITY"
	| "PORTFOLIO_REBALANCE"
	| "CONTENT_DISCOVERY"
	| "RISK_ALERT"
	| "LEARNING_RESOURCE"
	| "MARKET_INSIGHT"
	| "TRADING_STRATEGY"
	| "NEWS_ALERT";

export type ContentType =
	| "NARRATIVE"
	| "PREDICTION"
	| "VISUALIZATION"
	| "ANALYSIS"
	| "NEWS"
	| "EDUCATIONAL";

export type InteractionType =
	| "VIEW"
	| "LIKE"
	| "SHARE"
	| "COMMENT"
	| "BOOKMARK"
	| "CLICK"
	| "FOLLOW"
	| "TRADE";

export class AIRecommendationEngine implements RecommendationEngine {
	private userInteractions: Map<string, UserInteraction[]> = new Map();
	private userProfiles: Map<string, UserProfile> = new Map();
	private contentDatabase: Map<string, any> = new Map();

	async generateRecommendations(
		userId: string,
		context: RecommendationContext,
	): Promise<Recommendation[]> {
		try {
			const recommendations: Recommendation[] = [];

			// Generate different types of recommendations
			const [
				investmentRecs,
				contentRecs,
				portfolioRecs,
				riskRecs,
				learningRecs,
			] = await Promise.all([
				this.generateInvestmentRecommendations(userId, context),
				this.generateContentRecommendations(userId, context),
				this.generatePortfolioRecommendations(userId, context),
				this.generateRiskAlerts(userId, context),
				this.generateLearningRecommendations(userId, context),
			]);

			recommendations.push(
				...investmentRecs,
				...contentRecs,
				...portfolioRecs,
				...riskRecs,
				...learningRecs,
			);

			// Sort by priority and confidence
			return recommendations
				.sort((a, b) => {
					const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
					const priorityDiff =
						priorityOrder[b.priority] - priorityOrder[a.priority];
					if (priorityDiff !== 0) return priorityDiff;
					return b.confidence - a.confidence;
				})
				.slice(0, 20); // Limit to top 20 recommendations
		} catch (error) {
			throw new ApplicationError({
				code: ErrorCode.AI_SERVICE_ERROR,
				message: "Failed to generate recommendations",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "recommendation-engine",
					operation: "generateRecommendations",
					additionalData: {
						userId,
						error: error instanceof Error ? error.message : String(error),
					},
				},
				retryable: true,
			});
		}
	}

	private async generateInvestmentRecommendations(
		userId: string,
		context: RecommendationContext,
	): Promise<Recommendation[]> {
		try {
			const prompt = `
        As a financial advisor AI, analyze this user's profile and current market conditions to generate personalized investment recommendations.

        User Profile:
        - Audience Type: ${context.userProfile.audienceType}
        - Experience Level: ${context.userProfile.experienceLevel}
        - Risk Tolerance: ${context.userProfile.riskTolerance}
        - Investment Interests: ${context.userProfile.interests?.join(", ") || "None specified"}
        - Watched Tickers: ${context.userProfile.watchedTickers?.join(", ") || "None specified"}

        Current Portfolio: ${JSON.stringify(context.portfolioData || {})}
        User Preferences: ${JSON.stringify(context.preferences)}

        Generate 3-5 investment opportunity recommendations with:
        1. Specific ticker symbols
        2. Expected return estimates
        3. Risk assessment
        4. Clear reasoning
        5. Appropriate timeframe

        Format as JSON array with fields: ticker, title, description, expectedReturn, riskLevel, timeframe, reasoning, confidence (0-1).
      `;

			const result = await generateText({
				model: openai("gpt-4o-mini"),
				prompt,
				maxTokens: 2000,
			});

			const aiRecommendations = this.parseAIRecommendations(result.text);

			return aiRecommendations.map((rec, index) => ({
				id: `inv_${userId}_${Date.now()}_${index}`,
				type: "INVESTMENT_OPPORTUNITY" as RecommendationType,
				title: rec.title,
				description: rec.description,
				confidence: rec.confidence || 0.7,
				priority: this.determinePriority(rec.confidence || 0.7, rec.riskLevel),
				category: "Investment",
				actionable: true,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
				metadata: {
					ticker: rec.ticker,
					expectedReturn: rec.expectedReturn,
					riskLevel: rec.riskLevel,
					timeframe: rec.timeframe,
					reasoning: rec.reasoning,
					sources: ["AI Analysis", "Market Data"],
				},
				personalizedFor: {
					userId,
					audienceType: context.userProfile.audienceType,
					experienceLevel: context.userProfile.experienceLevel,
				},
			}));
		} catch (error) {
			console.warn("Failed to generate investment recommendations:", error);
			return [];
		}
	}

	private async generateContentRecommendations(
		userId: string,
		context: RecommendationContext,
	): Promise<Recommendation[]> {
		const userInteractions = this.userInteractions.get(userId) || [];
		const recentTopics = this.extractTopicsFromInteractions(userInteractions);
		const watchedTickers = context.userProfile.watchedTickers || [];

		// Generate content recommendations based on user interests and behavior
		const recommendations: Recommendation[] = [];

		// Recommend narratives for watched tickers
		for (const ticker of watchedTickers.slice(0, 3)) {
			recommendations.push({
				id: `content_${userId}_${ticker}_${Date.now()}`,
				type: "CONTENT_DISCOVERY",
				title: `Latest insights on ${ticker}`,
				description: `Discover new AI-generated narratives and analysis about ${ticker} based on your interests.`,
				confidence: 0.8,
				priority: "medium",
				category: "Content",
				actionable: true,
				metadata: {
					ticker,
					reasoning: `Recommended because you're watching ${ticker}`,
					sources: ["User Watchlist", "Content Database"],
				},
				personalizedFor: {
					userId,
					audienceType: context.userProfile.audienceType,
					experienceLevel: context.userProfile.experienceLevel,
				},
			});
		}

		return recommendations;
	}

	private async generatePortfolioRecommendations(
		userId: string,
		context: RecommendationContext,
	): Promise<Recommendation[]> {
		if (!context.portfolioData) return [];

		const recommendations: Recommendation[] = [];

		// Mock portfolio analysis - would use real data in production
		const portfolioValue = context.portfolioData.totalValue || 0;
		const positions = context.portfolioData.positions || [];

		// Check for concentration risk
		const concentrationThreshold = 0.3;
		const concentratedPositions = positions.filter(
			(pos: any) => pos.weight > concentrationThreshold,
		);

		if (concentratedPositions.length > 0) {
			recommendations.push({
				id: `portfolio_concentration_${userId}_${Date.now()}`,
				type: "PORTFOLIO_REBALANCE",
				title: "Consider Diversification",
				description: `You have high concentration in ${concentratedPositions.length} position(s). Consider rebalancing for better risk management.`,
				confidence: 0.85,
				priority: "high",
				category: "Portfolio Management",
				actionable: true,
				metadata: {
					reasoning: `Portfolio concentration risk detected in ${concentratedPositions.map((p: any) => p.symbol).join(", ")}`,
					sources: ["Portfolio Analysis"],
				},
				personalizedFor: {
					userId,
					audienceType: context.userProfile.audienceType,
					experienceLevel: context.userProfile.experienceLevel,
				},
			});
		}

		return recommendations;
	}

	private async generateRiskAlerts(
		userId: string,
		context: RecommendationContext,
	): Promise<Recommendation[]> {
		const recommendations: Recommendation[] = [];

		// Generate risk alerts based on user profile and market conditions
		if (context.userProfile.riskTolerance === "CONSERVATIVE") {
			recommendations.push({
				id: `risk_conservative_${userId}_${Date.now()}`,
				type: "RISK_ALERT",
				title: "Conservative Risk Management",
				description:
					"Based on your conservative risk profile, consider reviewing high-volatility positions in your portfolio.",
				confidence: 0.75,
				priority: "medium",
				category: "Risk Management",
				actionable: true,
				metadata: {
					reasoning: "User has conservative risk tolerance",
					sources: ["Risk Profile Analysis"],
				},
				personalizedFor: {
					userId,
					audienceType: context.userProfile.audienceType,
					experienceLevel: context.userProfile.experienceLevel,
				},
			});
		}

		return recommendations;
	}

	private async generateLearningRecommendations(
		userId: string,
		context: RecommendationContext,
	): Promise<Recommendation[]> {
		const recommendations: Recommendation[] = [];

		// Recommend learning resources based on experience level
		if (context.userProfile.experienceLevel === "BEGINNER") {
			recommendations.push({
				id: `learning_beginner_${userId}_${Date.now()}`,
				type: "LEARNING_RESOURCE",
				title: "Investment Basics for Beginners",
				description:
					"Learn fundamental investment concepts tailored to your experience level.",
				confidence: 0.9,
				priority: "medium",
				category: "Education",
				actionable: true,
				metadata: {
					reasoning: "Recommended for beginner investors",
					sources: ["Educational Content Database"],
				},
				personalizedFor: {
					userId,
					audienceType: context.userProfile.audienceType,
					experienceLevel: context.userProfile.experienceLevel,
				},
			});
		}

		return recommendations;
	}

	async getPersonalizedContent(
		userId: string,
		contentType: ContentType,
	): Promise<PersonalizedContent[]> {
		// Implementation for personalized content retrieval
		// This would integrate with the content database and use collaborative filtering
		return [];
	}

	async trackInteraction(
		userId: string,
		interaction: UserInteraction,
	): Promise<void> {
		const userInteractions = this.userInteractions.get(userId) || [];
		userInteractions.push(interaction);
		this.userInteractions.set(userId, userInteractions);

		// Keep only last 1000 interactions per user
		if (userInteractions.length > 1000) {
			this.userInteractions.set(userId, userInteractions.slice(-1000));
		}
	}

	async calculateSimilarity(userA: string, userB: string): Promise<number> {
		// Implementation for user similarity calculation using collaborative filtering
		// This would compare user interactions, preferences, and behavior patterns
		return 0.5; // Placeholder
	}

	async updateUserProfile(
		userId: string,
		preferences: UserPreferences,
	): Promise<void> {
		// Update user preferences for better recommendations
		// This would persist to database in production
	}

	private parseAIRecommendations(aiResponse: string): any[] {
		try {
			// Extract JSON from AI response
			const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
			if (jsonMatch) {
				return JSON.parse(jsonMatch[0]);
			}
			return [];
		} catch (error) {
			console.warn("Failed to parse AI recommendations:", error);
			return [];
		}
	}

	private determinePriority(
		confidence: number,
		riskLevel?: string,
	): "low" | "medium" | "high" | "urgent" {
		if (confidence > 0.9 && riskLevel === "low") return "urgent";
		if (confidence > 0.8) return "high";
		if (confidence > 0.6) return "medium";
		return "low";
	}

	private extractTopicsFromInteractions(
		interactions: UserInteraction[],
	): string[] {
		// Extract topics from user interactions for content recommendations
		const topics = new Set<string>();

		interactions.forEach((interaction) => {
			if (interaction.metadata?.tags) {
				interaction.metadata.tags.forEach((tag: string) => topics.add(tag));
			}
			if (interaction.metadata?.ticker) {
				topics.add(interaction.metadata.ticker);
			}
		});

		return Array.from(topics);
	}
}

// Singleton instance
export const recommendationEngine = new AIRecommendationEngine();
