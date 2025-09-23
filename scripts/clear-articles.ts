import { db } from '../src/lib/db';
import { generatedArticles } from '../src/lib/schema/articles';
import { sql } from 'drizzle-orm';

async function clearArticles() {
  console.log('🗑️  Removing all generated articles from database...');

  try {
    // Delete all articles using raw SQL
    await db.execute(sql`DELETE FROM generated_articles`);
    console.log('✅ All articles removed successfully');

    // Count remaining articles to confirm
    const remaining = await db.select().from(generatedArticles);
    console.log(`📊 Remaining articles: ${remaining.length}`);
  } catch (error) {
    console.error('❌ Error removing articles:', error);
    process.exit(1);
  }

  process.exit(0);
}

clearArticles();
