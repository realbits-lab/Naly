import { NextRequest, NextResponse } from 'next/server';
import { streamText, stepCountIs } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { fetchNewsTool } from '@/lib/tools/fetch-news';

const RequestSchema = z.object({
  topic: z.enum(['stock', 'coin', 'sports', 'politics']),
  region: z.enum(['US', 'KR']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validatedInput = RequestSchema.parse(body);
    const { topic, region } = validatedInput;

    // 2. Build system prompt for reporter agent
    const systemPrompt = `You are an expert AI Reporter specializing in ${topic} news${region ? ` in ${region}` : ''}.

Your workflow:
1. First, use the fetchNews tool to gather the latest 24-hour news on your topic.
2. Analyze the news articles to identify current trends and hot topics.
3. Select the most interesting and relevant topic to write about.
4. Write a comprehensive, well-researched report based on the real news data.

Always cite your sources with the actual URLs from the news articles.
Focus on providing accurate, timely, and insightful analysis.

After gathering and analyzing the news, write a comprehensive report with:
- A compelling headline
- Key trends identified
- Detailed analysis (at least 500 words)
- Properly cited sources`;

    // 3. Execute streaming multi-step workflow
    const result = streamText({
      model: google('gemini-2.0-flash-exp'),
      system: systemPrompt,
      tools: {
        fetchNews: fetchNewsTool,
      },
      // 4. Control workflow iterations
      stopWhen: stepCountIs(5),
      // 5. Force news fetching on first step
      prepareStep: async ({ stepNumber }) => {
        if (stepNumber === 0) {
          return {
            toolChoice: { type: 'tool', toolName: 'fetchNews' },
          };
        }
        return {};
      },
      // 6. Log step completion
      onStepFinish: ({ toolCalls }) => {
        console.log(`[Reporter] Step completed`, {
          toolCalls: toolCalls.map(tc => tc.toolName),
        });
      },
      prompt: `Research and write a comprehensive news report about the latest ${topic} developments${region ? ` in ${region}` : ''}.`,
    });

    // 7. Return streaming response
    return result.toTextStreamResponse();
  } catch (error) {
    // 8. Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }

    // 9. Handle other errors
    console.error('[Reporter API Error]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
