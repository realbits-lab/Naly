import { type NextRequest, NextResponse } from "next/server";
import {
	createServiceConfiguration,
	getFinancialDataAPI,
	initializeServices,
} from "@/lib/service-registry";
import { createErrorResponse, createSuccessResponse } from "@/types";
import { ApplicationError, ErrorCode, ErrorSeverity, isApplicationError } from "@/types/errors";

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
		const yearsParam = searchParams.get("years");

		// Validate required parameters
		if (!ticker) {
			const error: ApplicationError = {
				code: ErrorCode.VALIDATION_ERROR,
				message: "Ticker parameter is required",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "historical-data-api",
					operation: "get-historical-data",
					requestId,
				},
				retryable: false,
			};
			return NextResponse.json(createErrorResponse(error, requestId), {
				status: 400,
			});
		}

		// Parse and validate years parameter
		const years = yearsParam ? parseFloat(yearsParam) : 1;
		if (isNaN(years) || years < 0.1 || years > 20) {
			const error: ApplicationError = {
				code: ErrorCode.VALIDATION_ERROR,
				message: "Years parameter must be a number between 0.1 and 20",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "historical-data-api",
					operation: "get-historical-data",
					requestId,
					additionalData: { years: yearsParam },
				},
				retryable: false,
			};
			return NextResponse.json(createErrorResponse(error, requestId), {
				status: 400,
			});
		}

		// Get historical data
		const financialDataAPI = getFinancialDataAPI();
		const historicalData = await financialDataAPI.getHistoricalData(
			ticker.toUpperCase(),
			years,
		);

		// Add metadata about the data range
		const metadata = {
			ticker: ticker.toUpperCase(),
			years,
			dataPoints: historicalData.length,
			dateRange: {
				start: historicalData.length > 0 ? historicalData[0].timestamp : null,
				end:
					historicalData.length > 0
						? historicalData[historicalData.length - 1].timestamp
						: null,
			},
		};

		return NextResponse.json(
			createSuccessResponse({ data: historicalData, metadata }, requestId),
		);
	} catch (error) {
		console.error("Historical data API error:", error);

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
			message: "An unexpected error occurred while fetching historical data",
			severity: ErrorSeverity.HIGH,
			metadata: {
				timestamp: new Date(),
				service: "historical-data-api",
				operation: "get-historical-data",
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
