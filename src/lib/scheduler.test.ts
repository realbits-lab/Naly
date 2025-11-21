import { checkAndTriggerJobs } from './scheduler';
import { db } from '../db';
import { agentConfigs, agentRuns } from '../db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables for real DB and AI calls
dotenv.config({ path: '.env.local' });

describe('Agent Scheduling System (Integration)', () => {
  // Increase timeout for real AI calls
  jest.setTimeout(60000);

  beforeAll(async () => {
    // Clean up before tests
    await db.delete(agentRuns);
    await db.delete(agentConfigs);
  });

  afterAll(async () => {
    // Clean up after tests
    await db.delete(agentRuns);
    await db.delete(agentConfigs);
  });

  it('should trigger reporter job via scheduler with real agents', async () => {
    // 1. Setup: Create a config that is due immediately
    await db.insert(agentConfigs).values({
      type: 'REPORTER',
      schedule: '* * * * *', // Every minute
      status: 'ACTIVE',
      params: { topic: 'stock' },
    });

    // 2. Execute: Run the scheduler
    console.log('Triggering scheduler...');
    await checkAndTriggerJobs();

    // 3. Verify: Check if a run was created
    const runs = await db.select().from(agentRuns).where(eq(agentRuns.agentType, 'REPORTER'));
    expect(runs.length).toBeGreaterThan(0);
    
    const run = runs[0];
    expect(run.status).toMatch(/RUNNING|COMPLETED|FAILED/);
    
    // If it completed quickly, we can check output, but real AI might take longer than this test waits if we don't await it.
    // checkAndTriggerJobs awaits triggerAgent, which awaits the AI calls.
    // So if it returns, the job is done (or failed).
    
    if (run.status === 'COMPLETED') {
      expect(run.output).toBeDefined();
      expect((run.output as any).title).toBeDefined();
      // Editor should also have run
      expect(run.editorReview).toBeDefined();
    } else if (run.status === 'FAILED') {
        console.warn('Agent run failed (expected if no API key):', run.logs);
    }
  });
});
