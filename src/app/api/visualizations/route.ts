import { type NextRequest, NextResponse } from "next/server";
import { ChartGenerator } from "@/lib/visualization/chart-generator";
import { createErrorResponse, createSuccessResponse } from "@/types";
import { ChartTheme, VisualizationType } from "@/types/content";
import { ApplicationError, ErrorCode, ErrorSeverity, isApplicationError } from "@/types/errors";

// Singleton chart generator
let chartGenerator: ChartGenerator | null = null;

async function getChartGenerator(): Promise<ChartGenerator> {
	if (!chartGenerator) {
		chartGenerator = new ChartGenerator();
		await chartGenerator.configure({
			defaultTheme: "AUTO",
			interactivityLevel: "ADVANCED",
			accessibilityLevel: "WCAG_AA",
			exportFormats: ["png", "svg", "pdf"],
		});
	}
	return chartGenerator;
}

export async function POST(request: NextRequest) {
	const requestId = crypto.randomUUID();

	try {
		const body = await request.json();

		// Validate required fields
		if (!body.data) {
			const error: ApplicationError = {
				code: ErrorCode.VALIDATION_ERROR,
				message: "Request body must contain data",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "visualizations-api",
					operation: "generate-visualization",
					requestId,
				},
				retryable: false,
			};
			return NextResponse.json(createErrorResponse(error, requestId), {
				status: 400,
			});
		}

		if (!body.type) {
			const error: ApplicationError = {
				code: ErrorCode.VALIDATION_ERROR,
				message: "Visualization type is required",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "visualizations-api",
					operation: "generate-visualization",
					requestId,
				},
				retryable: false,
			};
			return NextResponse.json(createErrorResponse(error, requestId), {
				status: 400,
			});
		}

		// Validate visualization type
		const validTypes = Object.values(VisualizationType);
		if (!validTypes.includes(body.type as VisualizationType)) {
			const error: ApplicationError = {
				code: ErrorCode.VALIDATION_ERROR,
				message: `Invalid visualization type. Must be one of: ${validTypes.join(", ")}`,
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "visualizations-api",
					operation: "generate-visualization",
					requestId,
					additionalData: { providedType: body.type, validTypes },
				},
				retryable: false,
			};
			return NextResponse.json(createErrorResponse(error, requestId), {
				status: 400,
			});
		}

		const generator = await getChartGenerator();

		// Generate visualization
		const visualization = await generator.generateVisualization(
			body.data,
			body.type,
			body.config,
		);

		return NextResponse.json(
			createSuccessResponse(
				{
					visualization,
					metadata: {
						type: body.type,
						dataPointCount: Array.isArray(body.data) ? body.data.length : 1,
						generatedAt: new Date().toISOString(),
						hasInteractivity:
							visualization.interactivity.zoom ||
							visualization.interactivity.pan,
						isAccessible:
							visualization.configuration.accessibility.screenReaderSupport,
					},
				},
				requestId,
			),
		);
	} catch (error) {
		console.error("Visualization generation API error:", error);

		if (isApplicationError(error) || (error as any).code) {
			const appError = error as ApplicationError;
			const status = getHttpStatusFromErrorCode(appError.code);
			return NextResponse.json(createErrorResponse(appError, requestId), {
				status,
			});
		}

		const genericError: ApplicationError = {
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "An unexpected error occurred during visualization generation",
			severity: ErrorSeverity.HIGH,
			metadata: {
				timestamp: new Date(),
				service: "visualizations-api",
				operation: "generate-visualization",
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

export async function PUT(request: NextRequest) {
	const requestId = crypto.randomUUID();

	try {
		const body = await request.json();

		// Validate required fields for dashboard creation
		if (!body.visualizations || !Array.isArray(body.visualizations)) {
			const error: ApplicationError = {
				code: ErrorCode.VALIDATION_ERROR,
				message: "Request body must contain visualizations array",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "visualizations-api",
					operation: "create-dashboard",
					requestId,
				},
				retryable: false,
			};
			return NextResponse.json(createErrorResponse(error, requestId), {
				status: 400,
			});
		}

		if (body.visualizations.length === 0 || body.visualizations.length > 12) {
			const error: ApplicationError = {
				code: ErrorCode.VALIDATION_ERROR,
				message: "Dashboard must contain between 1 and 12 visualizations",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "visualizations-api",
					operation: "create-dashboard",
					requestId,
					additionalData: { visualizationCount: body.visualizations.length },
				},
				retryable: false,
			};
			return NextResponse.json(createErrorResponse(error, requestId), {
				status: 400,
			});
		}

		const generator = await getChartGenerator();

		// Create dashboard
		const dashboard = await generator.createDashboard(body.visualizations);

		return NextResponse.json(
			createSuccessResponse(
				{
					dashboard,
					metadata: {
						visualizationCount: body.visualizations.length,
						layout: `${dashboard.layout.columns}x${dashboard.layout.rows}`,
						interactionCount: dashboard.interactions.length,
						isResponsive:
							dashboard.responsiveness.mobile &&
							dashboard.responsiveness.tablet,
						createdAt: new Date().toISOString(),
					},
				},
				requestId,
			),
		);
	} catch (error) {
		console.error("Dashboard creation API error:", error);

		if (isApplicationError(error) || (error as any).code) {
			const appError = error as ApplicationError;
			const status = getHttpStatusFromErrorCode(appError.code);
			return NextResponse.json(createErrorResponse(appError, requestId), {
				status,
			});
		}

		const genericError: ApplicationError = {
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "An unexpected error occurred during dashboard creation",
			severity: ErrorSeverity.HIGH,
			metadata: {
				timestamp: new Date(),
				service: "visualizations-api",
				operation: "create-dashboard",
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

export async function PATCH(request: NextRequest) {
	const requestId = crypto.randomUUID();

	try {
		const { searchParams } = new URL(request.url);
		const visualizationId = searchParams.get("id");
		const format = searchParams.get("format") || "png";

		if (!visualizationId) {
			const error: ApplicationError = {
				code: ErrorCode.VALIDATION_ERROR,
				message: "Visualization ID is required for export",
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "visualizations-api",
					operation: "export-visualization",
					requestId,
				},
				retryable: false,
			};
			return NextResponse.json(createErrorResponse(error, requestId), {
				status: 400,
			});
		}

		const validFormats = ["png", "svg", "pdf", "json"];
		if (!validFormats.includes(format)) {
			const error: ApplicationError = {
				code: ErrorCode.VALIDATION_ERROR,
				message: `Invalid export format. Must be one of: ${validFormats.join(", ")}`,
				severity: ErrorSeverity.MEDIUM,
				metadata: {
					timestamp: new Date(),
					service: "visualizations-api",
					operation: "export-visualization",
					requestId,
					additionalData: { providedFormat: format, validFormats },
				},
				retryable: false,
			};
			return NextResponse.json(createErrorResponse(error, requestId), {
				status: 400,
			});
		}

		// For this implementation, create a mock visualization object
		// In production, this would retrieve the visualization from database
		const mockVisualization = {
			id: visualizationId,
			type: VisualizationType.LINE_CHART,
			title: "Sample Visualization",
			description: "Sample visualization for export",
			data: {
				datasets: [],
				annotations: [],
				timeRange: { start: new Date(), end: new Date() },
				filters: [],
			},
			configuration: {
				theme: ChartTheme.LIGHT,
				responsive: true,
				interactive: true,
				exportable: true,
				accessibility: {
					highContrast: false,
					screenReaderSupport: true,
					keyboardNavigation: true,
					altText: "Financial chart",
				},
			},
			interactivity: {
				zoom: true,
				pan: true,
				hover: true,
				click: true,
				brush: false,
				tooltip: true,
			},
		};

		const generator = await getChartGenerator();

		// Export visualization
		const exportBuffer = await generator.exportVisualization(
			mockVisualization,
			format,
		);

		// Set appropriate headers for download
		const headers = new Headers();
		headers.set("Content-Type", getContentType(format));
		headers.set(
			"Content-Disposition",
			`attachment; filename="visualization_${visualizationId}.${format}"`,
		);
		headers.set("Content-Length", exportBuffer.length.toString());

		return new NextResponse(new Uint8Array(exportBuffer), { headers });
	} catch (error) {
		console.error("Visualization export API error:", error);

		if (isApplicationError(error) || (error as any).code) {
			const appError = error as ApplicationError;
			const status = getHttpStatusFromErrorCode(appError.code);
			return NextResponse.json(createErrorResponse(appError, requestId), {
				status,
			});
		}

		const genericError: ApplicationError = {
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "An unexpected error occurred during visualization export",
			severity: ErrorSeverity.HIGH,
			metadata: {
				timestamp: new Date(),
				service: "visualizations-api",
				operation: "export-visualization",
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
		const action = searchParams.get("action") || "list";

		if (action === "list") {
			// Return list of supported visualization types and their capabilities
			const supportedTypes = Object.values(VisualizationType).map((type) => ({
				type,
				description: getVisualizationDescription(type),
				features: getVisualizationFeatures(type),
				dataRequirements: getDataRequirements(type),
			}));

			return NextResponse.json(
				createSuccessResponse(
					{
						supportedTypes,
						capabilities: {
							themes: Object.values(ChartTheme),
							interactivityLevels: ["NONE", "BASIC", "ADVANCED"],
							accessibilityLevels: ["BASIC", "WCAG_A", "WCAG_AA", "WCAG_AAA"],
							exportFormats: ["png", "svg", "pdf", "json"],
						},
						metadata: {
							totalTypes: supportedTypes.length,
							timestamp: new Date().toISOString(),
						},
					},
					requestId,
				),
			);
		}

		const error: ApplicationError = {
			code: ErrorCode.VALIDATION_ERROR,
			message: "Invalid action parameter",
			severity: ErrorSeverity.LOW,
			metadata: {
				timestamp: new Date(),
				service: "visualizations-api",
				operation: "get-info",
				requestId,
			},
			retryable: false,
		};
		return NextResponse.json(createErrorResponse(error, requestId), {
			status: 400,
		});
	} catch (error) {
		console.error("Visualizations GET API error:", error);

		const genericError: ApplicationError = {
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "An unexpected error occurred",
			severity: ErrorSeverity.MEDIUM,
			metadata: {
				timestamp: new Date(),
				service: "visualizations-api",
				operation: "get-info",
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

// Helper functions
function getContentType(format: string): string {
	switch (format) {
		case "png":
			return "image/png";
		case "svg":
			return "image/svg+xml";
		case "pdf":
			return "application/pdf";
		case "json":
			return "application/json";
		default:
			return "application/octet-stream";
	}
}

function getVisualizationDescription(type: VisualizationType): string {
	switch (type) {
		case VisualizationType.LINE_CHART:
			return "Time series line chart for continuous data";
		case VisualizationType.BAR_CHART:
			return "Bar chart for categorical or discrete data comparison";
		case VisualizationType.CANDLESTICK_CHART:
			return "OHLC candlestick chart for financial price data";
		case VisualizationType.FAN_CHART:
			return "Probability fan chart for forecasting with uncertainty";
		case VisualizationType.PROBABILITY_CHART:
			return "Chart showing probability distributions";
		case VisualizationType.WATERFALL_CHART:
			return "Waterfall chart showing sequential value contributions";
		default:
			return "Interactive financial data visualization";
	}
}

function getVisualizationFeatures(type: VisualizationType): string[] {
	const baseFeatures = [
		"Interactive",
		"Responsive",
		"Accessible",
		"Exportable",
	];

	switch (type) {
		case VisualizationType.LINE_CHART:
			return [...baseFeatures, "Zoom", "Pan", "Multi-series", "Annotations"];
		case VisualizationType.CANDLESTICK_CHART:
			return [...baseFeatures, "Zoom", "Pan", "OHLC Data", "Volume Overlay"];
		case VisualizationType.FAN_CHART:
			return [...baseFeatures, "Uncertainty Bands", "Scenario Visualization"];
		case VisualizationType.PROBABILITY_CHART:
			return [...baseFeatures, "Distribution Analysis", "Statistical Metrics"];
		default:
			return baseFeatures;
	}
}

function getDataRequirements(type: VisualizationType): any {
	switch (type) {
		case VisualizationType.LINE_CHART:
			return {
				required: ["timestamp", "value"],
				optional: ["dataType"],
				minPoints: 2,
			};
		case VisualizationType.CANDLESTICK_CHART:
			return {
				required: ["timestamp", "open", "high", "low", "close"],
				optional: ["volume"],
				minPoints: 1,
			};
		case VisualizationType.FAN_CHART:
			return {
				required: ["scenarios"],
				optional: ["confidence", "timeHorizon"],
				minPoints: 2,
			};
		case VisualizationType.PROBABILITY_CHART:
			return {
				required: ["probability", "type"],
				optional: ["description"],
				minPoints: 2,
			};
		default:
			return {
				required: ["value"],
				optional: ["label"],
				minPoints: 1,
			};
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
