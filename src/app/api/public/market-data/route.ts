import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { financialDataClient } from "@/lib/financial-data-client";
import { createErrorResponse, createSuccessResponse } from "@/types";
import { ApplicationError, ErrorCode, ErrorSeverity } from "@/types/errors";

const marketDataQuerySchema = z.object({
	ticker: z.string().min(1).max(10),
	period: z
		.enum(["1d", "5d", "1m", "3m", "6m", "1y", "2y", "5y", "max"])
		.default("1d"),
	interval: z
		.enum([
			"1m",
			"2m",
			"5m",
			"15m",
			"30m",
			"60m",
			"90m",
			"1h",
			"1d",
			"5d",
			"1wk",
			"1mo",
			"3mo",
		])
		.default("1d"),
	includePrePost: z.boolean().default(false),
	includeAdjustedClose: z.boolean().default(true),
	includeDividends: z.boolean().default(false),
	includeSplits: z.boolean().default(false),
	format: z.enum(["json", "csv"]).default("json"),
});

const multiTickerQuerySchema = z.object({
	tickers: z.string().refine((val) => {
		const symbols = val
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
		return symbols.length >= 1 && symbols.length <= 50;
	}, "Must provide 1-50 comma-separated ticker symbols"),
	metrics: z
		.array(
			z.enum([
				"price",
				"change",
				"changePercent",
				"volume",
				"marketCap",
				"peRatio",
				"dividendYield",
				"52weekHigh",
				"52weekLow",
				"beta",
			]),
		)
		.default(["price", "change", "changePercent", "volume"]),
	format: z.enum(["json", "csv"]).default("json"),
});

export async function GET(request: NextRequest) {
	const requestId = crypto.randomUUID();

	try {
		// Validate API key
		const apiKey =
			request.headers.get("X-API-Key") ||
			request.headers.get("Authorization")?.replace("Bearer ", "");

		if (!apiKey) {
			return NextResponse.json(
				createErrorResponse(
					{
						code: ErrorCode.UNAUTHORIZED,
						message:
							"API key required. Get your API key at https://naly.ai/api-keys",
						severity: ErrorSeverity.MEDIUM,
						metadata: {
							timestamp: new Date(),
							service: "public-api",
							operation: "get-market-data",
							requestId,
						},
						retryable: false,
					},
					requestId,
				),
				{
					status: 401,
					headers: {
						"WWW-Authenticate": "Bearer",
						"Access-Control-Allow-Origin": "*",
					},
				},
			);
		}

		const { searchParams } = new URL(request.url);
		const endpoint = searchParams.get("endpoint") || "quote";

		if (endpoint === "quote") {
			return await handleQuoteRequest(request, requestId);
		} else if (endpoint === "historical") {
			return await handleHistoricalRequest(request, requestId);
		} else if (endpoint === "multi") {
			return await handleMultiTickerRequest(request, requestId);
		} else {
			return NextResponse.json(
				createErrorResponse(
					{
						code: ErrorCode.VALIDATION_ERROR,
						message:
							"Invalid endpoint. Supported endpoints: quote, historical, multi",
						severity: ErrorSeverity.MEDIUM,
						metadata: {
							timestamp: new Date(),
							service: "public-api",
							operation: "get-market-data",
							requestId,
							additionalData: {
								providedEndpoint: endpoint,
								supportedEndpoints: ["quote", "historical", "multi"],
							},
						},
						retryable: false,
					},
					requestId,
				),
				{
					status: 400,
					headers: { "Access-Control-Allow-Origin": "*" },
				},
			);
		}
	} catch (error) {
		console.error("Public market data API error:", error);

		const genericError = {
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "An unexpected error occurred while fetching market data",
			severity: ErrorSeverity.HIGH,
			metadata: {
				timestamp: new Date(),
				service: "public-api",
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
			headers: { "Access-Control-Allow-Origin": "*" },
		});
	}
}

async function handleQuoteRequest(request: NextRequest, requestId: string) {
	const { searchParams } = new URL(request.url);
	const ticker = searchParams.get("ticker")?.toUpperCase();

	if (!ticker) {
		return NextResponse.json(
			createErrorResponse(
				{
					code: ErrorCode.VALIDATION_ERROR,
					message: "Ticker parameter is required for quote endpoint",
					severity: ErrorSeverity.MEDIUM,
					metadata: {
						timestamp: new Date(),
						service: "public-api",
						operation: "get-quote",
						requestId,
					},
					retryable: false,
				},
				requestId,
			),
			{
				status: 400,
				headers: { "Access-Control-Allow-Origin": "*" },
			},
		);
	}

	// Mock real-time quote data
	const quote = {
		ticker: ticker,
		name: ticker === "AAPL" ? "Apple Inc." : `${ticker} Corp.`,
		price: 150.25 + (Math.random() - 0.5) * 10,
		change: (Math.random() - 0.5) * 5,
		changePercent: (Math.random() - 0.5) * 0.05,
		volume: Math.floor(Math.random() * 50000000) + 10000000,
		avgVolume: Math.floor(Math.random() * 40000000) + 15000000,
		marketCap: Math.floor(Math.random() * 1000000000000) + 500000000000,
		peRatio: 15 + Math.random() * 20,
		dividendYield: Math.random() * 0.04,
		week52High: 180 + Math.random() * 20,
		week52Low: 120 + Math.random() * 20,
		beta: 0.8 + Math.random() * 0.8,
		previousClose: 149.8,
		open: 150.0,
		dayHigh: 152.5,
		dayLow: 149.75,
		currency: "USD",
		exchange: "NASDAQ",
		lastUpdated: new Date().toISOString(),
		marketStatus: "OPEN",
		afterHoursPrice: null,
		afterHoursChange: null,
		afterHoursChangePercent: null,
	};

	// Calculate derived values
	quote.changePercent = quote.change / quote.previousClose;
	quote.afterHoursPrice = quote.price * (1 + (Math.random() - 0.5) * 0.002);
	quote.afterHoursChange = quote.afterHoursPrice - quote.price;
	quote.afterHoursChangePercent = quote.afterHoursChange / quote.price;

	return NextResponse.json(
		createSuccessResponse(
			{
				quote,
				meta: {
					requestId,
					timestamp: new Date().toISOString(),
					apiVersion: "1.0",
					dataSource: "real-time",
					delay: 0, // Real-time data
					rateLimit: {
						remaining: 4999,
						reset: Math.floor((Date.now() + 3600000) / 1000),
					},
				},
			},
			requestId,
		),
		{
			status: 200,
			headers: {
				"X-RateLimit-Remaining": "4999",
				"X-RateLimit-Reset": Math.floor(
					(Date.now() + 3600000) / 1000,
				).toString(),
				"Access-Control-Allow-Origin": "*",
				"Cache-Control": "public, max-age=5", // 5 seconds cache for real-time data
			},
		},
	);
}

async function handleHistoricalRequest(
	request: NextRequest,
	requestId: string,
) {
	const { searchParams } = new URL(request.url);
	const queryParams = {
		ticker: searchParams.get("ticker")?.toUpperCase(),
		period: searchParams.get("period") || "1d",
		interval: searchParams.get("interval") || "1d",
		includePrePost: searchParams.get("includePrePost") === "true",
		includeAdjustedClose: searchParams.get("includeAdjustedClose") !== "false",
		includeDividends: searchParams.get("includeDividends") === "true",
		includeSplits: searchParams.get("includeSplits") === "true",
		format: searchParams.get("format") || "json",
	};

	const validationResult = marketDataQuerySchema.safeParse(queryParams);
	if (!validationResult.success) {
		return NextResponse.json(
			createErrorResponse(
				{
					code: ErrorCode.VALIDATION_ERROR,
					message: "Invalid query parameters for historical data",
					severity: ErrorSeverity.MEDIUM,
					metadata: {
						timestamp: new Date(),
						service: "public-api",
						operation: "get-historical-data",
						requestId,
						additionalData: {
							validationErrors: validationResult.error.errors,
							supportedParams: {
								ticker: "string (required)",
								period: ["1d", "5d", "1m", "3m", "6m", "1y", "2y", "5y", "max"],
								interval: [
									"1m",
									"2m",
									"5m",
									"15m",
									"30m",
									"60m",
									"90m",
									"1h",
									"1d",
									"5d",
									"1wk",
									"1mo",
									"3mo",
								],
								includePrePost: "boolean",
								includeAdjustedClose: "boolean",
								includeDividends: "boolean",
								includeSplits: "boolean",
								format: ["json", "csv"],
							},
						},
					},
					retryable: false,
				},
				requestId,
			),
			{
				status: 400,
				headers: { "Access-Control-Allow-Origin": "*" },
			},
		);
	}

	const data = validationResult.data;

	// Generate mock historical data
	const generateHistoricalData = (
		ticker: string,
		period: string,
		interval: string,
	) => {
		const dataPoints = getDataPointsCount(period, interval);
		const basePrice = 150;
		const historicalData = [];

		for (let i = dataPoints; i >= 0; i--) {
			const date = new Date();
			date.setDate(date.getDate() - i);

			const randomChange = (Math.random() - 0.5) * 0.02;
			const price = basePrice * (1 + randomChange * i * 0.001);
			const volume = Math.floor(Math.random() * 30000000) + 10000000;

			historicalData.push({
				date: date.toISOString().split("T")[0],
				timestamp: Math.floor(date.getTime() / 1000),
				open: price * 0.999,
				high: price * 1.005,
				low: price * 0.995,
				close: price,
				adjustedClose: data.includeAdjustedClose ? price * 0.998 : undefined,
				volume: volume,
				dividends: data.includeDividends && Math.random() > 0.95 ? 0.25 : 0,
				splits: data.includeSplits && Math.random() > 0.99 ? 2 : 1,
			});
		}

		return historicalData;
	};

	const historicalData = generateHistoricalData(
		data.ticker,
		data.period,
		data.interval,
	);

	if (data.format === "csv") {
		const headers = ["date", "open", "high", "low", "close"];
		if (data.includeAdjustedClose) headers.push("adjustedClose");
		headers.push("volume");
		if (data.includeDividends) headers.push("dividends");
		if (data.includeSplits) headers.push("splits");

		const csvContent = [
			headers.join(","),
			...historicalData.map((row) =>
				headers.map((header) => row[header as keyof typeof row] || 0).join(","),
			),
		].join("\n");

		return new NextResponse(csvContent, {
			status: 200,
			headers: {
				"Content-Type": "text/csv",
				"Content-Disposition": `attachment; filename="${data.ticker}_${data.period}_${data.interval}.csv"`,
				"X-RateLimit-Remaining": "999",
				"X-RateLimit-Reset": Math.floor(
					(Date.now() + 3600000) / 1000,
				).toString(),
				"Access-Control-Allow-Origin": "*",
				"Cache-Control": "public, max-age=300",
			},
		});
	}

	return NextResponse.json(
		createSuccessResponse(
			{
				ticker: data.ticker,
				period: data.period,
				interval: data.interval,
				historicalData,
				meta: {
					requestId,
					timestamp: new Date().toISOString(),
					apiVersion: "1.0",
					dataPoints: historicalData.length,
					startDate: historicalData[0]?.date,
					endDate: historicalData[historicalData.length - 1]?.date,
					rateLimit: {
						remaining: 999,
						reset: Math.floor((Date.now() + 3600000) / 1000),
					},
				},
			},
			requestId,
		),
		{
			status: 200,
			headers: {
				"X-RateLimit-Remaining": "999",
				"X-RateLimit-Reset": Math.floor(
					(Date.now() + 3600000) / 1000,
				).toString(),
				"Access-Control-Allow-Origin": "*",
				"Cache-Control": "public, max-age=300", // 5 minutes cache
			},
		},
	);
}

async function handleMultiTickerRequest(
	request: NextRequest,
	requestId: string,
) {
	const { searchParams } = new URL(request.url);
	const queryParams = {
		tickers: searchParams.get("tickers") || "",
		metrics: searchParams.get("metrics")?.split(",") || [
			"price",
			"change",
			"changePercent",
			"volume",
		],
		format: searchParams.get("format") || "json",
	};

	const validationResult = multiTickerQuerySchema.safeParse(queryParams);
	if (!validationResult.success) {
		return NextResponse.json(
			createErrorResponse(
				{
					code: ErrorCode.VALIDATION_ERROR,
					message: "Invalid query parameters for multi-ticker data",
					severity: ErrorSeverity.MEDIUM,
					metadata: {
						timestamp: new Date(),
						service: "public-api",
						operation: "get-multi-ticker-data",
						requestId,
						additionalData: {
							validationErrors: validationResult.error.errors,
							supportedParams: {
								tickers: "comma-separated string (1-50 symbols)",
								metrics: [
									"price",
									"change",
									"changePercent",
									"volume",
									"marketCap",
									"peRatio",
									"dividendYield",
									"52weekHigh",
									"52weekLow",
									"beta",
								],
								format: ["json", "csv"],
							},
						},
					},
					retryable: false,
				},
				requestId,
			),
			{
				status: 400,
				headers: { "Access-Control-Allow-Origin": "*" },
			},
		);
	}

	const data = validationResult.data;
	const tickers = data.tickers
		.split(",")
		.map((s) => s.trim().toUpperCase())
		.filter(Boolean);

	// Generate mock data for multiple tickers
	const quotes = tickers.map((ticker) => {
		const baseData = {
			ticker,
			name: `${ticker} Corp.`,
			price: 100 + Math.random() * 100,
			change: (Math.random() - 0.5) * 10,
			changePercent: (Math.random() - 0.5) * 0.1,
			volume: Math.floor(Math.random() * 50000000) + 5000000,
			marketCap: Math.floor(Math.random() * 500000000000) + 100000000000,
			peRatio: 10 + Math.random() * 30,
			dividendYield: Math.random() * 0.06,
			"52weekHigh": 150 + Math.random() * 50,
			"52weekLow": 80 + Math.random() * 40,
			beta: 0.5 + Math.random() * 1.5,
			lastUpdated: new Date().toISOString(),
		};

		// Filter to only requested metrics
		const filteredData: any = { ticker: baseData.ticker, name: baseData.name };
		data.metrics.forEach((metric) => {
			if (baseData[metric as keyof typeof baseData] !== undefined) {
				filteredData[metric] = baseData[metric as keyof typeof baseData];
			}
		});

		return filteredData;
	});

	if (data.format === "csv") {
		const headers = ["ticker", "name", ...data.metrics];
		const csvContent = [
			headers.join(","),
			...quotes.map((quote) =>
				headers.map((header) => quote[header] || "").join(","),
			),
		].join("\n");

		return new NextResponse(csvContent, {
			status: 200,
			headers: {
				"Content-Type": "text/csv",
				"Content-Disposition": `attachment; filename="multi_ticker_data.csv"`,
				"X-RateLimit-Remaining": "199",
				"X-RateLimit-Reset": Math.floor(
					(Date.now() + 3600000) / 1000,
				).toString(),
				"Access-Control-Allow-Origin": "*",
				"Cache-Control": "public, max-age=60",
			},
		});
	}

	return NextResponse.json(
		createSuccessResponse(
			{
				quotes,
				meta: {
					requestId,
					timestamp: new Date().toISOString(),
					apiVersion: "1.0",
					tickerCount: quotes.length,
					requestedMetrics: data.metrics,
					rateLimit: {
						remaining: 199,
						reset: Math.floor((Date.now() + 3600000) / 1000),
					},
				},
			},
			requestId,
		),
		{
			status: 200,
			headers: {
				"X-RateLimit-Remaining": "199",
				"X-RateLimit-Reset": Math.floor(
					(Date.now() + 3600000) / 1000,
				).toString(),
				"Access-Control-Allow-Origin": "*",
				"Cache-Control": "public, max-age=60", // 1 minute cache
			},
		},
	);
}

function getDataPointsCount(period: string, interval: string): number {
	const periodMap = {
		"1d": 1,
		"5d": 5,
		"1m": 30,
		"3m": 90,
		"6m": 180,
		"1y": 365,
		"2y": 730,
		"5y": 1825,
		max: 3650,
	};

	const days = periodMap[period as keyof typeof periodMap] || 30;

	if (interval.includes("m") || interval.includes("h")) {
		return Math.min(days * 24, 1000); // Limit intraday data points
	}

	return days;
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
	return NextResponse.json(
		{},
		{
			status: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET, OPTIONS",
				"Access-Control-Allow-Headers":
					"Content-Type, Authorization, X-API-Key",
				"Access-Control-Max-Age": "86400",
			},
		},
	);
}
