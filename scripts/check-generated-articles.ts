import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve } from 'path';
import { generatedArticles } from '../src/lib/schema/articles';
import { desc } from 'drizzle-orm';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}

const sql = postgres(databaseUrl);
const db = drizzle(sql);

async function checkGeneratedArticles() {
  console.log('🔍 Checking generated articles in database...');
  console.log('⏰ Timestamp:', new Date().toISOString());

  try {
    // Get all generated articles, ordered by creation date
    const articles = await db.select().from(generatedArticles).orderBy(desc(generatedArticles.createdAt));

    console.log(`\n📊 Total generated articles: ${articles.length}`);

    if (articles.length === 0) {
      console.log('❌ No generated articles found in database');
      return { success: false, count: 0 };
    }

    console.log('\n📰 Generated Articles:');
    console.log('=' .repeat(80));

    articles.forEach((article, index) => {
      console.log(`\n📄 Article ${index + 1}:`);
      console.log(`   ID: ${article.id}`);
      console.log(`   Title: ${article.title}`);
      console.log(`   Quality: ${article.quality ? '⭐'.repeat(article.quality) + ` (${article.quality}/5)` : 'Not rated'}`);
      console.log(`   Created: ${article.createdAt}`);
      console.log(`   Updated: ${article.updatedAt}`);

      // Check for company information
      if (article.companies) {
        try {
          const companies = JSON.parse(article.companies as string);
          console.log(`   Companies: ${companies.join(', ')}`);
        } catch (e) {
          if (Array.isArray(article.companies)) {
            console.log(`   Companies: ${(article.companies as any[]).join(', ')}`);
          } else {
            console.log(`   Companies: ${String(article.companies).substring(0, 100)}...`);
          }
        }
      } else {
        console.log(`   Companies: None`);
      }

      // Check for entities
      if (article.entities) {
        try {
          const entities = JSON.parse(article.entities as string);
          console.log(`   Entities: ${entities.slice(0, 5).join(', ')}${entities.length > 5 ? '...' : ''}`);
        } catch (e) {
          // Entities might be a plain string array
          if (Array.isArray(article.entities)) {
            console.log(`   Entities: ${(article.entities as any[]).slice(0, 5).join(', ')}${(article.entities as any[]).length > 5 ? '...' : ''}`);
          } else {
            console.log(`   Entities: ${String(article.entities).substring(0, 100)}...`);
          }
        }
      }

      // Check for keywords
      if (article.keywords) {
        try {
          const keywords = JSON.parse(article.keywords as string);
          console.log(`   Keywords: ${keywords.slice(0, 5).join(', ')}${keywords.length > 5 ? '...' : ''}`);
        } catch (e) {
          if (Array.isArray(article.keywords)) {
            console.log(`   Keywords: ${(article.keywords as any[]).slice(0, 5).join(', ')}${(article.keywords as any[]).length > 5 ? '...' : ''}`);
          } else {
            console.log(`   Keywords: ${String(article.keywords).substring(0, 100)}...`);
          }
        }
      }

      // Content summary
      if (article.summary) {
        console.log(`   Summary: ${article.summary.substring(0, 100)}...`);
      }

      // Check for key points
      if (article.keyPoints) {
        try {
          const keyPoints = JSON.parse(article.keyPoints as string);
          console.log(`   Key Points: ${keyPoints.length} points`);
          keyPoints.slice(0, 2).forEach((point: string) => {
            console.log(`      • ${point.substring(0, 80)}...`);
          });
        } catch (e) {
          console.log(`   Key Points: Unable to parse`);
        }
      }

      // Infographic check
      if (article.infographicTitle || article.infographicContent) {
        console.log(`   📊 Has Infographic: Yes`);
        if (article.infographicTitle) {
          console.log(`      Title: ${article.infographicTitle}`);
        }
      } else {
        console.log(`   📊 Has Infographic: No`);
      }

      console.log('-' .repeat(80));
    });

    // Quality analysis
    const qualityRatings = articles.filter(a => a.quality).map(a => a.quality as number);
    if (qualityRatings.length > 0) {
      const avgQuality = qualityRatings.reduce((a, b) => a + b, 0) / qualityRatings.length;
      console.log(`\n📊 Quality Analysis:`);
      console.log(`   Average Quality: ${avgQuality.toFixed(2)}/5 ⭐`);
      console.log(`   Articles with quality rating: ${qualityRatings.length}/${articles.length}`);
    }

    // Company information analysis
    const articlesWithCompanies = articles.filter(a => a.companies && JSON.parse(a.companies as string).length > 0);
    console.log(`\n🏢 Company Information:`);
    console.log(`   Articles with companies: ${articlesWithCompanies.length}/${articles.length}`);

    if (articlesWithCompanies.length > 0) {
      const allCompanies = new Set<string>();
      articlesWithCompanies.forEach(article => {
        const companies = JSON.parse(article.companies as string);
        companies.forEach((c: string) => allCompanies.add(c));
      });
      console.log(`   Unique companies mentioned: ${allCompanies.size}`);
      console.log(`   Companies: ${Array.from(allCompanies).slice(0, 10).join(', ')}${allCompanies.size > 10 ? '...' : ''}`);
    }

    // Check latest article details
    if (articles.length > 0) {
      const latest = articles[0];
      console.log(`\n🆕 Latest Article Details:`);
      console.log(`   Title: ${latest.title}`);
      console.log(`   Created: ${latest.createdAt}`);

      // Check if title contains company name
      const hasCompanyInTitle = latest.companies &&
        JSON.parse(latest.companies as string).some((company: string) =>
          latest.title.toLowerCase().includes(company.toLowerCase())
        );
      console.log(`   Title contains company name: ${hasCompanyInTitle ? '✅ Yes' : '❌ No'}`);
    }

    return {
      success: true,
      count: articles.length,
      averageQuality: qualityRatings.length > 0 ? qualityRatings.reduce((a, b) => a + b, 0) / qualityRatings.length : 0,
      articlesWithCompanies: articlesWithCompanies.length
    };

  } catch (error) {
    console.error('❌ Error checking generated articles:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the check
checkGeneratedArticles()
  .then(result => {
    console.log('\n✨ Check completed:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });