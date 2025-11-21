# Architecture Documentation

## Overview

Naly is a predictive content service built on a multi-agent AI architecture. The system orchestrates four specialized AI agents that work sequentially to transform topic ideas into production-ready content with visual assets, optimized layouts, and marketing strategies.

## System Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│                    (Next.js App Router)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     Server Actions Layer                     │
│                      (actions.ts)                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │   Multi-Agent Workflow     │
         └────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
    ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
    │Reporter│──▶│ Editor │──▶│Designer│──▶│Marketer│
    └────────┘   └────────┘   └────────┘   └────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │
                      ▼
              ┌──────────────┐
              │  OpenAI API  │
              │   (GPT-4o)   │
              └──────────────┘
```

## Core Components

### 1. User Interface Layer

**Location**: `src/app/page.tsx`

The UI is built with Next.js App Router and provides:
- Topic selection (Stock, Coin, Sports, Politics)
- Region selection (US, KR)
- Real-time workflow status
- Sequential display of agent outputs
- Error handling and user feedback

**Technology Stack**:
- Next.js 16 with App Router
- React Server Components
- Tailwind CSS for styling
- Lucide React for icons

### 2. Server Actions Layer

**Location**: `src/app/actions.ts`

Implements Next.js Server Actions to:
- Orchestrate the multi-agent workflow
- Handle API key validation
- Manage error states
- Return structured results to the client

**Key Functions**:
- `generateContent(input: ReporterInput)`: Main orchestration function

### 3. Agent Layer

**Location**: `src/lib/agents/`

Each agent is implemented as a separate module with:
- Type-safe input/output schemas (Zod)
- AI model integration (Vercel AI SDK)
- Specialized prompts for specific tasks

#### Agent Details

##### AI Reporter (`reporter.ts`)

**Purpose**: Researches trending topics and creates initial content

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
  title: string,
  content: string,
  trends: string[],
  sources: string[]
}
```

**Workflow**:
1. Identifies current hot trends in the specified domain
2. Selects a specific deep topic
3. Writes a comprehensive report
4. Provides sources and trend metadata

##### AI Editor (`editor.ts`)

**Purpose**: Reviews and refines content for quality and accuracy

**Input**:
```typescript
{
  originalContent: ReporterOutput
}
```

**Output**:
```typescript
{
  title: string,
  content: string,
  changes: string[],
  status: 'approved' | 'revised'
}
```

**Workflow**:
1. Validates content for clarity and accuracy
2. Improves writing style
3. Fixes grammatical errors
4. Ensures appropriate tone
5. Documents all changes made

##### AI Designer (`designer.ts`)

**Purpose**: Enhances content with visual elements and layout strategies

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

**Workflow**:
1. Analyzes content to determine visual needs
2. Suggests appropriate asset types
3. Generates asset descriptions
4. Provides layout recommendations

**Note**: Currently uses placeholder images. In production, this would integrate with:
- Image generation APIs (DALL-E, Midjourney)
- Video generation services
- Audio synthesis tools

##### AI Marketer (`marketer.ts`)

**Purpose**: Optimizes content for engagement and predicts performance

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
    retention: number,
    views: number,
    clicks: number
  },
  strategy: string
}
```

**Workflow**:
1. Analyzes content and assets
2. Determines optimal ad placements
3. Predicts user engagement metrics
4. Formulates optimization strategy ("Ultrathink")

## Data Flow

### Sequential Pipeline

The agents execute in a strict sequential order, where each agent's output becomes the next agent's input:

```
User Input
    │
    ▼
Reporter (generates content)
    │
    ├─► title, content, trends, sources
    │
    ▼
Editor (refines content)
    │
    ├─► revised title, content, changes[], status
    │
    ▼
Designer (adds visuals)
    │
    ├─► assets[], layoutSuggestion
    │
    ▼
Marketer (optimizes for engagement)
    │
    ├─► adPlacements[], predictedMetrics, strategy
    │
    ▼
Final Result (returned to UI)
```

### Error Handling

The system implements comprehensive error handling:

1. **API Key Validation**: Checks for OpenAI API key before execution
2. **Try-Catch Blocks**: Wraps entire workflow in error handling
3. **Structured Errors**: Returns consistent error format to UI
4. **User Feedback**: Displays clear error messages to users

```typescript
return {
  success: false,
  error: error instanceof Error ? error.message : 'Unexpected error'
}
```

## AI Model Configuration

### Model Selection

**Current**: OpenAI GPT-4o (`gpt-4o`)

**Rationale**:
- High-quality structured output generation
- Strong reasoning capabilities
- Fast response times
- Cost-effective for production use

### Structured Output Generation

Uses Vercel AI SDK's `generateObject` with Zod schemas:

```typescript
const { object } = await generateObject({
  model: openai('gpt-4o'),
  schema: z.object({
    // Type-safe schema definition
  }),
  prompt: prompt,
});
```

**Benefits**:
- Type safety at runtime
- Guaranteed JSON structure
- Automatic validation
- Better error messages

## Scalability Considerations

### Current Implementation

- Synchronous sequential execution
- Single OpenAI API key
- No caching or rate limiting
- In-memory state management

### Production Enhancements

For production deployment, consider:

1. **Parallel Processing**: Run independent agents concurrently
2. **Queue System**: Implement job queue (Bull, BullMQ) for async processing
3. **Caching**: Cache frequent queries and trend data
4. **Rate Limiting**: Implement API rate limiting
5. **Database Integration**: Store generated content and metrics
6. **Monitoring**: Add observability (logging, tracing, metrics)
7. **Load Balancing**: Distribute requests across multiple instances

### Recommended Architecture for Scale

```
Load Balancer
    │
    ├─► Next.js Instance 1
    ├─► Next.js Instance 2
    └─► Next.js Instance N
            │
            ▼
    Redis Queue (Bull)
            │
            ▼
    Worker Pool
            │
            ├─► Reporter Workers
            ├─► Editor Workers
            ├─► Designer Workers
            └─► Marketer Workers
                    │
                    ▼
            PostgreSQL/MongoDB
            (Content Storage)
```

## Security Considerations

### Current Implementation

- Server-side API key storage (environment variables)
- No user authentication
- No rate limiting
- No input sanitization

### Production Requirements

1. **Authentication**: Implement user authentication (NextAuth.js)
2. **Authorization**: Role-based access control
3. **Rate Limiting**: Per-user API call limits
4. **Input Validation**: Sanitize all user inputs
5. **API Key Rotation**: Implement key rotation strategy
6. **Audit Logging**: Log all content generation requests
7. **CORS Configuration**: Restrict API access

## Performance Metrics

### Expected Response Times

- Reporter: 5-10 seconds
- Editor: 3-7 seconds
- Designer: 3-5 seconds
- Marketer: 3-5 seconds

**Total Pipeline**: ~15-30 seconds per content generation

### Optimization Opportunities

1. **Streaming Responses**: Stream agent outputs as they complete
2. **Parallel Execution**: Run Designer and preliminary Marketer analysis concurrently
3. **Model Selection**: Use faster models for less critical tasks
4. **Prompt Optimization**: Reduce token usage with concise prompts
5. **Result Caching**: Cache common trend analyses

## Technology Stack

### Core Technologies

- **Framework**: Next.js 16 (App Router)
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5
- **AI SDK**: Vercel AI SDK 5.0+
- **AI Provider**: OpenAI (GPT-4o)
- **Styling**: Tailwind CSS 4
- **Validation**: Zod 4

### Development Tools

- **Package Manager**: pnpm
- **Linting**: ESLint 9 with Next.js config
- **Type Checking**: TypeScript strict mode
- **Version Control**: Git

## Future Enhancements

### Planned Features

1. **Real-time Data Integration**: Connect to actual data sources for trends
2. **Content Storage**: Database integration for generated content
3. **User Accounts**: Multi-user support with saved preferences
4. **Content Scheduling**: Schedule content publication
5. **Analytics Dashboard**: Track content performance metrics
6. **A/B Testing**: Test different agent configurations
7. **Multi-model Support**: Support for different AI providers
8. **Webhook Integration**: Notify external systems of new content
9. **Export Formats**: Export to various formats (PDF, Markdown, HTML)
10. **Collaboration**: Multi-user workflow with reviews and approvals

### Experimental Features

1. **Agent Fine-tuning**: Train custom models for specific domains
2. **Feedback Loop**: Learn from user engagement data
3. **Multi-language Support**: Generate content in multiple languages
4. **Voice Integration**: Audio narration generation
5. **Video Generation**: Automated video content creation
