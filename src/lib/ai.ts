import { generateObject, generateText, streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Configure Google AI provider
const google = createGoogleGenerativeAI({
	apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.AI_GATEWAY_API_KEY,
});

// Model configuration
export const AI_MODELS = {
	GEMINI_2_5_FLASH_LITE: "gemini-2.5-flash-lite",
	GEMINI_2_5_FLASH: "gemini-2.5-flash",
	GPT_4O_MINI: "gpt-4o-mini",
	GPT_4O: "gpt-4o",
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
		model: google(modelName),
		prompt,
		temperature,
		maxTokens,
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
		model: google(modelName),
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

	const result = await streamText({
		model: google(modelName),
		prompt,
		temperature,
		maxTokens,
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
