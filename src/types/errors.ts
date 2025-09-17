// Error Types and Exception Handling

export enum ErrorCode {
	// General Errors
	INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
	VALIDATION_ERROR = "VALIDATION_ERROR",
	NOT_FOUND = "NOT_FOUND",
	UNAUTHORIZED = "UNAUTHORIZED",
	FORBIDDEN = "FORBIDDEN",
	RATE_LIMITED = "RATE_LIMITED",

	// Database Errors
	DATABASE_CONNECTION_ERROR = "DATABASE_CONNECTION_ERROR",
	DATABASE_QUERY_ERROR = "DATABASE_QUERY_ERROR",
	DATABASE_CONSTRAINT_ERROR = "DATABASE_CONSTRAINT_ERROR",
	DATABASE_TIMEOUT = "DATABASE_TIMEOUT",

	// API Errors
	API_CONNECTION_ERROR = "API_CONNECTION_ERROR",
	API_AUTHENTICATION_ERROR = "API_AUTHENTICATION_ERROR",
	API_RATE_LIMIT_ERROR = "API_RATE_LIMIT_ERROR",
	API_INVALID_RESPONSE = "API_INVALID_RESPONSE",
	API_TIMEOUT = "API_TIMEOUT",

	// Data Processing Errors
	DATA_QUALITY_ERROR = "DATA_QUALITY_ERROR",
	DATA_VALIDATION_ERROR = "DATA_VALIDATION_ERROR",
	DATA_PARSING_ERROR = "DATA_PARSING_ERROR",
	MISSING_DATA_ERROR = "MISSING_DATA_ERROR",

	// Analytics Errors
	MODEL_TRAINING_ERROR = "MODEL_TRAINING_ERROR",
	PREDICTION_ERROR = "PREDICTION_ERROR",
	ANALYSIS_ERROR = "ANALYSIS_ERROR",
	INSUFFICIENT_DATA_ERROR = "INSUFFICIENT_DATA_ERROR",

	// AI/LLM Errors
	AI_SERVICE_ERROR = "AI_SERVICE_ERROR",
	AI_TOKEN_LIMIT_EXCEEDED = "AI_TOKEN_LIMIT_EXCEEDED",
	AI_CONTENT_FILTERED = "AI_CONTENT_FILTERED",
	AI_MODEL_UNAVAILABLE = "AI_MODEL_UNAVAILABLE",

	// User Errors
	USER_NOT_FOUND = "USER_NOT_FOUND",
	USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",
	INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
	SUBSCRIPTION_REQUIRED = "SUBSCRIPTION_REQUIRED",
	SUBSCRIPTION_EXPIRED = "SUBSCRIPTION_EXPIRED",

	// Configuration Errors
	MISSING_CONFIGURATION = "MISSING_CONFIGURATION",
	INVALID_CONFIGURATION = "INVALID_CONFIGURATION",
	SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

export enum ErrorSeverity {
	LOW = "LOW",
	MEDIUM = "MEDIUM",
	HIGH = "HIGH",
	CRITICAL = "CRITICAL",
}

export interface ErrorMetadata {
	timestamp: Date;
	requestId?: string;
	userId?: string;
	service: string;
	operation: string;
	additionalData?: Record<string, any>;
}

export interface ApplicationError {
	code: ErrorCode;
	message: string;
	severity: ErrorSeverity;
	metadata: ErrorMetadata;
	cause?: Error;
	stack?: string;
	retryable: boolean;
}

// ApplicationError creator function
export function createApplicationError(
	code: ErrorCode,
	message: string,
	severity: ErrorSeverity,
	metadata: ErrorMetadata,
	cause?: Error,
	retryable: boolean = false,
): ApplicationError {
	return {
		code,
		message,
		severity,
		metadata,
		cause,
		stack: cause?.stack || new Error().stack,
		retryable,
	};
}

// Type guard for ApplicationError
export function isApplicationError(error: any): error is ApplicationError {
	return (
		error &&
		typeof error === "object" &&
		"code" in error &&
		"severity" in error &&
		"metadata" in error &&
		"retryable" in error
	);
}

export interface ValidationErrorDetail {
	field: string;
	message: string;
	value?: any;
	constraint?: string;
}

export interface ValidationError extends ApplicationError {
	code: ErrorCode.VALIDATION_ERROR;
	details: ValidationErrorDetail[];
}

export interface APIError extends ApplicationError {
	statusCode: number;
	endpoint: string;
	method: string;
	responseBody?: any;
}

export interface DatabaseError extends ApplicationError {
	query?: string;
	parameters?: any[];
	constraint?: string;
}

export interface AIServiceError extends ApplicationError {
	model: string;
	prompt?: string;
	tokensUsed?: number;
	maxTokens?: number;
}

export interface DataQualityError extends ApplicationError {
	dataSource: string;
	qualityMetrics: {
		completeness: number;
		accuracy: number;
		consistency: number;
	};
	failedChecks: string[];
}

// Error Handler Types
export interface ErrorHandler {
	handle(error: ApplicationError): Promise<void>;
	shouldRetry(error: ApplicationError): boolean;
	getRetryDelay(attempt: number): number;
}

export interface ErrorReporter {
	report(error: ApplicationError): Promise<void>;
	reportBatch(errors: ApplicationError[]): Promise<void>;
}

export interface ErrorRecoveryStrategy {
	canRecover(error: ApplicationError): boolean;
	recover(error: ApplicationError, context: any): Promise<any>;
}

// Error Response Types
export interface ErrorResponse {
	success: false;
	error: {
		code: string;
		message: string;
		details?: any;
		timestamp: string;
		requestId?: string;
	};
}

export interface SuccessResponse<T = any> {
	success: true;
	data: T;
	metadata?: {
		timestamp: string;
		requestId?: string;
		pagination?: {
			page: number;
			limit: number;
			total: number;
		};
	};
}

export type APIResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Circuit Breaker Types
export enum CircuitBreakerState {
	CLOSED = "CLOSED",
	OPEN = "OPEN",
	HALF_OPEN = "HALF_OPEN",
}

export interface CircuitBreakerConfig {
	failureThreshold: number;
	timeout: number;
	monitoringPeriod: number;
	expectedErrors: ErrorCode[];
}

export interface CircuitBreakerMetrics {
	state: CircuitBreakerState;
	failureCount: number;
	successCount: number;
	lastFailureTime?: Date;
	lastSuccessTime?: Date;
}

// Retry Policy Types
export interface RetryPolicy {
	maxAttempts: number;
	baseDelay: number;
	maxDelay: number;
	backoffMultiplier: number;
	retryableErrors: ErrorCode[];
}

export interface RetryContext {
	attempt: number;
	totalDelay: number;
	lastError: ApplicationError;
}
