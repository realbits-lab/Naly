import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { generatedArticles } from '../src/lib/schema/articles.js';

const sql = postgres(process.env.DATABASE_URL as string);
const db = drizzle(sql);

async function checkDatabaseArticles() {
  console.log('🔍 Checking generated_articles table...');

  try {
    const articles = await db.select().from(generatedArticles).orderBy(generatedArticles.createdAt);
    console.log(`📊 Found ${articles.length} generated articles`);

    if (articles.length > 0) {
      const latest = articles[articles.length - 1];
      console.log(`📰 Latest article: ${latest.title}`);
      console.log(`📅 Created: ${latest.createdAt}`);
      console.log(`📝 Content length: ${latest.content.length} characters`);

      // Check if it contains company analysis
      const hasAppleAnalysis = latest.content.includes('Apple') || latest.content.includes('AAPL');
      const hasCompanySection = latest.content.includes('Company Analysis') || latest.content.includes('Financial Data');
      const hasFinancialMetrics = latest.content.includes('Revenue') || latest.content.includes('Market Cap');

      console.log(`🏢 Contains Apple analysis: ${hasAppleAnalysis}`);
      console.log(`📊 Contains company section: ${hasCompanySection}`);
      console.log(`💰 Contains financial metrics: ${hasFinancialMetrics}`);

      if (hasAppleAnalysis && (hasCompanySection || hasFinancialMetrics)) {
        console.log('✅ Company analysis is included in the report!');

        // Show a preview of Apple-related content
        const appleMatches = latest.content.match(/.{0,100}Apple.{0,100}/gi);
        if (appleMatches && appleMatches.length > 0) {
          console.log('\n📋 Apple analysis preview:');
          appleMatches.slice(0, 3).forEach((match, index) => {
            console.log(`${index + 1}. ...${match}...`);
          });
        }
      } else {
        console.log('❌ Company analysis may be missing or incomplete');
      }

      // Check for other company mentions
      const companies = ['Microsoft', 'Tesla', 'NVIDIA'];
      companies.forEach(company => {
        const hasCompany = latest.content.includes(company);
        console.log(`🏢 Contains ${company}: ${hasCompany}`);
      });

    } else {
      console.log('❌ No generated articles found in database');
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await sql.end();
  }
}

checkDatabaseArticles();