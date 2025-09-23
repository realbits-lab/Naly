import { db } from '../src/lib/db';
import { generatedArticles } from '../src/lib/schema/articles';

async function checkArticleContent() {
  console.log('📄 Checking article content quality...');

  try {
    const articles = await db.select({
      id: generatedArticles.id,
      title: generatedArticles.title,
      content: generatedArticles.content,
      summary: generatedArticles.summary,
      wordCount: generatedArticles.wordCount,
      readingTime: generatedArticles.readingTime,
      keyPoints: generatedArticles.keyPoints,
      marketAnalysis: generatedArticles.marketAnalysis,
      investmentImplications: generatedArticles.investmentImplications
    }).from(generatedArticles);

    if (articles.length === 0) {
      console.log('❌ No articles found');
      process.exit(1);
    }

    const article = articles[0];
    console.log('\n📰 Article Analysis:');
    console.log('Title:', article.title);
    console.log('Content length:', article.content?.length || 0, 'characters');
    console.log('Word count in DB:', article.wordCount);
    console.log('Reading time:', article.readingTime, 'minutes');

    console.log('\n📝 Content Preview:');
    console.log(article.content?.substring(0, 500) + '...' || 'No content');

    console.log('\n📋 Summary:');
    console.log(article.summary || 'No summary');

    console.log('\n🔑 Key Points:');
    console.log(article.keyPoints || 'No key points');

    console.log('\n📊 Market Analysis:');
    console.log(article.marketAnalysis || 'No market analysis');

    console.log('\n💰 Investment Implications:');
    console.log(article.investmentImplications || 'No investment implications');

    // Quality assessment
    const contentLength = article.content?.length || 0;
    console.log('\n🔍 Quality Assessment:');
    console.log('- Content length:', contentLength < 500 ? '❌ Too short' : contentLength < 2000 ? '⚠️ Medium' : '✅ Good length');
    console.log('- Has summary:', article.summary ? '✅' : '❌');
    console.log('- Has key points:', article.keyPoints ? '✅' : '❌');
    console.log('- Has market analysis:', article.marketAnalysis ? '✅' : '❌');
    console.log('- Has investment implications:', article.investmentImplications ? '✅' : '❌');

  } catch (error) {
    console.error('❌ Error checking article:', error);
    process.exit(1);
  }

  process.exit(0);
}

checkArticleContent();