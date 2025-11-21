import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function verify() {
  const { db } = await import('./src/db');
  const { users, agentConfigs, agentRuns } = await import('./src/db/schema');
  const { triggerAgent } = await import('./src/lib/scheduler');

  console.log('Starting verification...');

  // 1. Verify User
  const admin = await db.select().from(users).where(eq(users.username, 'admin'));
  if (admin.length === 0) throw new Error('Admin user not found');
  console.log('✅ Admin user exists');

  // 2. Configure Agent
  await db.insert(agentConfigs).values({
    type: 'REPORTER',
    schedule: '0 * * * *',
    status: 'ACTIVE',
    params: { topic: 'stock', region: 'US' },
  }).onConflictDoUpdate({
    target: agentConfigs.type,
    set: { status: 'ACTIVE' }
  });
  console.log('✅ Reporter configured');

  // 3. Trigger Run
  console.log('Triggering Reporter run...');
  await triggerAgent('REPORTER', { topic: 'stock', region: 'US' });
  
  // 4. Check Run
  const runs = await db.select().from(agentRuns).where(eq(agentRuns.agentType, 'REPORTER'));
  const lastRun = runs[runs.length - 1];
  
  if (!lastRun) throw new Error('No run created');
  console.log(`✅ Run created with status: ${lastRun.status}`);
  
  if (lastRun.status === 'COMPLETED') {
      console.log('✅ Run completed successfully');
      console.log('Output:', lastRun.output ? 'Present' : 'Missing');
      console.log('Editor Review:', lastRun.editorReview ? 'Present' : 'Missing');
  } else if (lastRun.status === 'FAILED') {
      console.error('❌ Run failed:', lastRun.logs);
  } else {
      console.log('⚠️ Run is still running (unexpected for synchronous test)');
  }

  process.exit(0);
}

verify().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});
