import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function cleanupData() {
  console.log('🧹 Starting cleanup of RSS articles and generated articles...');

  try {
    // Delete RSS article views first (due to foreign key)
    console.log('Deleting RSS article views...');
    const deletedViewsResult = await db.execute(sql`DELETE FROM rss_article_views`);
    console.log(`✓ Deleted ${deletedViewsResult.rowCount} RSS article views`);

    // Delete RSS articles
    console.log('Deleting RSS articles...');
    const deletedRssResult = await db.execute(sql`DELETE FROM rss_articles`);
    console.log(`✓ Deleted ${deletedRssResult.rowCount} RSS articles`);

    // Delete RSS sources
    console.log('Deleting RSS sources...');
    const deletedSourcesResult = await db.execute(sql`DELETE FROM rss_sources`);
    console.log(`✓ Deleted ${deletedSourcesResult.rowCount} RSS sources`);

    // Delete generated articles and related data
    console.log('Deleting article feedback...');
    const deletedFeedbackResult = await db.execute(sql`DELETE FROM article_feedback`);
    console.log(`✓ Deleted ${deletedFeedbackResult.rowCount} article feedback`);

    console.log('Deleting article likes...');
    const deletedLikesResult = await db.execute(sql`DELETE FROM article_likes`);
    console.log(`✓ Deleted ${deletedLikesResult.rowCount} article likes`);

    console.log('Deleting article replies...');
    const deletedRepliesResult = await db.execute(sql`DELETE FROM article_replies`);
    console.log(`✓ Deleted ${deletedRepliesResult.rowCount} article replies`);

    console.log('Deleting article views...');
    const deletedArticleViewsResult = await db.execute(sql`DELETE FROM article_views`);
    console.log(`✓ Deleted ${deletedArticleViewsResult.rowCount} article views`);

    console.log('Deleting generated articles...');
    const deletedArticlesResult = await db.execute(sql`DELETE FROM generated_articles`);
    console.log(`✓ Deleted ${deletedArticlesResult.rowCount} generated articles`);

    console.log('✅ Cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupData();