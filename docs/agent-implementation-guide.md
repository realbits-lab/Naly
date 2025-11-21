# Agent Implementation Guide

## Overview

This guide provides detailed instructions for implementing and customizing the AI agents in the Naly system. Each agent follows a consistent pattern and can be extended or modified to support additional use cases.

## Agent Architecture Pattern

All agents in Naly follow a standardized architecture:

```typescript
// 1. Import dependencies
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { AgentInput, AgentOutput } from './types';

// 2. Define the agent function
export async function runAgent(input: AgentInput): Promise<AgentOutput> {
  // 3. Construct the prompt
  const prompt = `...`;

  // 4. Call the AI model with structured output
  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: z.object({ /* output schema */ }),
    prompt: prompt,
  });

  // 5. Return the result
  return object;
}
```

## Type System

### Location: `src/lib/agents/types.ts`

The type system ensures type safety across the entire pipeline:

```typescript
// Agent state tracking
export type AgentRole = 'reporter' | 'editor' | 'designer' | 'marketer';

export interface AgentState {
  role: AgentRole;
  status: 'idle' | 'working' | 'completed' | 'failed';
  output?: any;
  error?: string;
}
```

### Input/Output Contracts

Each agent has strictly typed input and output contracts:

```typescript
// Reporter
export const ReporterInputSchema = z.object({
  topic: z.enum(['stock', 'coin', 'sports', 'politics']),
  region: z.enum(['US', 'KR']).optional(),
});
export type ReporterInput = z.infer<typeof ReporterInputSchema>;

export interface ReporterOutput {
  title: string;
  content: string;
  trends: string[];
  sources: string[];
}
```

## Agent Implementation Details

### 1. Reporter Agent

**File**: `src/lib/agents/reporter.ts`

**Purpose**: Research trends and generate initial content

**Implementation Details**:

```typescript
export async function runReporter(input: ReporterInput): Promise<ReporterOutput> {
  // 1. Construct specialized prompt
  const prompt = `
    You are an expert AI Reporter specializing in ${input.topic} ${input.region ? `in ${input.region}` : ''}.

    Your task:
    1. Identify current hot trends in your field.
    2. Select one specific, deep topic to write about.
    3. Write a comprehensive report on this topic.

    Output the result as a JSON object with title, content, trends identified, and mock sources.
  `;

  // 2. Generate structured output
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
```

**Customization Options**:

1. **Add Real Data Sources**: Integrate with external APIs
   ```typescript
   // Example: Fetch real stock data
   const marketData = await fetchMarketData(input.topic, input.region);
   const prompt = `
     Using this real-time data: ${JSON.stringify(marketData)}
     ...
   `;
   ```

2. **Expand Topic Support**: Add more topics
   ```typescript
   topic: z.enum(['stock', 'coin', 'sports', 'politics', 'tech', 'health', 'entertainment'])
   ```

3. **Add Language Support**: Support multiple languages
   ```typescript
   export interface ReporterInput {
     topic: TopicType;
     region?: RegionType;
     language?: 'en' | 'ko' | 'es' | 'ja';
   }
   ```

### 2. Editor Agent

**File**: `src/lib/agents/editor.ts`

**Purpose**: Review, validate, and improve content quality

**Implementation Details**:

```typescript
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
```

**Customization Options**:

1. **Add Style Guidelines**: Enforce specific writing styles
   ```typescript
   const prompt = `
     Follow these style guidelines:
     - Use active voice
     - Keep sentences under 20 words
     - Avoid jargon
     - Target reading level: Grade 8

     Original Content: ${input.originalContent.content}
     ...
   `;
   ```

2. **Add Fact-Checking**: Integrate fact-checking APIs
   ```typescript
   const factCheckResults = await factCheck(input.originalContent.content);
   const prompt = `
     Fact-check results: ${JSON.stringify(factCheckResults)}
     Correct any inaccuracies found.
     ...
   `;
   ```

3. **Multi-Round Editing**: Implement iterative editing
   ```typescript
   export async function runEditorMultiRound(
     input: EditorInput,
     maxRounds: number = 3
   ): Promise<EditorOutput> {
     let currentContent = input.originalContent;
     const allChanges: string[] = [];

     for (let i = 0; i < maxRounds; i++) {
       const result = await runEditor({ originalContent: currentContent });
       allChanges.push(...result.changes);

       if (result.status === 'approved') break;

       currentContent = {
         ...currentContent,
         title: result.title,
         content: result.content,
       };
     }

     return { ...currentContent, changes: allChanges, status: 'approved' };
   }
   ```

### 3. Designer Agent

**File**: `src/lib/agents/designer.ts`

**Purpose**: Suggest visual assets and layout strategies

**Implementation Details**:

```typescript
export async function runDesigner(input: DesignerInput): Promise<DesignerOutput> {
  const prompt = `
    You are an expert AI Designer. You need to beautify the following content.

    Title: ${input.content.title}
    Content: ${input.content.content}

    Your task:
    1. Suggest visual assets (images, videos, audio) that would enhance this article.
    2. Describe the layout strategy.

    For the assets, provide a description that could be used to generate them (we will mock the URL for now).
  `;

  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: z.object({
      assets: z.array(z.object({
        type: z.enum(['image', 'video', 'audio']),
        description: z.string(),
        alt: z.string(),
      })),
      layoutSuggestion: z.string(),
    }),
    prompt: prompt,
  });

  // Mock URLs for now - replace with real asset generation
  const assetsWithUrls = object.assets.map(asset => ({
    ...asset,
    url: `https://placehold.co/600x400?text=${encodeURIComponent(asset.type)}`,
  }));

  return {
    assets: assetsWithUrls,
    layoutSuggestion: object.layoutSuggestion,
  };
}
```

**Customization Options**:

1. **Integrate Image Generation**: Use DALL-E or Midjourney
   ```typescript
   import OpenAI from 'openai';

   const openaiClient = new OpenAI();

   const assetsWithUrls = await Promise.all(
     object.assets.map(async (asset) => {
       if (asset.type === 'image') {
         const image = await openaiClient.images.generate({
           model: 'dall-e-3',
           prompt: asset.description,
           size: '1024x1024',
         });
         return { ...asset, url: image.data[0].url };
       }
       return { ...asset, url: `placeholder-${asset.type}` };
     })
   );
   ```

2. **Add Layout Templates**: Pre-defined layout options
   ```typescript
   export interface DesignerOutput {
     assets: Asset[];
     layoutSuggestion: string;
     layoutTemplate: 'hero' | 'sidebar' | 'grid' | 'masonry';
     colorScheme: {
       primary: string;
       secondary: string;
       accent: string;
     };
   }
   ```

3. **Responsive Design**: Generate responsive layouts
   ```typescript
   export interface ResponsiveLayout {
     mobile: LayoutConfig;
     tablet: LayoutConfig;
     desktop: LayoutConfig;
   }
   ```

### 4. Marketer Agent

**File**: `src/lib/agents/marketer.ts`

**Purpose**: Optimize for engagement and predict performance metrics

**Implementation Details**:

```typescript
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
    model: openai('gpt-4o'),
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
```

**Customization Options**:

1. **Historical Data Integration**: Use past performance data
   ```typescript
   const historicalData = await getHistoricalMetrics(input.content.title);
   const prompt = `
     Based on historical data showing:
     - Average retention: ${historicalData.avgRetention}%
     - Average views: ${historicalData.avgViews}

     Predict metrics for this new content...
   `;
   ```

2. **A/B Testing Recommendations**: Suggest content variants
   ```typescript
   export interface MarketerOutput {
     adPlacements: AdPlacement[];
     predictedMetrics: PredictedMetrics;
     strategy: string;
     abTestSuggestions: {
       titleVariants: string[];
       thumbnailOptions: string[];
       cta: string[];
     };
   }
   ```

3. **SEO Optimization**: Add SEO recommendations
   ```typescript
   export interface MarketerOutput {
     // ... existing fields
     seo: {
       keywords: string[];
       metaDescription: string;
       slug: string;
       ogImage: string;
     };
   }
   ```

## Creating a New Agent

### Step 1: Define Types

Add types to `src/lib/agents/types.ts`:

```typescript
// Example: Translator Agent
export interface TranslatorInput {
  content: EditorOutput;
  targetLanguages: string[];
}

export interface TranslatorOutput {
  translations: {
    language: string;
    title: string;
    content: string;
  }[];
}
```

### Step 2: Implement Agent

Create `src/lib/agents/translator.ts`:

```typescript
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { TranslatorInput, TranslatorOutput } from './types';

export async function runTranslator(input: TranslatorInput): Promise<TranslatorOutput> {
  const translations = await Promise.all(
    input.targetLanguages.map(async (lang) => {
      const prompt = `
        Translate the following content to ${lang}:
        Title: ${input.content.title}
        Content: ${input.content.content}

        Maintain the tone and style. Adapt cultural references appropriately.
      `;

      const { object } = await generateObject({
        model: openai('gpt-4o'),
        schema: z.object({
          title: z.string(),
          content: z.string(),
        }),
        prompt,
      });

      return {
        language: lang,
        ...object,
      };
    })
  );

  return { translations };
}
```

### Step 3: Integrate into Workflow

Update `src/app/actions.ts`:

```typescript
import { runTranslator } from '@/lib/agents/translator';

export async function generateContent(input: ReporterInput) {
  // ... existing workflow

  // Add translation step
  const translatorOutput = await runTranslator({
    content: editorOutput,
    targetLanguages: ['ko', 'es', 'ja'],
  });

  return {
    success: true,
    data: {
      reporter: reporterOutput,
      editor: editorOutput,
      designer: designerOutput,
      marketer: marketerOutput,
      translator: translatorOutput, // New!
    },
  };
}
```

### Step 4: Update UI

Modify `src/app/page.tsx` to display translation results.

## Best Practices

### 1. Prompt Engineering

**Be Specific**: Provide clear, detailed instructions
```typescript
// ❌ Bad
const prompt = "Write about stocks";

// ✅ Good
const prompt = `
  You are a financial analyst specializing in US equities.
  Write a 500-word analysis of current market trends.
  Focus on technology sector performance.
  Include specific stock examples and data points.
`;
```

**Use Examples**: Provide few-shot examples
```typescript
const prompt = `
  Task: Generate a headline for this article.

  Example 1:
  Content: "Tesla's new battery technology..."
  Headline: "Tesla Revolutionizes EV Industry with New Battery Tech"

  Example 2:
  Content: "Market volatility increases..."
  Headline: "Investors Face Uncertain Markets Amid Rising Volatility"

  Now generate a headline for:
  Content: ${content}
`;
```

### 2. Error Handling

Always wrap agent calls in try-catch blocks:

```typescript
export async function runAgent(input: AgentInput): Promise<AgentOutput> {
  try {
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: outputSchema,
      prompt: constructPrompt(input),
    });

    return object;
  } catch (error) {
    console.error(`Agent failed:`, error);

    // Return fallback or rethrow
    if (error instanceof Error && error.message.includes('rate limit')) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }

    throw error;
  }
}
```

### 3. Type Safety

Use Zod schemas for runtime validation:

```typescript
// Define schema
const OutputSchema = z.object({
  title: z.string().min(10).max(200),
  content: z.string().min(100),
  score: z.number().min(0).max(100),
});

// Use in agent
const { object } = await generateObject({
  model: openai('gpt-4o'),
  schema: OutputSchema,
  prompt,
});

// object is now type-safe and validated
```

### 4. Performance Optimization

**Cache Prompts**: Reuse constructed prompts
```typescript
const promptCache = new Map<string, string>();

function getPrompt(key: string, builder: () => string): string {
  if (!promptCache.has(key)) {
    promptCache.set(key, builder());
  }
  return promptCache.get(key)!;
}
```

**Stream Results**: Use streaming for large outputs
```typescript
import { streamObject } from 'ai';

export async function* runAgentStreaming(input: AgentInput) {
  const { partialObjectStream } = await streamObject({
    model: openai('gpt-4o'),
    schema: outputSchema,
    prompt,
  });

  for await (const partialObject of partialObjectStream) {
    yield partialObject;
  }
}
```

### 5. Testing

Write unit tests for each agent:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { runReporter } from './reporter';

describe('Reporter Agent', () => {
  it('should generate content for stock topic', async () => {
    const result = await runReporter({
      topic: 'stock',
      region: 'US',
    });

    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('content');
    expect(result.trends).toBeInstanceOf(Array);
    expect(result.sources).toBeInstanceOf(Array);
  });

  it('should handle errors gracefully', async () => {
    vi.mock('@ai-sdk/openai', () => ({
      openai: () => {
        throw new Error('API Error');
      },
    }));

    await expect(
      runReporter({ topic: 'stock' })
    ).rejects.toThrow('API Error');
  });
});
```

## Advanced Patterns

### 1. Agent Chaining with Validation

```typescript
export async function runAgentChain<T, U>(
  agent: (input: T) => Promise<U>,
  validator: (output: U) => boolean,
  input: T,
  maxRetries: number = 3
): Promise<U> {
  for (let i = 0; i < maxRetries; i++) {
    const output = await agent(input);

    if (validator(output)) {
      return output;
    }

    console.log(`Validation failed, retry ${i + 1}/${maxRetries}`);
  }

  throw new Error('Agent failed validation after max retries');
}
```

### 2. Parallel Agent Execution

```typescript
export async function runAgentsParallel<T>(
  agents: Array<(input: T) => Promise<any>>,
  input: T
): Promise<any[]> {
  return Promise.all(agents.map(agent => agent(input)));
}

// Usage
const [designerResult, preliminaryMarketingData] = await runAgentsParallel(
  [runDesigner, runPreliminaryMarketing],
  editorOutput
);
```

### 3. Agent State Management

```typescript
export class AgentOrchestrator {
  private states: Map<AgentRole, AgentState> = new Map();

  async runWorkflow(input: ReporterInput) {
    this.updateState('reporter', 'working');
    const reporterOutput = await runReporter(input);
    this.updateState('reporter', 'completed', reporterOutput);

    this.updateState('editor', 'working');
    const editorOutput = await runEditor({ originalContent: reporterOutput });
    this.updateState('editor', 'completed', editorOutput);

    // ... continue workflow
  }

  private updateState(role: AgentRole, status: AgentState['status'], output?: any) {
    this.states.set(role, { role, status, output });
    this.emitStateChange();
  }

  getState(role: AgentRole): AgentState | undefined {
    return this.states.get(role);
  }

  private emitStateChange() {
    // Emit to UI or logging system
    console.log('Agent states:', Array.from(this.states.values()));
  }
}
```

## Debugging Tips

### 1. Log Prompts

Always log prompts for debugging:

```typescript
const prompt = constructPrompt(input);
console.log('Agent prompt:', prompt);

const result = await generateObject({
  model: openai('gpt-4o'),
  schema,
  prompt,
});
```

### 2. Validate Outputs

Add assertions to catch unexpected outputs:

```typescript
const result = await runAgent(input);

console.assert(result.title.length > 0, 'Title should not be empty');
console.assert(result.content.length >= 100, 'Content too short');
```

### 3. Use Development Mode

Create a development mode with mock responses:

```typescript
const DEV_MODE = process.env.NODE_ENV === 'development';

export async function runAgent(input: AgentInput): Promise<AgentOutput> {
  if (DEV_MODE && process.env.USE_MOCK_AGENTS === 'true') {
    return mockAgentResponse(input);
  }

  return realAgentImplementation(input);
}
```

## Conclusion

The agent system in Naly is designed to be modular, extensible, and maintainable. By following these patterns and best practices, you can:

- Add new agents easily
- Customize existing agents
- Maintain type safety
- Handle errors gracefully
- Optimize performance
- Test thoroughly

For more information, see:
- [Architecture Documentation](./architecture.md)
- [API Documentation](./api-documentation.md)
- [Deployment Guide](./deployment.md)
