import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  const { db } = await import('./index');
  const { users } = await import('./schema');

  const passwordHash = await bcrypt.hash('admin123', 10);
  
  try {
    await db.insert(users).values({
      username: 'admin',
      passwordHash,
    }).onConflictDoNothing();
    console.log('Seed completed: Admin user created');
  } catch (e) {
    console.error('Seed failed:', e);
  }
  process.exit(0);
}

main();
