import {
	type ApplicationError,
	ErrorCode,
	ErrorSeverity,
} from "@/types/errors";
import type {
	FinancialDataAPIService,
	ServiceConfiguration,
	ServiceFactory,
	ServiceRegistry,
} from "@/types/services";
import { FinancialDataAPIClient } from "./financial-data-client";

class ServiceRegistryImpl implements ServiceFactory {
	private services: Partial<ServiceRegistry> = {};
	private config: ServiceConfiguration | null = null;
	private isInitialized = false;

	async initialize(config: ServiceConfiguration): Promise<void> {
		this.config = config;
		await this.initializeServices();
		this.isInitialized = true;
	}

	getService<T extends keyof ServiceRegistry>(
		serviceName: T,
	): ServiceRegistry[T] {
		if (!this.isInitialized) {
			throw this.createError(
				ErrorCode.MISSING_CONFIGURATION,
				"Service registry not initialized",
				ErrorSeverity.CRITICAL,
			);
		}

		const service = this.services[serviceName];
		if (!service) {
			throw this.createError(
				ErrorCode.SERVICE_UNAVAILABLE,
				`Service '${serviceName}' not available`,
				ErrorSeverity.HIGH,
				{ serviceName },
			);
		}

		return service as ServiceRegistry[T];
	}

	async shutdown(): Promise<void> {
		// Cleanup services if they have shutdown methods
		this.services = {};
		this.isInitialized = false;
	}

	private async initializeServices(): Promise<void> {
		try {
			// Initialize Financial Data API Service
			await this.initializeFinancialDataAPI();

			// TODO: Initialize other services as they are implemented
			// await this.initializeEventDetection()
			// await this.initializeCausalAnalysis()
			// await this.initializePrediction()
			// await this.initializeNarrative()
			// await this.initializeVisualization()
			// await this.initializeUserManagement()
			// await this.initializeRecommendation()
			// await this.initializeNotification()
			// await this.initializeCommunity()
			// await this.initializePublicAPI()
			// await this.initializeB2BAPI()
		} catch (error) {
			throw this.createError(
				ErrorCode.SERVICE_UNAVAILABLE,
				"Failed to initialize services",
				ErrorSeverity.CRITICAL,
				{ error: error instanceof Error ? error.message : String(error) },
			);
		}
	}

	private async initializeFinancialDataAPI(): Promise<void> {
		if (!process.env.FINANCIAL_DATASETS_API_KEY) {
			throw this.createError(
				ErrorCode.MISSING_CONFIGURATION,
				"FINANCIAL_DATASETS_API_KEY environment variable is required",
				ErrorSeverity.CRITICAL,
			);
		}

		const client = new FinancialDataAPIClient();

		await client.initialize({
			apiKey: process.env.FINANCIAL_DATASETS_API_KEY,
			baseUrl:
				process.env.FINANCIAL_DATASETS_API_URL ||
				"https://api.financialdatasets.ai/v1",
			rateLimit: parseInt(process.env.FINANCIAL_DATASETS_RATE_LIMIT || "100"),
			timeout: parseInt(process.env.FINANCIAL_DATASETS_TIMEOUT || "30000"),
		});

		this.services.financialDataAPI = client;
	}

	private createError(
		code: ErrorCode,
		message: string,
		severity: ErrorSeverity,
		additionalData?: any,
	): ApplicationError {
		return {
			code,
			message,
			severity,
			metadata: {
				timestamp: new Date(),
				service: "service-registry",
				operation: "initialization",
				additionalData,
			},
			retryable: false,
		};
	}
}

// Singleton instance
let serviceRegistry: ServiceRegistryImpl | null = null;

export const getServiceRegistry = (): ServiceRegistryImpl => {
	if (!serviceRegistry) {
		serviceRegistry = new ServiceRegistryImpl();
	}
	return serviceRegistry;
};

export const initializeServices = async (
	config: ServiceConfiguration,
): Promise<void> => {
	const registry = getServiceRegistry();
	await registry.initialize(config);
};

// Service access helpers
export const getFinancialDataAPI = (): FinancialDataAPIService => {
	return getServiceRegistry().getService("financialDataAPI");
};

// Configuration builder
export const createServiceConfiguration = (
	environment: "development" | "staging" | "production",
): ServiceConfiguration => {
	const baseConfig: ServiceConfiguration = {
		environment,
		logging: {
			level: environment === "development" ? "debug" : "info",
			destination: environment === "development" ? "console" : "file",
		},
		monitoring: {
			enabled: environment === "production",
			metricsEndpoint: process.env.METRICS_ENDPOINT,
		},
		cache: {
			enabled: true,
			provider: "memory", // TODO: Use Redis in production
			ttl: 300, // 5 minutes
		},
	};

	// Environment-specific overrides
	switch (environment) {
		case "development":
			return {
				...baseConfig,
				logging: {
					level: "debug",
					destination: "console",
				},
				cache: {
					enabled: true,
					provider: "memory",
					ttl: 60, // 1 minute for faster dev feedback
				},
			};

		case "staging":
			return {
				...baseConfig,
				logging: {
					level: "info",
					destination: "both",
				},
				monitoring: {
					enabled: true,
					metricsEndpoint: process.env.STAGING_METRICS_ENDPOINT,
				},
			};

		case "production":
			return {
				...baseConfig,
				logging: {
					level: "warn",
					destination: "file",
				},
				monitoring: {
					enabled: true,
					metricsEndpoint: process.env.METRICS_ENDPOINT,
				},
				cache: {
					enabled: true,
					provider: "redis", // TODO: Implement Redis provider
					ttl: 600, // 10 minutes
				},
			};


		default:
			return baseConfig;
	}
};

// Health check for all services
export const checkServiceHealth = async (): Promise<{
	status: "healthy" | "unhealthy" | "degraded";
	services: Record<
		string,
		{ status: string; responseTime: number; error?: string }
	>;
}> => {
	const results: Record<
		string,
		{ status: string; responseTime: number; error?: string }
	> = {};

	try {
		const registry = getServiceRegistry();

		// Check Financial Data API
		try {
			const start = Date.now();
			const financialAPI = registry.getService("financialDataAPI");
			const isHealthy = await financialAPI.validateApiConnection();
			const responseTime = Date.now() - start;

			results.financialDataAPI = {
				status: isHealthy ? "healthy" : "unhealthy",
				responseTime,
			};
		} catch (error) {
			results.financialDataAPI = {
				status: "unhealthy",
				responseTime: 0,
				error: error instanceof Error ? error.message : String(error),
			};
		}

		// TODO: Add health checks for other services as they are implemented

		// Determine overall status
		const allHealthy = Object.values(results).every(
			(r) => r.status === "healthy",
		);
		const anyHealthy = Object.values(results).some(
			(r) => r.status === "healthy",
		);

		const status = allHealthy
			? "healthy"
			: anyHealthy
				? "degraded"
				: "unhealthy";

		return { status, services: results };
	} catch (error) {
		return {
			status: "unhealthy",
			services: {
				registry: {
					status: "unhealthy",
					responseTime: 0,
					error: error instanceof Error ? error.message : String(error),
				},
			},
		};
	}
};
