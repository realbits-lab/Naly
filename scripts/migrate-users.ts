/**
 * Migration script to migrate existing users from old schema to new better-auth schema
 * Run this script after applying the database migrations
 */

import { db } from '../src/db';
import { users, user } from '../src/db/schema';
import bcrypt from 'bcryptjs';

async function migrateUsers() {
  console.log('Starting user migration...');

  try {
    // Get all users from old table
    const oldUsers = await db.select().from(users);

    console.log(`Found ${oldUsers.length} users to migrate`);

    for (const oldUser of oldUsers) {
      // Check if user already exists in new table
      const existingUser = await db
        .select()
        .from(user)
        .where(sql`${user.username} = ${oldUser.username}`)
        .limit(1);

      if (existingUser.length > 0) {
        console.log(`User ${oldUser.username} already exists, skipping...`);
        continue;
      }

      // Create new user with better-auth schema
      const userId = crypto.randomUUID();
      await db.insert(user).values({
        id: userId,
        username: oldUser.username,
        email: oldUser.username, // Use username as email for now
        password: oldUser.passwordHash, // Already hashed with bcrypt
        emailVerified: true,
        isAnonymous: false,
      });

      console.log(`Migrated user: ${oldUser.username}`);
    }

    console.log('User migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

// Fix import
import { sql } from 'drizzle-orm';

migrateUsers()
  .then(() => {
    console.log('Migration finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
