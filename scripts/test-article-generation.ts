import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve } from 'path';
import { eq } from 'drizzle-orm';
import { generatedArticles } from '../src/lib/schema/articles';
import { rssArticles } from '../src/lib/schema/rss';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}

const sql = postgres(databaseUrl);
const db = drizzle(sql);

async function cleanDatabase() {
  console.log('🧹 Starting database cleanup...');

  try {
    // Count existing articles before deletion
    const articleCount = await db.select().from(generatedArticles);
    const rssCount = await db.select().from(rssArticles);

    console.log(`📊 Found ${articleCount.length} generated articles in database`);
    console.log(`📊 Found ${rssCount.length} RSS articles in database`);

    // Delete all generated articles
    console.log('🗑️ Deleting all generated articles...');
    await db.delete(generatedArticles);
    console.log('✅ All generated articles deleted');

    // Delete all RSS articles
    console.log('🗑️ Deleting all RSS articles...');
    await db.delete(rssArticles);
    console.log('✅ All RSS articles deleted');

    // Verify deletion
    const remainingArticles = await db.select().from(generatedArticles);
    const remainingRss = await db.select().from(rssArticles);

    console.log(`📊 Verification: ${remainingArticles.length} generated articles remaining`);
    console.log(`📊 Verification: ${remainingRss.length} RSS articles remaining`);

    if (remainingArticles.length === 0 && remainingRss.length === 0) {
      console.log('✅ Database cleanup successful!');
    } else {
      console.error('❌ Database cleanup failed - some records remain');
    }
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run cleanup
cleanDatabase().catch(console.error);