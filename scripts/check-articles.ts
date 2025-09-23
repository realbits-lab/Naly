import { db } from '../src/lib/db';
import { generatedArticles } from '../src/lib/schema/articles';

async function checkArticles() {
  console.log('🔍 Checking articles in database...');

  try {
    const articles = await db.select({
      id: generatedArticles.id,
      title: generatedArticles.title,
      createdAt: generatedArticles.createdAt,
      sourceCategory: generatedArticles.sourceCategory,
      sentiment: generatedArticles.sentiment
    }).from(generatedArticles);
    console.log(`📊 Total articles in database: ${articles.length}`);

    if (articles.length > 0) {
      console.log('\n📰 Articles found:');
      articles.forEach((article, index) => {
        console.log(`\n[${index + 1}]`);
        console.log(`  ID: ${article.id}`);
        console.log(`  Title: ${article.title}`);
        console.log(`  Created: ${article.createdAt}`);
        console.log(`  Category: ${article.sourceCategory}`);
        console.log(`  Sentiment: ${article.sentiment}`);
      });
    } else {
      console.log('❌ No articles found in database');
    }
  } catch (error) {
    console.error('❌ Error checking articles:', error);
    process.exit(1);
  }

  process.exit(0);
}

checkArticles();