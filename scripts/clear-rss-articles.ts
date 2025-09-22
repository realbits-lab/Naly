#!/usr/bin/env tsx

import { db } from '../src/lib/db';
import { rssArticles } from '../src/lib/schema/rss';
import { generatedArticles } from '../src/lib/schema/articles';

async function clearArticles() {
  console.log('🧹 Clearing RSS articles and generated reports to test Gemini integration...');

  try {
    // Delete all RSS articles and generated articles
    await db.delete(rssArticles);
    await db.delete(generatedArticles);

    console.log('✅ Successfully cleared all RSS articles and generated reports');
  } catch (error) {
    console.error('❌ Error clearing articles:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  clearArticles()
    .then(() => {
      console.log('🎉 Cleanup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Cleanup failed:', error);
      process.exit(1);
    });
}

export { clearArticles };