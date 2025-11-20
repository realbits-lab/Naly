import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { ReporterInput, ReporterOutput } from './types';

export async function runReporter(input: ReporterInput): Promise<ReporterOutput> {
  // In a real scenario, this would fetch real-time data.
  // For now, we simulate trend research with the LLM itself.

  const prompt = `
    You are an expert AI Reporter specializing in ${input.topic} ${input.region ? `in ${input.region}` : ''}.

    Your task:
    1. Identify current hot trends in your field.
    2. Select one specific, deep topic to write about.
    3. Write a comprehensive report on this topic.

    Output the result as a JSON object with title, content, trends identified, and mock sources.
  `;

  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: z.object({
      title: z.string(),
      content: z.string(),
      trends: z.array(z.string()),
      sources: z.array(z.string()),
    }),
    prompt: prompt,
  });

  return object;
}
