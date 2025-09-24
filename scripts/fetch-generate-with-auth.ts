import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve } from 'path';
import { generatedArticles } from '../src/lib/schema/articles';
import { rssArticles, rssSources } from '../src/lib/schema/rss';
import { desc } from 'drizzle-orm';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}

const sql = postgres(databaseUrl);
const db = drizzle(sql);

// Test manager API key from .auth/user.json
const API_KEY = 'naly_test_7687773d9c0b0dbe1334b27fe61014bab3af656d5f2881f5cf39c50d0031e6be';

async function fetchAndGenerateWithAuth() {
  console.log('🚀 Starting authenticated RSS fetch and article generation process...');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🔑 Using test manager API key for authentication');

  try {
    // Step 1: First, get the RSS sources
    console.log('\n📋 Step 1: Getting RSS sources...');
    const sources = await db.select().from(rssSources).limit(10);

    // If no sources, add default sources
    if (sources.length === 0) {
      console.log('⚡ No RSS sources found, adding default sources...');
      const defaultSources = [
        { name: 'CNBC Markets', feedUrl: 'https://www.cnbc.com/id/100003241/device/rss/rss.xml', category: 'markets', isActive: true },
        { name: 'Reuters Business', feedUrl: 'https://feeds.reuters.com/reuters/businessNews', category: 'business', isActive: true },
        { name: 'MarketWatch', feedUrl: 'https://feeds.marketwatch.com/marketwatch/marketpulse/', category: 'markets', isActive: true },
      ];

      for (const source of defaultSources) {
        await db.insert(rssSources).values(source);
      }

      const newSources = await db.select().from(rssSources).limit(10);
      sources.push(...newSources);
      console.log(`✅ Added ${newSources.length} default RSS sources`);
    }

    console.log(`📊 Found ${sources.length} RSS sources`);

    // Step 2: Fetch RSS from each source
    let totalFetched = 0;
    for (const source of sources) {
      console.log(`\n📡 Step 2.${sources.indexOf(source) + 1}: Fetching RSS from ${source.name}...`);

      const rssResponse = await fetch(`http://localhost:4000/api/monitor/rss?sourceId=${source.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
      });

      if (!rssResponse.ok) {
        const errorText = await rssResponse.text();
        console.error(`❌ RSS fetch failed for ${source.name}:`, rssResponse.status, errorText.substring(0, 100));
        continue;
      }

      const rssData = await rssResponse.json();
      console.log(`✅ Fetched ${rssData.articles?.length || 0} articles from ${source.name}`);

      // Store articles in database
      if (rssData.articles && rssData.articles.length > 0) {
        for (const article of rssData.articles) {
          try {
            await db.insert(rssArticles).values({
              sourceId: source.id,
              guid: article.guid || article.link,
              title: article.title,
              link: article.link,
              description: article.description,
              content: article.content,
              pubDate: new Date(article.publishedAt),
              author: article.author,
              categories: article.categories,
              hasTicker: false
            });
            totalFetched++;
          } catch (insertError) {
            // Skip duplicates
            console.log(`⚠️ Skipping duplicate article: ${article.title?.substring(0, 50)}...`);
          }
        }
      }
    }

    console.log(`\n📊 Total RSS articles fetched and stored: ${totalFetched}`);

    // Step 3: Check what RSS articles we have
    const rssArticlesList = await db.select().from(rssArticles).orderBy(desc(rssArticles.pubDate)).limit(5);
    console.log('\n📋 Latest RSS articles in database:');
    rssArticlesList.forEach((article, index) => {
      console.log(`  ${index + 1}. Title: ${article.title}`);
      console.log(`     URL: ${article.link}`);
      console.log(`     Date: ${article.pubDate}`);
      console.log(`     Source: ${article.sourceId}`);
    });

    // Step 4: Generate reports from RSS articles
    console.log('\n🤖 Step 3: Generating market intelligence report...');
    console.log('📝 Using the /api/monitor/generate-report API with authentication');

    const generateResponse = await fetch('http://localhost:4000/api/monitor/generate-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        // Request body if needed
      })
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error('❌ Report generation failed:', generateResponse.status, errorText.substring(0, 200));

      // Try to understand the error
      if (generateResponse.status === 401) {
        console.error('🔐 Authentication failed - API key may be invalid or expired');
      } else if (generateResponse.status === 403) {
        console.error('🚫 Permission denied - user may not have manager role');
      }

      throw new Error(`Report generation failed: ${generateResponse.status}`);
    }

    const generateData = await generateResponse.json();
    console.log('✅ Generation response received');
    console.log('📊 Response summary:', {
      success: generateData.success || false,
      articlesGenerated: generateData.articlesGenerated || 0,
      message: generateData.message || 'No message'
    });

    // Step 5: Verify articles were generated
    console.log('\n📊 Step 4: Verifying generated articles...');
    const generatedArticlesList = await db.select().from(generatedArticles).orderBy(desc(generatedArticles.createdAt)).limit(5);

    console.log(`\n📈 Total generated articles found: ${generatedArticlesList.length}`);

    generatedArticlesList.forEach((article, index) => {
      console.log(`\n📰 Article ${index + 1}:`);
      console.log(`  🏷️ Title: ${article.title}`);
      console.log(`  📝 Summary: ${article.summary?.substring(0, 150)}...`);
      console.log(`  📖 Word count: ${article.wordCount}`);
      console.log(`  ⏱️ Reading time: ${article.readingTime} minutes`);
      console.log(`  📰 Source: ${article.sourcePublisher || 'Unknown'}`);
      console.log(`  📂 Category: ${article.sourceCategory || 'General'}`);
      console.log(`  💭 Sentiment: ${article.sentiment || 'Neutral'}`);
      console.log(`  🤖 AI Model: ${article.aiModel || 'Unknown'}`);
      console.log(`  ⚙️ Generation Method: ${article.generationMethod || 'ai'}`);
      console.log(`  🌍 Language: ${article.sourceLanguage || 'en'}`);
      console.log(`  📅 Created: ${article.createdAt}`);

      // Check for company information
      if (article.entities) {
        const entities = typeof article.entities === 'string'
          ? JSON.parse(article.entities)
          : article.entities;
        console.log(`  🏢 Companies/Entities: ${Array.isArray(entities) ? entities.join(', ') : JSON.stringify(entities)}`);
      }

      if (article.keywords) {
        const keywords = typeof article.keywords === 'string'
          ? JSON.parse(article.keywords)
          : article.keywords;
        console.log(`  🔑 Keywords: ${Array.isArray(keywords) ? keywords.join(', ') : JSON.stringify(keywords)}`);
      }

      // Check title quality - enhanced company detection
      const hasCompanyInTitle =
        article.title.includes(':') ||  // Often used in format "Company: News"
        /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/.test(article.title) || // Proper nouns
        /\b[A-Z]{2,}\b/.test(article.title) || // Stock tickers
        /\b(?:Inc|Corp|Ltd|LLC|Co\.|Company|Group|Holdings)\b/i.test(article.title); // Company suffixes

      console.log(`  ✅ Title has company reference: ${hasCompanyInTitle ? 'Yes' : 'No'}`);

      // Check content quality
      const contentLength = article.content?.length || 0;
      const hasKeyPoints = article.keyPoints && JSON.parse(article.keyPoints as string).length > 0;
      const hasMarketAnalysis = !!article.marketAnalysis && article.marketAnalysis.length > 100;
      const hasInvestmentImplications = !!article.investmentImplications && article.investmentImplications.length > 100;

      console.log(`  📏 Content length: ${contentLength} characters`);
      console.log(`  📊 Quality indicators:`);
      console.log(`     - Has key points: ${hasKeyPoints ? '✅' : '❌'}`);
      console.log(`     - Has market analysis: ${hasMarketAnalysis ? '✅' : '❌'}`);
      console.log(`     - Has investment implications: ${hasInvestmentImplications ? '✅' : '❌'}`);
      console.log(`     - Overall quality: ${contentLength > 1000 ? 'Good ✅' : 'Poor ❌'}`);
    });

    // Step 6: Summary statistics
    console.log('\n📊 === FINAL SUMMARY ===');
    console.log(`  📰 RSS articles in database: ${rssArticlesList.length}`);
    console.log(`  ✨ Generated articles: ${generatedArticlesList.length}`);
    console.log(`  🎯 Generation success: ${generatedArticlesList.length > 0 ? '✅ SUCCESS' : '❌ FAILED'}`);

    // Quality metrics summary
    if (generatedArticlesList.length > 0) {
      const qualityScores = generatedArticlesList.map(article => {
        let score = 0;
        if (article.title) score++;
        if (article.content && article.content.length > 100) score++;
        if (article.entities) score++;
        if (article.summary) score++;
        if (article.keyPoints) score++;
        if (article.marketAnalysis) score++;
        if (article.investmentImplications) score++;
        return { title: article.title?.substring(0, 50), score };
      });

      console.log('\n✅ Article Quality Scores (out of 7):');
      qualityScores.forEach((item, index) => {
        const stars = '⭐'.repeat(item.score);
        console.log(`  ${index + 1}. ${item.title}... : ${item.score}/7 ${stars}`);
      });

      const avgScore = qualityScores.reduce((sum, item) => sum + item.score, 0) / qualityScores.length;
      console.log(`\n  📊 Average Quality Score: ${avgScore.toFixed(1)}/7`);
    }

    console.log('\n🎉 Process completed successfully!');
    return {
      success: true,
      rssArticlesFetched: totalFetched,
      articlesGenerated: generatedArticlesList.length
    };

  } catch (error) {
    console.error('\n❌ Error during authenticated fetch and generate process:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the authenticated process
fetchAndGenerateWithAuth()
  .then(result => {
    console.log('\n✨ Final result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });