#!/usr/bin/env tsx

import { db } from '../src/lib/db';
import { users } from '../src/lib/schema/users';
import { eq } from 'drizzle-orm';

async function createSystemUser() {
  console.log('🤖 Creating system user for AI-generated content...');

  const systemUserId = '00000000-0000-0000-0000-000000000000';

  try {
    // Check if system user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, systemUserId))
      .limit(1);

    if (existingUser.length > 0) {
      console.log('✅ System user already exists');
      return;
    }

    // Create system user
    const systemUserData = {
      id: systemUserId,
      name: 'System AI',
      email: 'system@naly.internal',
      emailVerified: new Date(),
      image: null,
      role: 'writer' as const,
      password: null,
    };

    await db.insert(users).values(systemUserData);
    console.log('✅ System user created successfully');

  } catch (error) {
    console.error('❌ Error creating system user:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createSystemUser()
    .then(() => {
      console.log('🎉 System user setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 System user setup failed:', error);
      process.exit(1);
    });
}

export { createSystemUser };