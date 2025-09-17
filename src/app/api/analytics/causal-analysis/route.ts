import { type NextRequest, NextResponse } from "next/server";
import { CausalAnalyzer } from "@/lib/causal-analysis/causal-analyzer";
import { createErrorResponse, createSuccessResponse } from "@/types";
import { ApplicationError, ErrorCode, ErrorSeverity } from "@/types/errors";
import type { MarketEvent } from "@/types/market";

// Singleton causal analyzer
let causalAnalyzer: CausalAnalyzer | null = null;

async function getCausalAnalyzer(): Promise<CausalAnalyzer> {
	if (!causalAnalyzer) {
		causalAnalyzer = new CausalAnalyzer();
		await causalAnalyzer.configure({
			analysisMethod: "STATISTICAL_INFERENCE",
			confidenceThreshold: 0.6,
			maxFactors: 5,
			enableAlternativeExplanations: true,
			useCache: true,
		});
	}
	return causalAnalyzer;
}

export async function POST(request: NextRequest) {
	const requestId = crypto.randomUUID();

	try {
		const body = await request.json();

		// Validate request body
		if (!body.event) {
			const error: ApplicationError = {
				code: ErrorCode.VALIDATION_ERROR,
				message: 'Request body must contain an "event" object',
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "causal-analysis-api",
					operation: "analyze-event",
					requestId,
				},
				retryable: false,
			};
			return NextResponse.json(createErrorResponse(error, requestId), {
				status: 400,
			});
		}

		// Validate event structure
		const event = body.event as MarketEvent;
		if (!event.id || !event.eventType || !event.ticker || !event.timestamp) {
			const error: ApplicationError = {
				code: ErrorCode.VALIDATION_ERROR,
				message: "Event must contain id, eventType, ticker, and timestamp",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "causal-analysis-api",
					operation: "analyze-event",
					requestId,
				},
				retryable: false,
			};
			return NextResponse.json(createErrorResponse(error, requestId), {
				status: 400,
			});
		}

		const analyzer = await getCausalAnalyzer();

		// Perform causal analysis
		const analysis = await analyzer.analyzeEvent(event);

		// Generate explanation if requested
		let explanation: string | undefined;
		if (body.includeExplanation) {
			try {
				explanation = await analyzer.generateExplanation(analysis);
			} catch (error) {
				console.warn("Failed to generate explanation:", error);
				// Continue without explanation rather than failing the entire request
			}
		}

		// Validate analysis if requested
		let validationScore: number | undefined;
		if (body.includeValidation) {
			try {
				validationScore = await analyzer.validateAnalysis(analysis);
			} catch (error) {
				console.warn("Failed to validate analysis:", error);
				// Continue without validation score
			}
		}

		return NextResponse.json(
			createSuccessResponse(
				{
					analysis,
					explanation,
					validationScore,
					metadata: {
						eventId: event.id,
						ticker: event.ticker,
						analysisTimestamp: new Date().toISOString(),
						includeExplanation: !!body.includeExplanation,
						includeValidation: !!body.includeValidation,
					},
				},
				requestId,
			),
		);
	} catch (error) {
		console.error("Causal analysis API error:", error);

		if (error instanceof ApplicationError || (error as any).code) {
			const appError = error as ApplicationError;
			const status = getHttpStatusFromErrorCode(appError.code);
			return NextResponse.json(createErrorResponse(appError, requestId), {
				status,
			});
		}

		const genericError: ApplicationError = {
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "An unexpected error occurred during causal analysis",
			severity: ErrorSeverity.HIGH,
			metadata: {
				timestamp: new Date(),
				service: "causal-analysis-api",
				operation: "analyze-event",
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

export async function GET(request: NextRequest) {
	const requestId = crypto.randomUUID();

	try {
		const { searchParams } = new URL(request.url);

		const eventId = searchParams.get("event_id");
		const includeExplanation =
			searchParams.get("include_explanation") === "true";
		const includeValidation = searchParams.get("include_validation") === "true";

		if (!eventId) {
			const error: ApplicationError = {
				code: ErrorCode.VALIDATION_ERROR,
				message: "event_id parameter is required",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "causal-analysis-api",
					operation: "get-analysis",
					requestId,
				},
				retryable: false,
			};
			return NextResponse.json(createErrorResponse(error, requestId), {
				status: 400,
			});
		}

		// For now, return a placeholder response
		// In a full implementation, this would retrieve the analysis from the database
		const error: ApplicationError = {
			code: ErrorCode.NOT_FOUND,
			message:
				"Analysis retrieval not implemented - use POST to create new analysis",
			severity: ErrorSeverity.LOW,
			metadata: {
				timestamp: new Date(),
				service: "causal-analysis-api",
				operation: "get-analysis",
				requestId,
			},
			retryable: false,
		};

		return NextResponse.json(createErrorResponse(error, requestId), {
			status: 501,
		});
	} catch (error) {
		console.error("Causal analysis GET API error:", error);

		const genericError: ApplicationError = {
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "An unexpected error occurred while retrieving analysis",
			severity: ErrorSeverity.HIGH,
			metadata: {
				timestamp: new Date(),
				service: "causal-analysis-api",
				operation: "get-analysis",
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
		case ErrorCode.MISSING_DATA_ERROR:
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
