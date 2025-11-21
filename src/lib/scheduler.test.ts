import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { triggerAgent, checkAndTriggerJobs } from '../lib/scheduler';
import { db } from '../db';
import { agentConfigs, agentRuns } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import cronParser from 'cron-parser';

// Mock the agents
jest.mock('../lib/agents/reporter', () => ({
  runReporter: jest.fn().mockResolvedValue({
    title: 'Test Report',
    content: 'This is a test report content.',
    trends: ['Trend 1'],
    sources: ['http://example.com']
  })
}));

jest.mock('../lib/agents/editor', () => ({
  runEditor: jest.fn().mockResolvedValue({
    title: 'Test Report (Edited)',
    content: 'This is a test report content. (Edited)',
    changes: ['Fixed typo'],
    score: 90,
    feedback: 'Good job',
    status: 'approved'
  })
}));

jest.mock('../lib/agents/designer', () => ({
  runDesigner: jest.fn().mockResolvedValue({
    assets: [{ type: 'image', url: 'http://example.com/image.png', alt: 'Test Image' }],
    layoutSuggestion: 'Grid layout'
  })
}));

jest.mock('../lib/agents/marketer', () => ({
  runMarketer: jest.fn().mockResolvedValue({
    adPlacements: [{ position: 'top', type: 'banner' }],
    predictedMetrics: { retention: 80, views: 1000, clicks: 50 },
    strategy: 'Viral strategy'
  })
}));

// Mock DB if needed, but integration test with local DB is better if available.
// Since we have a real DB connection in dev, let's use it but clean up.
// However, 'vitest' or 'jest' might not be set up for TS execution in this env easily without config.
// Let's assume we can run this with `npx vitest` or `npx jest`.
// The user asked to "write test file... and then, run tests".
// I'll check if vitest is installed. package.json showed jest.
// I'll use Jest syntax but I need to make sure I can run it.
// Actually, `verify-flow.ts` was a standalone script.
// A standalone script with mocked imports is harder.
// I'll create a standalone script `test-full-flow.ts` that manually mocks by replacing the functions at runtime if possible,
// OR I'll just use the `jest` runner if configured.
// The package.json has "test": "jest".
// I'll write a Jest test file `src/lib/scheduler.test.ts`.

describe('Agent Scheduling System', () => {
  
  // Clean up before/after
  const cleanup = async () => {
    await db.delete(agentRuns);
    await db.delete(agentConfigs);
  };

  beforeAll(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  it('should set reporter cron period and check working', async () => {
    // 1. Set Config
    await db.insert(agentConfigs).values({
      type: 'REPORTER',
      schedule: '0 * * * *', // Hourly
      status: 'ACTIVE',
      params: { topic: 'stock' }
    });

    const config = await db.select().from(agentConfigs).where(eq(agentConfigs.type, 'REPORTER'));
    expect(config[0].schedule).toBe('0 * * * *');
    expect(config[0].status).toBe('ACTIVE');
  });

  it('should check reporter fetch news and select topic and write report (Mocked)', async () => {
    // 2. Trigger Reporter
    await triggerAgent('REPORTER', { topic: 'stock' });

    // 3. Verify Run
    const runs = await db.select().from(agentRuns)
      .where(eq(agentRuns.agentType, 'REPORTER'))
      .orderBy(desc(agentRuns.startTime));
    
    const run = runs[0];
    expect(run).toBeDefined();
    expect(run.status).toBe('COMPLETED');
    
    // Check Output (Reporter)
    const output = run.output as any;
    expect(output.title).toContain('Test Report');
    
    // Check Editor's work
    const review = run.editorReview as any;
    expect(review.score).toBe(90);
    expect(review.status).toBe('approved');

    // Check Designer's work
    const design = run.designerOutput as any;
    expect(design.assets).toHaveLength(1);
    expect(design.layoutSuggestion).toBe('Grid layout');
  });

  it('should set marketer cron period and check working', async () => {
    // 4. Set Marketer Config
    await db.insert(agentConfigs).values({
      type: 'MARKETER',
      schedule: '0 9 * * *', // Daily 9am
      status: 'ACTIVE',
      params: { targetAudience: 'investors' }
    });

    const config = await db.select().from(agentConfigs).where(eq(agentConfigs.type, 'MARKETER'));
    expect(config[0].schedule).toBe('0 9 * * *');
  });

  it('should check marketer work (using previous report)', async () => {
    // 5. Trigger Marketer
    await triggerAgent('MARKETER', { targetAudience: 'investors' });

    // 6. Verify Run
    const runs = await db.select().from(agentRuns)
      .where(eq(agentRuns.agentType, 'MARKETER'))
      .orderBy(desc(agentRuns.startTime));
    
    const run = runs[0];
    expect(run).toBeDefined();
    expect(run.status).toBe('COMPLETED');
    
    // Check Marketer Output
    const output = run.marketerOutput as any;
    expect(output.strategy).toBe('Viral strategy');
    expect(output.predictedMetrics.views).toBe(1000);
  });

  it('should trigger jobs via scheduler', async () => {
    // 7. Test checkAndTriggerJobs
    // We need to make sure it thinks it's due.
    // The logic is: if next scheduled time from lastRunTime is in the past.
    // Let's set a config with a schedule that is definitely due (e.g. every second).
    // And ensure last run was long ago or never.
    
    await db.delete(agentConfigs).where(eq(agentConfigs.type, 'REPORTER'));
    await db.insert(agentConfigs).values({
      type: 'REPORTER',
      schedule: '* * * * * *', // Every second
      status: 'ACTIVE',
      params: { topic: 'politics' }
    });

    // Mock triggerAgent to verify it's called?
    // checkAndTriggerJobs calls triggerAgent.
    // We can spy on triggerAgent if we exported it?
    // It's exported from the same file.
    // But we are testing the file itself.
    // We can check if a run was created in DB.
    const initialRuns = await db.select().from(agentRuns).where(eq(agentRuns.agentType, 'REPORTER'));
    
    await checkAndTriggerJobs();
    
    // Verify a run started
    const runs = await db.select().from(agentRuns)
      .where(eq(agentRuns.agentType, 'REPORTER'))
      .orderBy(desc(agentRuns.startTime));
      
    expect(runs.length).toBeGreaterThan(initialRuns.length);
    // The most recent run should be from this trigger
    // (We might have previous runs from other tests, so check count or time)
  });
});
