/**
 * Local cron job for testing
 * Resets database and runs reporter every 1 minute
 *
 * Usage: dotenv --file .env.local run -- npx tsx scripts/local-cron.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const INTERVAL_MS = 60 * 1000; // 1 minute

async function runReporter(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('[CRON] Running Reporter Agent...');
  console.log('[CRON] Time:', new Date().toISOString());
  console.log('='.repeat(60));

  try {
    const { triggerAgent } = await import('../src/lib/scheduler');
    const { db } = await import('../src/db');
    const { agentConfigs } = await import('../src/db/schema');
    const { eq } = await import('drizzle-orm');

    // 1. Ensure config exists
    const existing = await db.select().from(agentConfigs).where(eq(agentConfigs.type, 'REPORTER'));
    if (existing.length === 0) {
      console.log('[CRON] Seeding Reporter config...');
      await db.insert(agentConfigs).values({
        type: 'REPORTER',
        schedule: '* * * * *', // Every minute for testing
        status: 'ACTIVE',
        params: { topic: 'stock' },
      });
    }

    // 2. Get params and trigger
    const config = await db.select().from(agentConfigs).where(eq(agentConfigs.type, 'REPORTER'));
    if (config.length === 0) {
      throw new Error('Reporter config not found');
    }

    console.log('[CRON] Running with params:', config[0].params);
    await triggerAgent('REPORTER', config[0].params);
    console.log('[CRON] Reporter completed successfully.');
  } catch (error) {
    console.error('[CRON] Error running reporter:', error);
  }
}

async function runCronJob(): Promise<void> {
  // Run reporter (no database reset)
  await runReporter();

  // Check predictions
  console.log('[CRON] Checking predictions...');
  try {
    const { checkAllDuePredictions } = await import('../src/lib/prediction-checker');
    await checkAllDuePredictions();
  } catch (error) {
    console.error('[CRON] Error checking predictions:', error);
  }
}

async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('[CRON] Local cron job started');
  console.log('[CRON] Interval: 1 minute');
  console.log('[CRON] Press Ctrl+C to stop');
  console.log('='.repeat(60));

  // Run immediately on start
  await runCronJob();

  // Then run every interval
  setInterval(async () => {
    await runCronJob();
  }, INTERVAL_MS);
}

main().catch(console.error);
