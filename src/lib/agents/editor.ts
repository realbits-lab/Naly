import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { EditorInput, EditorOutput } from './types';

export interface EditorResult {
  output: EditorOutput;
  tokensUsed: number;
}

export async function runEditor(input: EditorInput): Promise<EditorResult> {
  const prompt = `
    You are an expert AI Editor. Review the following article for quality, accuracy, and style.
    
    Title: ${input.originalContent.title}
    Content: ${input.originalContent.content}
    
    Your task:
    1. Score the content from 0-100 based on quality, clarity, and engagement.
    2. Provide specific feedback and suggestions for improvement.
    3. List specific changes you would make or have made (if you were editing directly, but here just list them).
    4. Determine the status: 'approved' (Score > 85), 'revised' (Score > 60), or 'rejected'.
  `;

  const { object, usage } = await generateObject({
    model: google('gemini-2.0-flash'),
    schema: z.object({
      title: z.string(),
      content: z.string(), // In a real scenario, this might be the edited content
      changes: z.array(z.string()),
      score: z.number().min(0).max(100),
      feedback: z.string(),
      status: z.enum(['approved', 'revised', 'rejected']),
    }),
    prompt: prompt,
  });

  return {
    output: object,
    tokensUsed: usage.totalTokens || 0,
  };
}
