import { db } from '../src/lib/db';
import { articles, rssFeeds, rssItems } from '../src/lib/schema/articles';

async function cleanupData() {
  console.log('🧹 Starting cleanup of RSS feeds and articles...');

  try {
    console.log('Deleting all articles...');
    const deletedArticles = await db.delete(articles);
    console.log(`✓ Deleted articles`);

    console.log('Deleting all RSS items...');
    const deletedItems = await db.delete(rssItems);
    console.log(`✓ Deleted RSS items`);

    console.log('Deleting all RSS feeds...');
    const deletedFeeds = await db.delete(rssFeeds);
    console.log(`✓ Deleted RSS feeds`);

    console.log('✅ Cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupData();