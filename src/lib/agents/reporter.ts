import { generateText, stepCountIs } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { ReporterInput, ReporterOutput } from './types';
import { fetchNewsTool } from '../tools/fetch-news';
import { getRecentReports, formatPreviousReportsForPrompt } from '../utils/duplicate-checker';

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

  // 1. Fetch recent reports to avoid duplicates
  const previousReports = await getRecentReports(input.topic, 24, 10);
  const previousReportsInfo = formatPreviousReportsForPrompt(previousReports);

  // 2. Build system prompt for reporter agent
  const systemPrompt = `You are an expert AI Reporter specializing in ${input.topic} news${input.region ? ` in ${input.region}` : ''}.

Your workflow:
1. First, use the fetchNews tool to gather the latest 24-hour news on your topic.
2. Analyze the news articles to identify current trends and hot topics.
3. Select the most interesting and relevant topic to write about.
4. Write a comprehensive, well-researched report based on the real news data.

IMPORTANT - AVOID DUPLICATES:
${previousReportsInfo}

You MUST select a topic that is different from the recent reports listed above. Choose a fresh angle, different news story, or emerging trend that hasn't been covered yet. If the news you fetch has already been reported on, select a different aspect or a new development.

Always cite your sources with the actual URLs from the news articles.
Focus on providing accurate, timely, and insightful analysis.`;

  // 2. Execute multi-step workflow with AI SDK v6 patterns
  const { text, steps } = await generateText({
    model: google('gemini-2.0-flash'),
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

IMPORTANT: When citing sources in your content, use markdown link format: [source name](url)
For example: "According to [Reuters](https://reuters.com/article/...), the market showed..."

IMPORTANT: Include at least one or two data visualizations in your report:
- Extract or calculate relevant numerical data from the news (e.g., price changes, percentages, comparisons, statistics)
- Create at least one data table with this information
- Create at least one chart configuration (line, bar, area, or pie chart) to visualize trends or comparisons

After gathering the news, provide your response in the following JSON format:
{
  "title": "Your compelling article title",
  "content": "Your detailed article content (at least 500 words) with markdown links for citations. Use {{TABLE:0}}, {{TABLE:1}}, etc. to reference where tables should appear, and {{CHART:0}}, {{CHART:1}}, etc. for charts.",
  "trends": ["trend1", "trend2", "trend3"],
  "sources": ["url1", "url2", "url3"],
  "dataTables": [
    {
      "title": "Table title",
      "headers": ["Column1", "Column2", "Column3"],
      "rows": [
        ["Data1", "Data2", "Data3"],
        ["Data4", "Data5", "Data6"]
      ]
    }
  ],
  "charts": [
    {
      "title": "Chart title",
      "type": "line" | "bar" | "area" | "pie",
      "data": [
        {"name": "Label1", "value": 100, "value2": 200},
        {"name": "Label2", "value": 150, "value2": 250}
      ],
      "xKey": "name",
      "yKeys": ["value", "value2"]
    }
  ]
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
        dataTables: parsed.dataTables || [],
        charts: parsed.charts || [],
      };
    } else {
      // Fallback if no JSON found
      output = {
        title: `${input.topic} Report`,
        content: text,
        trends: [],
        sources: [],
        dataTables: [],
        charts: [],
      };
    }
  } catch {
    // Fallback on parse error
    output = {
      title: `${input.topic} Report`,
      content: text,
      trends: [],
      sources: [],
      dataTables: [],
      charts: [],
    };
  }

  // 7. Final duplicate check (log warning if duplicate detected)
  const { checkTitleSimilarity } = await import('../utils/duplicate-checker');
  const duplicateCheck = checkTitleSimilarity(output.title, previousReports);
  if (duplicateCheck.isDuplicate && duplicateCheck.matchingReport) {
    console.warn(`[DUPLICATE WARNING] New report "${output.title}" is similar to existing report "${duplicateCheck.matchingReport.title}" (ID: ${duplicateCheck.matchingReport.id})`);
    // Note: We're logging the warning but still returning the output.
    // You could modify this behavior to throw an error or return a different status.
  }

  return {
    output,
    steps: stepLogs,
    totalSteps: steps.length,
  };
}
