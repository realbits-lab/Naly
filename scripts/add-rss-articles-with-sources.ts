import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve } from 'path';
import { rssArticles, rssSources } from '../src/lib/schema/rss';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}

const sql = postgres(databaseUrl);
const db = drizzle(sql);

async function addRssArticlesWithSources() {
  console.log('🚀 Adding RSS articles with proper sources...');
  console.log('⏰ Timestamp:', new Date().toISOString());

  try {
    // First, get existing RSS sources
    const existingSources = await db.select().from(rssSources);
    console.log(`📊 Found ${existingSources.length} existing RSS sources`);

    let sourceId: string;

    if (existingSources.length > 0) {
      // Use the first existing source
      sourceId = existingSources[0].id;
      console.log(`✅ Using existing source: ${existingSources[0].name} (${sourceId})`);
    } else {
      // Create a new RSS source
      console.log('📝 No sources found, creating a new RSS source...');
      const newSource = await db.insert(rssSources).values({
        name: 'Tech News Feed',
        feedUrl: 'https://technews.example.com/rss',
        category: 'technology',
        isActive: true
      }).returning();

      sourceId = newSource[0].id;
      console.log(`✅ Created new source with ID: ${sourceId}`);
    }

    // Sample RSS articles to insert
    const sampleRssArticles = [
      {
        sourceId: sourceId,
        guid: 'apple-ai-' + Date.now(),
        title: 'Apple Unveils Revolutionary AI Features in iOS 18 Beta',
        link: 'https://example.com/apple-ai-ios-18',
        description: 'Apple has announced groundbreaking artificial intelligence capabilities in the latest iOS 18 beta, including advanced Siri integration and on-device language models that rival ChatGPT.',
        content: 'Apple has announced groundbreaking artificial intelligence capabilities in the latest iOS 18 beta release. The new features include advanced Siri integration with context awareness, on-device language models that rival ChatGPT performance, and innovative AI-powered photography enhancements. Industry analysts predict these features could significantly boost iPhone sales in the coming quarter. Tim Cook stated that this represents the biggest leap in iOS capabilities since the introduction of the App Store.',
        pubDate: new Date(),
        author: 'Sarah Johnson',
        categories: ['Technology', 'AI', 'Apple', 'iOS'],
        hasTicker: true,
        isArchived: false
      },
      {
        sourceId: sourceId,
        guid: 'microsoft-cloud-' + Date.now(),
        title: 'Microsoft Stock Hits All-Time High on Cloud Computing Growth',
        link: 'https://example.com/microsoft-cloud-growth',
        description: 'Microsoft shares reached record levels as Azure cloud services reported 35% year-over-year growth, exceeding analyst expectations.',
        content: 'Microsoft Corporation (NASDAQ: MSFT) saw its stock price surge to an all-time high of $425 per share following stellar Q4 earnings results. Azure cloud services grew 35% year-over-year, significantly outpacing competitor AWS which reported 12% growth. The company also announced a massive $100 billion investment in AI infrastructure over the next four years, partnering with OpenAI to develop next-generation AI models. CFO Amy Hood highlighted that enterprise AI adoption is accelerating, with over 60% of Fortune 500 companies now using Azure AI services.',
        pubDate: new Date(),
        author: 'Michael Chen',
        categories: ['Finance', 'Cloud', 'Microsoft', 'Technology'],
        hasTicker: true,
        isArchived: false
      },
      {
        sourceId: sourceId,
        guid: 'tesla-battery-' + Date.now(),
        title: 'Tesla Announces Major Breakthrough in Battery Technology',
        link: 'https://example.com/tesla-battery-breakthrough',
        description: 'Tesla reveals new battery cell design that promises 50% more range and 30% lower production costs, revolutionizing EV industry.',
        content: 'Tesla Inc. (NASDAQ: TSLA) announced a major breakthrough in battery technology with its new 4680 cell design at the Battery Day event. The innovative cells promise 50% more range and 30% lower production costs compared to current technology. CEO Elon Musk stated this advancement will enable Tesla to produce a $25,000 electric vehicle by 2025, potentially disrupting the entire automotive industry. The new batteries also feature improved safety with reduced fire risk and faster charging capabilities, reaching 80% charge in just 15 minutes.',
        pubDate: new Date(),
        author: 'David Martinez',
        categories: ['Automotive', 'Technology', 'Tesla', 'Electric Vehicles'],
        hasTicker: true,
        isArchived: false
      },
      {
        sourceId: sourceId,
        guid: 'nvidia-earnings-' + Date.now(),
        title: 'NVIDIA Crushes Earnings Expectations with AI Chip Demand Surge',
        link: 'https://example.com/nvidia-ai-earnings',
        description: 'NVIDIA reports record revenue of $26.9 billion, driven by unprecedented demand for AI training chips from tech giants.',
        content: 'NVIDIA Corporation (NASDAQ: NVDA) reported blockbuster Q3 earnings with revenue of $26.9 billion, up 206% year-over-year. The semiconductor giant continues to dominate the AI chip market with its H100 GPUs sold out through 2025. Major cloud providers including Amazon, Microsoft, and Google are competing for chip allocations. CEO Jensen Huang announced the next-generation H200 GPU will begin shipping in Q2 2025 with 2x performance improvements. The company raised guidance for Q4 to $28-30 billion in revenue.',
        pubDate: new Date(),
        author: 'Lisa Wong',
        categories: ['Technology', 'Semiconductors', 'AI', 'NVIDIA'],
        hasTicker: true,
        isArchived: false
      },
      {
        sourceId: sourceId,
        guid: 'fed-rates-' + Date.now(),
        title: 'Federal Reserve Signals Potential Rate Cuts in 2025',
        link: 'https://example.com/fed-rate-decision',
        description: 'Fed Chair Jerome Powell hints at possible rate cuts beginning Q1 2025 as inflation shows signs of cooling.',
        content: 'The Federal Reserve kept interest rates unchanged at 5.25-5.50% but signaled a more dovish stance for 2025. Chair Jerome Powell noted that inflation has shown consistent progress toward the 2% target, with Core PCE falling to 2.8%. The dot plot revealed that FOMC members now expect three rate cuts in 2025, up from previous projections of two. Markets rallied on the news with the S&P 500 gaining 1.5% and bond yields falling 15 basis points. Economic data shows the labor market cooling with job openings declining to pre-pandemic levels.',
        pubDate: new Date(),
        author: 'Robert Thompson',
        categories: ['Economy', 'Federal Reserve', 'Interest Rates', 'Markets'],
        hasTicker: false,
        isArchived: false
      }
    ];

    let successCount = 0;

    for (const article of sampleRssArticles) {
      console.log(`\n📝 Adding RSS article: ${article.title.substring(0, 60)}...`);

      try {
        const result = await db.insert(rssArticles).values(article).returning();

        if (result.length > 0) {
          successCount++;
          console.log(`✅ RSS article added with ID: ${result[0].id}`);
          console.log(`   - Has ticker: ${article.hasTicker ? 'Yes' : 'No'}`);
          console.log(`   - Categories: ${article.categories.join(', ')}`);
        }
      } catch (insertError) {
        console.error(`❌ Failed to insert article:`, insertError);
      }
    }

    console.log(`\n✨ Successfully added ${successCount}/${sampleRssArticles.length} RSS articles`);

    // Verify insertion
    const allRssArticles = await db.select().from(rssArticles);
    console.log(`\n📊 Total RSS articles in database: ${allRssArticles.length}`);

    console.log('\n📰 RSS Articles in database:');
    allRssArticles.forEach((article, index) => {
      console.log(`  ${index + 1}. ${article.title}`);
      console.log(`     - Source ID: ${article.sourceId}`);
      console.log(`     - Published: ${article.pubDate}`);
      console.log(`     - Has Ticker: ${article.hasTicker ? 'Yes' : 'No'}`);
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
addRssArticlesWithSources()
  .then(result => {
    console.log('\n🎉 RSS articles addition completed:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });