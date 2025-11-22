import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { MarketerInput, MarketerOutput } from './types';

export interface MarketerResult {
  output: MarketerOutput;
  tokensUsed: number;
}

// Token pricing for Google Gemini 2.0 Flash (as of 2025)
// Prices per 1M tokens
const TOKEN_COST_PER_MILLION = {
  input: 0.0001875, // $0.0001875 per 1K input tokens = $0.1875 per 1M
  output: 0.00075,  // $0.00075 per 1K output tokens = $0.75 per 1M
};

// Average revenue per ad click (industry standard CPM/CPC estimates)
const REVENUE_PER_CLICK = 0.50; // $0.50 per click

export function calculateTokenCost(tokens: number): number {
  // Simplified: assume 50/50 split between input and output tokens
  const avgCostPerMillion = (TOKEN_COST_PER_MILLION.input + TOKEN_COST_PER_MILLION.output) / 2;
  return (tokens / 1_000_000) * avgCostPerMillion;
}

export function calculateROI(totalTokens: number, predictedClicks: number): {
  estimatedCost: number;
  estimatedRevenue: number;
  roi: number;
} {
  const estimatedCost = calculateTokenCost(totalTokens);
  const estimatedRevenue = predictedClicks * REVENUE_PER_CLICK;
  const roi = estimatedCost > 0 ? ((estimatedRevenue - estimatedCost) / estimatedCost) * 100 : 0;

  return {
    estimatedCost,
    estimatedRevenue,
    roi,
  };
}

export async function runMarketer(input: MarketerInput): Promise<MarketerResult> {
  const prompt = `
    You are an expert AI Marketer. Analyze the following content and assets to maximize engagement and revenue.

    Title: ${input.content.title}
    Content Snippet: ${input.content.content.substring(0, 200)}...
    Assets Count: ${input.assets.assets.length}

    Your task:
    1. Decide where to place ads for maximum visibility without annoying the user.
    2. Predict user retention and view counts based on the content quality and topic.
    3. Formulate a strategy to improve these metrics ("Ultrathink").
  `;

  const { object, usage } = await generateObject({
    model: google('gemini-2.0-flash'),
    schema: z.object({
      adPlacements: z.array(z.object({
        position: z.string(),
        type: z.string(),
      })),
      predictedMetrics: z.object({
        retention: z.number().describe('Predicted retention rate in percentage (0-100)'),
        views: z.number().describe('Predicted view count'),
        clicks: z.number().describe('Predicted ad click count'),
      }),
      strategy: z.string(),
    }),
    prompt: prompt,
  });

  return {
    output: object,
    tokensUsed: usage.totalTokens || 0,
  };
}
