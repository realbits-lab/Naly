/**
 * Predictive Agent Examples
 * Demonstrates how to use the Predictor agent for different domains
 *
 * SETUP:
 * 1. Copy .env.example to .env
 * 2. Add your API keys:
 *    - OPENAI_API_KEY or keep using GOOGLE_GENERATIVE_AI_API_KEY
 *    - FMP_API_KEY (for stocks)
 *    - FIRECRAWL_API_KEY (for deep research)
 *    - POLYMARKET_API_KEY (optional, for politics)
 *    - ODDS_API_KEY (for sports)
 *
 * RUN:
 * pnpm tsx examples/predictor-example.ts
 */

import 'dotenv/config';
import { runPredictor, runPredictorWorkflow, formatPrediction } from '../src/lib/agents/predictor';
import { PredictorInput } from '../src/lib/agents/types';

async function exampleStockPrediction() {
  console.log('\n=== STOCK PREDICTION EXAMPLE ===\n');

  const input: PredictorInput = {
    domain: 'stock',
    target: 'AAPL',
    horizon: '1 month',
    region: 'US',
  };

  try {
    const workflow = await runPredictorWorkflow(input);

    console.log(`\n✅ Prediction complete in ${workflow.totalSteps} steps`);
    console.log(`📊 Tools used: ${workflow.output.toolsUsed.join(', ')}`);
    console.log(`🎯 Confidence: ${workflow.output.confidence}`);

    console.log('\n--- RESEARCH TRACE ---');
    console.log(workflow.output.researchTrace.substring(0, 500) + '...\n');

    console.log('\n--- STRUCTURED PREDICTION ---');
    const formatted = formatPrediction(workflow.output.prediction);
    console.log(formatted);

    // Save to file
    const fs = require('fs');
    fs.writeFileSync(
      './prediction-output-stock.md',
      formatted + '\n\n---\n\n## Full Research Trace\n\n' + workflow.output.researchTrace
    );
    console.log('\n📝 Full output saved to: prediction-output-stock.md');
  } catch (error) {
    console.error('❌ Prediction failed:', error);
  }
}

async function exampleCryptoPrediction() {
  console.log('\n=== CRYPTO PREDICTION EXAMPLE ===\n');

  const input: PredictorInput = {
    domain: 'crypto',
    target: 'Bitcoin',
    horizon: '1 month',
  };

  try {
    const output = await runPredictor(input);
    console.log(`\n✅ Prediction complete`);
    console.log(`📊 Tools used: ${output.toolsUsed.join(', ')}`);

    const formatted = formatPrediction(output.prediction);
    console.log('\n' + formatted);
  } catch (error) {
    console.error('❌ Prediction failed:', error);
  }
}

async function exampleSportsPrediction() {
  console.log('\n=== SPORTS PREDICTION EXAMPLE ===\n');

  const input: PredictorInput = {
    domain: 'sports',
    target: 'Lakers vs Warriors',
    horizon: '1 week',
    region: 'US',
  };

  try {
    const output = await runPredictor(input);
    console.log(`\n✅ Prediction complete`);
    console.log(`📊 Tools used: ${output.toolsUsed.join(', ')}`);

    const formatted = formatPrediction(output.prediction);
    console.log('\n' + formatted);
  } catch (error) {
    console.error('❌ Prediction failed:', error);
  }
}

async function examplePoliticsPrediction() {
  console.log('\n=== POLITICS PREDICTION EXAMPLE ===\n');

  const input: PredictorInput = {
    domain: 'politics',
    target: '2024 Presidential Election',
    horizon: '1 month',
    region: 'US',
  };

  try {
    const output = await runPredictor(input);
    console.log(`\n✅ Prediction complete`);
    console.log(`📊 Tools used: ${output.toolsUsed.join(', ')}`);

    const formatted = formatPrediction(output.prediction);
    console.log('\n' + formatted);
  } catch (error) {
    console.error('❌ Prediction failed:', error);
  }
}

// Run examples
async function main() {
  const example = process.argv[2] || 'stock';

  switch (example) {
    case 'stock':
      await exampleStockPrediction();
      break;
    case 'crypto':
      await exampleCryptoPrediction();
      break;
    case 'sports':
      await exampleSportsPrediction();
      break;
    case 'politics':
      await examplePoliticsPrediction();
      break;
    case 'all':
      await exampleStockPrediction();
      await exampleCryptoPrediction();
      await exampleSportsPrediction();
      await examplePoliticsPrediction();
      break;
    default:
      console.log('Usage: pnpm tsx examples/predictor-example.ts [stock|crypto|sports|politics|all]');
  }
}

main().catch(console.error);
