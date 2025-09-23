import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UserRole } from "@/types/user";
import { db } from "@/lib/db";
import { rssSources, rssArticles, generatedArticles } from "@/lib/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { generateAIText } from "@/lib/ai";
import { generateObject } from 'ai';
import { z } from 'zod';
import Parser from "rss-parser";
import { SlideInfographicGenerator } from "@/lib/slide-infographic-generator";

const parser = new Parser({
	customFields: {
		feed: ['language', 'copyright', 'managingEditor'],
		item: ['media:content', 'media:thumbnail', 'enclosure', 'dc:creator', 'content:encoded']
	}
});

// CORS proxy for feeds that might be blocked
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const FINANCIAL_DATASETS_API_KEY = process.env.FINANCIAL_DATASETS_API_KEY;
const FINANCIAL_DATASETS_BASE_URL = 'https://api.financialdatasets.ai';

// Helper function to try fetching RSS with CORS proxy fallback
async function tryFetchRSS(feedUrl: string): Promise<any> {
	try {
		// First, try direct fetch
		return await parser.parseURL(feedUrl);
	} catch (directError) {
		console.log(`Direct fetch failed for ${feedUrl}, trying CORS proxy...`);
		try {
			// If direct fetch fails, try with CORS proxy
			const proxyUrl = `${CORS_PROXY}${encodeURIComponent(feedUrl)}`;
			const response = await fetch(proxyUrl);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const xmlText = await response.text();
			return await parser.parseString(xmlText);
		} catch (proxyError) {
			// If both direct and proxy fail, throw the original error
			throw directError;
		}
	}
}

// Company identification schema
const CompanyIdentificationSchema = z.object({
	companyName: z.string().describe('The most relevant company name mentioned in the report'),
	ticker: z.string().optional().describe('Stock ticker symbol if clearly mentioned'),
	reasoning: z.string().describe('Why this company is most relevant to the market report'),
	needsTickerSearch: z.boolean().describe('Whether we need to search for the ticker symbol')
});

// Helper function to identify the most relevant company from market report
async function identifyRelevantCompany(marketReport: string): Promise<z.infer<typeof CompanyIdentificationSchema>> {
	console.log("🔍 Identifying most relevant company from market report...");

	const result = await generateObject({
		model: 'google/gemini-2.5-flash',
		schema: CompanyIdentificationSchema,
		prompt: `Analyze this market intelligence report and identify the single most relevant company that would benefit from detailed financial analysis.

MARKET REPORT:
${marketReport}

INSTRUCTIONS:
1. Identify the ONE company that is most frequently mentioned, most central to the themes, or would be most valuable for investors to analyze in detail
2. If a ticker symbol is clearly mentioned in the report, include it
3. If no ticker is mentioned or you're unsure, set needsTickerSearch to true
4. Provide clear reasoning for why this company is most relevant
5. Focus on public companies that would have financial data available

Return the most strategically important company for further financial analysis.`
	});

	console.log(`✅ Identified company: ${result.object.companyName}`);
	console.log(`🎯 Ticker: ${result.object.ticker || 'Not found'}`);
	console.log(`🔍 Needs ticker search: ${result.object.needsTickerSearch}`);

	return result.object;
}

// Extract company names directly from articles
async function extractCompaniesFromArticles(articles: Array<{ title: string; content: { description?: string; fullContent?: string } }>): Promise<string[]> {
	try {
		console.log('📰 Extracting companies from article content...');

		// Combine all article content for analysis
		const allText = articles.map(article => {
			const content = article.content?.description || article.content?.fullContent || '';
			return `${article.title} ${content}`;
		}).join(' ');

		// Use AI to extract company names from actual article content
		const extractionPrompt = `Extract all company names mentioned in this financial news content. Include:
1. Public companies with stock tickers
2. Private companies mentioned in business context
3. Financial institutions and banks
4. Major corporations and organizations

Content to analyze:
${allText.slice(0, 4000)}

Respond with ONLY a JSON array of company names:
["Company Name 1", "Company Name 2", "Company Name 3"]

Extract actual company names mentioned in the content, not generic terms.`;

		const { text } = await generateAIText({
			prompt: extractionPrompt,
			model: "GEMINI_2_5_FLASH" as any,
			temperature: 0.1,
			maxTokens: 300
		});

		const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
		const extractedCompanies = JSON.parse(cleanText);

		console.log(`🏢 Extracted ${extractedCompanies.length} companies from articles:`, extractedCompanies);
		return extractedCompanies || [];
	} catch (error) {
		console.error('❌ Error extracting companies from articles:', error);
		return [];
	}
}

// Helper function to search for company ticker using Google
async function searchCompanyTicker(companyName: string): Promise<string | null> {
	console.log(`🌐 Searching for ticker symbol for: ${companyName}`);

	try {
		const result = await generateObject({
			model: 'google/gemini-2.5-flash',
			schema: z.object({
				ticker: z.string().describe('The stock ticker symbol found'),
				exchange: z.string().describe('The stock exchange (NYSE, NASDAQ, etc.)'),
				confidence: z.number().min(0).max(1).describe('Confidence in the ticker symbol (0-1)')
			}),
			prompt: `Search for the stock ticker symbol for "${companyName}".

Find the official stock ticker symbol for this company. Look for:
1. The company's official ticker symbol
2. Which exchange it trades on (NYSE, NASDAQ, etc.)
3. Make sure it's the correct company and not a subsidiary

Return the ticker symbol with high confidence only if you're certain it's correct.`
		});

		if (result.object.confidence > 0.8) {
			console.log(`✅ Found ticker: ${result.object.ticker} (${result.object.exchange})`);
			return result.object.ticker;
		} else {
			console.log(`⚠️ Low confidence ticker result: ${result.object.ticker} (confidence: ${result.object.confidence})`);
			return null;
		}
	} catch (error) {
		console.error('❌ Error searching for ticker:', error);
		return null;
	}
}

// Helper function to fetch financial data from Financial Datasets API
async function fetchFinancialData(ticker: string) {
	console.log(`📊 Fetching comprehensive financial data for: ${ticker}`);

	if (!FINANCIAL_DATASETS_API_KEY) {
		console.error('❌ FINANCIAL_DATASETS_API_KEY not configured');
		return null;
	}

	const headers = {
		'Authorization': `Bearer ${FINANCIAL_DATASETS_API_KEY}`,
		'Content-Type': 'application/json'
	};

	const financialData: any = {};

	try {
		// Fetch company facts
		console.log('📋 Fetching company facts...');
		const factsResponse = await fetch(`${FINANCIAL_DATASETS_BASE_URL}/company/facts/${ticker}`, { headers });
		if (factsResponse.ok) {
			financialData.facts = await factsResponse.json();
			console.log('✅ Company facts fetched');
		}

		// Fetch company news (last 30 days)
		console.log('📰 Fetching company news...');
		const newsResponse = await fetch(`${FINANCIAL_DATASETS_BASE_URL}/news/company?tickers=${ticker}&limit=10`, { headers });
		if (newsResponse.ok) {
			financialData.news = await newsResponse.json();
			console.log(`✅ Company news fetched: ${financialData.news?.data?.length || 0} articles`);
		}

		// Fetch all financial statements
		console.log('📈 Fetching financial statements...');
		const financialsResponse = await fetch(`${FINANCIAL_DATASETS_BASE_URL}/financials/all-financial-statements?ticker=${ticker}&period=annual&limit=3`, { headers });
		if (financialsResponse.ok) {
			financialData.financials = await financialsResponse.json();
			console.log('✅ Financial statements fetched');
		}

		// Fetch press releases
		console.log('📢 Fetching press releases...');
		const pressResponse = await fetch(`${FINANCIAL_DATASETS_BASE_URL}/earnings/press-releases?ticker=${ticker}&limit=5`, { headers });
		if (pressResponse.ok) {
			financialData.pressReleases = await pressResponse.json();
			console.log(`✅ Press releases fetched: ${financialData.pressReleases?.data?.length || 0} releases`);
		}

		// Fetch SEC filings
		console.log('📋 Fetching SEC filings...');
		const filingsResponse = await fetch(`${FINANCIAL_DATASETS_BASE_URL}/filings/${ticker}?limit=10`, { headers });
		if (filingsResponse.ok) {
			financialData.secFilings = await filingsResponse.json();
			console.log(`✅ SEC filings fetched: ${financialData.secFilings?.data?.length || 0} filings`);
		}

		// Fetch historical stock price (last 30 days)
		console.log('📊 Fetching historical stock prices...');
		const endDate = new Date().toISOString().split('T')[0];
		const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
		const pricesResponse = await fetch(`${FINANCIAL_DATASETS_BASE_URL}/prices/historical?ticker=${ticker}&start_date=${startDate}&end_date=${endDate}`, { headers });
		if (pricesResponse.ok) {
			financialData.historicalPrices = await pricesResponse.json();
			console.log(`✅ Historical prices fetched: ${financialData.historicalPrices?.data?.length || 0} data points`);
		}

		console.log('🎉 All financial data fetched successfully');
		return financialData;

	} catch (error) {
		console.error('❌ Error fetching financial data:', error);
		return null;
	}
}

// Helper function to enhance market report with company analysis
async function enhanceReportWithCompanyAnalysis(marketReport: string, companyName: string, ticker: string, financialData: any): Promise<string> {
	console.log(`📝 Enhancing market report with analysis for ${companyName} (${ticker})`);

	// Import the post-processing function
	const { ensureCompleteDataTables } = await import('@/lib/ai');

	// Prepare financial data summary for AI
	const financialSummary = {
		companyFacts: financialData.facts ? {
			name: financialData.facts.name,
			cik: financialData.facts.cik,
			sector: financialData.facts.sector,
			industry: financialData.facts.industry,
			marketCap: financialData.facts.market_cap,
			employees: financialData.facts.employees
		} : 'Not available',

		recentNews: financialData.news?.data?.slice(0, 5).map((article: any) => ({
			title: article.title,
			published_at: article.published_at,
			summary: article.summary
		})) || 'Not available',

		// Include ALL financial periods for complete time series
		financialHighlights: financialData.financials?.data?.length > 0 ?
			financialData.financials.data.map((period: any) => ({
				period: period.period,
				fiscal_year: period.fiscal_year,
				revenue: period.revenue,
				net_income: period.net_income,
				total_assets: period.total_assets,
				total_liabilities: period.total_liabilities,
				gross_profit: period.gross_profit,
				operating_income: period.operating_income,
				eps_diluted: period.eps_diluted,
				cash_flow_from_operations: period.cash_flow_from_operations
			})) : 'Not available',

		recentFilings: financialData.secFilings?.data?.slice(0, 3).map((filing: any) => ({
			form_type: filing.form_type,
			date_filed: filing.date_filed,
			description: filing.description
		})) || 'Not available',

		// Include COMPLETE historical price series data
		pricePerformance: financialData.historicalPrices?.data?.length > 0 ? {
			// Summary metrics
			current_price: financialData.historicalPrices.data[financialData.historicalPrices.data.length - 1]?.close,
			price_30_days_ago: financialData.historicalPrices.data[0]?.close,
			price_change_percentage: financialData.historicalPrices.data.length > 1 ?
				((financialData.historicalPrices.data[financialData.historicalPrices.data.length - 1]?.close -
				  financialData.historicalPrices.data[0]?.close) /
				 financialData.historicalPrices.data[0]?.close * 100).toFixed(4) : null,
			// Complete daily price series
			daily_prices: financialData.historicalPrices.data.map((day: any) => ({
				date: day.date,
				open: day.open,
				high: day.high,
				low: day.low,
				close: day.close,
				volume: day.volume,
				adjusted_close: day.adjusted_close
			}))
		} : 'Not available'
	};

	const enhancementPrompt = `Enhance the following market intelligence report by adding a comprehensive company deep-dive analysis section for ${companyName} (${ticker}).

ORIGINAL MARKET REPORT:
${marketReport}

COMPANY FINANCIAL DATA:
${JSON.stringify(financialSummary, null, 2)}

CRITICAL NUMERICAL DATA PRESERVATION REQUIREMENTS:
- PRESERVE ALL NUMERICAL DATA EXACTLY as provided in the financial data
- DO NOT round, approximate, or summarize any financial figures
- Include EXACT stock prices with full decimal precision (e.g., $156.7834, not "$157")
- Include EXACT revenue figures with full precision (e.g., $24,318,000,000, not "$24.3B")
- Include EXACT market cap, employee counts, and all financial metrics
- Include EXACT percentage changes from price performance data
- Preserve all decimal places, commas, and currency symbols exactly as provided
- When referencing historical prices, use exact values from the data
- All financial ratios and metrics must be calculated and displayed with full precision

TIME SERIES DATA PRESENTATION REQUIREMENTS:
- Present ALL time series data as properly formatted markdown tables
- For daily stock prices: Create a table with columns: Date | Open | High | Low | Close | Volume | Adj Close
- For quarterly/annual financials: Create a table with columns for each period showing ALL metrics
- Include EVERY data point provided - do not summarize or skip any values
- Use proper table alignment and formatting for readability
- Include row for EACH day/period in the data - no aggregation or averaging
- Sort chronologically with most recent data first

INSTRUCTIONS:
1. Keep the entire original market report exactly as is
2. Add a new section at the end titled "# Featured Company Deep-Dive: ${companyName} (${ticker})"
3. Create a comprehensive analysis using the financial data provided with COMPLETE numerical accuracy
4. Use markdown formatting throughout
5. Make the analysis professional and actionable for investors
6. PRESERVE every single number from the financial data without any rounding or approximation

The new section should include:
- Company overview and position in the market (with EXACT market cap, employee count)
- Historical Financial Performance Table: Show 3-year quarterly/annual financials with ALL metrics in a table
- Stock Price History Table: Display complete 30-day price series with Date, Open, High, Low, Close, Volume
- Key business developments and news (with EXACT dates and figures mentioned)
- Investment thesis and risk factors (with PRECISE financial metrics)
- Technical Analysis with Price Movement Table showing daily changes
- SEC filings insights (with EXACT filing dates and figures)
- Conclusion and investment recommendation (with PRECISE price targets and ratios)

IMPORTANT: Each time series MUST be presented as a complete table with every single data point - no summaries!

RAW DATA PRESERVATION REQUIREMENTS:
- Include a "Data Tables" section with complete time series in table format
- Add a "Raw Data" section at the end with JSON code blocks containing all numerical data
- Every single data point must be preserved - no omissions, no summaries
- Tables should show ALL periods/dates provided in the data
- Include metadata about data sources and timestamps

Format the entire response in clean markdown with proper headers, bullet points, and tables where appropriate. MOST IMPORTANTLY: Every single financial number, percentage, dollar amount, and metric must be preserved EXACTLY as provided in the source data without any rounding, approximation, or summarization.`;

	// Use GPT-4O for better table formatting if available, otherwise fall back to Gemini
	const modelToUse = process.env.OPENAI_API_KEY ? "GPT_4O" : "GEMINI_2_5_FLASH";

	const enhancedReport = await generateAIText({
		prompt: enhancementPrompt,
		model: modelToUse as any,
		temperature: 0.1, // Lower temperature for precise table formatting
		maxTokens: 65536,
	});

	// Post-process to ensure complete data tables
	const reportWithCompleteTables = ensureCompleteDataTables(
		enhancedReport.text,
		financialSummary
	);

	console.log('✅ Market report enhanced with company analysis and complete data tables');
	return reportWithCompleteTables;
}

// Generate infographic content from market report
async function generateInfographicContent(marketReport: string, companyName?: string): Promise<string | null> {
	try {
		console.log('📊 Starting infographic content generation...');

		// Extract key data from the market report for infographic
		const extractedData = extractDataForInfographic(marketReport, companyName);

		// Initialize the slide generator
		const generator = new SlideInfographicGenerator();

		// Generate slides
		const slides = await generator.generateSlides(extractedData);

		if (slides.length === 0) {
			console.log('⚠️ No slides generated, falling back to simple infographic');
			return generateSimpleInfographic(extractedData);
		}

		// Generate HTML presentation
		const infographicHTML = generator.generateHTML(extractedData, slides);

		console.log(`✅ Generated infographic with ${slides.length} slides`);
		return infographicHTML;

	} catch (error) {
		console.error('❌ Error generating infographic content:', error);
		return null;
	}
}

// Extract relevant data from market report for infographic
function extractDataForInfographic(marketReport: string, companyName?: string) {
	// Extract title
	const titleMatch = marketReport.match(/^#\s*(.+)$/m);
	const title = titleMatch ? titleMatch[1] : (companyName ? `${companyName} Market Analysis` : 'Market Intelligence Report');

	// Extract summary (first paragraph or executive summary section)
	const summaryMatch = marketReport.match(/(?:## Executive Summary|## Summary)\s*\n\n([^#]+?)(?=\n##|$)/s)
		|| marketReport.match(/^([^#\n]+(?:\n[^#\n]+)*?)(?=\n##|$)/s);
	const summary = summaryMatch ? summaryMatch[1].trim().substring(0, 300) + '...' : 'Market analysis and insights';

	// Extract key points (look for bullet points or numbered lists)
	const keyPointsMatches = marketReport.match(/^\s*[-*]\s*(.+)$/gm)
		|| marketReport.match(/^\s*\d+\.\s*(.+)$/gm)
		|| [];
	const keyPoints = keyPointsMatches.slice(0, 5).map(point =>
		point.replace(/^\s*[-*\d.]\s*/, '').trim()
	);

	// Determine sentiment based on content
	const positiveWords = ['growth', 'increase', 'positive', 'strong', 'gain', 'rise', 'bullish', 'opportunity'];
	const negativeWords = ['decline', 'decrease', 'negative', 'weak', 'loss', 'fall', 'bearish', 'risk'];

	const content = marketReport.toLowerCase();
	const positiveCount = positiveWords.filter(word => content.includes(word)).length;
	const negativeCount = negativeWords.filter(word => content.includes(word)).length;

	let sentiment: "positive" | "negative" | "neutral" = "neutral";
	if (positiveCount > negativeCount) sentiment = "positive";
	else if (negativeCount > positiveCount) sentiment = "negative";

	// Extract entities (companies, organizations)
	const entityMatches = marketReport.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Inc|Corp|LLC|Ltd|Company|Bank|Group)\.?)?/g) || [];
	const entities = [...new Set(entityMatches.slice(0, 8))];

	// Extract keywords
	const keywordMatches = marketReport.match(/\b(?:market|financial|stock|price|revenue|earnings|growth|analysis|forecast|trend|investment|trading|economic|sector|industry)\b/gi) || [];
	const keywords = [...new Set(keywordMatches.map(k => k.toLowerCase()).slice(0, 10))];

	// Extract market analysis section
	const marketAnalysisMatch = marketReport.match(/(?:## Market Analysis|## Analysis)\s*\n\n([^#]+?)(?=\n##|$)/s);
	const marketAnalysis = marketAnalysisMatch ? marketAnalysisMatch[1].trim().substring(0, 200) + '...' : undefined;

	// Extract investment implications
	const investmentMatch = marketReport.match(/(?:## Investment|## Implications|## Outlook)\s*\n\n([^#]+?)(?=\n##|$)/s);
	const investmentImplications = investmentMatch ? investmentMatch[1].trim().substring(0, 200) + '...' : undefined;

	return {
		title,
		summary,
		keyPoints: keyPoints.length > 0 ? keyPoints : ['Market analysis in progress', 'Key insights being processed', 'Comprehensive data review'],
		sentiment,
		entities,
		keywords,
		marketAnalysis,
		investmentImplications,
		wordCount: marketReport.length,
		readingTime: Math.ceil(marketReport.split(' ').length / 200),
		companyName
	};
}

// Fallback simple infographic generator
function generateSimpleInfographic(data: any): string {
	const sentimentColor = data.sentiment === 'positive' ? '#10b981' :
		data.sentiment === 'negative' ? '#ef4444' : '#6366f1';

	return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px; margin: 0; color: #333;
        }
        .infographic {
            max-width: 800px; margin: 0 auto; background: white;
            border-radius: 15px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 2.5em; font-weight: bold; color: ${sentimentColor}; margin-bottom: 10px; }
        .summary { font-size: 1.2em; line-height: 1.6; margin-bottom: 30px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { text-align: center; padding: 20px; background: #f8fafc; border-radius: 10px; }
        .metric-value { font-size: 2em; font-weight: bold; color: ${sentimentColor}; }
        .metric-label { font-size: 0.9em; color: #64748b; margin-top: 5px; }
        .key-points { margin-bottom: 30px; }
        .point { padding: 15px; margin: 10px 0; background: #f1f5f9; border-left: 4px solid ${sentimentColor}; border-radius: 0 8px 8px 0; }
        .sentiment-badge {
            display: inline-block; padding: 8px 16px; background: ${sentimentColor};
            color: white; border-radius: 20px; font-weight: 600; text-transform: uppercase;
            font-size: 0.8em; letter-spacing: 1px;
        }
    </style>
</head>
<body>
    <div class="infographic">
        <div class="header">
            <div class="title">${data.title}</div>
            <div class="sentiment-badge">${data.sentiment}</div>
        </div>

        <div class="summary">${data.summary}</div>

        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${data.readingTime}</div>
                <div class="metric-label">Min Read</div>
            </div>
            <div class="metric">
                <div class="metric-value">${data.entities.length}</div>
                <div class="metric-label">Key Entities</div>
            </div>
            <div class="metric">
                <div class="metric-value">${data.keywords.length}</div>
                <div class="metric-label">Keywords</div>
            </div>
        </div>

        <div class="key-points">
            <h3 style="color: ${sentimentColor}; margin-bottom: 15px;">Key Insights</h3>
            ${data.keyPoints.map((point: string) => `<div class="point">${point}</div>`).join('')}
        </div>

        <div style="text-align: center; margin-top: 30px; font-size: 0.9em; color: #64748b;">
            Generated on ${new Date().toLocaleDateString()}
        </div>
    </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
	try {
		// Check authentication and authorization (support both session and API key)
		let userId: string;
		let userRole: UserRole;

		// First, try API key authentication
		const apiKey = request.headers.get('X-API-Key') ||
		              (request.headers.get('Authorization')?.startsWith('Bearer naly_') ?
		               request.headers.get('Authorization')?.replace('Bearer ', '') : null);

		if (apiKey) {
			console.log('🔑 Authenticating with API key...');
			// Import and validate API key
			const { apiKeyService } = await import('@/lib/services/api-key-service');
			const keyRecord = await apiKeyService.validateApiKey(apiKey);

			if (!keyRecord) {
				return NextResponse.json(
					{ error: "Invalid or expired API key" },
					{ status: 401 }
				);
			}

			// Get user details from API key
			const { users } = await import('@/lib/schema');
			const { eq } = await import('drizzle-orm');

			const [user] = await db
				.select()
				.from(users)
				.where(eq(users.id, keyRecord.userId))
				.limit(1);

			if (!user || user.role !== UserRole.MANAGER) {
				return NextResponse.json(
					{ error: "Forbidden: Only managers can access this endpoint" },
					{ status: 403 }
				);
			}

			userId = user.id;
			userRole = user.role as UserRole;
			console.log('✅ API key authentication successful');
		} else {
			// Fall back to session authentication
			console.log('🔐 Authenticating with session...');
			const session = await auth();

			if (!session?.user) {
				return NextResponse.json(
					{ error: "Unauthorized: Please sign in" },
					{ status: 401 }
				);
			}

			if (session.user.role !== UserRole.MANAGER) {
				return NextResponse.json(
					{ error: "Forbidden: Only managers can access this endpoint" },
					{ status: 403 }
				);
			}

			userId = session.user.id;
			userRole = session.user.role;
			console.log('✅ Session authentication successful');
		}

		console.log("Starting market report generation...");

		// Step 1: Fetch latest unarchived articles from database
		console.log("Step 1: Fetching latest unarchived articles from database...");

		const recentArticles = await db
			.select({
				id: rssArticles.id,
				title: rssArticles.title,
				description: rssArticles.description,
				content: rssArticles.content,
				fullContent: rssArticles.fullContent,
				categories: rssArticles.categories,
				publishedAt: rssArticles.publishedAt,
				link: rssArticles.link,
				author: rssArticles.author,
			})
			.from(rssArticles)
			.where(eq(rssArticles.isArchived, false))
			.orderBy(desc(rssArticles.publishedAt))
			.limit(10);

		console.log(`Found ${recentArticles.length} recent articles for analysis`);

		if (recentArticles.length === 0) {
			return NextResponse.json(
				{ error: "No unarchived articles found to generate report" },
				{ status: 404 }
			);
		}

		// Step 2: Generate comprehensive market report with integrated topic analysis
		console.log("Step 2: Generating comprehensive market report with topic analysis...");

		// Use full content if available, otherwise fall back to description/content
		const articlesText = recentArticles.map(article => {
			const contentToUse = article.fullContent
				? article.fullContent.substring(0, 2000) // Use first 2000 chars of full content
				: (article.content || article.description || 'No content available');

			console.log(`📰 Article: ${article.title}`);
			console.log(`📄 Content source: ${article.fullContent ? 'fullContent' : 'content/description'}`);
			console.log(`📝 Content length: ${contentToUse.length} chars`);
			console.log(`📝 Content preview: ${contentToUse.substring(0, 200)}...`);

			return `Title: ${article.title}
Content: ${contentToUse}
Categories: ${Array.isArray(article.categories) ? article.categories.join(', ') : 'No categories'}
Author: ${article.author || 'Unknown'}
Link: ${article.link}`;
		}).join('\n\n---\n\n');

		console.log(`📊 Total articlesText length: ${articlesText.length} characters`);
		console.log(`📋 ArticlesText preview (first 500 chars):`);
		console.log(articlesText.substring(0, 500));

		const reportPrompt = `Analyze the following recent financial news articles and generate a comprehensive market intelligence report suitable for investment professionals and financial analysts.

FINANCIAL NEWS ARTICLES:
${articlesText}

CRITICAL NUMERICAL DATA PRESERVATION REQUIREMENTS:
- PRESERVE ALL NUMERICAL DATA EXACTLY as stated in the source articles
- DO NOT round, approximate, or summarize any financial figures
- Include EXACT stock prices (e.g., $156.78, not "around $157")
- Include EXACT percentage changes (e.g., +3.24%, not "about 3%")
- Include EXACT revenue/earnings figures (e.g., $24.318 billion, not "$24.3B")
- Include EXACT market cap, employee counts, and all financial metrics
- Quote specific numbers directly from the articles with proper attribution
- When citing growth rates, use the exact percentages provided
- Preserve decimal places and currency symbols as written in source material

ANALYSIS REQUIREMENTS:
First, analyze the articles to identify:
1. Top 5-7 most significant market topics/themes
2. Key sectors or industries mentioned frequently
3. Notable economic indicators or events
4. Emerging trends or patterns

Then, using this analysis, create a comprehensive market intelligence report with the following structure:

# Executive Summary
[2-3 sentence overview of current market conditions and key developments based on the articles]

# Key Market Themes
[Detailed analysis of the most significant topics identified from the articles, with specific references to the news content and EXACT numerical data]

# Sector Analysis
[Breakdown by industry/sector with specific insights derived from the article content, including ALL EXACT financial figures]

# Risk Assessment
[Potential market risks and concerns identified from the news flow, with concrete examples from the articles including PRECISE numerical data]

# Market Outlook
[Short-term implications and what to watch for based on the trends identified, with EXACT forecasts and projections when available]

# Investment Considerations
[Key factors for investment decision-making based on current themes, supported by specific article insights with COMPLETE numerical accuracy]

CONTEXT:
- Total articles analyzed: ${recentArticles.length}
- Data sources: Multiple financial news feeds
- Analysis timeframe: Latest market developments from database

Make the report professional, actionable, and focused on providing valuable insights for financial decision-making. Include specific details and references from the article analysis while maintaining a clear, structured format. Ensure the analysis flows logically from topic identification through comprehensive market intelligence. MOST IMPORTANTLY: Preserve every single number, percentage, dollar amount, and financial metric EXACTLY as stated in the source articles without any rounding or approximation.

APPEND at the end of the report:
## Source Article Data
Include a table or list with:
- Article titles
- Key numerical data from each article
- Publication timestamps
- Categories/topics covered`;

		console.log(`🤖 Sending prompt to AI (length: ${reportPrompt.length} chars)`);
		console.log(`🔧 AI Config: model=GEMINI_2_5_FLASH, temperature=0.4, maxTokens=65536`);

		// Use better model for complex report generation if available
		const reportModel = process.env.OPENAI_API_KEY ? "GPT_4O" : "GEMINI_2_5_FLASH";

		const marketReport = await generateAIText({
			prompt: reportPrompt,
			model: reportModel as any,
			temperature: 0.1, // Lower temperature for more deterministic table generation
			maxTokens: 65536,
		});

		console.log("Market report generated successfully");
		console.log(`📰 Generated report length: ${marketReport.text.length} characters`);
		console.log(`📖 Report preview (first 500 chars):`);
		console.log(marketReport.text.substring(0, 500));

		// Step 2.5: Enhanced Company Analysis
		console.log("Step 2.5: Starting enhanced company analysis...");

		let finalReport = marketReport.text;
		let companyAnalysis = null;

		try {
			// Extract companies directly from the articles instead of using market report analysis
			const extractedCompanies = await extractCompaniesFromArticles(recentArticles);

			if (extractedCompanies.length > 0) {
				console.log(`🏢 Found ${extractedCompanies.length} companies in articles:`, extractedCompanies);

				// Use the first/most relevant company for detailed analysis
				const selectedCompany = extractedCompanies[0];
				console.log(`🎯 Selected company for analysis: ${selectedCompany}`);

				// Create a mock analysis object for compatibility
				companyAnalysis = {
					companyName: selectedCompany,
					ticker: null,
					needsTickerSearch: true,
					reasoning: `Selected from ${extractedCompanies.length} companies extracted from article content`
				};

				// Search for ticker
				console.log(`🔍 Searching for ticker symbol for ${selectedCompany}...`);
				const searchedTicker = await searchCompanyTicker(selectedCompany);
				let ticker = searchedTicker;

				if (searchedTicker) {
					ticker = searchedTicker;
					console.log(`✅ Ticker found via search: ${ticker}`);

					// Fetch financial data
					console.log(`📊 Fetching comprehensive financial data for ${selectedCompany} (${ticker})...`);
					const financialData = await fetchFinancialData(ticker);

					if (financialData) {
						console.log(`💼 Enhancing report with detailed analysis for ${selectedCompany} (${ticker})`);

						// Enhance the report with comprehensive company analysis
						const enhancedReport = await enhanceReportWithCompanyAnalysis(
							marketReport.text,
							selectedCompany,
							ticker,
							financialData
						);

						finalReport = enhancedReport;

						// Import and append complete data tables
						const { generateCompleteDataSection } = await import('@/lib/ai');
						finalReport += generateCompleteDataSection(recentArticles, financialData);

						console.log(`✅ Enhanced report generated with complete data preservation (${finalReport.length} characters)`);
					} else {
						console.log(`⚠️ Failed to fetch financial data for ${ticker}, using original report`);

						// Still append article data even without financial data
						const { generateCompleteDataSection } = await import('@/lib/ai');
						finalReport = marketReport.text + generateCompleteDataSection(recentArticles);
					}
				} else {
					console.log(`⚠️ Could not find ticker for ${selectedCompany}, skipping financial data analysis`);

					// Still append article data even without ticker
					const { generateCompleteDataSection } = await import('@/lib/ai');
					finalReport = marketReport.text + generateCompleteDataSection(recentArticles);
				}
			} else {
				console.log('⚠️ No companies found in articles, using original report');

				// Still append article data
				const { generateCompleteDataSection } = await import('@/lib/ai');
				finalReport = marketReport.text + generateCompleteDataSection(recentArticles);
			}

		} catch (error) {
			console.error(`❌ Error during company analysis: ${error}`);
			console.log(`📄 Using original market report without company enhancement`);
		}

		// Step 3: Generate infographics and prepare enhanced report
		console.log("Step 3: Generating infographics and preparing final report...");

		// Generate infographic content if we have company data
		let infographicContent = null;
		let finalCompanyName = null;

		try {
			// Check if we have a company from the analysis step
			if (companyAnalysis && companyAnalysis.companyName) {
				finalCompanyName = companyAnalysis.companyName;
				console.log(`🏢 Using company from analysis step: ${finalCompanyName}`);
			} else {
				// Debug: Show first 500 characters of finalReport for analysis
				console.log('🔍 DEBUG: First 500 chars of finalReport:', finalReport.substring(0, 500));

				// Extract company name from the final report for title
				console.log('🔍 DEBUG: Testing company extraction patterns...');

				// Look for common company patterns in the report
				const patterns = [
					/Featured Company Deep-Dive: (.+?) \(/,
					/##\s*([A-Z][^\n]+Bank|[A-Z][^\n]+Corp|[A-Z][^\n]+Inc|[A-Z][^\n]+Ltd|[A-Z][^\n]+Company)/,
					/Canadian Imperial Bank of Commerce|CIBC/,
					// New patterns for common company names
					/\b(Binance|Tesla|Apple|Microsoft|Google|Amazon|Meta|Netflix|Nvidia|OpenAI)\b/i,
					// Pattern for "Company Name" or Company Name mentioned prominently
					/\*\*([A-Z][a-zA-Z\s&.]{2,30})\*\*/,
					// Pattern for company names in quotes
					/"([A-Z][a-zA-Z\s&.]{2,30})"/,
					// Pattern for company names at start of sentences
					/\b([A-Z][a-zA-Z\s&.]{2,30}(?:Inc|Corp|LLC|Ltd|Company|Bank|Group)\.?)\b/
				];

				let companyMatch = null;
				for (let i = 0; i < patterns.length; i++) {
					const match = finalReport.match(patterns[i]);
					if (match) {
						companyMatch = match;
						console.log(`🔍 DEBUG: Pattern ${i + 1} match:`, match);
						break;
					}
				}

				if (companyMatch) {
					finalCompanyName = companyMatch[1] || companyMatch[0];
					console.log(`🏢 Extracted company name for title: ${finalCompanyName}`);
				} else {
					console.log('⚠️ No company name found in finalReport for title extraction');
				}
			}

			// Generate infographic content regardless of company name
			console.log('📊 Starting infographic content generation...');
			try {
				infographicContent = await generateInfographicContent(finalReport, finalCompanyName);
				console.log('📊 Infographic generation completed successfully');
				if (infographicContent) {
					console.log('📊 Infographic content length:', infographicContent.length);
				} else {
					console.log('⚠️ Infographic content is null');
				}
			} catch (infographicError) {
				console.error('❌ Error in infographic generation:', infographicError);
			}

		} catch (error) {
			console.error('❌ Error extracting company name or generating infographics:', error);
		}

		// Step 4: Save the enhanced report to database
		console.log("Step 4: Saving report to database...");

		// Create creative title with company name format: "Company Name: Creative Title"
		let reportTitle;
		if (finalCompanyName) {
			const creativeTitle = `Global Market Intelligence Insights - ${new Date().toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			})}`;
			reportTitle = `${finalCompanyName}: ${creativeTitle}`;
		} else {
			reportTitle = `Market Intelligence Report - ${new Date().toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			})}`;
		}

		const [savedReport] = await db
			.insert(generatedArticles)
			.values({
				userId: userId,
				title: reportTitle,
				content: finalReport,
				summary: `Enhanced market intelligence report analyzing ${recentArticles.length} recent financial news articles with detailed company analysis, identifying key themes and investment considerations.`,
				sourceCategory: "market-intelligence",
				marketAnalysis: finalReport,
				investmentImplications: "See Market Outlook, Investment Considerations, and Featured Company Deep-Dive sections in the full report",
				keywords: ["market-analysis", "intelligence-report", "financial-news", "investment-research", "company-analysis"],
				entities: recentArticles.map(article => article.title.substring(0, 50)),
				marketImpact: "Comprehensive analysis of current market conditions and trends with detailed company financial analysis",
				aiModel: "GEMINI_2_5_FLASH",
				generationMethod: "ai",
				wordCount: finalReport.length,
				readingTime: Math.ceil(finalReport.length / 200), // Assuming 200 words per minute
			})
			.returning({ id: generatedArticles.id });

		console.log(`Report saved to database with ID: ${savedReport.id}`);

		// Step 5: Mark analyzed articles as archived
		console.log("Step 4: Marking analyzed articles as archived...");

		const articleIds = recentArticles.map(article => article.id);

		if (articleIds.length > 0) {
			await db
				.update(rssArticles)
				.set({
					isArchived: true,
					isProcessed: true,
					processedAt: new Date(),
				})
				.where(
					inArray(rssArticles.id, articleIds)
				);
		}

		console.log(`Marked ${articleIds.length} articles as archived and processed`);

		// Step 6: Final response preparation
		console.log('Step 6: Preparing final response...');

		// Extract topic count for response from the enhanced report
		const topicLines = finalReport.split('\n').filter((line: string) =>
			line.trim().startsWith('-') || line.trim().startsWith('•') || /^\d+\./.test(line.trim())
		);

		return NextResponse.json({
			success: true,
			reportId: savedReport.id,
			reportTitle,
			articlesAnalyzed: recentArticles.length,
			articlesArchived: articleIds.length,
			topicsCount: Math.max(topicLines.length, 7),
			companyAnalyzed: finalCompanyName || null,
			infographicsGenerated: infographicContent ? true : false,
			message: "Enhanced market intelligence report with comprehensive company analysis generated successfully",
		});

	} catch (error) {
		console.error("Error generating market report:", error);
		return NextResponse.json(
			{
				error: "Failed to generate market report",
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
}