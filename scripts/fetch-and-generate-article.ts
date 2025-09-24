import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve } from 'path';
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

async function fetchAndGenerateArticle() {
  console.log('🚀 Starting RSS fetch and article generation process...');
  console.log('⏰ Timestamp:', new Date().toISOString());

  try {
    // Step 1: Fetch RSS feeds
    console.log('\n📡 Step 1: Fetching RSS feeds...');
    const rssResponse = await fetch('http://localhost:4000/api/monitor/rss', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!rssResponse.ok) {
      const errorText = await rssResponse.text();
      console.error('❌ RSS fetch failed:', rssResponse.status, errorText);
      throw new Error(`RSS fetch failed: ${rssResponse.status}`);
    }

    const rssData = await rssResponse.json();
    console.log('✅ RSS fetch response:', JSON.stringify(rssData, null, 2));
    console.log(`📊 Fetched ${rssData.fetchedCount || rssData.fetched || 0} RSS articles`);

    // Step 2: Check what RSS articles we have
    const rssArticlesList = await db.select().from(rssArticles).limit(5);
    console.log('\n📋 Current RSS articles in database:');
    rssArticlesList.forEach((article, index) => {
      console.log(`  ${index + 1}. Title: ${article.title}`);
      console.log(`     URL: ${article.link}`);
      console.log(`     Date: ${article.pubDate}`);
      console.log(`     Has ticker: ${article.hasTicker ? 'Yes' : 'No'}`);
    });

    // Step 3: Generate reports from RSS articles
    console.log('\n🤖 Step 2: Generating market intelligence report...');
    console.log('📝 Using the real /api/monitor/generate-report API');

    const generateResponse = await fetch('http://localhost:4000/api/monitor/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error('❌ Report generation failed:', generateResponse.status, errorText);
      throw new Error(`Report generation failed: ${generateResponse.status}`);
    }

    const generateData = await generateResponse.json();
    console.log('✅ Generation response:', JSON.stringify(generateData, null, 2));

    // Step 4: Verify articles were generated
    console.log('\n📊 Step 3: Verifying generated articles...');
    const generatedArticlesList = await db.select().from(generatedArticles).limit(5);

    console.log(`\n📈 Total generated articles in database: ${generatedArticlesList.length}`);

    generatedArticlesList.forEach((article, index) => {
      console.log(`\n📰 Article ${index + 1}:`);
      console.log(`  Title: ${article.title}`);
      console.log(`  Summary: ${article.summary?.substring(0, 100)}...`);
      console.log(`  Word count: ${article.wordCount}`);
      console.log(`  Reading time: ${article.readingTime} minutes`);
      console.log(`  Source: ${article.sourcePublisher}`);
      console.log(`  Category: ${article.sourceCategory}`);
      console.log(`  Sentiment: ${article.sentiment}`);
      console.log(`  AI Model: ${article.aiModel}`);
      console.log(`  Generation Method: ${article.generationMethod}`);
      console.log(`  Has translations: ${article.hasTranslations}`);
      console.log(`  Created at: ${article.createdAt}`);

      // Check for company information
      if (article.entities) {
        const entities = typeof article.entities === 'string'
          ? JSON.parse(article.entities)
          : article.entities;
        console.log(`  Entities/Companies: ${JSON.stringify(entities)}`);
      }

      if (article.keywords) {
        const keywords = typeof article.keywords === 'string'
          ? JSON.parse(article.keywords)
          : article.keywords;
        console.log(`  Keywords: ${JSON.stringify(keywords)}`);
      }

      // Check title quality
      const hasCompanyName = article.title.includes(':') ||
                             article.title.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/) ||
                             article.title.match(/\b[A-Z]+\b/);
      console.log(`  Title has company name: ${hasCompanyName ? 'Yes' : 'No'}`);

      // Check content quality
      const contentLength = article.content?.length || 0;
      console.log(`  Content length: ${contentLength} characters`);
      console.log(`  Content quality: ${contentLength > 1000 ? 'Good' : 'Poor'}`);
    });

    // Step 5: Summary statistics
    console.log('\n📊 Summary Statistics:');
    console.log(`  Total RSS articles: ${rssArticlesList.length}`);
    console.log(`  Total generated articles: ${generatedArticlesList.length}`);
    console.log(`  Generation success rate: ${generatedArticlesList.length > 0 ? '100%' : '0%'}`);

    // Check article quality metrics
    const qualityMetrics = generatedArticlesList.map(article => ({
      hasTitle: !!article.title,
      hasContent: !!article.content && article.content.length > 100,
      hasCompanyInfo: !!article.entities,
      hasSummary: !!article.summary,
      hasKeyPoints: !!article.keyPoints,
      hasMarketAnalysis: !!article.marketAnalysis,
      hasInvestmentImplications: !!article.investmentImplications,
    }));

    console.log('\n✅ Quality Metrics:');
    qualityMetrics.forEach((metrics, index) => {
      const score = Object.values(metrics).filter(v => v).length;
      console.log(`  Article ${index + 1}: ${score}/7 quality checks passed`);
      Object.entries(metrics).forEach(([key, value]) => {
        console.log(`    - ${key}: ${value ? '✅' : '❌'}`);
      });
    });

    console.log('\n🎉 Process completed successfully!');
    return { success: true, articlesGenerated: generatedArticlesList.length };

  } catch (error) {
    console.error('\n❌ Error during fetch and generate process:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the process
fetchAndGenerateArticle()
  .then(result => {
    console.log('\n✨ Final result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });