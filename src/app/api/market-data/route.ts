import { type NextRequest, NextResponse } from "next/server";
import {
	createServiceConfiguration,
	getFinancialDataAPI,
	initializeServices,
} from "@/lib/service-registry";
import {
	createErrorResponse,
	createSuccessResponse,
	validateQueryParams,
} from "@/types";
import { ApplicationError, ErrorCode, ErrorSeverity, isApplicationError } from "@/types/errors";
import type { MarketDataRequest } from "@/types/services";

// Initialize services on first load
let servicesInitialized = false;

async function ensureServicesInitialized() {
	if (!servicesInitialized) {
		const environment = (process.env.NODE_ENV || "development") as
			| "development"
			| "staging"
			| "production"
			| "test";
		const config = createServiceConfiguration(environment);
		await initializeServices(config);
		servicesInitialized = true;
	}
}

export async function GET(request: NextRequest) {
	const requestId = crypto.randomUUID();

	try {
		await ensureServicesInitialized();

		const { searchParams } = new URL(request.url);

		// Extract and validate query parameters
		const ticker = searchParams.get("ticker");
		const dataTypesParam = searchParams.get("data_types");
		const startDateParam = searchParams.get("start_date");
		const endDateParam = searchParams.get("end_date");
		const frequency = searchParams.get("frequency") as
			| "realtime"
			| "daily"
			| "weekly"
			| "monthly"
			| null;

		// Validate required parameters
		if (!ticker) {
			const error: ApplicationError = {
				code: ErrorCode.VALIDATION_ERROR,
				message: "Ticker parameter is required",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "market-data-api",
					operation: "get-market-data",
					requestId,
				},
				retryable: false,
			};
			return NextResponse.json(createErrorResponse(error, requestId), {
				status: 400,
			});
		}

		if (!dataTypesParam) {
			const error: ApplicationError = {
				code: ErrorCode.VALIDATION_ERROR,
				message: "data_types parameter is required",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "market-data-api",
					operation: "get-market-data",
					requestId,
				},
				retryable: false,
			};
			return NextResponse.json(createErrorResponse(error, requestId), {
				status: 400,
			});
		}

		if (!startDateParam || !endDateParam) {
			const error: ApplicationError = {
				code: ErrorCode.VALIDATION_ERROR,
				message: "start_date and end_date parameters are required",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "market-data-api",
					operation: "get-market-data",
					requestId,
				},
				retryable: false,
			};
			return NextResponse.json(createErrorResponse(error, requestId), {
				status: 400,
			});
		}

		// Parse parameters
		const dataTypes = dataTypesParam.split(",").map((dt) => dt.trim());
		const startDate = new Date(startDateParam);
		const endDate = new Date(endDateParam);

		// Validate dates
		if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
			const error: ApplicationError = {
				code: ErrorCode.VALIDATION_ERROR,
				message: "Invalid date format. Use ISO 8601 format (YYYY-MM-DD)",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "market-data-api",
					operation: "get-market-data",
					requestId,
				},
				retryable: false,
			};
			return NextResponse.json(createErrorResponse(error, requestId), {
				status: 400,
			});
		}

		if (startDate >= endDate) {
			const error: ApplicationError = {
				code: ErrorCode.VALIDATION_ERROR,
				message: "start_date must be before end_date",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "market-data-api",
					operation: "get-market-data",
					requestId,
				},
				retryable: false,
			};
			return NextResponse.json(createErrorResponse(error, requestId), {
				status: 400,
			});
		}

		// Create request object
		const marketDataRequest: MarketDataRequest = {
			ticker: ticker.toUpperCase(),
			dataTypes,
			startDate,
			endDate,
			...(frequency && { frequency }),
		};

		// Get market data
		const financialDataAPI = getFinancialDataAPI();
		const marketData = await financialDataAPI.getMarketData(marketDataRequest);

		return NextResponse.json(createSuccessResponse(marketData, requestId));
	} catch (error) {
		console.error("Market data API error:", error);

		if (isApplicationError(error) || (error as any).code) {
			const appError = error as ApplicationError;
			const status = getHttpStatusFromErrorCode(appError.code);
			return NextResponse.json(createErrorResponse(appError, requestId), {
				status,
			});
		}

		// Generic error handling
		const genericError: ApplicationError = {
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "An unexpected error occurred while fetching market data",
			severity: ErrorSeverity.HIGH,
			metadata: {
				timestamp: new Date(),
				service: "market-data-api",
				operation: "get-market-data",
				requestId,
				additionalData: {
					originalError: error instanceof Error ? error.message : String(error),
				},
			},
			retryable: true,
		};

		return NextResponse.json(createErrorResponse(genericError, requestId), {
			status: 500,
		});
	}
}

export async function POST(request: NextRequest) {
	const requestId = crypto.randomUUID();

	try {
		await ensureServicesInitialized();

		const body = await request.json();

		// Validate request body
		if (!body.requests || !Array.isArray(body.requests)) {
			const error: ApplicationError = {
				code: ErrorCode.VALIDATION_ERROR,
				message: 'Request body must contain a "requests" array',
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "market-data-api",
					operation: "batch-market-data",
					requestId,
				},
				retryable: false,
			};
			return NextResponse.json(createErrorResponse(error, requestId), {
				status: 400,
			});
		}

		if (body.requests.length === 0 || body.requests.length > 10) {
			const error: ApplicationError = {
				code: ErrorCode.VALIDATION_ERROR,
				message: "Batch requests must contain between 1 and 10 requests",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "market-data-api",
					operation: "batch-market-data",
					requestId,
				},
				retryable: false,
			};
			return NextResponse.json(createErrorResponse(error, requestId), {
				status: 400,
			});
		}

		const financialDataAPI = getFinancialDataAPI();
		const results = [];

		// Process each request in the batch
		for (let i = 0; i < body.requests.length; i++) {
			const req = body.requests[i];

			try {
				// Validate individual request
				if (
					!req.ticker ||
					!req.data_types ||
					!req.start_date ||
					!req.end_date
				) {
					results.push({
						index: i,
						success: false,
						error:
							"Missing required fields: ticker, data_types, start_date, end_date",
					});
					continue;
				}

				const marketDataRequest: MarketDataRequest = {
					ticker: req.ticker.toUpperCase(),
					dataTypes: req.data_types,
					startDate: new Date(req.start_date),
					endDate: new Date(req.end_date),
					...(req.frequency && { frequency: req.frequency }),
				};

				const marketData =
					await financialDataAPI.getMarketData(marketDataRequest);

				results.push({
					index: i,
					success: true,
					data: marketData,
				});
			} catch (error) {
				results.push({
					index: i,
					success: false,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		return NextResponse.json(createSuccessResponse({ results }, requestId));
	} catch (error) {
		console.error("Batch market data API error:", error);

		if (isApplicationError(error) || (error as any).code) {
			const appError = error as ApplicationError;
			const status = getHttpStatusFromErrorCode(appError.code);
			return NextResponse.json(createErrorResponse(appError, requestId), {
				status,
			});
		}

		const genericError: ApplicationError = {
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message:
				"An unexpected error occurred while processing batch market data request",
			severity: ErrorSeverity.HIGH,
			metadata: {
				timestamp: new Date(),
				service: "market-data-api",
				operation: "batch-market-data",
				requestId,
			},
			retryable: true,
		};

		return NextResponse.json(createErrorResponse(genericError, requestId), {
			status: 500,
		});
	}
}

function getHttpStatusFromErrorCode(code: ErrorCode): number {
	switch (code) {
		case ErrorCode.VALIDATION_ERROR:
			return 400;
		case ErrorCode.UNAUTHORIZED:
			return 401;
		case ErrorCode.FORBIDDEN:
			return 403;
		case ErrorCode.NOT_FOUND:
			return 404;
		case ErrorCode.RATE_LIMITED:
		case ErrorCode.API_RATE_LIMIT_ERROR:
			return 429;
		case ErrorCode.SERVICE_UNAVAILABLE:
			return 503;
		case ErrorCode.API_TIMEOUT:
			return 504;
		default:
			return 500;
	}
}
