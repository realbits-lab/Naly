# Predictive Agent System

A comprehensive autonomous AI agent for generating rigorous, data-driven forecasts across multiple domains using Vercel AI SDK v6.

## Overview

The Predictive Agent implements a **two-phase architecture** inspired by Superforecasting methodology:

1. **Phase 1: Deep Research** - Autonomous exploration using multi-step reasoning (up to 10 steps)
2. **Phase 2: Structured Synthesis** - Enforced schema validation for consistent, actionable predictions

## Supported Domains

### 🏦 Stock Market
- **Data Sources**: Financial Modeling Prep (earnings, fundamentals, technicals)
- **Key Features**:
  - Earnings calendar analysis (primary catalyst identification)
  - Technical indicators (RSI, SMA)
  - Market cap-based volatility profiling
  - Revenue and EPS trend analysis

### 💰 Cryptocurrency
- **Data Sources**: Technical indicators, deep web research
- **Key Features**:
  - Bitcoin correlation analysis (critical for altcoins)
  - Narrative momentum tracking (DeFi, AI, Gaming)
  - Regulatory risk assessment
  - On-chain metrics interpretation

### 🏀 Sports
- **Data Sources**: The Odds API (betting lines across bookmakers)
- **Key Features**:
  - Consensus odds calculation (market probability)
  - Line movement tracking (sharp money detection)
  - Injury impact analysis
  - Home/away advantage quantification

### 🗳️ Politics
- **Data Sources**: Polymarket (prediction markets), deep research
- **Key Features**:
  - Swing state polling prioritization
  - Prediction market vs polls divergence analysis
  - Poll quality assessment (A+ rated vs partisan)
  - Electoral college math

## Architecture

### Core Components

```
src/lib/
├── agents/
│   ├── predictor.ts              # Main agent implementation
│   ├── prediction-schemas.ts     # Zod schemas for structured output
│   └── types.ts                  # TypeScript type definitions
└── tools/
    └── predictive/
        ├── fmp-financial.ts      # Financial Modeling Prep integration
        ├── firecrawl-research.ts # Deep web research and scraping
        ├── polymarket.ts         # Prediction markets API
        ├── odds-api.ts           # Sports betting odds
        └── index.ts              # Tool exports
```

### Two-Phase Generation Pattern

#### Phase 1: Deep Research (Unstructured)
```typescript
const { text: researchTrace, steps } = await generateText({
  model: reasoningModel,
  system: SUPERFORECASTING_SYSTEM_PROMPT,
  tools: getDomainTools(input.domain),
  stopWhen: stepCountIs(10),
  prompt: "Research task..."
});
```

**Agent capabilities:**
- Autonomous tool selection (no hardcoded paths)
- Recursive reasoning (model decides next steps)
- Disconfirming evidence seeking (bias mitigation)
- Pre-mortem analysis (blind spot identification)

#### Phase 2: Structured Output (Enforced Schema)
```typescript
const { object: prediction } = await generateObject({
  model: reasoningModel,
  schema: getPredictionSchema(input.domain),
  prompt: `Synthesize research into structured report...`
});
```

**Output guarantees:**
- Type-safe prediction format
- Machine-readable confidence scores
- Specific catalyst dates
- Cited data sources

## Superforecasting Principles

The agent system prompt enforces rigorous analytical standards:

### 1. Outside View (Base Rates)
Before analyzing specifics, establish reference class:
- "Home teams win 55% of NBA games"
- "Stocks beat earnings estimates 52% of the time"

### 2. Decomposition
Break complex questions into sub-problems:
- Bitcoin prediction → ETF inflows + Fed policy + Miner pressure

### 3. Disconfirming Evidence
Actively search for contradictory data:
- If bullish on a stock, explicitly search for bearish signals

### 4. Pre-Mortem Analysis
"Assume the prediction is wrong. What was the most likely cause?"

### 5. Probabilistic Language
Never say "will happen" → "65% probability"

### 6. Confidence Intervals
Provide ranges, not point estimates: "$150-$170 (60% confidence)"

## Setup

### 1. Install Dependencies
```bash
pnpm install
```

The following dependencies are added:
- `@mendable/firecrawl-js` - Deep web research
- `@ai-sdk/openai` - Advanced reasoning models (optional)
- `ai` (6.0.0-beta.105) - Already installed

### 2. Configure API Keys

Copy `.env.example` to `.env` and add:

```bash
# Required for advanced reasoning (optional if using Google)
OPENAI_API_KEY=sk-...

# Stock predictions (Financial Modeling Prep)
FMP_API_KEY=...

# Deep research (Firecrawl)
FIRECRAWL_API_KEY=fc-...

# Politics predictions (Polymarket)
POLYMARKET_API_KEY=...  # Optional for public data

# Sports predictions (The Odds API)
ODDS_API_KEY=...
```

### 3. Get API Keys

- **FMP**: https://financialmodelingprep.com/developer/docs
- **Firecrawl**: https://firecrawl.dev
- **The Odds API**: https://the-odds-api.com
- **Polymarket**: https://docs.polymarket.com (optional for public endpoints)

## Usage

### Basic Usage

```typescript
import { runPredictor, formatPrediction } from '@/lib/agents/predictor';

const output = await runPredictor({
  domain: 'stock',
  target: 'AAPL',
  horizon: '1 month',
  region: 'US',
});

console.log(formatPrediction(output.prediction));
```

### Advanced: Full Workflow with Observability

```typescript
import { runPredictorWorkflow } from '@/lib/agents/predictor';

const workflow = await runPredictorWorkflow({
  domain: 'crypto',
  target: 'Bitcoin',
  horizon: '2 weeks',
});

console.log(`Steps taken: ${workflow.totalSteps}`);
console.log(`Tools used: ${workflow.output.toolsUsed.join(', ')}`);
console.log(`Confidence: ${workflow.output.confidence}`);

// Access raw research trace for debugging
console.log(workflow.output.researchTrace);

// Structured prediction
console.log(workflow.output.prediction);
```

### Domain-Specific Examples

#### Stock Prediction
```typescript
const prediction = await runPredictor({
  domain: 'stock',
  target: 'NVDA',
  horizon: '1 month',
  region: 'US',
});

// Output includes:
// - Earnings date (if within horizon)
// - Price target range
// - RSI/technical signals
// - Volatility profile
// - Key drivers and risks
```

#### Crypto Prediction
```typescript
const prediction = await runPredictor({
  domain: 'crypto',
  target: 'Ethereum',
  horizon: '1 month',
});

// Output includes:
// - Bitcoin correlation analysis
// - Regulatory environment
// - Narrative momentum
// - Price range estimates
```

#### Sports Prediction
```typescript
const prediction = await runPredictor({
  domain: 'sports',
  target: 'Lakers vs Warriors',
  horizon: '1 week',
  region: 'US',
});

// Output includes:
// - Consensus odds across bookmakers
// - Implied probability
// - Line movement analysis
// - Injury impact
// - Value assessment
```

#### Politics Prediction
```typescript
const prediction = await runPredictor({
  domain: 'politics',
  target: '2024 Presidential Election',
  horizon: '1 month',
  region: 'US',
});

// Output includes:
// - Swing state polling
// - Polymarket probabilities
// - Market vs polls divergence
// - Electoral college math
```

## Running Examples

```bash
# Run stock prediction example
pnpm tsx examples/predictor-example.ts stock

# Run crypto prediction
pnpm tsx examples/predictor-example.ts crypto

# Run sports prediction
pnpm tsx examples/predictor-example.ts sports

# Run politics prediction
pnpm tsx examples/predictor-example.ts politics

# Run all examples
pnpm tsx examples/predictor-example.ts all
```

## Output Schema

Each prediction returns a structured object validated by Zod:

```typescript
{
  meta: {
    topic: string;
    predictionDate: string;
    horizon: string;
    domain: 'stock' | 'crypto' | 'sports' | 'politics';
  },
  forecast: {
    direction?: 'Bullish' | 'Bearish' | 'Neutral';
    prediction?: string;
    probability: number; // 0-100
    confidenceLevel: 'High' | 'Medium' | 'Low';
    targetPrice?: number;
    priceRange?: { low: number; high: number };
  },
  analysis: {
    executiveSummary: string;
    baseRate: string;
    keyDrivers: string[];
    riskFactors: string[];
    catalystCalendar: Array<{
      date: string;
      event: string;
      impact: 'High' | 'Medium' | 'Low';
    }>;
    disconfirmingEvidence: string;
  },
  methodology: {
    dataSourcesUsed: string[];
    decompositonApproach: string;
    preMortem: string;
  }
}
```

## Cost Optimization

### Model Selection
The agent automatically selects models based on availability:
- **OpenAI GPT-4o**: Best reasoning (if `OPENAI_API_KEY` is set)
- **Google Gemini 2.0 Flash Thinking**: Fast and cost-effective (fallback)

### Caching Strategy
Implement API response caching to reduce costs:

```typescript
// Recommended: Use Vercel KV or Redis
import { kv } from '@vercel/kv';

const cacheKey = `stock:${symbol}:${date}`;
const cached = await kv.get(cacheKey);

if (cached) return cached;

const data = await fmpAPI.fetch(symbol);
await kv.set(cacheKey, data, { ex: 3600 }); // 1 hour cache
```

### Rate Limit Protection
All tools include graceful error handling:

```typescript
if (!apiKey) {
  return {
    error: 'API key not configured',
    recommendation: 'Proceed with alternative data sources'
  };
}
```

The agent adapts: "Earnings API unavailable → Focus on technical + news"

## Operational Excellence

### Observability
The workflow exposes detailed step-by-step execution:

```typescript
const workflow = await runPredictorWorkflow(input);

workflow.steps.forEach(step => {
  console.log(`Step ${step.stepNumber}: ${step.action}`);
  console.log(`Tools: ${step.toolCalls?.join(', ')}`);
});
```

### Error Recovery
Tools fail gracefully, allowing the agent to continue:

```typescript
{
  error: "FMP API Error: Rate limited",
  recommendation: "Proceed with technical analysis and news sentiment only"
}
```

The LLM sees this error and adapts its strategy automatically.

### Production Deployment
For serverless deployment (Vercel Functions):

```typescript
// app/api/predict/route.ts
import { runPredictor } from '@/lib/agents/predictor';

export async function POST(request: Request) {
  const { domain, target, horizon } = await request.json();

  const output = await runPredictor({ domain, target, horizon });

  return Response.json(output);
}
```

**Timeout considerations:**
- Vercel Hobby: 10s timeout
- Vercel Pro: 60s timeout
- Consider async job queue for longer predictions

## Extending the System

### Adding a New Domain
1. **Create schema** in `prediction-schemas.ts`:
```typescript
export const WeatherPredictionSchema = BasePredictionSchema.extend({
  forecast: z.object({
    temperature: z.number(),
    precipitation: z.number(),
  })
});
```

2. **Add tools** in `src/lib/tools/predictive/`:
```typescript
export const weatherTool = tool({
  description: 'Fetch weather data',
  inputSchema: z.object({ location: z.string() }),
  execute: async ({ location }) => { /* ... */ }
});
```

3. **Update agent** in `predictor.ts`:
```typescript
case 'weather':
  return { ...baseTools, weather: weatherTool };
```

### Adding a New Data Source
Follow the tool pattern in `src/lib/tools/predictive/`:

```typescript
export const newDataSourceTool = tool({
  description: 'Clear description for the LLM',
  inputSchema: z.object({ /* parameters */ }),
  execute: async (params) => {
    try {
      const data = await fetchData(params);
      return { /* structured result */ };
    } catch (error) {
      return {
        error: 'API Error',
        recommendation: 'Fallback strategy'
      };
    }
  }
});
```

## Best Practices

### 1. Always Use Specific Targets
❌ Bad: `target: "tech stocks"`
✅ Good: `target: "NVDA"`

### 2. Set Realistic Horizons
- **1 month**: Optimal (balances catalysts + technicals)
- **1 week**: Too short (noise dominates)
- **3+ months**: Too long (too many unknowns)

### 3. Review the Research Trace
The structured output is clean, but the research trace shows the "thinking":

```typescript
console.log(workflow.output.researchTrace);
```

This reveals:
- Which tools were called
- What disconfirming evidence was found
- Pre-mortem analysis reasoning

### 4. Validate Against Reality
After the horizon period, compare prediction to outcome:

```typescript
// Store predictions in database
await db.predictions.create({
  target: 'AAPL',
  predictedDirection: 'Bullish',
  probability: 65,
  actualOutcome: null, // Fill after 1 month
});
```

Track accuracy over time to calibrate confidence levels.

## Troubleshooting

### "API key not configured"
- Check `.env` file has the required keys
- Verify environment variables are loaded (`dotenv/config`)

### "Failed to fetch URL"
- Firecrawl may be rate limited
- Source may be behind paywall
- Try alternative URLs or manual research

### "Prediction lacks specificity"
- Ensure target is specific (not generic)
- Check that relevant API keys are configured
- Review research trace to see which tools failed

### TypeScript errors
```bash
pnpm tsc --noEmit --skipLibCheck
```

## References

- **Superforecasting**: Philip Tetlock, "Superforecasting: The Art and Science of Prediction"
- **Vercel AI SDK v6**: https://sdk.vercel.ai/docs
- **Financial Modeling Prep**: https://financialmodelingprep.com/developer/docs
- **The Odds API**: https://the-odds-api.com/
- **Polymarket**: https://docs.polymarket.com/

## License

Same as parent project (Naly).
