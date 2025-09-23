import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve } from 'path';
import { rssArticles } from '../src/lib/schema/rss';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}

const sql = postgres(databaseUrl);
const db = drizzle(sql);

// Sample RSS articles to insert
const sampleRssArticles = [
  {
    sourceId: uuidv4(),
    guid: 'article-1-' + Date.now(),
    title: 'Apple Unveils Revolutionary AI Features in iOS 18 Beta',
    link: 'https://example.com/apple-ai-ios-18',
    description: 'Apple has announced groundbreaking artificial intelligence capabilities in the latest iOS 18 beta, including advanced Siri integration and on-device language models that rival ChatGPT.',
    content: 'Apple has announced groundbreaking artificial intelligence capabilities in the latest iOS 18 beta release. The new features include advanced Siri integration with context awareness, on-device language models that rival ChatGPT performance, and innovative AI-powered photography enhancements. Industry analysts predict these features could significantly boost iPhone sales in the coming quarter.',
    pubDate: new Date(),
    author: 'Tech Reporter',
    categories: ['Technology', 'AI', 'Apple'],
    hasTicker: false,
    isArchived: false
  },
  {
    sourceId: uuidv4(),
    guid: 'article-2-' + Date.now(),
    title: 'Microsoft Stock Hits All-Time High on Cloud Computing Growth',
    link: 'https://example.com/microsoft-cloud-growth',
    description: 'Microsoft shares reached record levels as Azure cloud services reported 35% year-over-year growth, exceeding analyst expectations.',
    content: 'Microsoft Corporation saw its stock price surge to an all-time high following stellar Q4 earnings results. Azure cloud services grew 35% year-over-year, significantly outpacing competitor AWS. The company also announced a $100 billion investment in AI infrastructure over the next four years, partnering with OpenAI to develop next-generation AI models.',
    pubDate: new Date(),
    author: 'Financial Analyst',
    categories: ['Finance', 'Cloud', 'Microsoft'],
    hasTicker: false,
    isArchived: false
  },
  {
    sourceId: uuidv4(),
    guid: 'article-3-' + Date.now(),
    title: 'Tesla Announces Major Breakthrough in Battery Technology',
    link: 'https://example.com/tesla-battery-breakthrough',
    description: 'Tesla reveals new battery cell design that promises 50% more range and 30% lower production costs, revolutionizing EV industry.',
    content: 'Tesla Inc. announced a major breakthrough in battery technology with its new 4680 cell design. The innovative cells promise 50% more range and 30% lower production costs compared to current technology. CEO Elon Musk stated this advancement will enable Tesla to produce a $25,000 electric vehicle by 2025, potentially disrupting the entire automotive industry.',
    pubDate: new Date(),
    author: 'Auto Industry Expert',
    categories: ['Automotive', 'Technology', 'Tesla'],
    hasTicker: false,
    isArchived: false
  }
];

async function addRssArticles() {
  console.log('🚀 Adding RSS articles to database...');
  console.log('⏰ Timestamp:', new Date().toISOString());

  try {
    let successCount = 0;

    for (const article of sampleRssArticles) {
      console.log(`\n📝 Adding RSS article: ${article.title.substring(0, 60)}...`);

      try {
        const result = await db.insert(rssArticles).values(article).returning();

        if (result.length > 0) {
          successCount++;
          console.log(`✅ RSS article added with ID: ${result[0].id}`);
        }
      } catch (insertError) {
        console.error(`❌ Failed to insert article: ${insertError}`);
      }
    }

    console.log(`\n✨ Successfully added ${successCount}/${sampleRssArticles.length} RSS articles`);

    // Verify insertion
    const allRssArticles = await db.select().from(rssArticles);
    console.log(`\n📊 Total RSS articles in database: ${allRssArticles.length}`);

    console.log('\n📰 RSS Articles in database:');
    allRssArticles.forEach((article, index) => {
      console.log(`  ${index + 1}. ${article.title}`);
      console.log(`     - Published: ${article.pubDate}`);
      console.log(`     - Archived: ${article.isArchived ? 'Yes' : 'No'}`);
    });

    return { success: true, articlesAdded: successCount };

  } catch (error) {
    console.error('❌ Error adding RSS articles:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the insertion
addRssArticles()
  .then(result => {
    console.log('\n🎉 RSS articles addition completed:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });