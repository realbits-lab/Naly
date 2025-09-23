import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve } from 'path';
import { generatedArticles } from '../src/lib/schema/articles';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}

const sql = postgres(databaseUrl);
const db = drizzle(sql);

// Test articles with varying quality and company information
const testArticles = [
  {
    title: "Apple Announces Record Q4 2024 Earnings: iPhone 16 Drives 15% Revenue Growth",
    summary: "Apple Inc. reported exceptional fourth-quarter results, with revenue jumping 15% year-over-year to $124.3 billion, driven by strong iPhone 16 sales and growing services revenue.",
    content: `# Apple Announces Record Q4 2024 Earnings

Apple Inc. (NASDAQ: AAPL) delivered outstanding fourth-quarter results that exceeded Wall Street expectations, with total revenue reaching $124.3 billion, a 15% increase from the previous year. The Cupertino-based tech giant attributed the strong performance primarily to robust iPhone 16 sales and continued growth in its services division.

## Key Financial Highlights

- **Revenue**: $124.3 billion (vs. $108.1 billion YoY)
- **Net Income**: $29.6 billion (vs. $25.2 billion YoY)
- **Earnings Per Share**: $1.89 (vs. $1.61 YoY)
- **Gross Margin**: 45.2% (vs. 44.3% YoY)

## Product Performance

### iPhone Division
The iPhone segment generated $67.2 billion in revenue, representing a 12% year-over-year increase. The iPhone 16 Pro models, featuring advanced AI capabilities and improved camera systems, saw particularly strong demand in China and emerging markets.

### Services Revenue
Apple's services division continued its impressive growth trajectory, reaching $23.1 billion in quarterly revenue, up 18% from the previous year. The company now boasts over 1 billion paid subscriptions across its various services.

## Market Analysis

The strong earnings report reinforces Apple's position as a market leader in premium consumer electronics. The company's focus on artificial intelligence integration and ecosystem expansion has resonated well with consumers, despite macroeconomic headwinds.

Tim Cook, Apple's CEO, stated: "This quarter's results demonstrate the enduring strength of our product ecosystem and the loyalty of our customer base. Our investments in AI and machine learning are beginning to show tangible results across our product line."

## Investment Implications

Analysts remain bullish on Apple's prospects, with several firms raising their price targets following the earnings announcement. The company's strong cash generation, with $112 billion in free cash flow over the past year, supports continued dividend growth and share buyback programs.

## Forward Guidance

For Q1 2025, Apple expects:
- Revenue between $128-132 billion
- Gross margins of 44.5-45.5%
- Operating expenses of $14.3-14.5 billion

The company also announced a 5% increase in its quarterly dividend to $0.25 per share and authorized an additional $90 billion for share repurchases.`,
    keyPoints: JSON.stringify([
      "Record Q4 revenue of $124.3 billion, up 15% YoY",
      "iPhone 16 drives strong growth with $67.2B in sales",
      "Services revenue reaches $23.1B, up 18% YoY",
      "EPS of $1.89 beats analyst expectations",
      "Q1 2025 guidance suggests continued momentum"
    ]),
    entities: JSON.stringify(["Apple Inc.", "NASDAQ", "Tim Cook", "iPhone", "China"]),
    keywords: JSON.stringify(["earnings", "revenue", "iphone", "services", "growth", "technology", "ai", "profit"]),
    sentiment: "positive",
    marketAnalysis: "Apple's strong Q4 performance demonstrates resilience in premium consumer electronics despite economic uncertainty. The company's ecosystem strategy and AI integration are key differentiators driving customer loyalty and pricing power.",
    investmentImplications: "Strong buy recommendation with price target raised to $245. Apple's consistent cash generation, growing services revenue, and successful product launches support long-term value creation.",
    sourcePublisher: "Financial Times",
    sourceCategory: "technology",
    wordCount: 487,
    readingTime: 3,
    aiModel: "gpt-4o",
    generationMethod: "ai"
  },
  {
    title: "Microsoft and OpenAI Expand Partnership: $100 Billion AI Infrastructure Investment Announced",
    summary: "Microsoft Corporation and OpenAI unveiled plans for a massive $100 billion investment in AI infrastructure over the next four years, aiming to accelerate AGI development and enterprise AI adoption.",
    content: `# Microsoft and OpenAI Expand Strategic Partnership

Microsoft Corporation (NASDAQ: MSFT) and OpenAI announced an unprecedented $100 billion joint investment in artificial intelligence infrastructure, marking the largest corporate AI investment in history. The partnership aims to build state-of-the-art data centers and develop next-generation AI models that could revolutionize enterprise computing.

## Partnership Details

The investment will be deployed across multiple initiatives:
- **$60 billion** for new AI-optimized data centers across North America and Europe
- **$25 billion** for advanced GPU procurement and custom chip development
- **$15 billion** for AI research and talent acquisition

## Strategic Implications

This expanded partnership solidifies Microsoft's position in the AI arms race against competitors like Google, Amazon, and emerging players. The investment will support the development of GPT-5 and subsequent models, with exclusive access for Microsoft Azure customers.

Satya Nadella, Microsoft CEO, commented: "This investment represents our commitment to democratizing AI and ensuring that the benefits of artificial general intelligence are broadly distributed."

## Market Impact

The announcement sent Microsoft shares up 7.3% in after-hours trading, adding approximately $180 billion to the company's market capitalization. Analysts project that AI-related revenue could contribute $50 billion annually to Microsoft by 2027.`,
    keyPoints: JSON.stringify([
      "$100 billion joint AI infrastructure investment",
      "Largest corporate AI investment in history",
      "Focus on AGI development and enterprise adoption",
      "Microsoft stock jumps 7.3% on announcement"
    ]),
    entities: JSON.stringify(["Microsoft Corporation", "OpenAI", "Satya Nadella", "Google", "Amazon", "Azure"]),
    keywords: JSON.stringify(["ai", "investment", "infrastructure", "partnership", "technology"]),
    sentiment: "positive",
    marketAnalysis: "This massive investment signals Microsoft's determination to lead the AI revolution and capture enterprise market share.",
    investmentImplications: "Strong buy signal for MSFT with significant upside potential from AI monetization.",
    sourcePublisher: "Reuters",
    sourceCategory: "technology",
    wordCount: 298,
    readingTime: 2,
    aiModel: "gemini-2.5-flash",
    generationMethod: "ai"
  },
  {
    title: "Tesla Achieves Record Q4 Deliveries: Full Self-Driving Revenue Surge Boosts Margins",
    summary: "Tesla Inc. delivered 515,000 vehicles in Q4 2024, exceeding analyst expectations, while Full Self-Driving subscription revenue jumped 200% year-over-year.",
    content: `# Tesla Shatters Delivery Records in Q4 2024

Tesla Inc. (NASDAQ: TSLA) reported record-breaking fourth-quarter deliveries of 515,000 vehicles, surpassing Wall Street estimates of 490,000 units. The electric vehicle manufacturer's strong performance was bolstered by increased production capacity at its Berlin and Texas gigafactories.

## Delivery Breakdown
- Model 3/Y: 487,000 units
- Model S/X: 28,000 units
- Cybertruck: 12,000 units (first full quarter of deliveries)

## Full Self-Driving Success

The company's Full Self-Driving (FSD) software has become a significant revenue driver, with subscription and one-time purchase revenue reaching $2.1 billion in Q4, a 200% increase from the previous year. Over 2 million vehicles now have FSD capability activated.

## Production Milestones

Tesla's global production capacity has reached 2.5 million units annually, with plans to expand to 3.5 million by end of 2025. The company's manufacturing efficiency improvements have reduced production costs by 18% year-over-year.

Elon Musk stated: "We're seeing unprecedented demand for our vehicles and FSD technology. The Cybertruck production ramp has exceeded our expectations."`,
    keyPoints: JSON.stringify([
      "Record 515,000 vehicles delivered in Q4 2024",
      "FSD revenue jumps 200% to $2.1 billion",
      "Cybertruck delivers 12,000 units in first full quarter",
      "Production costs down 18% YoY"
    ]),
    entities: JSON.stringify(["Tesla Inc.", "Elon Musk", "Cybertruck", "Berlin", "Texas"]),
    keywords: JSON.stringify(["tesla", "deliveries", "ev", "fsd", "automotive", "production"]),
    sentiment: "positive",
    marketAnalysis: "Tesla's execution on deliveries and FSD monetization validates its premium valuation and growth trajectory.",
    investmentImplications: "Maintain buy rating with increased price target of $420 based on FSD revenue potential.",
    sourcePublisher: "CNBC",
    sourceCategory: "automotive",
    wordCount: 245,
    readingTime: 2,
    aiModel: "gpt-4o",
    generationMethod: "ai"
  },
  {
    title: "NVIDIA Reports Blowout Earnings: Data Center Revenue Hits $18.4 Billion",
    summary: "NVIDIA Corporation crushed Q3 expectations with data center revenue of $18.4 billion, driven by insatiable demand for AI chips from cloud providers and enterprises.",
    content: `# NVIDIA Delivers Exceptional Q3 Results

NVIDIA Corporation (NASDAQ: NVDA) reported stellar third-quarter results that far exceeded analyst expectations, with total revenue reaching $24.1 billion, up 206% year-over-year. The semiconductor giant's data center business continues to dominate, driven by explosive demand for AI computing infrastructure.

## Financial Highlights
- **Total Revenue**: $24.1 billion (vs. $7.9 billion YoY)
- **Data Center Revenue**: $18.4 billion (up 279% YoY)
- **Net Income**: $9.2 billion (vs. $1.5 billion YoY)
- **Gross Margin**: 75.0% (vs. 56.9% YoY)

## H100 GPU Demand

The company's H100 GPU remains sold out through 2025, with major cloud providers including Amazon AWS, Microsoft Azure, and Google Cloud competing for allocation. NVIDIA announced the upcoming H200 GPU will begin shipping in Q2 2025 with 2x the performance of H100.

## AI Market Leadership

CEO Jensen Huang commented: "Generative AI has triggered a platform shift unprecedented in computing history. The entire data center infrastructure is being modernized for AI."

## Competitive Landscape

Despite competition from AMD's MI300 and custom chips from cloud providers, NVIDIA maintains over 90% market share in AI training workloads. The company's CUDA software ecosystem remains a significant competitive moat.`,
    keyPoints: JSON.stringify([
      "Q3 revenue of $24.1B, up 206% YoY",
      "Data center revenue reaches $18.4B",
      "H100 GPUs sold out through 2025",
      "75% gross margins demonstrate pricing power",
      "H200 GPU launching Q2 2025"
    ]),
    entities: JSON.stringify(["NVIDIA Corporation", "Jensen Huang", "Amazon AWS", "Microsoft Azure", "Google Cloud", "AMD"]),
    keywords: JSON.stringify(["nvidia", "ai", "gpu", "datacenter", "earnings", "semiconductor", "h100"]),
    sentiment: "positive",
    marketAnalysis: "NVIDIA's dominance in AI infrastructure positions it as the primary beneficiary of the generative AI revolution.",
    investmentImplications: "Overweight rating maintained despite high valuation. AI infrastructure spending cycle has years of growth ahead.",
    sourcePublisher: "Bloomberg",
    sourceCategory: "technology",
    wordCount: 312,
    readingTime: 2,
    aiModel: "gpt-4o",
    generationMethod: "ai"
  },
  {
    title: "Federal Reserve Signals Rate Cuts: Markets Rally on Dovish Pivot",
    summary: "The Federal Reserve indicated potential rate cuts in Q1 2025, citing cooling inflation and labor market moderation, sending equity markets to new highs.",
    content: `# Fed Signals Policy Shift Ahead

The Federal Reserve's latest FOMC meeting delivered a more dovish tone than expected, with Chairman Jerome Powell signaling that interest rate cuts could begin as early as March 2025. The shift in monetary policy stance sent equity markets surging and bond yields tumbling.

## Key Policy Updates
- Fed funds rate maintained at 5.25-5.50%
- Dot plot shows three rate cuts projected for 2025
- Inflation forecast revised down to 2.4% for year-end 2025
- QT program to slow from $95B to $60B monthly

## Market Reaction

The S&P 500 jumped 2.1% following the announcement, with rate-sensitive sectors leading gains:
- **Real Estate**: +4.2%
- **Technology**: +3.1%
- **Utilities**: +2.8%

The 10-year Treasury yield fell 18 basis points to 4.12%, while the dollar index dropped 1.3% against major currencies.

## Economic Outlook

Powell noted: "The committee sees the policy rate as likely at or near its peak for this tightening cycle. The economy has shown remarkable resilience, but we're seeing clear signs of disinflation taking hold."

## Inflation Progress

Core PCE inflation has declined to 2.8% annually, approaching the Fed's 2% target. Labor market cooling is evident with job openings falling to 8.7 million and wage growth moderating to 4.1% annually.`,
    keyPoints: JSON.stringify([
      "Fed signals rate cuts possible in Q1 2025",
      "Three cuts projected for 2025",
      "S&P 500 rallies 2.1% on dovish pivot",
      "Core inflation falls to 2.8%",
      "10-year yield drops to 4.12%"
    ]),
    entities: JSON.stringify(["Federal Reserve", "Jerome Powell", "FOMC", "S&P 500", "Treasury"]),
    keywords: JSON.stringify(["fed", "rates", "inflation", "monetary", "policy", "markets", "economy"]),
    sentiment: "positive",
    marketAnalysis: "The Fed's dovish pivot removes a major headwind for equities and supports risk asset valuations going forward.",
    investmentImplications: "Shift to overweight equities, particularly growth and rate-sensitive sectors. Consider extending duration in fixed income.",
    sourcePublisher: "Wall Street Journal",
    sourceCategory: "economy",
    wordCount: 289,
    readingTime: 2,
    aiModel: "gemini-2.5-flash",
    generationMethod: "ai"
  }
];

async function insertTestArticles() {
  console.log('🚀 Inserting high-quality test articles...');
  console.log('⏰ Timestamp:', new Date().toISOString());

  try {
    let successCount = 0;

    for (const article of testArticles) {
      console.log(`\n📝 Inserting article: ${article.title.substring(0, 60)}...`);

      const result = await db.insert(generatedArticles).values({
        id: uuidv4(),
        userId: 'a8190034-e70a-463c-abef-82b71bf057c7', // Test manager user
        title: article.title,
        content: article.content,
        summary: article.summary,
        keyPoints: article.keyPoints as any,
        marketAnalysis: article.marketAnalysis,
        investmentImplications: article.investmentImplications,
        sourceTitle: article.title,
        sourceContent: article.content.substring(0, 500),
        sourceUrl: `https://example.com/article-${Date.now()}`,
        sourcePublisher: article.sourcePublisher,
        sourceCategory: article.sourceCategory,
        sentiment: article.sentiment,
        keywords: article.keywords as any,
        entities: article.entities as any,
        marketImpact: article.marketAnalysis,
        wordCount: article.wordCount,
        readingTime: article.readingTime,
        aiModel: article.aiModel,
        generationMethod: article.generationMethod,
        sourceLanguage: 'en',
        hasTranslations: 'false',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      if (result.length > 0) {
        successCount++;
        console.log(`✅ Article inserted with ID: ${result[0].id}`);

        // Log quality indicators
        console.log('📊 Quality Check:');
        console.log(`   - Has company in title: ✅`);
        console.log(`   - Has summary: ✅`);
        console.log(`   - Has key points: ✅`);
        console.log(`   - Has market analysis: ✅`);
        console.log(`   - Has entities: ✅ (${JSON.parse(article.entities as string).length} entities)`);
        console.log(`   - Word count: ${article.wordCount}`);
      }
    }

    console.log(`\n✨ Successfully inserted ${successCount}/${testArticles.length} articles`);

    // Verify insertion
    const allArticles = await db.select().from(generatedArticles);
    console.log(`\n📊 Total articles in database: ${allArticles.length}`);

    // Show article titles
    console.log('\n📰 Articles in database:');
    allArticles.forEach((article, index) => {
      const hasCompany = /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/.test(article.title) ||
                         article.title.includes(':') ||
                         /\b(?:Inc|Corp|Ltd|LLC)\b/i.test(article.title);
      console.log(`  ${index + 1}. ${article.title.substring(0, 70)}...`);
      console.log(`     - Company reference: ${hasCompany ? '✅' : '❌'}`);
      console.log(`     - Quality score: ${article.keyPoints ? '⭐⭐⭐⭐⭐' : '⭐'}`);
    });

    return { success: true, articlesInserted: successCount };

  } catch (error) {
    console.error('❌ Error inserting test articles:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the insertion
insertTestArticles()
  .then(result => {
    console.log('\n🎉 Test articles insertion completed:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });