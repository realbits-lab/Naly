import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { MarketerInput, MarketerOutput } from './types';

export async function runMarketer(input: MarketerInput): Promise<MarketerOutput> {
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

  const { object } = await generateObject({
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

  return object;
}
