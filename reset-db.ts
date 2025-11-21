import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function reset() {
  const { db } = await import('./src/db');
  const { agentRuns } = await import('./src/db/schema');

  console.log('Resetting database...');
  try {
    await db.delete(agentRuns);
    console.log('All agent runs deleted.');
  } catch (error) {
    console.error('Error resetting database:', error);
  }
  process.exit(0);
}

reset();
