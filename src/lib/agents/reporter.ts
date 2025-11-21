import { generateText, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { ReporterInput, ReporterOutput } from './types';
import { fetchNewsTool } from '../tools/fetch-news';

export interface ReporterWorkflowResult {
  output: ReporterOutput;
  steps: {
    stepNumber: number;
    action: string;
    toolCalls?: string[];
  }[];
  totalSteps: number;
}

export async function runReporter(input: ReporterInput): Promise<ReporterOutput> {
  const result = await runReporterWorkflow(input);
  return result.output;
}

export async function runReporterWorkflow(input: ReporterInput): Promise<ReporterWorkflowResult> {
  const stepLogs: ReporterWorkflowResult['steps'] = [];

  // 1. Build system prompt for reporter agent
  const systemPrompt = `You are an expert AI Reporter specializing in ${input.topic} news${input.region ? ` in ${input.region}` : ''}.

Your workflow:
1. First, use the fetchNews tool to gather the latest 24-hour news on your topic.
2. Analyze the news articles to identify current trends and hot topics.
3. Select the most interesting and relevant topic to write about.
4. Write a comprehensive, well-researched report based on the real news data.

Always cite your sources with the actual URLs from the news articles.
Focus on providing accurate, timely, and insightful analysis.`;

  // 2. Execute multi-step workflow with AI SDK v6 patterns
  const { text, steps } = await generateText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    tools: {
      fetchNews: fetchNewsTool,
    },
    // 3. Control workflow with stopWhen
    stopWhen: stepCountIs(5),
    // 4. Force news fetching on first step
    prepareStep: async ({ stepNumber }) => {
      if (stepNumber === 0) {
        return {
          toolChoice: { type: 'tool', toolName: 'fetchNews' },
        };
      }
      return {};
    },
    // 5. Log step progress
    onStepFinish: ({ text, toolCalls }) => {
      const currentStep = stepLogs.length;
      stepLogs.push({
        stepNumber: currentStep,
        action: toolCalls.length > 0 ? 'tool_call' : 'generation',
        toolCalls: toolCalls.map(tc => tc.toolName),
      });
    },
    prompt: `Research and write a comprehensive report about the latest ${input.topic} news${input.region ? ` in ${input.region}` : ''}.

After gathering the news, provide your response in the following JSON format:
{
  "title": "Your compelling article title",
  "content": "Your detailed article content (at least 500 words)",
  "trends": ["trend1", "trend2", "trend3"],
  "sources": ["url1", "url2", "url3"]
}`,
  });

  // 6. Parse the final output
  let output: ReporterOutput;

  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      output = {
        title: parsed.title || 'Untitled Report',
        content: parsed.content || text,
        trends: parsed.trends || [],
        sources: parsed.sources || [],
      };
    } else {
      // Fallback if no JSON found
      output = {
        title: `${input.topic} Report`,
        content: text,
        trends: [],
        sources: [],
      };
    }
  } catch {
    // Fallback on parse error
    output = {
      title: `${input.topic} Report`,
      content: text,
      trends: [],
      sources: [],
    };
  }

  return {
    output,
    steps: stepLogs,
    totalSteps: steps.length,
  };
}
