// Common Types and Utility Interfaces

// Generic Utility Types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Timestamp = Date | string | number;

export interface PaginationParams {
	page: number;
	limit: number;
	offset?: number;
}

export interface PaginationMetadata {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
	hasPrevious: boolean;
}

export interface PaginatedResponse<T> {
	data: T[];
	pagination: PaginationMetadata;
}

export interface SortParams {
	field: string;
	direction: "asc" | "desc";
}

export interface FilterParams {
	field: string;
	operator:
		| "eq"
		| "ne"
		| "gt"
		| "gte"
		| "lt"
		| "lte"
		| "in"
		| "nin"
		| "contains"
		| "startsWith"
		| "endsWith";
	value: any;
}

export interface QueryParams {
	filters?: FilterParams[];
	sort?: SortParams[];
	pagination?: PaginationParams;
	include?: string[];
	search?: string;
}

// Configuration Types
export interface DatabaseConfig {
	host: string;
	port: number;
	database: string;
	username: string;
	password: string;
	ssl?: boolean;
	pool?: {
		min: number;
		max: number;
		idleTimeoutMillis: number;
	};
}

export interface RedisConfig {
	host: string;
	port: number;
	password?: string;
	database: number;
	keyPrefix: string;
}

export interface LoggingConfig {
	level: "debug" | "info" | "warn" | "error";
	format: "json" | "text";
	destination: "console" | "file" | "both";
	logFile?: string;
	maxFileSize?: string;
	maxFiles?: number;
}

export interface MonitoringConfig {
	enabled: boolean;
	metricsPort?: number;
	healthCheckPath?: string;
	prometheusEndpoint?: string;
}

export interface SecurityConfig {
	cors: {
		origin: string[];
		credentials: boolean;
	};
	rateLimiting: {
		windowMs: number;
		max: number;
		skipSuccessfulRequests: boolean;
	};
	jwt: {
		secret: string;
		expiresIn: string;
		issuer: string;
	};
}

// API Types
export interface APIEndpoint {
	path: string;
	method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
	auth: boolean;
	rateLimit?: number;
	validation?: any;
}

export interface APIVersion {
	version: string;
	endpoints: APIEndpoint[];
	deprecated?: boolean;
	deprecationDate?: Date;
}

export interface WebhookConfig {
	url: string;
	events: string[];
	secret: string;
	retryPolicy: {
		maxAttempts: number;
		baseDelay: number;
	};
}

// Cache Types
export interface CacheConfig {
	provider: "redis" | "memory";
	defaultTTL: number;
	keyPrefix: string;
	compression: boolean;
}

export interface CacheKey {
	namespace: string;
	identifier: string;
	version?: string;
}

export interface CacheItem<T> {
	key: string;
	value: T;
	ttl: number;
	createdAt: Date;
	lastAccessedAt: Date;
}

// Queue Types
export interface QueueConfig {
	name: string;
	concurrency: number;
	retryPolicy: {
		attempts: number;
		backoff: "exponential" | "linear" | "fixed";
		delay: number;
	};
}

export interface JobData<T = any> {
	id: string;
	type: string;
	payload: T;
	priority: number;
	attempts: number;
	maxAttempts: number;
	createdAt: Date;
	processedAt?: Date;
	completedAt?: Date;
	failedAt?: Date;
	error?: string;
}

// Metrics Types
export interface MetricPoint {
	name: string;
	value: number;
	timestamp: Date;
	tags: Record<string, string>;
}

export interface PerformanceMetrics {
	responseTime: number;
	throughput: number;
	errorRate: number;
	memoryUsage: number;
	cpuUsage: number;
}

export interface BusinessMetrics {
	activeUsers: number;
	narrativesGenerated: number;
	predictionsAccuracy: number;
	apiCallsTotal: number;
	revenueTotal: number;
}

// Feature Flags
export interface FeatureFlag {
	name: string;
	enabled: boolean;
	conditions?: {
		userSegments?: string[];
		percentage?: number;
		startDate?: Date;
		endDate?: Date;
	};
}

export interface FeatureFlagContext {
	userId?: string;
	userSegment?: string;
	timestamp: Date;
	metadata?: Record<string, any>;
}

// A/B Testing
export interface Experiment {
	id: string;
	name: string;
	description: string;
	hypothesis: string;
	status: "draft" | "running" | "completed" | "paused";
	variants: ExperimentVariant[];
	trafficAllocation: number;
	startDate: Date;
	endDate?: Date;
	successMetrics: string[];
}

export interface ExperimentVariant {
	id: string;
	name: string;
	description: string;
	allocation: number;
	configuration: Record<string, any>;
}

export interface ExperimentAssignment {
	experimentId: string;
	variantId: string;
	userId: string;
	assignedAt: Date;
}

// Data Quality Types
export interface DataQualityRule {
	name: string;
	description: string;
	field: string;
	condition: string;
	threshold: number;
	severity: "warning" | "error";
}

export interface DataQualityMetrics {
	completeness: number;
	accuracy: number;
	consistency: number;
	timeliness: number;
	validity: number;
	uniqueness: number;
}

export interface DataLineage {
	sourceId: string;
	sourceName: string;
	transformations: string[];
	targetId: string;
	targetName: string;
	lastUpdated: Date;
}

// Audit Types
export interface AuditLog {
	id: string;
	userId: string;
	action: string;
	resource: string;
	resourceId: string;
	timestamp: Date;
	ipAddress: string;
	userAgent: string;
	changes?: Record<string, any>;
	metadata?: Record<string, any>;
}

export interface AuditableEntity {
	createdAt: Date;
	updatedAt: Date;
	createdBy: string;
	updatedBy: string;
	version: number;
}

// Generic Repository Types
export interface Repository<T, ID = string> {
	findById(id: ID): Promise<T | null>;
	findAll(params?: QueryParams): Promise<PaginatedResponse<T>>;
	create(entity: Omit<T, "id" | keyof AuditableEntity>): Promise<T>;
	update(id: ID, updates: Partial<T>): Promise<T>;
	delete(id: ID): Promise<boolean>;
}

// Event Sourcing Types
export interface DomainEvent {
	id: string;
	aggregateId: string;
	aggregateType: string;
	eventType: string;
	eventData: any;
	eventVersion: number;
	timestamp: Date;
	userId?: string;
	metadata?: Record<string, any>;
}

export interface EventStore {
	saveEvents(
		aggregateId: string,
		events: DomainEvent[],
		expectedVersion: number,
	): Promise<void>;
	getEvents(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]>;
	getAllEvents(fromTimestamp?: Date): Promise<DomainEvent[]>;
}

// Health Check Types
export interface HealthCheckResult {
	service: string;
	status: "healthy" | "unhealthy" | "degraded";
	responseTime: number;
	timestamp: Date;
	details?: any;
	error?: string;
}

export interface SystemHealth {
	status: "healthy" | "unhealthy" | "degraded";
	timestamp: Date;
	services: HealthCheckResult[];
	uptime: number;
	version: string;
}

// Environment Types
export type Environment = "development" | "staging" | "production" | "test";

export interface EnvironmentConfig {
	environment: Environment;
	port: number;
	host: string;
	database: DatabaseConfig;
	redis?: RedisConfig;
	logging: LoggingConfig;
	monitoring: MonitoringConfig;
	security: SecurityConfig;
	cache: CacheConfig;
	featureFlags: Record<string, boolean>;
}
