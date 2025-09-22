import { generateObject, generateText, streamText } from "ai";

// Model configuration - using provider/model format for AI Gateway
// The AI SDK automatically uses the AI Gateway when you pass a model string in the provider/model format
export const AI_MODELS = {
	GEMINI_2_5_FLASH_LITE: "google/gemini-2.5-flash-lite",
	GEMINI_2_5_FLASH: "google/gemini-2.5-flash",
	GEMINI_2_0_FLASH: "google/gemini-2.0-flash-exp",
	GPT_4O: "openai/gpt-4o",
	GPT_4O_MINI: "openai/gpt-4o-mini",
	CLAUDE_3_5_SONNET: "anthropic/claude-3-5-sonnet-20241022",
	CLAUDE_3_5_HAIKU: "anthropic/claude-3-5-haiku-20241022",
} as const;

// Default model for most operations
export const DEFAULT_MODEL = "GEMINI_2_5_FLASH_LITE" as keyof typeof AI_MODELS;

/**
 * Generate text using AI with configurable parameters
 */
export async function generateAIText({
	prompt,
	model = DEFAULT_MODEL,
	temperature = 0.7,
	maxTokens = 2000,
}: {
	prompt: string;
	model?: keyof typeof AI_MODELS;
	temperature?: number;
	maxTokens?: number;
}) {
	const modelName = AI_MODELS[model];

	const result = await generateText({
		model: modelName, // Direct model string - AI Gateway is used automatically
		prompt,
		temperature,
		// maxTokens parameter may not be supported in current version
	});

	return result;
}

/**
 * Generate structured object using AI
 */
export async function generateAIObject<T>({
	prompt,
	schema,
	model = DEFAULT_MODEL,
	temperature = 0.3,
}: {
	prompt: string;
	schema: any;
	model?: keyof typeof AI_MODELS;
	temperature?: number;
}) {
	const modelName = AI_MODELS[model];

	const result = await generateObject({
		model: modelName, // Direct model string - AI Gateway is used automatically
		prompt,
		schema,
		temperature,
	});

	return result.object as T;
}

/**
 * Stream text generation for real-time responses
 */
export async function streamAIText({
	prompt,
	model = DEFAULT_MODEL,
	temperature = 0.7,
	maxTokens = 2000,
}: {
	prompt: string;
	model?: keyof typeof AI_MODELS;
	temperature?: number;
	maxTokens?: number;
}) {
	const modelName = AI_MODELS[model];

	const result = streamText({
		model: modelName, // Direct model string - AI Gateway is used automatically
		prompt,
		temperature,
		// maxTokens parameter may not be supported in current version
	});

	return result.textStream;
}

/**
 * Generate market narrative from event data
 */
export async function generateMarketNarrative({
	eventData,
	analysisData,
	userContext,
}: {
	eventData: any;
	analysisData: any;
	userContext?: any;
}) {
	const prompt = `
As a financial intelligence platform, generate an intelligent narrative for the following market event:

EVENT DATA:
${JSON.stringify(eventData, null, 2)}

ANALYSIS DATA:
${JSON.stringify(analysisData, null, 2)}

USER CONTEXT:
${userContext ? JSON.stringify(userContext, null, 2) : "General audience"}

Generate a comprehensive narrative that includes:

1. HEADLINE: A compelling, concise headline that captures the essence of the event
2. SUMMARY: 3-5 bullet points explaining what happened and why it matters
3. EXPLANATION: Detailed analysis of the causal factors behind this event
4. PREDICTION: Forward-looking scenarios with probabilities and supporting evidence
5. KEY INSIGHTS: 2-3 actionable insights for investors

Style guidelines:
- Write in clear, professional financial journalism style
- Use specific numbers and data points
- Avoid jargon or explain technical terms
- Maintain objectivity and cite evidence
- Present uncertainty transparently

Format as JSON with sections: headline, summary, explanation, prediction, keyInsights
`;

	return await generateAIText({
		prompt,
		temperature: 0.6,
		maxTokens: 3000,
	});
}

/**
 * Generate causal analysis explanation
 */
export async function generateCausalExplanation({
	eventData,
	evidenceChain,
	historicalContext,
}: {
	eventData: any;
	evidenceChain: any[];
	historicalContext?: any;
}) {
	const prompt = `
Analyze the causal factors behind this market event and generate a clear explanation:

EVENT DATA:
${JSON.stringify(eventData, null, 2)}

EVIDENCE CHAIN:
${JSON.stringify(evidenceChain, null, 2)}

HISTORICAL CONTEXT:
${historicalContext ? JSON.stringify(historicalContext, null, 2) : "Limited historical data available"}

Generate a causal analysis that:
1. Identifies the primary root cause
2. Explains the chain of causation step by step
3. Assesses the confidence level of this analysis
4. Considers alternative explanations
5. Provides supporting evidence for each causal link

Use the "5 Whys" methodology to trace the event back to its fundamental causes.
Present findings objectively with appropriate caveats about uncertainty.

Format as structured analysis with clear reasoning.
`;

	return await generateAIText({
		prompt,
		temperature: 0.4,
		maxTokens: 2500,
	});
}

/**
 * Generate probabilistic forecast scenarios
 */
export async function generatePredictionScenarios({
	marketData,
	historicalPatterns,
	currentContext,
}: {
	marketData: any;
	historicalPatterns: any[];
	currentContext: any;
}) {
	const prompt = `
Based on the provided data, generate probabilistic forecast scenarios:

CURRENT MARKET DATA:
${JSON.stringify(marketData, null, 2)}

HISTORICAL PATTERNS:
${JSON.stringify(historicalPatterns, null, 2)}

CURRENT CONTEXT:
${JSON.stringify(currentContext, null, 2)}

Generate 3 forecast scenarios:
1. BULL CASE (optimistic scenario)
2. BASE CASE (most likely scenario)
3. BEAR CASE (pessimistic scenario)

For each scenario, provide:
- Probability percentage (must sum to 100%)
- Key drivers and assumptions
- Specific price targets or outcome ranges
- Timeline for realization
- Supporting evidence from data
- Key risks that could invalidate the scenario

Base probabilities on quantitative analysis and historical precedents.
Ensure scenarios are mutually exclusive and collectively exhaustive.
Communicate uncertainty transparently.

Format as structured JSON with scenarios array.
`;

	return await generateAIText({
		prompt,
		temperature: 0.5,
		maxTokens: 2500,
	});
}

/**
 * Generate formatted financial data tables from time series
 * Uses structured generation for precise table formatting
 */
export async function generateFinancialDataTable({
	data,
	tableType,
	model = "GPT_4O" as keyof typeof AI_MODELS,
}: {
	data: any;
	tableType: "stock_prices" | "quarterly_financials" | "monthly_metrics" | "custom";
}) {
	const schemas = {
		stock_prices: {
			columns: ["Date", "Open", "High", "Low", "Close", "Volume", "Adj Close"],
			format: "| Date | Open | High | Low | Close | Volume | Adj Close |",
		},
		quarterly_financials: {
			columns: ["Period", "Revenue", "Net Income", "EPS", "Gross Margin", "Operating Income"],
			format: "| Period | Revenue | Net Income | EPS | Gross Margin | Operating Income |",
		},
		monthly_metrics: {
			columns: ["Month", "Revenue", "Active Users", "Market Share", "Growth Rate"],
			format: "| Month | Revenue | Active Users | Market Share | Growth Rate |",
		},
		custom: {
			columns: [],
			format: "",
		},
	};

	const selectedSchema = schemas[tableType];

	const prompt = `Convert the following financial data into a PERFECTLY formatted markdown table.

DATA TO CONVERT:
${JSON.stringify(data, null, 2)}

TABLE REQUIREMENTS:
1. Use this exact column structure: ${selectedSchema.format}
2. Include alignment row: |:---|---:|---:|---:|---:|---:|---:|
3. Include EVERY SINGLE data point provided - no omissions
4. Preserve EXACT numerical precision (all decimal places)
5. Format large numbers with commas: 1,234,567.89
6. Include currency symbols where appropriate: $1,234.56
7. Sort chronologically (most recent first for dates)
8. NO summaries, NO aggregations, NO averages
9. Each row must contain actual data from the input

OUTPUT FORMAT:
Return ONLY the markdown table, no explanatory text before or after.
Every cell must be filled with actual data or "N/A" if truly missing.
`;

	const result = await generateAIText({
		prompt,
		model,
		temperature: 0.0, // Zero temperature for maximum determinism
		maxTokens: 8000,
	});

	return result.text;
}

/**
 * Post-process AI-generated report to ensure complete data tables
 */
export function ensureCompleteDataTables(
	reportContent: string,
	financialData: any
): string {
	// This function can be expanded to:
	// 1. Parse the AI response
	// 2. Find incomplete tables
	// 3. Rebuild them with complete data
	// 4. Replace in the report

	// For now, we'll append a data appendix if tables are incomplete
	if (financialData.historicalPrices?.daily_prices?.length > 0) {
		const hasCompleteTable = reportContent.includes(financialData.historicalPrices.daily_prices[0].date);

		if (!hasCompleteTable) {
			const appendix = `

## Data Appendix: Complete Time Series

### Historical Stock Prices (30-Day Series)
${generateManualTable(financialData.historicalPrices.daily_prices, "stock_prices")}

### Quarterly Financial Performance
${generateManualTable(financialData.financialHighlights, "quarterly")}
`;
			return reportContent + appendix;
		}
	}

	return reportContent;
}

/**
 * Manually generate a markdown table from data
 */
function generateManualTable(data: any[], type: string): string {
	if (!data || data.length === 0) return "No data available";

	if (type === "stock_prices") {
		let table = "| Date | Open | High | Low | Close | Volume |\n";
		table += "|:-----|-----:|-----:|-----:|------:|-------:|\n";

		data.forEach(row => {
			table += `| ${row.date} | $${row.open} | $${row.high} | $${row.low} | $${row.close} | ${row.volume?.toLocaleString() || 'N/A'} |\n`;
		});

		return table;
	}

	if (type === "quarterly") {
		let table = "| Period | Revenue | Net Income | EPS | Gross Margin |\n";
		table += "|:-------|--------:|-----------:|----:|-------------:|\n";

		data.forEach(row => {
			table += `| ${row.period} | $${row.revenue?.toLocaleString() || 'N/A'} | $${row.net_income?.toLocaleString() || 'N/A'} | $${row.eps_diluted || 'N/A'} | ${row.gross_margin || 'N/A'} |\n`;
		});

		return table;
	}

	return "Unsupported table type";
}