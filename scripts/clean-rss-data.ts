import { db } from '../src/lib/db';
import { articles, rssFeeds, rssItems } from '../src/lib/schema/articles';
import { sql } from 'drizzle-orm';

async function cleanupData() {
  console.log('🧹 Starting cleanup of RSS feeds and articles...');

  try {
    // Delete all articles
    console.log('Deleting all articles...');
    const deletedArticlesResult = await db.execute(sql`DELETE FROM articles`);
    console.log(`✓ Deleted ${deletedArticlesResult.rowCount} articles`);

    // Delete all RSS items
    console.log('Deleting all RSS items...');
    const deletedItemsResult = await db.execute(sql`DELETE FROM rss_items`);
    console.log(`✓ Deleted ${deletedItemsResult.rowCount} RSS items`);

    // Delete all RSS feeds
    console.log('Deleting all RSS feeds...');
    const deletedFeedsResult = await db.execute(sql`DELETE FROM rss_feeds`);
    console.log(`✓ Deleted ${deletedFeedsResult.rowCount} RSS feeds`);

    console.log('✅ Cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupData();