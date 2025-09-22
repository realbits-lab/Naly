#!/usr/bin/env node

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

// Construct the schema manually since direct import isn't working
const { sql: drizzleSql } = require('drizzle-orm');

const insertArticlesSQL = `
INSERT INTO rss_articles (source_id, title, content, full_content, link, published_at, categories, is_archived, guid)
VALUES
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'NVIDIA Reports Record Q3 2024 Revenue of $35.08 Billion',
  'NVIDIA Corporation (NASDAQ: NVDA) today reported record revenue for the third quarter ended October 29, 2024, of $35.08 billion, up 17% from the previous quarter and up 94% from a year ago. Data Center revenue was $30.77 billion, up 17% from the previous quarter and up 112% from a year ago. Gaming revenue was $3.28 billion, up 14% from the previous quarter and up 15% from a year ago. Professional Visualization revenue was $486 million, up 7% from the previous quarter and up 17% from a year ago. Automotive revenue was $449 million, up 30% from the previous quarter and up 72% from a year ago. GAAP earnings per diluted share for the quarter were $0.78, up 16% from the previous quarter and up 103% from a year ago. Non-GAAP earnings per diluted share were $0.81, up 19% from the previous quarter and up 103% from a year ago. The company paid dividends of $0.01 per share during the quarter.',
  'Full quarterly financial data: Q3 2024: Revenue $35,082,000,000, Net Income $19,309,000,000, EPS $0.78. Q2 2024: Revenue $30,040,000,000, Net Income $16,599,000,000, EPS $0.67. Q1 2024: Revenue $26,044,000,000, Net Income $14,881,000,000, EPS $0.60. Q4 2023: Revenue $22,103,000,000, Net Income $12,285,000,000, EPS $0.49. Stock price history (daily closes): 2024-10-29: $145.89, 2024-10-28: $143.24, 2024-10-27: $142.11, 2024-10-26: $141.98, 2024-10-25: $139.56, 2024-10-24: $138.23, 2024-10-23: $137.89, 2024-10-22: $136.45, 2024-10-21: $135.12, 2024-10-20: $134.78.',
  'https://example.com/nvidia-q3-2024',
  NOW(),
  '["earnings", "technology", "semiconductors", "ai"]'::jsonb,
  false,
  'nvidia-q3-2024'
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Apple Achieves $89.5 Billion Revenue in Q4 2024',
  'Apple Inc. (NASDAQ: AAPL) today announced financial results for its fiscal 2024 fourth quarter ended September 28, 2024. The Company posted quarterly revenue of $89.498 billion, up 6 percent year over year, and quarterly earnings per diluted share of $1.64, up 12 percent year over year. iPhone revenue: $43.814 billion. Mac revenue: $7.744 billion. iPad revenue: $7.019 billion. Wearables revenue: $9.040 billion. Services revenue: $21.881 billion.',
  'Complete financial metrics: Total Revenue $89,498,000,000. Gross Profit $41,009,080,000 (45.8% margin). Operating Income $27,644,380,000. Net Income $21,448,440,000. Operating Cash Flow $29,833,320,000. Free Cash Flow $25,058,580,000. Share Buyback $25,000,000,000. Dividend Paid $3,750,000,000 ($0.24 per share). Stock Performance (10-day): Oct 29: $234.30, Oct 28: $233.52, Oct 27: $232.98, Oct 26: $231.76, Oct 25: $230.85, Oct 24: $229.93, Oct 23: $228.67, Oct 22: $227.34, Oct 21: $226.89, Oct 20: $225.45. Regional Revenue: Americas $41,168,080,000, Europe $22,374,500,000, Greater China $15,033,664,000, Japan $5,547,876,000, Rest of Asia Pacific $5,373,880,000.',
  'https://example.com/apple-q4-2024',
  NOW(),
  '["earnings", "technology", "consumer-electronics"]'::jsonb,
  false,
  'apple-q4-2024'
),
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Tesla Delivers 462,890 Vehicles in Q3 2024',
  'Tesla, Inc. (NASDAQ: TSLA) achieved record vehicle deliveries of 462,890 units in Q3 2024, representing a 6.4% increase quarter-over-quarter and 4.3% year-over-year growth. Model 3/Y deliveries: 439,975 units. Model S/X deliveries: 22,915 units. Total production: 469,796 vehicles.',
  'Comprehensive Q3 2024 Data: Total Deliveries 462,890 vehicles. Model 3/Y: 439,975 units. Model S/X: 22,915 units. Total Production: 469,796 vehicles. Energy Storage Deployed: 6,868 MWh. Solar Deployed: 100 MW. Automotive Revenue: $19,625,000,000. Energy Revenue: $2,376,000,000. Services Revenue: $2,790,000,000. Total Revenue: $25,182,000,000. Automotive Gross Margin: 16.4%. GAAP Net Income: $2,167,000,000. Free Cash Flow: $2,742,000,000. Cash and Investments: $33,648,000,000. Stock Price (15-day): Oct 29: $269.19, Oct 28: $274.52, Oct 27: $272.88, Oct 26: $269.95, Oct 25: $265.23, Oct 24: $262.51, Oct 23: $260.02, Oct 22: $256.89, Oct 21: $254.79, Oct 20: $252.12, Oct 19: $249.83, Oct 18: $247.21, Oct 17: $245.67, Oct 16: $243.89, Oct 15: $241.45.',
  'https://example.com/tesla-q3-2024',
  NOW(),
  '["automotive", "electric-vehicles", "deliveries", "earnings"]'::jsonb,
  false,
  'tesla-q3-2024'
)
RETURNING id, title;
`;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL not found');
  }

  const sql = postgres(connectionString);

  try {
    const result = await sql.unsafe(insertArticlesSQL);
    console.log(`✅ Inserted ${result.length} test articles with complete financial data`);
    result.forEach(row => {
      console.log(`   - ${row.title}`);
    });
  } catch (error) {
    console.error('Error inserting articles:', error);
  } finally {
    await sql.end();
  }
}

main().catch(console.error);