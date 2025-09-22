#!/usr/bin/env node

// Add sample articles with precise financial numbers for testing number preservation
const fs = require('fs');
const path = require('path');

// Load auth data
const authFile = path.join(__dirname, '..', '.auth', 'user.json');
const authData = JSON.parse(fs.readFileSync(authFile, 'utf8'));
const apiKey = authData.credentials.apiKey;

console.log('📊 Adding articles with precise financial numbers for testing...');

const sampleArticles = [
    {
        title: 'Tesla Reports Q3 2024 Earnings: Revenue of $25,182,000,000 and Deliveries of 462,890 Vehicles',
        description: 'Tesla Inc. announced third-quarter 2024 financial results with precise revenue and delivery figures.',
        content: 'Tesla Inc. (NASDAQ: TSLA) reported third-quarter 2024 revenue of exactly $25,182,000,000, representing a 7.85% increase from the previous quarter. Vehicle deliveries reached precisely 462,890 units, beating analyst estimates of 456,000 by 6,890 vehicles.',
        fullContent: `Tesla Inc. (NASDAQ: TSLA) reported comprehensive third-quarter 2024 financial results with the following exact figures:

FINANCIAL PERFORMANCE:
- Total Revenue: $25,182,000,000 (increase of 7.85% quarter-over-quarter)
- Automotive Revenue: $21,456,000,000
- Energy Generation Revenue: $2,376,000,000
- Services Revenue: $1,350,000,000
- Net Income: $1,853,000,000
- EBITDA: $3,764,000,000
- Free Cash Flow: $7,533,000,000
- Cash and Cash Equivalents: $15,218,000,000
- Total Assets: $106,618,000,000

OPERATIONAL METRICS:
- Vehicle Deliveries: 462,890 units (vs. estimate of 456,000)
- Vehicle Production: 469,796 units
- Model 3/Y Deliveries: 439,975 units
- Model S/X Deliveries: 22,915 units
- Energy Storage Deployed: 6.9 GWh
- Solar Deployed: 1,048 MW

STOCK PERFORMANCE:
- Stock Price at Close: $248.98 (up $13.45 or +5.71%)
- Market Cap: $793,847,000,000
- 52-Week High: $299.29
- 52-Week Low: $138.80
- Price-to-Earnings Ratio: 69.34

GUIDANCE AND PROJECTIONS:
- Q4 2024 Delivery Estimate: 515,000-525,000 vehicles
- Full Year 2024 Revenue Guidance: $98.5-$101.2 billion
- Capital Expenditure Guidance: $8.5-$10.0 billion

CEO Elon Musk stated that the company achieved a gross automotive margin of 16.9%, up from 16.3% in Q2 2024.`,
        categories: ['Earnings', 'Electric Vehicles', 'Technology'],
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        link: 'https://example.com/tesla-q3-2024-earnings',
        author: 'Financial Markets Reporter',
        isArchived: false,
        isProcessed: false
    },
    {
        title: 'Microsoft Azure Revenue Surges to $28,543,000,000 in Q1 FY2025, Growing 31.2% Year-Over-Year',
        description: 'Microsoft Corporation reports strong cloud growth with precise Azure revenue figures and detailed segment performance.',
        content: 'Microsoft Corporation (NASDAQ: MSFT) reported Azure and other cloud services revenue of exactly $28,543,000,000 for the first quarter of fiscal 2025, representing growth of 31.2% compared to the same period last year.',
        fullContent: `Microsoft Corporation (NASDAQ: MSFT) announced detailed first quarter fiscal 2025 results with precise financial metrics:

SEGMENT REVENUE BREAKDOWN:
- Total Revenue: $65,585,000,000 (up 13.1% year-over-year)
- Azure and Other Cloud Services: $28,543,000,000 (up 31.2% YoY)
- Microsoft 365 Commercial: $18,456,000,000 (up 15.2% YoY)
- Windows Commercial: $2,943,000,000 (up 3.8% YoY)
- Office Consumer: $4,826,000,000 (up 5.4% YoY)
- LinkedIn Revenue: $4,244,000,000 (up 9.7% YoY)
- Gaming Revenue: $5,621,000,000 (up 16.2% YoY)
- Search Revenue: $3,948,000,000 (up 18.4% YoY)

PROFITABILITY METRICS:
- Gross Margin: $45,354,000,000 (69.2% margin)
- Operating Income: $30,552,000,000 (46.6% margin)
- Net Income: $24,667,000,000
- Earnings Per Share: $3.30 (diluted)
- Free Cash Flow: $23,174,000,000

BALANCE SHEET HIGHLIGHTS:
- Cash and Short-term Investments: $75,528,000,000
- Total Assets: $512,715,000,000
- Total Shareholders' Equity: $238,424,000,000
- Return on Equity: 41.7%

STOCK PERFORMANCE:
- Closing Price: $415.26 (up $8.74 or +2.15%)
- Market Capitalization: $3,087,000,000,000
- Price-to-Earnings Ratio: 31.4
- Dividend Yield: 0.68%

OPERATIONAL METRICS:
- Microsoft 365 Commercial Seats: 448,000,000 (up 8.1% YoY)
- Teams Monthly Active Users: 320,000,000
- GitHub Paying Users: 73,000,000
- Azure Active Directory Users: 1,400,000,000

CEO Satya Nadella highlighted that Copilot for Microsoft 365 now has 18,600,000 monthly active users, generating average revenue per user of $30.17 monthly.`,
        categories: ['Technology', 'Cloud Computing', 'Earnings'],
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        link: 'https://example.com/microsoft-q1-fy2025-earnings',
        author: 'Technology Analyst',
        isArchived: false,
        isProcessed: false
    },
    {
        title: 'Apple Reports iPhone Revenue of $43,805,000,000 in Q4 2024, Services Hit $24,213,000,000',
        description: 'Apple Inc. delivers strong quarterly results with detailed revenue breakdown across all product categories.',
        content: 'Apple Inc. (NASDAQ: AAPL) reported iPhone revenue of exactly $43,805,000,000 for Q4 2024, while Services revenue reached $24,213,000,000, representing growth of 6.1% year-over-year.',
        fullContent: `Apple Inc. (NASDAQ: AAPL) reported comprehensive fourth quarter 2024 financial results:

PRODUCT REVENUE BREAKDOWN:
- iPhone Revenue: $43,805,000,000 (down 0.5% YoY)
- Mac Revenue: $7,744,000,000 (up 2.4% YoY)
- iPad Revenue: $6,955,000,000 (down 7.8% YoY)
- Wearables, Home & Accessories: $9,026,000,000 (down 3.2% YoY)
- Services Revenue: $24,213,000,000 (up 6.1% YoY)
- Total Net Sales: $91,743,000,000

GEOGRAPHIC REVENUE:
- Americas: $41,656,000,000 (up 2.1% YoY)
- Europe: $22,463,000,000 (down 0.8% YoY)
- Greater China: $15,084,000,000 (down 2.4% YoY)
- Japan: $5,934,000,000 (up 8.7% YoY)
- Rest of Asia Pacific: $6,606,000,000 (up 4.3% YoY)

PROFITABILITY METRICS:
- Gross Profit: $40,977,000,000 (44.7% margin)
- Operating Income: $25,306,000,000 (27.6% margin)
- Net Income: $20,721,000,000
- Diluted Earnings Per Share: $1.33
- Return on Equity: 160.6%

IPHONE SPECIFIC METRICS:
- iPhone 15 Pro Units Sold: 54,700,000
- iPhone 15 Units Sold: 41,200,000
- iPhone 14 Units Sold: 12,800,000
- Average Selling Price: $896.43
- Install Base: 1,460,000,000 active devices

SERVICES BREAKDOWN:
- App Store Revenue: $8,142,000,000
- Apple Music: $3,967,000,000
- iCloud: $4,128,000,000
- Apple Care: $2,476,000,000
- Apple Pay Transaction Volume: $12,843,000,000
- Advertising Revenue: $1,244,000,000

STOCK AND VALUATION:
- Stock Price: $189.43 (up $2.87 or +1.54%)
- Market Cap: $2,932,000,000,000
- Price-to-Earnings Ratio: 29.1
- Free Cash Flow: $15,346,000,000
- Cash and Marketable Securities: $162,104,000,000

CEO Tim Cook noted that the company returned $24,374,000,000 to shareholders through dividends of $3,769,000,000 and share repurchases of $20,605,000,000.`,
        categories: ['Technology', 'Consumer Electronics', 'Earnings'],
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        link: 'https://example.com/apple-q4-2024-earnings',
        author: 'Consumer Technology Reporter',
        isArchived: false,
        isProcessed: false
    }
];

async function addArticleViaAPI(article) {
    try {
        // First check if there's an API endpoint to add articles
        // If not, we'll save this data to a file that can be manually imported
        console.log(`📄 Processing article: "${article.title.substring(0, 50)}..."`);
        console.log(`💰 Key figures found: Revenue, stock prices, and precise metrics`);

        // For now, save to a JSON file that can be manually imported
        return article;
    } catch (error) {
        console.error(`❌ Error processing article: ${error.message}`);
        return null;
    }
}

async function main() {
    console.log('🧮 Testing number preservation with these precise financial figures:');
    console.log('');

    const processedArticles = [];

    for (const article of sampleArticles) {
        const processed = await addArticleViaAPI(article);
        if (processed) {
            processedArticles.push(processed);

            // Extract key numbers from content for verification
            const numbers = article.fullContent.match(/\$[\d,]+,\d{3},\d{3}/g) || [];
            const percentages = article.fullContent.match(/\d+\.\d+%/g) || [];
            const prices = article.fullContent.match(/\$\d+\.\d{2}/g) || [];

            console.log(`   💵 Revenue/Large figures: ${numbers.slice(0, 3).join(', ')}`);
            console.log(`   📊 Percentages: ${percentages.slice(0, 3).join(', ')}`);
            console.log(`   📈 Stock prices: ${prices.slice(0, 3).join(', ')}`);
            console.log('');
        }
    }

    // Save articles to a file for database import
    const articlesFile = path.join(__dirname, '..', 'test-articles.json');
    fs.writeFileSync(articlesFile, JSON.stringify(processedArticles, null, 2));

    console.log(`✅ Prepared ${processedArticles.length} articles with precise financial data`);
    console.log(`📄 Articles saved to: ${articlesFile}`);
    console.log('');
    console.log('🎯 Key Testing Numbers to Verify:');
    console.log('   Tesla Revenue: $25,182,000,000 (exact)');
    console.log('   Tesla Stock: $248.98 (exact with cents)');
    console.log('   Tesla Growth: 7.85% (exact percentage)');
    console.log('   Microsoft Azure: $28,543,000,000 (exact)');
    console.log('   Microsoft Growth: 31.2% (exact percentage)');
    console.log('   Apple iPhone Revenue: $43,805,000,000 (exact)');
    console.log('   Apple Stock: $189.43 (exact with cents)');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Import these articles to database');
    console.log('2. Generate report using modified API');
    console.log('3. Verify ALL numbers are preserved exactly');
}

main().catch(console.error);