/**
 * Workflow Test Script
 *
 * This script tests the complete multi-agent workflow without requiring
 * the full Next.js application to be running.
 *
 * Usage:
 *   1. Ensure .env.local file exists with OPENAI_API_KEY
 *   2. Run: pnpm tsx test-scripts/test-workflow.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

// Import agents
import { runReporter } from '../src/lib/agents/reporter';
import { runEditor } from '../src/lib/agents/editor';
import { runDesigner } from '../src/lib/agents/designer';
import { runMarketer } from '../src/lib/agents/marketer';
import type { ReporterInput } from '../src/lib/agents/types';

/**
 * Main test function
 */
async function testWorkflow() {
  console.log('🚀 Starting Naly Workflow Test\n');

  // 1. Validate environment
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY not found in environment');
    console.error('   Please create .env.local file with your OpenAI API key');
    process.exit(1);
  }

  console.log('✅ Environment validated\n');

  // 2. Test configuration
  const testInput: ReporterInput = {
    topic: 'stock',
    region: 'US',
  };

  console.log('📝 Test Configuration:');
  console.log(`   Topic: ${testInput.topic}`);
  console.log(`   Region: ${testInput.region}\n`);

  try {
    // 3. Run Reporter Agent
    console.log('🔍 Step 1/4: Running Reporter Agent...');
    const startReporter = Date.now();
    const reporterOutput = await runReporter(testInput);
    const reporterTime = Date.now() - startReporter;

    console.log(`✅ Reporter completed in ${reporterTime}ms`);
    console.log(`   Title: ${reporterOutput.title}`);
    console.log(`   Content length: ${reporterOutput.content.length} characters`);
    console.log(`   Trends found: ${reporterOutput.trends.length}`);
    console.log(`   Sources: ${reporterOutput.sources.length}\n`);

    // 4. Run Editor Agent
    console.log('📝 Step 2/4: Running Editor Agent...');
    const startEditor = Date.now();
    const editorOutput = await runEditor({ originalContent: reporterOutput });
    const editorTime = Date.now() - startEditor;

    console.log(`✅ Editor completed in ${editorTime}ms`);
    console.log(`   Status: ${editorOutput.status}`);
    console.log(`   Changes made: ${editorOutput.changes.length}`);
    console.log(`   Content length: ${editorOutput.content.length} characters\n`);

    // 5. Run Designer Agent
    console.log('🎨 Step 3/4: Running Designer Agent...');
    const startDesigner = Date.now();
    const designerOutput = await runDesigner({ content: editorOutput });
    const designerTime = Date.now() - startDesigner;

    console.log(`✅ Designer completed in ${designerTime}ms`);
    console.log(`   Assets created: ${designerOutput.assets.length}`);
    designerOutput.assets.forEach((asset, i) => {
      console.log(`   - Asset ${i + 1}: ${asset.type} (${asset.alt})`);
    });
    console.log(`   Layout: ${designerOutput.layoutSuggestion.substring(0, 60)}...\n`);

    // 6. Run Marketer Agent
    console.log('📊 Step 4/4: Running Marketer Agent...');
    const startMarketer = Date.now();
    const marketerOutput = await runMarketer({
      content: editorOutput,
      assets: designerOutput
    });
    const marketerTime = Date.now() - startMarketer;

    console.log(`✅ Marketer completed in ${marketerTime}ms`);
    console.log(`   Ad placements: ${marketerOutput.adPlacements.length}`);
    console.log(`   Predicted metrics:`);
    console.log(`   - Retention: ${marketerOutput.predictedMetrics.retention}%`);
    console.log(`   - Views: ${marketerOutput.predictedMetrics.views.toLocaleString()}`);
    console.log(`   - Clicks: ${marketerOutput.predictedMetrics.clicks.toLocaleString()}`);
    console.log(`   Strategy: ${marketerOutput.strategy.substring(0, 60)}...\n`);

    // 7. Summary
    const totalTime = reporterTime + editorTime + designerTime + marketerTime;
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 Test Summary');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ All agents completed successfully`);
    console.log(`⏱️  Total execution time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
    console.log(`\nTiming breakdown:`);
    console.log(`   Reporter: ${reporterTime}ms (${((reporterTime / totalTime) * 100).toFixed(1)}%)`);
    console.log(`   Editor: ${editorTime}ms (${((editorTime / totalTime) * 100).toFixed(1)}%)`);
    console.log(`   Designer: ${designerTime}ms (${((designerTime / totalTime) * 100).toFixed(1)}%)`);
    console.log(`   Marketer: ${marketerTime}ms (${((marketerTime / totalTime) * 100).toFixed(1)}%)`);
    console.log('═══════════════════════════════════════════════════════\n');

    // 8. Detailed output
    console.log('📄 Detailed Output:\n');
    console.log('Reporter Output:');
    console.log(JSON.stringify(reporterOutput, null, 2));
    console.log('\nEditor Output:');
    console.log(JSON.stringify(editorOutput, null, 2));
    console.log('\nDesigner Output:');
    console.log(JSON.stringify(designerOutput, null, 2));
    console.log('\nMarketer Output:');
    console.log(JSON.stringify(marketerOutput, null, 2));

    console.log('\n✅ Test completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testWorkflow();
