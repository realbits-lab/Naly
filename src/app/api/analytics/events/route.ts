import { type NextRequest, NextResponse } from "next/server";
import { AnalyticsEngine } from "@/lib/analytics/analytics-engine";
import { createErrorResponse, createSuccessResponse } from "@/types";
import { ApplicationError, ErrorCode, ErrorSeverity, isApplicationError } from "@/types/errors";
import type { EventType, SignificanceLevel } from "@/types/market";

// Singleton analytics engine
let analyticsEngine: AnalyticsEngine | null = null;

async function getAnalyticsEngine(): Promise<AnalyticsEngine> {
	if (!analyticsEngine) {
		analyticsEngine = new AnalyticsEngine();
		await analyticsEngine.initialize();
	}
	return analyticsEngine;
}

export async function GET(request: NextRequest) {
	const requestId = crypto.randomUUID();

	try {
		const { searchParams } = new URL(request.url);

		// Extract query parameters
		const limit = parseInt(searchParams.get("limit") || "50");
		const significanceParam = searchParams.get("significance");
		const ticker = searchParams.get("ticker");
		const startDateParam = searchParams.get("start_date");
		const endDateParam = searchParams.get("end_date");
		const eventTypesParam = searchParams.get("event_types");

		// Validate limit
		if (limit < 1 || limit > 200) {
			const error: ApplicationError = {
				code: ErrorCode.VALIDATION_ERROR,
				message: "Limit must be between 1 and 200",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "analytics-events-api",
					operation: "get-events",
					requestId,
				},
				retryable: false,
			};
			return NextResponse.json(createErrorResponse(error, requestId), {
				status: 400,
			});
		}

		const engine = await getAnalyticsEngine();

		// If ticker and date range are specified, get ticker-specific events
		if (ticker && startDateParam && endDateParam) {
			const startDate = new Date(startDateParam);
			const endDate = new Date(endDateParam);

			if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
				const error: ApplicationError = {
					code: ErrorCode.VALIDATION_ERROR,
					message: "Invalid date format. Use ISO 8601 format (YYYY-MM-DD)",
					severity: ErrorSeverity.MEDIUM,
					metadata: {
						timestamp: new Date(),
						service: "analytics-events-api",
						operation: "get-events",
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
						service: "analytics-events-api",
						operation: "get-events",
						requestId,
					},
					retryable: false,
				};
				return NextResponse.json(createErrorResponse(error, requestId), {
					status: 400,
				});
			}

			// Parse event types filter
			const eventTypes = eventTypesParam
				? eventTypesParam.split(",").map((et) => et.trim() as EventType)
				: undefined;

			const events = await engine.getTickerEvents(
				ticker,
				startDate,
				endDate,
				eventTypes,
			);

			return NextResponse.json(
				createSuccessResponse(
					{
						events,
						metadata: {
							ticker,
							startDate: startDate.toISOString(),
							endDate: endDate.toISOString(),
							eventCount: events.length,
							eventTypes: eventTypes || "all",
						},
					},
					requestId,
				),
			);
		}

		// Otherwise, get recent events with optional significance filter
		const significanceFilter = significanceParam
			? significanceParam.split(",").map((s) => s.trim() as SignificanceLevel)
			: undefined;

		const events = await engine.getRecentEvents(limit, significanceFilter);

		return NextResponse.json(
			createSuccessResponse(
				{
					events,
					metadata: {
						limit,
						significanceFilter: significanceFilter || "all",
						eventCount: events.length,
					},
				},
				requestId,
			),
		);
	} catch (error) {
		console.error("Analytics events API error:", error);

		if (isApplicationError(error) || (error as any).code) {
			const appError = error as ApplicationError;
			const status = getHttpStatusFromErrorCode(appError.code);
			return NextResponse.json(createErrorResponse(appError, requestId), {
				status,
			});
		}

		const genericError: ApplicationError = {
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "An unexpected error occurred while retrieving events",
			severity: ErrorSeverity.HIGH,
			metadata: {
				timestamp: new Date(),
				service: "analytics-events-api",
				operation: "get-events",
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
