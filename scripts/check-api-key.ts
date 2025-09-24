import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve } from 'path';
import { apiKeys } from '../src/lib/schema/api-keys';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}

const sql = postgres(databaseUrl);
const db = drizzle(sql);

// Test API key from .auth/user.json
const API_KEY = 'naly_test_7687773d9c0b0dbe1334b27fe61014bab3af656d5f2881f5cf39c50d0031e6be';
const USER_ID = 'a8190034-e70a-463c-abef-82b71bf057c7';

async function checkApiKey() {
  console.log('🔍 Checking API key in database...');

  try {
    // Check if API key exists
    const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, USER_ID));
    console.log(`📊 Found ${keys.length} API keys for user ${USER_ID}`);

    if (keys.length === 0) {
      console.log('❌ No API keys found for this user');
      console.log('✨ Creating new API key...');

      // Create the API key
      const hashedKey = await bcrypt.hash(API_KEY, 10);
      const newKey = await db.insert(apiKeys).values({
        id: 'a53dd190-a1ae-4e9e-a5fb-a782954a135d',
        userId: USER_ID,
        name: 'Test Manager Key',
        key: hashedKey,
        keyPrefix: 'naly_test_',
        scopes: ['*'],
        rateLimit: 1000,
        expiresAt: new Date('2026-09-22'),
        createdAt: new Date(),
        lastUsedAt: null,
        usageCount: 0
      }).returning();

      console.log('✅ API key created:', newKey[0].id);
    } else {
      keys.forEach(key => {
        console.log(`\n📋 Key Details:`);
        console.log(`  ID: ${key.id}`);
        console.log(`  Name: ${key.name}`);
        console.log(`  Prefix: ${key.keyPrefix}`);
        console.log(`  Scopes: ${key.scopes}`);
        console.log(`  Rate Limit: ${key.rateLimit}`);
        console.log(`  Expires: ${key.expiresAt}`);
        console.log(`  Last Used: ${key.lastUsedAt || 'Never'}`);
        console.log(`  Usage Count: ${key.usageCount}`);
      });

      // Verify the API key hash
      const keyToCheck = keys[0];
      const isValid = await bcrypt.compare(API_KEY, keyToCheck.key);
      console.log(`\n🔐 API key validation: ${isValid ? '✅ VALID' : '❌ INVALID'}`);

      if (!isValid) {
        console.log('🔄 Updating API key hash...');
        const hashedKey = await bcrypt.hash(API_KEY, 10);
        await db.update(apiKeys)
          .set({ key: hashedKey })
          .where(eq(apiKeys.id, keyToCheck.id));
        console.log('✅ API key hash updated');
      }
    }

  } catch (error) {
    console.error('❌ Error checking API key:', error);
  } finally {
    await sql.end();
  }
}

checkApiKey().catch(console.error);