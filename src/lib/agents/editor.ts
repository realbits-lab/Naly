import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { EditorInput, EditorOutput } from './types';

export async function runEditor(input: EditorInput): Promise<EditorOutput> {
  const prompt = `
    You are an expert AI Editor. Review the following report submitted by a reporter.

    Original Title: ${input.originalContent.title}
    Original Content: ${input.originalContent.content}

    Your task:
    1. Validate the content for clarity, accuracy, and engagement.
    2. Improve the writing style.
    3. Fix any grammatical errors.
    4. Ensure the tone is appropriate for the topic.

    Output the revised title, revised content, a list of changes made, and the final status.
  `;

  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: z.object({
      title: z.string(),
      content: z.string(),
      changes: z.array(z.string()),
      status: z.enum(['approved', 'revised']),
    }),
    prompt: prompt,
  });

  return object;
}
