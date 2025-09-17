// Type Exports - Organized by Domain

export * from "./analytics";
// Common and Utility Types
export * from "./common";
export * from "./content";
export * from "./errors";
// Core Domain Types
export * from "./market";
// Service Interface Types
export * from "./services";
export type {
	UserRole,
	InvestmentExperience,
	SubscriptionTier,
	RiskTolerance,
	NotificationChannel,
	NotificationType,
	Priority,
	RecommendationType,
	InvestmentRecommendationType,
	RiskLevel,
	UserActionType,
	UserDemographics,
	NotificationPreferences,
	DashboardConfiguration,
	UserPreferences,
	Holding,
	Portfolio,
	Watchlist,
	ReadingPattern,
	EngagementMetrics,
	AccuracyMetrics,
	BiasIndicator,
	LearningMetrics,
	UserBehavior,
	UserProfile,
	RecommendationMetadata,
	RecommendationContent,
	Recommendation,
	UserInteraction,
	AudienceType,
	ComplexityLevel,
} from "./user";

// Type Guards and Utilities
export const isMarketEvent = (
	obj: any,
): obj is import("./market").MarketEvent => {
	return obj && typeof obj.id === "string" && typeof obj.eventType === "string";
};

export const isUserProfile = (
	obj: any,
): obj is import("./user").UserProfile => {
	return (
		obj && typeof obj.userId === "string" && obj.demographics && obj.preferences
	);
};

export const isApplicationError = (
	obj: any,
): obj is import("./errors").ApplicationError => {
	return obj && obj.code && obj.message && obj.severity && obj.metadata;
};

export const isPaginatedResponse = <T>(
	obj: any,
): obj is import("./common").PaginatedResponse<T> => {
	return (
		obj &&
		Array.isArray(obj.data) &&
		obj.pagination &&
		typeof obj.pagination.total === "number"
	);
};

// Type Assertion Utilities
export const assertMarketEvent = (obj: any): import("./market").MarketEvent => {
	if (!isMarketEvent(obj)) {
		throw new Error("Object is not a valid MarketEvent");
	}
	return obj;
};

export const assertUserProfile = (obj: any): import("./user").UserProfile => {
	if (!isUserProfile(obj)) {
		throw new Error("Object is not a valid UserProfile");
	}
	return obj;
};

// Validation Utilities
export const validatePaginationParams = (
	params: any,
): import("./common").PaginationParams => {
	const page = Math.max(1, parseInt(params.page) || 1);
	const limit = Math.min(100, Math.max(1, parseInt(params.limit) || 10));
	const offset = (page - 1) * limit;

	return { page, limit, offset };
};

export const validateQueryParams = (
	params: any,
): import("./common").QueryParams => {
	return {
		filters: Array.isArray(params.filters) ? params.filters : [],
		sort: Array.isArray(params.sort) ? params.sort : [],
		pagination: params.pagination
			? validatePaginationParams(params.pagination)
			: undefined,
		include: Array.isArray(params.include) ? params.include : [],
		search: typeof params.search === "string" ? params.search : undefined,
	};
};

// Enum Value Validators
export const isValidEventType = (
	value: string,
): value is import("./market").EventType => {
	const EventType = require("./market").EventType;
	return Object.values(EventType).includes(value);
};

export const isValidComplexityLevel = (
	value: string,
): value is import("./content").ComplexityLevel => {
	const ComplexityLevel = require("./content").ComplexityLevel;
	return Object.values(ComplexityLevel).includes(value);
};

export const isValidRiskTolerance = (
	value: string,
): value is import("./user").RiskTolerance => {
	const RiskTolerance = require("./user").RiskTolerance;
	return Object.values(RiskTolerance).includes(value);
};

export const isValidTimeHorizon = (
	value: string,
): value is import("./analytics").TimeHorizon => {
	const TimeHorizon = require("./analytics").TimeHorizon;
	return Object.values(TimeHorizon).includes(value);
};

// Data Transformation Utilities
export const transformMarketDataToChartData = (
	dataPoints: import("./market").MarketDataPoint[],
): import("./content").DataPoint[] => {
	return dataPoints.map((point) => ({
		x: point.timestamp,
		y: typeof point.value === "number" ? point.value : parseFloat(point.value),
		metadata: point.metadata,
	}));
};

export const createPaginationMetadata = (
	page: number,
	limit: number,
	total: number,
): import("./common").PaginationMetadata => {
	const totalPages = Math.ceil(total / limit);

	return {
		page,
		limit,
		total,
		totalPages,
		hasNext: page < totalPages,
		hasPrevious: page > 1,
	};
};

// Default Values and Constants
export const DEFAULT_PAGINATION_LIMIT = 20;
export const MAX_PAGINATION_LIMIT = 100;
export const DEFAULT_CACHE_TTL = 300; // 5 minutes
export const DEFAULT_API_TIMEOUT = 30000; // 30 seconds
export const DEFAULT_RETRY_ATTEMPTS = 3;

// Error Factories
export const createApplicationError = (
	code: import("./errors").ErrorCode,
	message: string,
	severity: import("./errors").ErrorSeverity,
	service: string,
	operation: string,
	additionalData?: any,
): import("./errors").ApplicationError => ({
	code,
	message,
	severity,
	metadata: {
		timestamp: new Date(),
		service,
		operation,
		additionalData,
	},
	retryable: false,
});

export const createValidationError = (
	details: import("./errors").ValidationErrorDetail[],
	service: string,
	operation: string,
): import("./errors").ValidationError => ({
	code: "VALIDATION_ERROR" as import("./errors").ErrorCode.VALIDATION_ERROR,
	message: "Validation failed",
	severity: "MEDIUM" as import("./errors").ErrorSeverity.MEDIUM,
	metadata: {
		timestamp: new Date(),
		service,
		operation,
	},
	retryable: false,
	details,
});

// Response Factories
export const createSuccessResponse = <T>(
	data: T,
	requestId?: string,
): import("./errors").SuccessResponse<T> => ({
	success: true,
	data,
	metadata: {
		timestamp: new Date().toISOString(),
		requestId,
	},
});

export const createErrorResponse = (
	error: import("./errors").ApplicationError,
	requestId?: string,
): import("./errors").ErrorResponse => ({
	success: false,
	error: {
		code: error.code,
		message: error.message,
		details: "details" in error ? (error as any).details : undefined,
		timestamp: new Date().toISOString(),
		requestId,
	},
});
