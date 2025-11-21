import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function trigger() {
  console.log('Triggering Reporter Agent...');
  try {
    // Dynamic import to ensure env vars are loaded first
    const { triggerAgent } = await import('./src/lib/scheduler');
    const { db } = await import('./src/db');
    const { agentConfigs } = await import('./src/db/schema');
    const { eq } = await import('drizzle-orm');

    // 1. Ensure config exists
    const existing = await db.select().from(agentConfigs).where(eq(agentConfigs.type, 'REPORTER'));
    if (existing.length === 0) {
      console.log('Seeding Reporter config...');
      await db.insert(agentConfigs).values({
        type: 'REPORTER',
        schedule: '0 * * * *', // Hourly
        status: 'ACTIVE',
        params: { topic: 'stock' },
      });
    }

    const existingMarketer = await db.select().from(agentConfigs).where(eq(agentConfigs.type, 'MARKETER'));
    if (existingMarketer.length === 0) {
        console.log('Seeding Marketer config...');
        await db.insert(agentConfigs).values({
            type: 'MARKETER',
            schedule: '30 * * * *',
            status: 'ACTIVE',
            params: { targetAudience: 'general' },
        });
    }

    // 2. Get params from config and trigger directly
    const config = await db.select().from(agentConfigs).where(eq(agentConfigs.type, 'REPORTER'));
    if (config.length === 0) {
      throw new Error('Reporter config not found');
    }

    console.log('Running Reporter agent with params:', config[0].params);
    await triggerAgent('REPORTER', config[0].params);
    console.log('Reporter agent completed successfully.');
  } catch (error) {
    console.error('Error triggering agent:', error);
  }
  process.exit(0);
}

trigger();
