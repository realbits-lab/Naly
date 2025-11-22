# Predictive Agent - Quick Start

A comprehensive autonomous AI agent for generating rigorous, data-driven forecasts using Vercel AI SDK v6.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure API Keys
Copy `.env.example` to `.env` and add your API keys:

```bash
# Optional: Use OpenAI for advanced reasoning (or stick with Google Gemini)
OPENAI_API_KEY=sk-...

# Stock predictions
FMP_API_KEY=your_fmp_key

# Deep research
FIRECRAWL_API_KEY=your_firecrawl_key

# Politics predictions (optional)
POLYMARKET_API_KEY=your_polymarket_key

# Sports predictions
ODDS_API_KEY=your_odds_key
```

### 3. Run Your First Prediction

```bash
# Stock prediction
pnpm tsx examples/predictor-example.ts stock

# Or try other domains
pnpm tsx examples/predictor-example.ts crypto
pnpm tsx examples/predictor-example.ts sports
pnpm tsx examples/predictor-example.ts politics
```

## 📊 Supported Domains

| Domain | Data Sources | Example Target |
|--------|-------------|----------------|
| 🏦 **Stock** | FMP (earnings, fundamentals), Technical Indicators | `AAPL`, `NVDA`, `TSLA` |
| 💰 **Crypto** | Technical Indicators, Deep Research | `Bitcoin`, `Ethereum` |
| 🏀 **Sports** | The Odds API (betting lines) | `Lakers vs Warriors` |
| 🗳️ **Politics** | Polymarket (prediction markets), Polls | `2024 Presidential Election` |

## 💡 Usage Example

```typescript
import { runPredictor, formatPrediction } from '@/lib/agents/predictor';

const output = await runPredictor({
  domain: 'stock',
  target: 'AAPL',
  horizon: '1 month',
  region: 'US',
});

// Pretty print the prediction
console.log(formatPrediction(output.prediction));

// Access structured data
console.log(output.prediction.forecast.probability); // 65
console.log(output.prediction.forecast.confidenceLevel); // "High"
console.log(output.prediction.analysis.keyDrivers); // ["Earnings beat", ...]
```

## 🎯 Key Features

- ✅ **Two-Phase Architecture**: Deep research → Structured synthesis
- ✅ **Superforecasting Methodology**: Base rates, decomposition, pre-mortem analysis
- ✅ **Autonomous Tool Selection**: Agent decides which data sources to use
- ✅ **10-Step Reasoning Loop**: Recursive problem-solving (Vercel AI SDK v6)
- ✅ **Structured Output**: Type-safe Zod schemas for every prediction
- ✅ **Domain-Specific Expertise**: Tailored prompts for stocks, crypto, sports, politics
- ✅ **Graceful Degradation**: Continues even if some APIs fail

## 📖 Full Documentation

See [docs/PREDICTIVE_AGENT.md](docs/PREDICTIVE_AGENT.md) for:
- Architecture deep-dive
- Superforecasting principles
- API integration details
- Production deployment guide
- Extending to new domains

## 🔑 Getting API Keys

- **FMP** (Financial Modeling Prep): https://financialmodelingprep.com/developer/docs
  - Free tier: 250 requests/day
  - Paid tier: $14/month for 750 requests/day

- **Firecrawl**: https://firecrawl.dev
  - Free tier: 500 scrapes/month
  - Paid tier: $29/month for 5,000 scrapes

- **The Odds API**: https://the-odds-api.com
  - Free tier: 500 requests/month
  - Paid tier: $10/month for 10,000 requests

- **Polymarket**: Public API (no key required for basic data)

- **OpenAI** (optional): https://platform.openai.com/api-keys
  - GPT-4o recommended for best reasoning
  - Falls back to Google Gemini if not configured

## 🏗️ Project Structure

```
src/lib/
├── agents/
│   ├── predictor.ts              # Main agent (runPredictor)
│   ├── prediction-schemas.ts     # Zod schemas for each domain
│   └── types.ts                  # TypeScript types
└── tools/
    └── predictive/
        ├── fmp-financial.ts      # Stock data
        ├── firecrawl-research.ts # Deep web research
        ├── polymarket.ts         # Prediction markets
        ├── odds-api.ts           # Sports betting odds
        └── index.ts              # Exports

examples/
└── predictor-example.ts          # Ready-to-run examples

docs/
└── PREDICTIVE_AGENT.md           # Full documentation
```

## 🎓 Learn More

This implementation is based on the comprehensive guide:
**"The Architect's Guide to Autonomous Predictive Agents: Implementing Vercel AI SDK v6 for Financial and Event Forecasting"**

Key concepts:
- **Reference Class Forecasting**: Start with base rates
- **Disconfirming Evidence**: Actively seek contradictory data
- **Pre-Mortem Analysis**: "Assume I'm wrong. Why?"
- **Probabilistic Language**: "65% probability" not "will happen"
- **Two-Phase Pattern**: Research → Synthesis

## 📝 Example Output

```
# AAPL - 1 Month Forecast

**Prediction Date:** 2025-11-22

## Executive Summary
Apple stock shows moderate bullish momentum heading into Q1 2025 earnings (Jan 30).
Historical beat rate of 78% combined with strong iPhone 16 sales data suggests
60% probability of upside movement. Key risk: macro headwinds from Fed policy.

## Forecast
- **Direction:** Bullish
- **Probability:** 60%
- **Confidence:** Medium
- **Target Price:** $195
- **Price Range:** $185 - $205

## Base Rate
Large-cap tech stocks beat earnings estimates 52% of the time. Apple specifically
has beaten estimates in 14 of last 18 quarters (78%).

## Key Drivers
- Q1 2025 earnings on Jan 30 (expected EPS: $2.10)
- Strong iPhone 16 Pro demand in China (up 15% YoY)
- Services revenue growth acceleration (18% YoY)
- AI features driving upgrade cycle

## Risk Factors
- Fed maintaining higher rates longer than expected
- China macro weakness could pressure sales
- Valuation elevated at 28x P/E vs historical 24x

## Catalyst Calendar
- **2025-01-30** [High]: Q1 2025 Earnings Report
- **2025-12-18** [Medium]: Fed Rate Decision
...
```

## 🚨 Important Notes

1. **Not Financial Advice**: This is an AI system for educational/research purposes
2. **Verify API Keys**: Many APIs have rate limits - monitor usage
3. **Review Research Trace**: Always check `output.researchTrace` to understand reasoning
4. **Track Accuracy**: Log predictions and compare to outcomes over time

## 🤝 Contributing

To add a new domain or data source:
1. Create tool in `src/lib/tools/predictive/`
2. Add schema to `prediction-schemas.ts`
3. Update `getDomainTools()` in `predictor.ts`
4. Add example to `examples/predictor-example.ts`

## 📄 License

Same as parent project (Naly).
