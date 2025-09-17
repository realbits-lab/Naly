// Service Interface Types based on development specification

import type {
	CausalAnalysis,
	EnsemblePrediction,
	PredictiveAnalysis,
} from "./analytics";
import type { IntelligentNarrative, Visualization } from "./content";
import {
	DataSource,
	type MarketDataPoint,
	type MarketDataStream,
	type MarketEvent,
} from "./market";
import type {
	Notification,
	Recommendation,
	UserInteraction,
	UserProfile,
} from "./user";

// Financial Datasets API Service Interfaces
export interface FinancialDataAPIConfig {
	apiKey: string;
	baseUrl: string;
	rateLimit: number;
	timeout: number;
}

export interface MarketDataRequest {
	ticker: string;
	dataTypes: string[];
	startDate: Date;
	endDate: Date;
	frequency?: "realtime" | "daily" | "weekly" | "monthly";
}

export interface FinancialDataAPIService {
	initialize(config: FinancialDataAPIConfig): Promise<void>;
	getMarketData(request: MarketDataRequest): Promise<MarketDataPoint[]>;
	streamMarketData(tickers: string[]): Promise<MarketDataStream>;
	getHistoricalData(ticker: string, years: number): Promise<MarketDataPoint[]>;
	validateApiConnection(): Promise<boolean>;
}

// Event Detection Service Interfaces
export interface EventDetectionConfig {
	priceThreshold: number;
	volumeThreshold: number;
	significanceFilters: string[];
	enableRealTimeDetection: boolean;
}

export interface EventDetectionService {
	configure(config: EventDetectionConfig): Promise<void>;
	detectEvents(dataPoints: MarketDataPoint[]): Promise<MarketEvent[]>;
	startRealTimeDetection(tickers: string[]): Promise<void>;
	stopRealTimeDetection(): Promise<void>;
	getEventById(eventId: string): Promise<MarketEvent | null>;
}

// Causal Analysis Service Interfaces
export interface CausalAnalysisConfig {
	analysisMethod: string;
	confidenceThreshold: number;
	maxFactors: number;
	enableAlternativeExplanations: boolean;
	useCache?: boolean;
}

export interface CausalAnalysisService {
	configure(config: CausalAnalysisConfig): Promise<void>;
	analyzeEvent(event: MarketEvent): Promise<CausalAnalysis>;
	generateExplanation(analysis: CausalAnalysis): Promise<string>;
	validateAnalysis(analysis: CausalAnalysis): Promise<number>;
}

// Prediction Engine Service Interfaces
export interface PredictionConfig {
	models: string[];
	ensembleWeights: Record<string, number>;
	confidenceThreshold: number;
	maxScenarios: number;
}

export interface PredictionService {
	configure(config: PredictionConfig): Promise<void>;
	generatePrediction(
		event: MarketEvent,
		context: any,
	): Promise<PredictiveAnalysis>;
	getEnsemblePrediction(predictions: any[]): Promise<EnsemblePrediction>;
	calibrateModels(historicalData: any[]): Promise<void>;
	evaluatePredictionAccuracy(
		predictions: any[],
		outcomes: any[],
	): Promise<number>;
}

// Narrative Generation Service Interfaces
export interface NarrativeConfig {
	targetAudience: string;
	complexityLevel: string;
	maxLength: number;
	includeVisualizations: boolean;
	autoValidate?: boolean;
	qualityThreshold?: number;
}

export interface NarrativeService {
	configure(config: NarrativeConfig): Promise<void>;
	generateNarrative(
		event: MarketEvent,
		analysis: CausalAnalysis,
		prediction: PredictiveAnalysis,
	): Promise<IntelligentNarrative>;
	adaptNarrative(
		narrative: IntelligentNarrative,
		userProfile: UserProfile,
	): Promise<IntelligentNarrative>;
	validateNarrative(narrative: IntelligentNarrative): Promise<number>;
}

// Visualization Service Interfaces
export interface VisualizationConfig {
	defaultTheme: string;
	interactivityLevel: string;
	accessibilityLevel: string;
	exportFormats: string[];
}

export interface VisualizationService {
	configure(config: VisualizationConfig): Promise<void>;
	generateVisualization(
		data: any,
		type: string,
		config?: any,
	): Promise<Visualization>;
	createDashboard(visualizations: Visualization[]): Promise<any>;
	exportVisualization(
		visualization: Visualization,
		format: string,
	): Promise<Buffer>;
}

// User Management Service Interfaces
export interface UserManagementConfig {
	authProvider: string;
	sessionTimeout: number;
	enableBehaviorTracking: boolean;
}

export interface UserManagementService {
	configure(config: UserManagementConfig): Promise<void>;
	createUserProfile(userData: any): Promise<UserProfile>;
	getUserProfile(userId: string): Promise<UserProfile | null>;
	updateUserProfile(
		userId: string,
		updates: Partial<UserProfile>,
	): Promise<UserProfile>;
	trackUserInteraction(interaction: UserInteraction): Promise<void>;
	analyzeBehavior(userId: string): Promise<any>;
}

// Recommendation Service Interfaces
export interface RecommendationConfig {
	algorithms: string[];
	personalizeWeight: number;
	freshnessFactor: number;
	diversityFactor: number;
}

export interface RecommendationService {
	configure(config: RecommendationConfig): Promise<void>;
	generateRecommendations(
		userId: string,
		context?: any,
	): Promise<Recommendation[]>;
	personalizeContent(content: any, userProfile: UserProfile): Promise<any>;
	trackRecommendationPerformance(
		recommendationId: string,
		outcome: string,
	): Promise<void>;
}

// Notification Service Interfaces
export interface NotificationConfig {
	channels: string[];
	batchingEnabled: boolean;
	retryAttempts: number;
	quietHoursEnabled: boolean;
}

export interface NotificationService {
	configure(config: NotificationConfig): Promise<void>;
	sendNotification(notification: Notification): Promise<boolean>;
	scheduleNotification(
		notification: Notification,
		scheduledTime: Date,
	): Promise<string>;
	cancelNotification(notificationId: string): Promise<boolean>;
	getNotificationHistory(userId: string): Promise<Notification[]>;
}

// Community Service Interfaces
export interface CommunityConfig {
	gamificationEnabled: boolean;
	moderationEnabled: boolean;
	reputationSystem: boolean;
}

export interface CommunityService {
	configure(config: CommunityConfig): Promise<void>;
	createDiscussion(
		userId: string,
		topic: string,
		content: string,
	): Promise<any>;
	addComment(
		discussionId: string,
		userId: string,
		content: string,
	): Promise<any>;
	awardAchievement(userId: string, achievementType: string): Promise<any>;
	updateLeaderboard(userId: string, points: number): Promise<void>;
}

// API Service Interfaces
export interface APIConfig {
	rateLimiting: Record<string, number>;
	authentication: string;
	cors: string[];
	caching: boolean;
}

export interface PublicAPIService {
	configure(config: APIConfig): Promise<void>;
	getMarketEvents(filters?: any): Promise<MarketEvent[]>;
	getNarrative(eventId: string): Promise<IntelligentNarrative>;
	getAnalysis(eventId: string): Promise<CausalAnalysis>;
	getPrediction(eventId: string): Promise<PredictiveAnalysis>;
}

export interface B2BAPIService {
	configure(config: APIConfig): Promise<void>;
	getBulkData(request: any): Promise<any>;
	getCustomAnalytics(parameters: any): Promise<any>;
	webhookRegistration(url: string, events: string[]): Promise<string>;
	getAPIUsageStats(clientId: string): Promise<any>;
}

// Service Factory Interfaces
export interface ServiceRegistry {
	financialDataAPI: FinancialDataAPIService;
	eventDetection: EventDetectionService;
	causalAnalysis: CausalAnalysisService;
	prediction: PredictionService;
	narrative: NarrativeService;
	visualization: VisualizationService;
	userManagement: UserManagementService;
	recommendation: RecommendationService;
	notification: NotificationService;
	community: CommunityService;
	publicAPI: PublicAPIService;
	b2bAPI: B2BAPIService;
}

export interface ServiceConfiguration {
	environment: "development" | "staging" | "production";
	logging: {
		level: string;
		destination: string;
	};
	monitoring: {
		enabled: boolean;
		metricsEndpoint?: string;
	};
	cache: {
		enabled: boolean;
		provider?: string;
		ttl?: number;
	};
}

export interface ServiceFactory {
	initialize(config: ServiceConfiguration): Promise<void>;
	getService<T extends keyof ServiceRegistry>(
		serviceName: T,
	): ServiceRegistry[T];
	shutdown(): Promise<void>;
}
