# API Documentation

## Overview

Naly exposes its functionality through Next.js Server Actions, providing a type-safe API for content generation. This document describes the available endpoints, request/response formats, and usage examples.

## Server Actions

### generateContent

Orchestrates the complete multi-agent workflow to generate content from a topic and region.

**Location**: `src/app/actions.ts`

**Function Signature**:
```typescript
async function generateContent(
  input: ReporterInput
): Promise<GenerateContentResponse>
```

**Request Parameters**:

```typescript
interface ReporterInput {
  topic: 'stock' | 'coin' | 'sports' | 'politics';
  region?: 'US' | 'KR';
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| topic | enum | Yes | Content topic to research |
| region | enum | No | Geographic region for content focus |

**Response Format**:

```typescript
interface GenerateContentResponse {
  success: boolean;
  data?: {
    reporter: ReporterOutput;
    editor: EditorOutput;
    designer: DesignerOutput;
    marketer: MarketerOutput;
  };
  error?: string;
}
```

**Success Response**:

```typescript
{
  success: true,
  data: {
    reporter: {
      title: "Bitcoin Surges Past $50K Amid Institutional Adoption",
      content: "In a remarkable turn of events...",
      trends: ["institutional adoption", "ETF approval", "regulatory clarity"],
      sources: ["Bloomberg", "CoinDesk", "Reuters"]
    },
    editor: {
      title: "Bitcoin Surges Past $50K as Institutions Embrace Crypto",
      content: "In a remarkable development for the cryptocurrency market...",
      changes: [
        "Improved headline clarity",
        "Added context in opening paragraph",
        "Fixed grammatical errors in body"
      ],
      status: "revised"
    },
    designer: {
      assets: [
        {
          type: "image",
          url: "https://placehold.co/600x400?text=image",
          alt: "Bitcoin price chart showing upward trend"
        },
        {
          type: "image",
          url: "https://placehold.co/600x400?text=image",
          alt: "Institutional investors meeting"
        }
      ],
      layoutSuggestion: "Use hero layout with main chart at top, split content into 3 columns below"
    },
    marketer: {
      adPlacements: [
        { position: "After first paragraph", type: "Banner" },
        { position: "Sidebar", type: "Native ad" },
        { position: "Footer", type: "Recommendation widget" }
      ],
      predictedMetrics: {
        retention: 72,
        views: 15000,
        clicks: 450
      },
      strategy: "Focus on SEO optimization with trending keywords. Schedule publication during peak trading hours. Cross-promote on social media with eye-catching visuals."
    }
  }
}
```

**Error Response**:

```typescript
{
  success: false,
  error: "OPENAI_API_KEY is not configured. Please add it to your .env file."
}
```

**Usage Example**:

```typescript
'use client';

import { generateContent } from './actions';
import { useState } from 'react';

export default function ContentGenerator() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    const response = await generateContent({
      topic: 'stock',
      region: 'US'
    });

    if (response.success) {
      setResult(response.data);
    } else {
      setError(response.error);
    }
  };

  return (
    <button onClick={handleGenerate}>
      Generate Content
    </button>
  );
}
```

## Agent APIs

### Reporter Agent

**Function**: `runReporter(input: ReporterInput): Promise<ReporterOutput>`

**Purpose**: Research trending topics and generate initial content

**Input**:
```typescript
{
  topic: 'stock' | 'coin' | 'sports' | 'politics',
  region?: 'US' | 'KR'
}
```

**Output**:
```typescript
{
  title: string,        // Article title
  content: string,      // Full article content
  trends: string[],     // Identified trending topics
  sources: string[]     // Reference sources
}
```

**Example**:
```typescript
import { runReporter } from '@/lib/agents/reporter';

const output = await runReporter({
  topic: 'coin',
  region: 'US'
});

console.log(output.title);
// "Bitcoin ETF Approval Sends Crypto Markets Soaring"
```

### Editor Agent

**Function**: `runEditor(input: EditorInput): Promise<EditorOutput>`

**Purpose**: Review and improve content quality

**Input**:
```typescript
{
  originalContent: ReporterOutput
}
```

**Output**:
```typescript
{
  title: string,           // Revised title
  content: string,         // Revised content
  changes: string[],       // List of changes made
  status: 'approved' | 'revised'
}
```

**Example**:
```typescript
import { runEditor } from '@/lib/agents/editor';

const output = await runEditor({
  originalContent: reporterOutput
});

console.log(output.changes);
// ["Improved headline clarity", "Fixed grammar", "Enhanced readability"]
```

### Designer Agent

**Function**: `runDesigner(input: DesignerInput): Promise<DesignerOutput>`

**Purpose**: Suggest visual assets and layout

**Input**:
```typescript
{
  content: EditorOutput
}
```

**Output**:
```typescript
{
  assets: Array<{
    type: 'image' | 'video' | 'audio',
    url: string,
    alt: string
  }>,
  layoutSuggestion: string
}
```

**Example**:
```typescript
import { runDesigner } from '@/lib/agents/designer';

const output = await runDesigner({
  content: editorOutput
});

console.log(output.assets.length); // 3
console.log(output.layoutSuggestion);
// "Hero layout with featured image, two-column text with sidebar ads"
```

### Marketer Agent

**Function**: `runMarketer(input: MarketerInput): Promise<MarketerOutput>`

**Purpose**: Optimize for engagement and predict performance

**Input**:
```typescript
{
  content: EditorOutput,
  assets: DesignerOutput
}
```

**Output**:
```typescript
{
  adPlacements: Array<{
    position: string,
    type: string
  }>,
  predictedMetrics: {
    retention: number,    // Percentage (0-100)
    views: number,        // Predicted view count
    clicks: number        // Predicted click count
  },
  strategy: string       // Marketing strategy description
}
```

**Example**:
```typescript
import { runMarketer } from '@/lib/agents/marketer';

const output = await runMarketer({
  content: editorOutput,
  assets: designerOutput
});

console.log(output.predictedMetrics);
// { retention: 75, views: 12000, clicks: 360 }
```

## Error Codes and Handling

### Common Error Scenarios

#### 1. Missing API Key

**Error Message**: `"OPENAI_API_KEY is not configured. Please add it to your .env file."`

**Solution**: Set the `OPENAI_API_KEY` environment variable

```bash
# .env.local
OPENAI_API_KEY=sk-...
```

#### 2. Rate Limit Exceeded

**Error Message**: `"Rate limit exceeded. Please try again later."`

**Solution**:
- Implement request queuing
- Add delays between requests
- Upgrade API plan

#### 3. Invalid Input

**Error Message**: `"Invalid topic provided"`

**Solution**: Ensure topic is one of: `stock`, `coin`, `sports`, `politics`

#### 4. Model Timeout

**Error Message**: `"Request timeout"`

**Solution**:
- Increase timeout limit
- Retry with exponential backoff
- Check API status

### Error Handling Best Practices

```typescript
export async function generateContentWithRetry(
  input: ReporterInput,
  maxRetries: number = 3
): Promise<GenerateContentResponse> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateContent(input);
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed after multiple retries'
        };
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return { success: false, error: 'Unexpected error' };
}
```

## Rate Limits

### OpenAI API Limits

The application is subject to OpenAI API rate limits:

- **GPT-4o**:
  - 10,000 requests per minute (RPM)
  - 300,000 tokens per minute (TPM)
  - 10,000,000 tokens per day (TPD)

### Application-Level Limits

**Recommended limits for production**:

- 10 requests per minute per user
- 100 requests per hour per user
- 1,000 requests per day per user

**Implementation**:

```typescript
import { RateLimiter } from 'limiter';

const limiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: 'minute'
});

export async function generateContent(input: ReporterInput) {
  const remainingTokens = await limiter.removeTokens(1);

  if (remainingTokens < 0) {
    return {
      success: false,
      error: 'Rate limit exceeded. Please try again in a minute.'
    };
  }

  // ... continue with generation
}
```

## Authentication (Future)

Currently, the application does not require authentication. For production deployment, consider implementing:

### NextAuth.js Integration

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### Protected Server Actions

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function generateContent(input: ReporterInput) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      success: false,
      error: 'Unauthorized. Please sign in.'
    };
  }

  // Check user quota
  const remainingQuota = await getUserQuota(session.user.id);
  if (remainingQuota <= 0) {
    return {
      success: false,
      error: 'Quota exceeded. Please upgrade your plan.'
    };
  }

  // ... continue with generation
}
```

## Streaming API (Advanced)

For real-time updates, implement streaming:

### Server-Side

```typescript
import { streamObject } from 'ai';

export async function generateContentStream(input: ReporterInput) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 1. Stream reporter output
        controller.enqueue(encoder.encode(JSON.stringify({ stage: 'reporter', status: 'working' }) + '\n'));
        const reporterOutput = await runReporter(input);
        controller.enqueue(encoder.encode(JSON.stringify({ stage: 'reporter', data: reporterOutput }) + '\n'));

        // 2. Stream editor output
        controller.enqueue(encoder.encode(JSON.stringify({ stage: 'editor', status: 'working' }) + '\n'));
        const editorOutput = await runEditor({ originalContent: reporterOutput });
        controller.enqueue(encoder.encode(JSON.stringify({ stage: 'editor', data: editorOutput }) + '\n'));

        // 3. Stream designer output
        controller.enqueue(encoder.encode(JSON.stringify({ stage: 'designer', status: 'working' }) + '\n'));
        const designerOutput = await runDesigner({ content: editorOutput });
        controller.enqueue(encoder.encode(JSON.stringify({ stage: 'designer', data: designerOutput }) + '\n'));

        // 4. Stream marketer output
        controller.enqueue(encoder.encode(JSON.stringify({ stage: 'marketer', status: 'working' }) + '\n'));
        const marketerOutput = await runMarketer({ content: editorOutput, assets: designerOutput });
        controller.enqueue(encoder.encode(JSON.stringify({ stage: 'marketer', data: marketerOutput }) + '\n'));

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Client-Side

```typescript
async function streamGeneration() {
  const response = await fetch('/api/generate-stream', {
    method: 'POST',
    body: JSON.stringify({ topic: 'stock', region: 'US' }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split('\n').filter(Boolean);

    for (const line of lines) {
      const update = JSON.parse(line);
      console.log('Update:', update);
      // Update UI based on stage
    }
  }
}
```

## Webhook Integration (Future)

For external system integration:

### Webhook Configuration

```typescript
// app/api/webhooks/content-generated/route.ts
export async function POST(request: Request) {
  const { data } = await request.json();

  // Send webhook to configured URLs
  const webhookUrls = process.env.WEBHOOK_URLS?.split(',') || [];

  await Promise.all(
    webhookUrls.map(url =>
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'content.generated',
          timestamp: new Date().toISOString(),
          data,
        }),
      })
    )
  );

  return Response.json({ success: true });
}
```

## Type Definitions

### Complete TypeScript Definitions

```typescript
// Request Types
export type TopicType = 'stock' | 'coin' | 'sports' | 'politics';
export type RegionType = 'US' | 'KR';

export interface ReporterInput {
  topic: TopicType;
  region?: RegionType;
}

// Response Types
export interface ReporterOutput {
  title: string;
  content: string;
  trends: string[];
  sources: string[];
}

export interface EditorInput {
  originalContent: ReporterOutput;
}

export interface EditorOutput {
  title: string;
  content: string;
  changes: string[];
  status: 'approved' | 'revised';
}

export interface DesignerInput {
  content: EditorOutput;
}

export interface Asset {
  type: 'image' | 'video' | 'audio';
  url: string;
  alt: string;
}

export interface DesignerOutput {
  assets: Asset[];
  layoutSuggestion: string;
}

export interface MarketerInput {
  content: EditorOutput;
  assets: DesignerOutput;
}

export interface AdPlacement {
  position: string;
  type: string;
}

export interface PredictedMetrics {
  retention: number;
  views: number;
  clicks: number;
}

export interface MarketerOutput {
  adPlacements: AdPlacement[];
  predictedMetrics: PredictedMetrics;
  strategy: string;
}

// API Response Types
export interface GenerateContentSuccess {
  success: true;
  data: {
    reporter: ReporterOutput;
    editor: EditorOutput;
    designer: DesignerOutput;
    marketer: MarketerOutput;
  };
}

export interface GenerateContentError {
  success: false;
  error: string;
}

export type GenerateContentResponse =
  | GenerateContentSuccess
  | GenerateContentError;
```

## OpenAPI Specification

For future REST API implementation:

```yaml
openapi: 3.0.0
info:
  title: Naly Content Generation API
  version: 1.0.0
  description: AI-powered predictive content service

paths:
  /api/generate:
    post:
      summary: Generate content using multi-agent workflow
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - topic
              properties:
                topic:
                  type: string
                  enum: [stock, coin, sports, politics]
                region:
                  type: string
                  enum: [US, KR]
      responses:
        '200':
          description: Content generated successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: object
        '400':
          description: Invalid request
        '401':
          description: Unauthorized
        '429':
          description: Rate limit exceeded
        '500':
          description: Server error
```

## SDK (Future)

Example client SDK implementation:

```typescript
// naly-sdk/index.ts
export class NalyClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: { apiKey: string; baseUrl?: string }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.naly.com';
  }

  async generateContent(input: ReporterInput): Promise<GenerateContentResponse> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(input),
    });

    return response.json();
  }

  async *generateContentStream(input: ReporterInput) {
    const response = await fetch(`${this.baseUrl}/api/generate-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(input),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const updates = text.split('\n').filter(Boolean).map(JSON.parse);

      for (const update of updates) {
        yield update;
      }
    }
  }
}

// Usage
const client = new NalyClient({ apiKey: 'your-api-key' });
const result = await client.generateContent({ topic: 'stock', region: 'US' });
```

## Additional Resources

- [Architecture Documentation](./architecture.md)
- [Agent Implementation Guide](./agent-implementation-guide.md)
- [Deployment Guide](./deployment.md)
- [Examples Repository](https://github.com/realbits-lab/naly-examples)
