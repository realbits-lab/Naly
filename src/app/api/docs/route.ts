import { type NextRequest, NextResponse } from "next/server";
import { createSuccessResponse } from "@/types";

export async function GET(request: NextRequest) {
	const requestId = crypto.randomUUID();
	const { searchParams } = new URL(request.url);
	const format = searchParams.get("format") || "json";

	const apiDocumentation = {
		info: {
			title: "Naly Financial Intelligence API",
			version: "1.0.0",
			description:
				"Comprehensive financial intelligence platform providing AI-powered market analysis, predictions, and institutional-grade analytics",
			contact: {
				name: "Naly API Support",
				url: "https://naly.ai/support",
				email: "api@naly.ai",
			},
			license: {
				name: "Commercial License",
				url: "https://naly.ai/license",
			},
		},
		servers: [
			{
				url: "https://api.naly.ai",
				description: "Production server",
			},
			{
				url: "https://sandbox-api.naly.ai",
				description: "Sandbox server",
			},
		],
		authentication: {
			type: "API Key",
			description: "All endpoints require authentication using an API key",
			header: "X-API-Key or Authorization: Bearer <api-key>",
			signup: {
				public: "https://naly.ai/api-keys",
				enterprise: "mailto:enterprise@naly.ai",
			},
			rateLimits: {
				public: {
					free: "1,000 requests/hour",
					pro: "10,000 requests/hour",
					premium: "50,000 requests/hour",
				},
				enterprise: {
					standard: "100,000 requests/hour",
					premium: "500,000 requests/hour",
					unlimited: "Custom limits available",
				},
			},
		},
		endpoints: {
			public: {
				"Market Data": {
					baseUrl: "/api/public/market-data",
					description: "Real-time and historical market data",
					methods: ["GET"],
					examples: [
						{
							title: "Get Real-time Quote",
							url: "/api/public/market-data?endpoint=quote&ticker=AAPL",
							description: "Get current price and key metrics for a stock",
						},
						{
							title: "Get Historical Data",
							url: "/api/public/market-data?endpoint=historical&ticker=MSFT&period=1y&interval=1d",
							description: "Get historical OHLCV data for technical analysis",
						},
						{
							title: "Multi-Ticker Data",
							url: "/api/public/market-data?endpoint=multi&tickers=AAPL,MSFT,GOOGL&metrics=price,change,volume",
							description: "Get data for multiple stocks in one request",
						},
					],
					parameters: {
						endpoint: {
							type: "string",
							enum: ["quote", "historical", "multi"],
							description: "Type of market data to retrieve",
						},
						ticker: {
							type: "string",
							description: "Stock symbol (e.g., AAPL)",
						},
						period: {
							type: "string",
							enum: ["1d", "5d", "1m", "3m", "6m", "1y", "2y", "5y", "max"],
							description: "Time period for historical data",
						},
						interval: {
							type: "string",
							enum: ["1m", "5m", "15m", "30m", "1h", "1d", "1wk", "1mo"],
							description: "Data interval granularity",
						},
						format: {
							type: "string",
							enum: ["json", "csv"],
							description: "Response format",
						},
					},
					responseSchema: {
						quote: {
							ticker: "string",
							price: "number",
							change: "number",
							changePercent: "number",
							volume: "number",
							marketCap: "number",
							peRatio: "number",
							lastUpdated: "string (ISO 8601)",
						},
					},
				},
				"AI Predictions": {
					baseUrl: "/api/public/predictions",
					description: "Machine learning-powered market predictions",
					methods: ["GET", "POST"],
					examples: [
						{
							title: "Get Price Predictions",
							url: "/api/public/predictions?ticker=NVDA&type=price&horizon=1w",
							description: "Get AI predictions for stock price movements",
						},
						{
							title: "Generate Custom Prediction",
							method: "POST",
							url: "/api/public/predictions",
							body: {
								ticker: "MSFT",
								horizon: "1m",
								type: "price",
								features: ["technical_indicators", "market_sentiment"],
								modelType: "ensemble",
							},
							description:
								"Generate custom predictions with specific model parameters",
						},
					],
					parameters: {
						ticker: {
							type: "string",
							description: "Stock symbol to predict",
						},
						horizon: {
							type: "string",
							enum: ["1d", "1w", "1m", "3m", "6m", "1y"],
							description: "Prediction time horizon",
						},
						type: {
							type: "string",
							enum: ["price", "movement", "volatility", "trend"],
							description: "Type of prediction",
						},
						confidence: {
							type: "number",
							description: "Minimum confidence threshold (0-1)",
						},
					},
					responseSchema: {
						prediction: {
							id: "string",
							ticker: "string",
							type: "string",
							currentPrice: "number",
							predictedPrice: "number",
							confidence: "number (0-1)",
							horizon: "string",
							uncertainty: "object",
							model: "object",
						},
					},
				},
			},
			b2b: {
				"Portfolio Analytics": {
					baseUrl: "/api/b2b/analytics",
					description:
						"Institutional-grade portfolio analysis and risk management",
					authentication: "Enterprise API key + Client ID required",
					methods: ["GET", "POST"],
					examples: [
						{
							title: "Portfolio Risk Analysis",
							url: "/api/b2b/analytics?endpoint=risk&portfolioId=portfolio_001&period=1y",
							headers: {
								"X-API-Key": "your-enterprise-api-key",
								"X-Client-ID": "your-client-id",
							},
							description:
								"Comprehensive risk analysis for institutional portfolios",
						},
						{
							title: "Performance Attribution",
							url: "/api/b2b/analytics?endpoint=performance&portfolioId=portfolio_001&benchmark=SPY",
							description: "Detailed performance attribution analysis",
						},
						{
							title: "Bulk Portfolio Analysis",
							method: "POST",
							url: "/api/b2b/analytics",
							body: {
								portfolios: [
									{
										id: "port_001",
										name: "Growth Portfolio",
										holdings: [
											{ ticker: "AAPL", weight: 0.2 },
											{ ticker: "MSFT", weight: 0.18 },
										],
									},
								],
								analysisTypes: ["risk_assessment", "performance_attribution"],
								deliveryMethod: "response",
							},
							description: "Analyze multiple portfolios simultaneously",
						},
					],
					endpoints: {
						portfolio: "General portfolio overview and metrics",
						risk: "Risk assessment and stress testing",
						performance: "Performance attribution and benchmarking",
						allocation: "Asset allocation analysis and optimization",
						"factor-analysis": "Factor exposure and attribution",
						"stress-test": "Scenario analysis and stress testing",
					},
					parameters: {
						endpoint: {
							type: "string",
							enum: [
								"portfolio",
								"risk",
								"performance",
								"allocation",
								"factor-analysis",
								"stress-test",
							],
							description: "Analytics endpoint to call",
						},
						portfolioId: {
							type: "string",
							description: "Unique portfolio identifier",
						},
						benchmark: {
							type: "string",
							description: "Benchmark ticker (default: SPY)",
						},
						period: {
							type: "string",
							enum: ["1m", "3m", "6m", "1y", "2y", "3y", "5y"],
							description: "Analysis time period",
						},
						riskMetrics: {
							type: "array",
							items: ["var", "cvar", "sharpe", "beta", "alpha", "max_drawdown"],
							description: "Risk metrics to include",
						},
						webhook: {
							type: "string",
							description: "Webhook URL for async result delivery",
						},
					},
					responseSchema: {
						analytics: {
							portfolioId: "string",
							overview: "object",
							riskMetrics: "object",
							performance: "object",
							attribution: "object",
						},
						processingInfo: {
							processingTimeMs: "number",
							dataPoints: "number",
							computeIntensive: "boolean",
						},
					},
				},
				"Bulk Operations": {
					description: "High-volume batch processing for institutional clients",
					features: [
						"Process up to 100 portfolios simultaneously",
						"Asynchronous job processing for large requests",
						"Multiple delivery methods (webhook, S3, email)",
						"Priority processing options",
						"Job status tracking and monitoring",
					],
					deliveryMethods: {
						response: "Synchronous response (up to 20 portfolios)",
						webhook: "Results delivered to webhook URL",
						s3: "Results uploaded to S3 bucket",
						email: "Results sent via secure email",
					},
					jobTracking: {
						endpoint: "/api/b2b/jobs/{jobId}",
						description: "Check status of asynchronous jobs",
						statuses: [
							"queued",
							"processing",
							"completed",
							"failed",
							"cancelled",
						],
					},
				},
			},
		},
		sdks: {
			python: {
				installation: "pip install naly-python",
				documentation: "https://docs.naly.ai/python",
				example: `
import naly

# Initialize client
client = naly.Client(api_key='your-api-key')

# Get market data
quote = client.market_data.get_quote('AAPL')
print(f"AAPL: {quote.price}")

# Generate narrative
narrative = client.narratives.generate(
    ticker='MSFT',
    analysis_type='technical',
    timeframe='1m'
)
print(narrative.content)

# Get predictions
prediction = client.predictions.get(
    ticker='GOOGL',
    horizon='1w',
    type='price'
)
print(f"Predicted price: {prediction.predicted_price}")
`,
			},
			javascript: {
				installation: "npm install @naly/javascript-sdk",
				documentation: "https://docs.naly.ai/javascript",
				example: `
import { NalyClient } from '@naly/javascript-sdk';

// Initialize client
const client = new NalyClient({
  apiKey: 'your-api-key'
});

// Get market data
const quote = await client.marketData.getQuote('AAPL');
console.log(\`AAPL: $\${quote.price}\`);

// Generate narrative
const narrative = await client.narratives.generate({
  ticker: 'MSFT',
  analysisType: 'technical',
  timeframe: '1m'
});
console.log(narrative.content);

// Get predictions
const prediction = await client.predictions.get({
  ticker: 'GOOGL',
  horizon: '1w',
  type: 'price'
});
console.log(\`Predicted price: $\${prediction.predictedPrice}\`);
`,
			},
			r: {
				installation: 'install.packages("nalyR")',
				documentation: "https://docs.naly.ai/r",
				example: `
library(nalyR)

# Initialize client
client <- naly_client(api_key = "your-api-key")

# Get market data
quote <- get_quote(client, "AAPL")
cat("AAPL:", quote$price, "\\n")

# Generate narrative
narrative <- generate_narrative(client,
  ticker = "MSFT",
  analysis_type = "technical",
  timeframe = "1m"
)
cat(narrative$content)

# Get predictions
prediction <- get_prediction(client,
  ticker = "GOOGL",
  horizon = "1w",
  type = "price"
)
cat("Predicted price:", prediction$predicted_price, "\\n")
`,
			},
		},
		errorCodes: {
			400: {
				code: "VALIDATION_ERROR",
				description: "Invalid request parameters or body",
				resolution: "Check parameter formats and required fields",
			},
			401: {
				code: "UNAUTHORIZED",
				description: "Missing or invalid API key",
				resolution:
					"Provide valid API key in X-API-Key header or Authorization: Bearer <key>",
			},
			403: {
				code: "FORBIDDEN",
				description: "Access denied or insufficient permissions",
				resolution: "Upgrade your plan or contact support for access",
			},
			404: {
				code: "NOT_FOUND",
				description: "Resource not found",
				resolution: "Check endpoint URLs and resource identifiers",
			},
			429: {
				code: "RATE_LIMITED",
				description: "Rate limit exceeded",
				resolution: "Reduce request frequency or upgrade your plan",
			},
			500: {
				code: "INTERNAL_SERVER_ERROR",
				description: "Unexpected server error",
				resolution: "Retry request or contact support if persistent",
			},
			503: {
				code: "SERVICE_UNAVAILABLE",
				description: "Service temporarily unavailable",
				resolution: "Retry request after delay",
			},
		},
		bestPractices: {
			authentication: [
				"Store API keys securely and never expose them in client-side code",
				"Use environment variables for API key storage",
				"Rotate API keys regularly for security",
				"Use different API keys for different environments",
			],
			rateLimiting: [
				"Implement exponential backoff for rate limit handling",
				"Cache responses when appropriate to reduce API calls",
				"Use batch endpoints for multiple data requests",
				"Monitor rate limit headers in responses",
			],
			errorHandling: [
				"Implement proper error handling for all API calls",
				"Use retry logic for transient errors (500, 503)",
				"Log errors with request IDs for debugging",
				"Provide meaningful error messages to end users",
			],
			performance: [
				"Use appropriate time periods and intervals for historical data",
				"Leverage webhooks for long-running operations",
				"Use CSV format for large data exports",
				"Implement client-side caching for frequently accessed data",
			],
		},
		support: {
			documentation: "https://docs.naly.ai",
			apiReference: "https://docs.naly.ai/api-reference",
			tutorials: "https://docs.naly.ai/tutorials",
			examples: "https://github.com/naly-ai/api-examples",
			community: "https://community.naly.ai",
			support: {
				email: "support@naly.ai",
				chat: "https://naly.ai/chat",
				tickets: "https://support.naly.ai",
			},
			enterprise: {
				sales: "enterprise@naly.ai",
				support: "enterprise-support@naly.ai",
				sla: "https://naly.ai/enterprise-sla",
			},
		},
		changelog: {
			"v1.0.0": {
				date: "2024-01-15",
				changes: [
					"Initial API release",
					"Public market data endpoints",
					"AI narratives and predictions",
					"B2B analytics platform",
					"Rate limiting and authentication",
				],
			},
		},
	};

	if (format === "yaml") {
		// Convert to YAML format (simplified)
		const yamlContent = `
openapi: 3.0.0
info:
  title: ${apiDocumentation.info.title}
  version: ${apiDocumentation.info.version}
  description: ${apiDocumentation.info.description}
servers:
${apiDocumentation.servers.map((s) => `  - url: ${s.url}\n    description: ${s.description}`).join("\n")}
paths:
  /api/public/market-data:
    get:
      summary: Get market data
      parameters:
        - name: endpoint
          in: query
          required: true
          schema:
            type: string
            enum: [quote, historical, multi]
        - name: ticker
          in: query
          schema:
            type: string
      responses:
        '200':
          description: Success
  # Additional paths would be defined here...
`;
		return new NextResponse(yamlContent, {
			status: 200,
			headers: {
				"Content-Type": "application/x-yaml",
				"Content-Disposition": 'attachment; filename="naly-api-spec.yaml"',
				"Access-Control-Allow-Origin": "*",
			},
		});
	}

	return NextResponse.json(
		createSuccessResponse(
			{
				documentation: apiDocumentation,
				meta: {
					requestId,
					timestamp: new Date().toISOString(),
					version: "1.0.0",
					formats: ["json", "yaml"],
					links: {
						interactiveDoc: "https://docs.naly.ai/interactive",
						postman: "https://docs.naly.ai/postman",
						openapi: "/api/docs?format=yaml",
					},
				},
			},
			requestId,
		),
		{
			status: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Cache-Control": "public, max-age=3600", // 1 hour cache
			},
		},
	);
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
				"Access-Control-Allow-Headers": "Content-Type",
				"Access-Control-Max-Age": "86400",
			},
		},
	);
}
