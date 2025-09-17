import { type NextRequest, NextResponse } from "next/server";
import {
	checkServiceHealth,
	createServiceConfiguration,
	initializeServices,
} from "@/lib/service-registry";
import { createErrorResponse, createSuccessResponse } from "@/types";
import {
	type ApplicationError,
	ErrorCode,
	ErrorSeverity,
} from "@/types/errors";

// Initialize services on first load
let servicesInitialized = false;

async function ensureServicesInitialized() {
	if (!servicesInitialized) {
		try {
			const environment = (process.env.NODE_ENV || "development") as
				| "development"
				| "staging"
				| "production";
			const config = createServiceConfiguration(environment);
			await initializeServices(config);
			servicesInitialized = true;
		} catch (error) {
			console.error("Failed to initialize services:", error);
			// Don't throw here - we want health check to report this condition
		}
	}
}

export async function GET(request: NextRequest) {
	const requestId = crypto.randomUUID();

	try {
		// Try to initialize services if not already done
		await ensureServicesInitialized();

		// Get detailed health status
		const healthStatus = await checkServiceHealth();

		// Determine HTTP status code based on overall health
		const httpStatus =
			healthStatus.status === "healthy"
				? 200
				: healthStatus.status === "degraded"
					? 200
					: 503;

		const response = createSuccessResponse(
			{
				status: healthStatus.status,
				timestamp: new Date().toISOString(),
				services: healthStatus.services,
				version: process.env.npm_package_version || "1.0.0",
				environment: process.env.NODE_ENV || "development",
				uptime: process.uptime(),
			},
			requestId,
		);

		return NextResponse.json(response, { status: httpStatus });
	} catch (error) {
		console.error("Health check error:", error);

		const healthError: ApplicationError = {
			code: ErrorCode.SERVICE_UNAVAILABLE,
			message: "Health check failed",
			severity: ErrorSeverity.HIGH,
			metadata: {
				timestamp: new Date(),
				service: "health-check",
				operation: "check-health",
				requestId,
				additionalData: {
					originalError: error instanceof Error ? error.message : String(error),
					servicesInitialized,
				},
			},
			retryable: true,
		};

		return NextResponse.json(createErrorResponse(healthError, requestId), {
			status: 503,
		});
	}
}

// Simple health check endpoint for load balancers
export async function HEAD(request: NextRequest) {
	try {
		await ensureServicesInitialized();
		const healthStatus = await checkServiceHealth();

		const httpStatus =
			healthStatus.status === "healthy"
				? 200
				: healthStatus.status === "degraded"
					? 200
					: 503;

		return new NextResponse(null, { status: httpStatus });
	} catch (error) {
		return new NextResponse(null, { status: 503 });
	}
}
