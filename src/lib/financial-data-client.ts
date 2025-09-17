import {
	type APIError,
	ApplicationError,
	ErrorCode,
	ErrorSeverity,
} from "@/types/errors";
import {
	DataSource,
	DataType,
	type MarketDataPoint,
	type MarketDataStream,
	ProcessingFlag,
	QualityRating,
} from "@/types/market";
import type {
	FinancialDataAPIConfig,
	FinancialDataAPIService,
	MarketDataRequest,
} from "@/types/services";

interface RateLimiter {
	requests: number;
	windowStart: number;
	limit: number;
	windowMs: number;
}

interface CachedResponse {
	data: any;
	timestamp: number;
	expiresAt: number;
}

export class FinancialDataAPIClient implements FinancialDataAPIService {
	private config: FinancialDataAPIConfig | null = null;
	private rateLimiter: RateLimiter;
	private cache = new Map<string, CachedResponse>();
	private isInitialized = false;

	constructor() {
		this.rateLimiter = {
			requests: 0,
			windowStart: Date.now(),
			limit: 100, // Default limit
			windowMs: 60000, // 1 minute window
		};
	}

	async initialize(config: FinancialDataAPIConfig): Promise<void> {
		this.validateConfig(config);

		this.config = config;
		this.rateLimiter.limit = config.rateLimit;
		this.isInitialized = true;

		// Test connection
		const isConnected = await this.validateApiConnection();
		if (!isConnected) {
			throw this.createError(
				ErrorCode.API_CONNECTION_ERROR,
				"Failed to establish connection to Financial Datasets API",
				ErrorSeverity.HIGH,
				{ baseUrl: config.baseUrl },
			);
		}
	}

	async validateApiConnection(): Promise<boolean> {
		this.ensureInitialized();

		try {
			const response = await fetch(`${this.config!.baseUrl}/health`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${this.config!.apiKey}`,
					"Content-Type": "application/json",
				},
				signal: AbortSignal.timeout(this.config!.timeout),
			});

			return response.ok;
		} catch (error) {
			console.error("API connection validation failed:", error);
			return false;
		}
	}

	async getMarketData(request: MarketDataRequest): Promise<MarketDataPoint[]> {
		this.ensureInitialized();
		this.validateMarketDataRequest(request);

		const cacheKey = this.generateCacheKey("marketData", request);
		const cached = this.getFromCache(cacheKey);
		if (cached) {
			return cached as MarketDataPoint[];
		}

		await this.checkRateLimit();

		try {
			const queryParams = new URLSearchParams({
				ticker: request.ticker,
				start_date: request.startDate.toISOString(),
				end_date: request.endDate.toISOString(),
				data_types: request.dataTypes.join(","),
				...(request.frequency && { frequency: request.frequency }),
			});

			const response = await fetch(
				`${this.config!.baseUrl}/market-data?${queryParams}`,
				{
					method: "GET",
					headers: {
						Authorization: `Bearer ${this.config!.apiKey}`,
						"Content-Type": "application/json",
					},
					signal: AbortSignal.timeout(this.config!.timeout),
				},
			);

			if (!response.ok) {
				throw await this.handleApiError(response);
			}

			const rawData = await response.json();
			const marketDataPoints = this.transformToMarketDataPoints(
				rawData,
				request.ticker,
			);

			// Cache for 5 minutes for most recent data, longer for historical
			const cacheTime = this.isRecentData(request.endDate)
				? 5 * 60 * 1000
				: 60 * 60 * 1000;
			this.setCache(cacheKey, marketDataPoints, cacheTime);

			return marketDataPoints;
		} catch (error) {
			if (isApplicationError(error)) {
				throw error;
			}

			throw this.createError(
				ErrorCode.API_CONNECTION_ERROR,
				`Failed to fetch market data for ${request.ticker}`,
				ErrorSeverity.HIGH,
				{
					ticker: request.ticker,
					error: error instanceof Error ? error.message : String(error),
				},
			);
		}
	}

	async streamMarketData(tickers: string[]): Promise<MarketDataStream> {
		this.ensureInitialized();

		if (!tickers.length || tickers.length > 50) {
			throw this.createError(
				ErrorCode.VALIDATION_ERROR,
				"Invalid ticker count: must be between 1 and 50",
				ErrorSeverity.MEDIUM,
				{ tickerCount: tickers.length },
			);
		}

		try {
			const response = await fetch(`${this.config!.baseUrl}/stream`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${this.config!.apiKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ tickers }),
				signal: AbortSignal.timeout(this.config!.timeout),
			});

			if (!response.ok) {
				throw await this.handleApiError(response);
			}

			const reader = response.body?.getReader();
			if (!reader) {
				throw this.createError(
					ErrorCode.API_INVALID_RESPONSE,
					"No response body received from stream endpoint",
					ErrorSeverity.HIGH,
				);
			}

			const dataPoints: MarketDataPoint[] = [];
			const startTime = new Date();

			return {
				source: DataSource.FINANCIAL_DATASETS_API,
				dataPoints,
				metadata: {
					startTime,
					endTime: new Date(), // Will be updated as stream progresses
					totalPoints: 0,
					averageLatency: 0,
					errorRate: 0,
				},
			};
		} catch (error) {
			if (isApplicationError(error)) {
				throw error;
			}

			throw this.createError(
				ErrorCode.API_CONNECTION_ERROR,
				"Failed to establish market data stream",
				ErrorSeverity.HIGH,
				{
					tickers,
					error: error instanceof Error ? error.message : String(error),
				},
			);
		}
	}

	async getHistoricalData(
		ticker: string,
		years: number,
	): Promise<MarketDataPoint[]> {
		if (!ticker || years < 0.1 || years > 20) {
			throw this.createError(
				ErrorCode.VALIDATION_ERROR,
				"Invalid parameters: ticker required, years must be between 0.1 and 20",
				ErrorSeverity.MEDIUM,
				{ ticker, years },
			);
		}

		const endDate = new Date();
		const startDate = new Date();
		startDate.setFullYear(endDate.getFullYear() - years);

		const request: MarketDataRequest = {
			ticker,
			dataTypes: ["STOCK_PRICE", "VOLUME"],
			startDate,
			endDate,
			frequency: "daily",
		};

		return this.getMarketData(request);
	}

	private validateConfig(config: FinancialDataAPIConfig): void {
		if (!config.apiKey) {
			throw new Error("API key is required");
		}
		if (!config.baseUrl) {
			throw new Error("Base URL is required");
		}
		if (config.rateLimit <= 0) {
			throw new Error("Rate limit must be positive");
		}
		if (config.timeout <= 0) {
			throw new Error("Timeout must be positive");
		}
	}

	private validateMarketDataRequest(request: MarketDataRequest): void {
		if (!request.ticker) {
			throw this.createError(
				ErrorCode.VALIDATION_ERROR,
				"Ticker symbol is required",
				ErrorSeverity.MEDIUM,
			);
		}

		if (!request.dataTypes.length) {
			throw this.createError(
				ErrorCode.VALIDATION_ERROR,
				"At least one data type must be specified",
				ErrorSeverity.MEDIUM,
			);
		}

		if (request.startDate >= request.endDate) {
			throw this.createError(
				ErrorCode.VALIDATION_ERROR,
				"Start date must be before end date",
				ErrorSeverity.MEDIUM,
			);
		}
	}

	private ensureInitialized(): void {
		if (!this.isInitialized || !this.config) {
			throw this.createError(
				ErrorCode.MISSING_CONFIGURATION,
				"Financial Data API client not initialized",
				ErrorSeverity.CRITICAL,
			);
		}
	}

	private async checkRateLimit(): Promise<void> {
		const now = Date.now();

		// Reset window if needed
		if (now - this.rateLimiter.windowStart >= this.rateLimiter.windowMs) {
			this.rateLimiter.requests = 0;
			this.rateLimiter.windowStart = now;
		}

		// Check if rate limit exceeded
		if (this.rateLimiter.requests >= this.rateLimiter.limit) {
			const resetTime =
				this.rateLimiter.windowStart + this.rateLimiter.windowMs;
			const waitTime = resetTime - now;

			throw this.createError(
				ErrorCode.API_RATE_LIMIT_ERROR,
				`Rate limit exceeded. Reset in ${Math.ceil(waitTime / 1000)} seconds`,
				ErrorSeverity.HIGH,
				{
					resetTime,
					currentRequests: this.rateLimiter.requests,
					limit: this.rateLimiter.limit,
				},
			);
		}

		this.rateLimiter.requests++;
	}

	private generateCacheKey(type: string, request: any): string {
		return `${type}:${JSON.stringify(request)}`;
	}

	private getFromCache(key: string): any | null {
		const cached = this.cache.get(key);
		if (!cached) return null;

		if (Date.now() > cached.expiresAt) {
			this.cache.delete(key);
			return null;
		}

		return cached.data;
	}

	private setCache(key: string, data: any, ttlMs: number): void {
		const expiresAt = Date.now() + ttlMs;
		this.cache.set(key, { data, timestamp: Date.now(), expiresAt });

		// Basic cache cleanup - remove expired entries
		if (this.cache.size > 1000) {
			const now = Date.now();
			for (const [k, v] of this.cache.entries()) {
				if (now > v.expiresAt) {
					this.cache.delete(k);
				}
			}
		}
	}

	private transformToMarketDataPoints(
		rawData: any,
		ticker: string,
	): MarketDataPoint[] {
		if (!Array.isArray(rawData)) {
			throw this.createError(
				ErrorCode.API_INVALID_RESPONSE,
				"Invalid response format: expected array of data points",
				ErrorSeverity.HIGH,
			);
		}

		return rawData.map((item: any, index: number) => {
			try {
				return {
					source: DataSource.FINANCIAL_DATASETS_API,
					timestamp: new Date(item.timestamp || item.date),
					ticker: ticker,
					dataType: this.mapDataType(item.type || "STOCK_PRICE"),
					value: item.value || item.close || item.price,
					confidence: item.confidence || 0.95,
					metadata: {
						reliability: item.reliability || 0.95,
						freshness: this.calculateFreshness(
							new Date(item.timestamp || item.date),
						),
						sourceQuality: item.quality || QualityRating.GOOD,
						processingFlags: this.determineProcessingFlags(item),
					},
				};
			} catch (error) {
				console.warn(`Failed to transform data point ${index}:`, error);
				throw this.createError(
					ErrorCode.DATA_PARSING_ERROR,
					`Failed to parse data point at index ${index}`,
					ErrorSeverity.MEDIUM,
					{ index, rawItem: item },
				);
			}
		});
	}

	private mapDataType(type: string): DataType {
		const mapping: Record<string, DataType> = {
			price: DataType.STOCK_PRICE,
			volume: DataType.VOLUME,
			sentiment: DataType.SENTIMENT_SCORE,
			news: DataType.NEWS_ITEM,
			filing: DataType.FILING_DATA,
			trade: DataType.TRADE_DATA,
			metric: DataType.FINANCIAL_METRIC,
		};

		return mapping[type.toLowerCase()] || DataType.STOCK_PRICE;
	}

	private calculateFreshness(timestamp: Date): number {
		const ageMs = Date.now() - timestamp.getTime();
		const ageHours = ageMs / (1000 * 60 * 60);

		// Freshness decreases over time (1.0 = current, 0.0 = very old)
		return Math.max(0, Math.min(1, 1 - ageHours / 24));
	}

	private determineProcessingFlags(item: any): ProcessingFlag[] {
		const flags: ProcessingFlag[] = [];

		if (item.normalized) flags.push(ProcessingFlag.NORMALIZED);
		if (item.validated) flags.push(ProcessingFlag.VALIDATED);
		if (item.enriched) flags.push(ProcessingFlag.ENRICHED);
		if (item.anomaly_detected) flags.push(ProcessingFlag.ANOMALY_DETECTED);

		return flags;
	}

	private isRecentData(date: Date): boolean {
		const dayInMs = 24 * 60 * 60 * 1000;
		return Date.now() - date.getTime() < dayInMs;
	}

	private async handleApiError(response: Response): Promise<ApplicationError> {
		let errorBody: any;
		try {
			errorBody = await response.json();
		} catch {
			errorBody = { message: response.statusText };
		}

		const apiError: APIError = {
			code: this.mapHttpStatusToErrorCode(response.status),
			message:
				errorBody.message || `HTTP ${response.status}: ${response.statusText}`,
			severity:
				response.status >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
			metadata: {
				timestamp: new Date(),
				service: "financial-data-api",
				operation: "api-request",
			},
			retryable: response.status >= 500 || response.status === 429,
			statusCode: response.status,
			endpoint: response.url,
			method: "GET",
			responseBody: errorBody,
		};

		return apiError;
	}

	private mapHttpStatusToErrorCode(status: number): ErrorCode {
		switch (status) {
			case 400:
				return ErrorCode.VALIDATION_ERROR;
			case 401:
				return ErrorCode.API_AUTHENTICATION_ERROR;
			case 403:
				return ErrorCode.FORBIDDEN;
			case 404:
				return ErrorCode.NOT_FOUND;
			case 429:
				return ErrorCode.API_RATE_LIMIT_ERROR;
			case 500:
				return ErrorCode.API_CONNECTION_ERROR;
			case 503:
				return ErrorCode.SERVICE_UNAVAILABLE;
			default:
				return ErrorCode.API_CONNECTION_ERROR;
		}
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
				service: "financial-data-api-client",
				operation: "data-fetch",
				additionalData,
			},
			retryable:
				code === ErrorCode.API_RATE_LIMIT_ERROR ||
				severity === ErrorSeverity.HIGH,
		};
	}
}
