#!/usr/bin/env node

const { db } = require('../src/lib/db');
const { rssArticles } = require('../src/lib/schema');

async function addSampleArticles() {
  try {
    console.log('📰 Adding sample RSS articles for report generation...');

    const sampleArticles = [
      {
        title: 'Tesla Stock Surges on Record Q3 Deliveries',
        description: 'Tesla announced record quarterly deliveries, beating analyst expectations and driving stock price higher.',
        content: 'Tesla Inc. delivered a record number of vehicles in the third quarter, surpassing Wall Street expectations and sending shares higher in after-hours trading. The electric vehicle maker delivered 466,140 vehicles in Q3, compared to analyst estimates of 456,000. This represents a 6.4% increase from the previous quarter.',
        fullContent: 'Tesla Inc. (NASDAQ: TSLA) delivered a record number of vehicles in the third quarter, surpassing Wall Street expectations and sending shares higher in after-hours trading. The electric vehicle maker delivered 466,140 vehicles in Q3, compared to analyst estimates of 456,000. This represents a 6.4% increase from the previous quarter and a 26% increase year-over-year. The strong delivery numbers come amid concerns about slowing EV demand and increased competition. Tesla CEO Elon Musk attributed the success to improved production efficiency and new model variants. The company also announced plans for new Gigafactory locations and expansion of its Supercharger network.',
        link: 'https://example.com/tesla-q3-deliveries',
        author: 'Financial News Reporter',
        categories: ['Technology', 'Automotive', 'Earnings'],
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isArchived: false,
        isProcessed: false
      },
      {
        title: 'Federal Reserve Signals Potential Rate Cut in December',
        description: 'Fed officials hint at possible interest rate reduction as inflation continues to moderate.',
        content: 'Federal Reserve officials are signaling a potential interest rate cut in December as inflation continues to moderate and labor market conditions soften. Recent economic data shows core inflation dropping to 3.2% annually.',
        fullContent: 'Federal Reserve officials are signaling a potential interest rate cut in December as inflation continues to moderate and labor market conditions soften. Recent economic data shows core inflation dropping to 3.2% annually, down from a peak of 9.1% in 2022. Fed Chair Jerome Powell indicated that the central bank is closely monitoring employment data and consumer spending patterns. Markets are pricing in a 75% probability of a 25 basis point rate cut at the December FOMC meeting. The potential policy shift comes as unemployment has risen to 4.1% and consumer confidence shows signs of weakening.',
        link: 'https://example.com/fed-rate-cut-signals',
        author: 'Economics Desk',
        categories: ['Monetary Policy', 'Federal Reserve', 'Interest Rates'],
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        isArchived: false,
        isProcessed: false
      },
      {
        title: 'Microsoft Azure Revenue Grows 29% in Latest Quarter',
        description: 'Microsoft cloud services continue strong growth trajectory, driving overall company performance.',
        content: 'Microsoft reported Azure revenue growth of 29% in its latest quarter, continuing the strong performance of its cloud computing division.',
        fullContent: 'Microsoft Corporation (NASDAQ: MSFT) reported Azure revenue growth of 29% in its latest quarter, continuing the strong performance of its cloud computing division. The cloud platform generated $24.3 billion in revenue, beating analyst expectations of $23.8 billion. CEO Satya Nadella highlighted strong enterprise adoption of AI-powered services and migration from legacy systems. Microsoft also announced new partnerships with major corporations for cloud infrastructure and AI services. The company\'s AI investments are showing strong returns, with Copilot for Microsoft 365 gaining significant enterprise traction.',
        link: 'https://example.com/microsoft-azure-growth',
        author: 'Tech Reporter',
        categories: ['Technology', 'Cloud Computing', 'Earnings'],
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        isArchived: false,
        isProcessed: false
      },
      {
        title: 'Oil Prices Rise on OPEC+ Production Cut Extension',
        description: 'Crude oil futures climb higher as OPEC+ extends production cuts through Q1 2024.',
        content: 'Oil prices rose sharply in trading today after OPEC+ announced an extension of production cuts through the first quarter of 2024.',
        fullContent: 'Oil prices rose sharply in trading today after OPEC+ announced an extension of production cuts through the first quarter of 2024. Brent crude futures climbed 3.2% to $87.45 per barrel, while WTI crude gained 2.8% to $83.12. The production cut extension of 2.2 million barrels per day aims to support oil prices amid concerns about global economic growth and energy demand. Saudi Arabia and Russia are leading the production restrictions, which have helped stabilize oil markets after volatile price swings earlier this year.',
        link: 'https://example.com/oil-prices-opec-cuts',
        author: 'Energy Markets Reporter',
        categories: ['Energy', 'Commodities', 'OPEC'],
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        isArchived: false,
        isProcessed: false
      },
      {
        title: 'Apple iPhone 15 Sales Exceed Expectations in China',
        description: 'Strong demand for new iPhone models in Chinese market drives quarterly revenue beat.',
        content: 'Apple reported stronger than expected iPhone 15 sales in China, helping drive overall quarterly revenue above analyst projections.',
        fullContent: 'Apple Inc. (NASDAQ: AAPL) reported stronger than expected iPhone 15 sales in China, helping drive overall quarterly revenue above analyst projections. Greater China revenue increased 12% year-over-year to $15.1 billion, reversing previous quarterly declines in the region. The iPhone 15 Pro models with titanium construction and improved cameras have resonated well with Chinese consumers. Apple also announced expanded services offerings in China and new retail store openings in tier-2 cities. The strong performance comes despite increased competition from local smartphone manufacturers.',
        link: 'https://example.com/apple-china-sales',
        author: 'Consumer Tech Reporter',
        categories: ['Technology', 'Consumer Electronics', 'China'],
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        isArchived: false,
        isProcessed: false
      }
    ];

    const result = await db.insert(rssArticles).values(sampleArticles).returning({ id: rssArticles.id });
    console.log(`✅ Successfully added ${result.length} sample articles to database`);
    console.log('📄 Article IDs:', result.map(r => r.id));
    console.log('🎯 Articles are ready for report generation');

  } catch (error) {
    console.error('❌ Error adding sample articles:', error);
    process.exit(1);
  }
}

addSampleArticles();