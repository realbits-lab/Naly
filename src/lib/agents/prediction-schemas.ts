import { z } from 'zod';

/**
 * Prediction Schemas for Structured Output
 * Following Vercel AI SDK v6 generateObject patterns
 * Enforces rigorous forecasting standards inspired by Superforecasting methodology
 */

/**
 * Base Prediction Schema
 * Common fields across all prediction types
 */
const BasePredictionSchema = z.object({
  meta: z.object({
    topic: z.string().describe('The subject being predicted'),
    predictionDate: z.string().describe('ISO date when prediction was made'),
    horizon: z.string().describe('Prediction timeframe (e.g., "1 Month", "2 Weeks")'),
    domain: z.enum(['stock', 'crypto', 'sports', 'politics']).describe('Prediction domain'),
  }),
  analysis: z.object({
    executiveSummary: z
      .string()
      .describe('Concise 2-3 sentence summary of the prediction and rationale'),
    baseRate: z
      .string()
      .describe(
        'Outside View: Historical base rate for this type of event (Reference Class Forecasting)'
      ),
    keyDrivers: z
      .array(z.string())
      .min(3)
      .max(7)
      .describe('Primary factors influencing the prediction'),
    riskFactors: z
      .array(z.string())
      .min(2)
      .describe('Key risks that could invalidate the prediction'),
    catalystCalendar: z
      .array(
        z.object({
          date: z.string().describe('ISO date of catalyst'),
          event: z.string().describe('Event description'),
          impact: z.enum(['High', 'Medium', 'Low']).describe('Expected impact level'),
        })
      )
      .describe('Upcoming events that will affect the outcome'),
    disconfirmingEvidence: z
      .string()
      .describe('Evidence that contradicts the primary hypothesis (critical for avoiding bias)'),
  }),
  methodology: z.object({
    dataSourcesUsed: z
      .array(z.string())
      .describe('APIs and sources consulted (e.g., FMP, Polymarket, Firecrawl)'),
    decompositonApproach: z
      .string()
      .describe('How the complex question was broken into sub-problems'),
    preMortem: z
      .string()
      .describe('Assume prediction is wrong. What was the most likely cause? (Pre-mortem analysis)'),
  }),
});

/**
 * Stock Prediction Schema
 * Structured output for equity forecasts
 */
export const StockPredictionSchema = BasePredictionSchema.extend({
  forecast: z.object({
    direction: z.enum(['Bullish', 'Bearish', 'Neutral']).describe('Price direction prediction'),
    targetPrice: z.number().optional().describe('Specific price target if applicable'),
    priceRange: z
      .object({
        low: z.number(),
        high: z.number(),
      })
      .describe('Expected price range within the horizon'),
    probability: z
      .number()
      .min(0)
      .max(100)
      .describe('Confidence in direction (0-100)'),
    confidenceLevel: z
      .enum(['High', 'Medium', 'Low'])
      .describe('Overall confidence in the prediction'),
  }),
  technicalContext: z.object({
    rsi: z.number().optional().describe('Current RSI value if available'),
    trendSignal: z
      .enum(['Overbought', 'Oversold', 'Neutral'])
      .describe('Technical trend interpretation'),
    volatilityProfile: z.string().describe('Market cap and volatility assessment'),
  }),
  fundamentalContext: z.object({
    hasEarningsInHorizon: z.boolean().describe('Is there an earnings report within the horizon?'),
    earningsDate: z.string().optional().describe('Next earnings date if applicable'),
    epsEstimate: z.number().optional().describe('Consensus EPS estimate'),
    sectorMomentum: z.string().describe('Current sector and industry momentum'),
  }),
});

/**
 * Crypto Prediction Schema
 */
export const CryptoPredictionSchema = BasePredictionSchema.extend({
  forecast: z.object({
    direction: z.enum(['Bullish', 'Bearish', 'Neutral']),
    targetPrice: z.number().optional(),
    priceRange: z.object({
      low: z.number(),
      high: z.number(),
    }),
    probability: z.number().min(0).max(100),
    confidenceLevel: z.enum(['High', 'Medium', 'Low']),
  }),
  marketContext: z.object({
    bitcoinCorrelation: z
      .string()
      .describe('Correlation with Bitcoin (critical for altcoins)'),
    onChainSignals: z
      .string()
      .describe('On-chain metrics if available (exchange flows, whale activity)'),
    regulatoryRisks: z.string().describe('Regulatory environment assessment'),
    narrativeMomentum: z.string().describe('Current narrative driving the asset (DeFi, AI, etc.)'),
  }),
});

/**
 * Sports Prediction Schema
 */
export const SportsPredictionSchema = BasePredictionSchema.extend({
  forecast: z.object({
    prediction: z.string().describe('Outcome prediction (e.g., "Team A to win")'),
    probability: z.number().min(0).max(100).describe('Implied probability of outcome'),
    confidenceLevel: z.enum(['High', 'Medium', 'Low']),
    recommendedBet: z.string().optional().describe('Suggested wager if applicable'),
  }),
  oddsContext: z.object({
    consensusOdds: z
      .string()
      .describe('Average odds across bookmakers (decimal format)'),
    impliedProbability: z.number().describe('Probability derived from consensus odds'),
    lineMovement: z
      .string()
      .optional()
      .describe('Opening vs current line movement (sharp money indicator)'),
    valueAssessment: z
      .string()
      .describe('Is the current line offering value compared to true probability?'),
  }),
  matchContext: z.object({
    homeAwayAdvantage: z.string().describe('Home field advantage assessment'),
    injuryReport: z.string().describe('Key injuries affecting the matchup'),
    recentForm: z.string().describe('Recent performance trends for both sides'),
    headToHead: z.string().describe('Historical matchup data'),
  }),
});

/**
 * Politics Prediction Schema
 */
export const PoliticsPredictionSchema = BasePredictionSchema.extend({
  forecast: z.object({
    prediction: z.string().describe('Electoral outcome prediction'),
    probability: z.number().min(0).max(100).describe('Probability of predicted outcome'),
    confidenceLevel: z.enum(['High', 'Medium', 'Low']),
    electoralMath: z
      .string()
      .optional()
      .describe('Electoral college breakdown if applicable'),
  }),
  pollContext: z.object({
    nationalPolling: z.string().describe('Current national polling average'),
    swingStatePolling: z.string().describe('Critical swing state polling (most important)'),
    pollingTrend: z.string().describe('Trend direction over past 2 weeks'),
    pollQuality: z
      .string()
      .describe('Assessment of polling reliability (A+ rated pollsters vs partisan polls)'),
  }),
  marketContext: z.object({
    polymarketProbability: z.number().optional().describe('Polymarket implied probability'),
    polymarketVolume: z.string().optional().describe('Market volume and confidence'),
    marketPollingDivergence: z
      .string()
      .describe('Comparison between prediction markets and polls'),
  }),
});

/**
 * Type exports
 */
export type StockPrediction = z.infer<typeof StockPredictionSchema>;
export type CryptoPrediction = z.infer<typeof CryptoPredictionSchema>;
export type SportsPrediction = z.infer<typeof SportsPredictionSchema>;
export type PoliticsPrediction = z.infer<typeof PoliticsPredictionSchema>;

/**
 * Schema selector utility
 */
export function getPredictionSchema(domain: 'stock' | 'crypto' | 'sports' | 'politics') {
  switch (domain) {
    case 'stock':
      return StockPredictionSchema;
    case 'crypto':
      return CryptoPredictionSchema;
    case 'sports':
      return SportsPredictionSchema;
    case 'politics':
      return PoliticsPredictionSchema;
  }
}
