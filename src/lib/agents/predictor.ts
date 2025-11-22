import { generateText, generateObject, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { PredictorInput, PredictorOutput } from './types';
import {
  getPredictionSchema,
  StockPrediction,
  CryptoPrediction,
  SportsPrediction,
  PoliticsPrediction,
} from './prediction-schemas';

// Import predictive tools
import {
  fmpFinancialTool,
  technicalIndicatorsTool,
  deepResearchTool,
  webSearchTool,
  polymarketTool,
  polymarketMarketDetailTool,
  sportsOddsTool,
  lineMovementTool,
} from '../tools/predictive';

export interface PredictorWorkflowResult {
  output: PredictorOutput;
  steps: {
    stepNumber: number;
    action: string;
    toolCalls?: string[];
  }[];
  totalSteps: number;
}

/**
 * Superforecasting System Prompt
 * Inspired by Philip Tetlock's research on accurate forecasting
 */
const SUPERFORECASTING_SYSTEM_PROMPT = `You are an elite Superforecaster Agent. Your goal is not to be polite, but to be ACCURATE.

PROTOCOL (YOU MUST FOLLOW THIS RIGOROUSLY):

1. START WITH THE OUTSIDE VIEW (Reference Class Forecasting)
   - What is the BASE RATE for this type of event?
   - Example: "Home teams win 55% of NBA games" or "Stocks beat earnings 52% of the time"
   - State this explicitly before diving into specifics

2. DECOMPOSE the question into constituent variables
   - Break complex predictions into smaller sub-problems
   - Example for Bitcoin: 1) ETF inflows, 2) Fed rate decisions, 3) Miner selling pressure
   - Address each sub-problem individually

3. SEEK DISCONFIRMING EVIDENCE
   - Actively search for data that CONTRADICTS your initial hypothesis
   - If you think stock will go up, search for bearish signals
   - This prevents confirmation bias

4. USE YOUR TOOLS STRATEGICALLY
   - For stocks: Check earnings calendar FIRST (catalyst identification)
   - For politics: Polymarket AND polls (wisdom of crowds vs. surveys)
   - For sports: Consensus odds across bookmakers (efficient market)
   - For crypto: Bitcoin correlation analysis (nothing moves independently)

5. QUANTIFY UNCERTAINTY
   - Never say "will happen" → Say "has an estimated probability of X%"
   - Provide confidence intervals, not point estimates
   - Example: "Target price: $150-$170 (60% confidence)"

6. PRE-MORTEM ANALYSIS
   - Before finalizing, ask: "Assume I'm wrong. What was the most likely cause?"
   - This identifies blind spots

7. CITE YOUR SOURCES
   - Every claim must be backed by data from your tools
   - Format: "According to [tool name], [data point]"

OUTPUT REQUIREMENTS:
- Be rigorous and data-backed
- Use probabilistic language
- Show your reasoning process
- Identify specific catalysts with dates
- Acknowledge uncertainty explicitly

You have access to multiple tools. Use them comprehensively before making predictions.`;

/**
 * Domain-specific system prompts
 */
const DOMAIN_PROMPTS = {
  stock: `
STOCK-SPECIFIC ANALYSIS:
- Check earnings calendar first (imminent reports = high volatility)
- Compare EPS estimate to "whisper numbers" from news
- Assess volatility profile: Small cap (<$2B) = wider confidence intervals
- Check sector momentum (is the entire sector moving?)
- Technical + Fundamental synthesis required
`,
  crypto: `
CRYPTO-SPECIFIC ANALYSIS:
- Bitcoin correlation is CRITICAL (altcoins follow BTC 80% of the time)
- If BTC is dumping, all altcoin predictions turn bearish regardless of individual news
- Check regulatory environment (SEC actions, ETF approvals)
- Narrative momentum: What story is driving this cycle? (DeFi, AI, Gaming, etc.)
- On-chain metrics if available (exchange flows indicate selling pressure)
`,
  sports: `
SPORTS-SPECIFIC ANALYSIS:
- Consensus odds across bookmakers = efficient market probability
- Line movement: Opening vs Current reveals "sharp money" (professional bettors)
- If line moves AGAINST public betting %, follow the sharps
- Injury impact: Calculate "Wins Above Replacement" (WAR) for key players
- Home field advantage: Quantify the edge (typically 2-4 points in NFL, 3-4 in NBA)
- Recent form matters more than season-long stats
`,
  politics: `
POLITICS-SPECIFIC ANALYSIS:
- Swing state polling >> National polling (only swing states matter)
- Poll quality: A+ rated pollsters vs. partisan polls
- Polymarket vs Polls divergence indicates information asymmetry
- Structural advantages: Turnout models, early voting data
- Beware "herding" (pollsters converging to avoid being outliers)
- Electoral college math: 270 to win (not popular vote)
`,
};

/**
 * Get domain-specific tools
 */
function getDomainTools(domain: PredictorInput['domain']) {
  const baseTools = {
    deepResearch: deepResearchTool,
    webSearch: webSearchTool,
  };

  switch (domain) {
    case 'stock':
      return {
        ...baseTools,
        fmpFinancial: fmpFinancialTool,
        technicalIndicators: technicalIndicatorsTool,
      };
    case 'crypto':
      return {
        ...baseTools,
        technicalIndicators: technicalIndicatorsTool,
      };
    case 'sports':
      return {
        ...baseTools,
        sportsOdds: sportsOddsTool,
        lineMovement: lineMovementTool,
      };
    case 'politics':
      return {
        ...baseTools,
        polymarket: polymarketTool,
        polymarketDetail: polymarketMarketDetailTool,
      };
  }
}

/**
 * Main Predictor Agent
 * Implements the two-phase pattern:
 * Phase 1: Deep Research (unstructured, exploratory)
 * Phase 2: Structured Report Generation
 */
export async function runPredictor(input: PredictorInput): Promise<PredictorOutput> {
  const result = await runPredictorWorkflow(input);
  return result.output;
}

export async function runPredictorWorkflow(
  input: PredictorInput
): Promise<PredictorWorkflowResult> {
  const stepLogs: PredictorWorkflowResult['steps'] = [];
  const toolsUsed: Set<string> = new Set();

  // Select appropriate model (use OpenAI for reasoning if available, fallback to Google)
  const reasoningModel = process.env.OPENAI_API_KEY
    ? openai('gpt-4o')
    : google('gemini-2.0-flash-thinking-exp');

  const tools = getDomainTools(input.domain);

  // PHASE 1: Deep Research Loop
  console.log(`[Predictor] Phase 1: Deep Research for ${input.domain} - ${input.target}`);

  const systemPrompt =
    SUPERFORECASTING_SYSTEM_PROMPT + '\n\n' + DOMAIN_PROMPTS[input.domain];

  const { text: researchTrace, steps } = await generateText({
    model: reasoningModel,
    system: systemPrompt,
    tools,
    stopWhen: stepCountIs(10), // Allow up to 10 reasoning steps
    onStepFinish: ({ text, toolCalls, toolResults }) => {
      const currentStep = stepLogs.length;

      // Log tools used
      toolCalls.forEach(tc => toolsUsed.add(tc.toolName));

      stepLogs.push({
        stepNumber: currentStep,
        action: toolCalls.length > 0 ? 'tool_call' : 'reasoning',
        toolCalls: toolCalls.map(tc => tc.toolName),
      });

      console.log(
        `[Predictor] Step ${currentStep}: ${toolCalls.length > 0 ? `Called ${toolCalls.map(tc => tc.toolName).join(', ')}` : 'Reasoning'}`
      );
    },
    prompt: `Perform comprehensive predictive analysis for:

TARGET: ${input.target}
DOMAIN: ${input.domain}
HORIZON: ${input.horizon}
${input.region ? `REGION: ${input.region}` : ''}

YOUR TASK:
1. Use your available tools to gather ALL relevant data
2. Start with base rates and catalysts
3. Actively seek disconfirming evidence
4. Perform pre-mortem analysis
5. Document your complete reasoning process

Remember: This is PHASE 1 (research). Think out loud. Show ALL your work.
Do NOT format the final prediction yet - just gather data and reason through it.`,
  });

  console.log(`[Predictor] Phase 1 complete. Used ${toolsUsed.size} tools across ${steps.length} steps`);

  // PHASE 2: Structured Output Generation
  console.log(`[Predictor] Phase 2: Generating structured prediction`);

  const predictionSchema = getPredictionSchema(input.domain);

  try {
    const { object: prediction } = await generateObject({
      model: reasoningModel,
      schema: predictionSchema,
      prompt: `You are now in PHASE 2: Structured Report Generation.

RESEARCH TRACE FROM PHASE 1:
${researchTrace}

YOUR TASK:
Based on the comprehensive research above, generate a rigorous, structured prediction report.

REQUIREMENTS:
- Fill out ALL fields in the schema
- Ensure probability scores reflect your pre-mortem analysis
- Include specific dates in the catalyst calendar
- Cite specific data sources used
- Maintain intellectual honesty about uncertainty

Generate the final structured prediction now.`,
    });

    return {
      output: {
        prediction,
        researchTrace,
        toolsUsed: Array.from(toolsUsed),
        confidence: (prediction as any).forecast.confidenceLevel,
      },
      steps: stepLogs,
      totalSteps: steps.length,
    };
  } catch (error: any) {
    console.error('[Predictor] Phase 2 failed:', error);

    // Fallback: Return research trace with error
    return {
      output: {
        prediction: {
          error: 'Structured generation failed',
          researchTrace,
        },
        researchTrace,
        toolsUsed: Array.from(toolsUsed),
        confidence: 'Low',
      },
      steps: stepLogs,
      totalSteps: steps.length,
    };
  }
}

/**
 * Utility: Format prediction for display
 */
export function formatPrediction(
  prediction:
    | StockPrediction
    | CryptoPrediction
    | SportsPrediction
    | PoliticsPrediction
): string {
  if ('error' in prediction) {
    return `Prediction Error: ${(prediction as any).error}`;
  }

  const domain = prediction.meta.domain;

  let markdown = `# ${prediction.meta.topic} - ${prediction.meta.horizon} Forecast\n\n`;
  markdown += `**Prediction Date:** ${new Date(prediction.meta.predictionDate).toLocaleDateString()}\n\n`;

  markdown += `## Executive Summary\n${prediction.analysis.executiveSummary}\n\n`;

  // Domain-specific forecast
  if ('forecast' in prediction) {
    const forecast = (prediction as any).forecast;
    markdown += `## Forecast\n`;
    markdown += `- **Direction/Outcome:** ${forecast.direction || forecast.prediction}\n`;
    markdown += `- **Probability:** ${forecast.probability}%\n`;
    markdown += `- **Confidence:** ${forecast.confidenceLevel}\n`;

    if (forecast.targetPrice) {
      markdown += `- **Target Price:** $${forecast.targetPrice}\n`;
    }
    if (forecast.priceRange) {
      markdown += `- **Price Range:** $${forecast.priceRange.low} - $${forecast.priceRange.high}\n`;
    }
    markdown += `\n`;
  }

  markdown += `## Base Rate\n${prediction.analysis.baseRate}\n\n`;

  markdown += `## Key Drivers\n`;
  prediction.analysis.keyDrivers.forEach(driver => {
    markdown += `- ${driver}\n`;
  });
  markdown += `\n`;

  markdown += `## Risk Factors\n`;
  prediction.analysis.riskFactors.forEach(risk => {
    markdown += `- ${risk}\n`;
  });
  markdown += `\n`;

  if (prediction.analysis.catalystCalendar.length > 0) {
    markdown += `## Catalyst Calendar\n`;
    prediction.analysis.catalystCalendar.forEach(catalyst => {
      markdown += `- **${new Date(catalyst.date).toLocaleDateString()}** [${catalyst.impact}]: ${catalyst.event}\n`;
    });
    markdown += `\n`;
  }

  markdown += `## Disconfirming Evidence\n${prediction.analysis.disconfirmingEvidence}\n\n`;

  markdown += `## Methodology\n`;
  markdown += `**Data Sources:** ${prediction.methodology.dataSourcesUsed.join(', ')}\n\n`;
  markdown += `**Decomposition:** ${prediction.methodology.decompositonApproach}\n\n`;
  markdown += `**Pre-Mortem:** ${prediction.methodology.preMortem}\n\n`;

  return markdown;
}
