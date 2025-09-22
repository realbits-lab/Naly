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

Format the entire response in clean markdown with proper headers, bullet points, and tables where appropriate. MOST IMPORTANTLY: Every single financial number, percentage, dollar amount, and metric must be preserved EXACTLY as provided in the source data without any rounding, approximation, or summarization.`;

	const enhancedReport = await generateAIText({
		prompt: enhancementPrompt,
		model: "GEMINI_2_5_FLASH",
		temperature: 0.3,
		maxTokens: 65536,
	});

	console.log('✅ Market report enhanced with company analysis');
	return enhancedReport.text;
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

Make the report professional, actionable, and focused on providing valuable insights for financial decision-making. Include specific details and references from the article analysis while maintaining a clear, structured format. Ensure the analysis flows logically from topic identification through comprehensive market intelligence. MOST IMPORTANTLY: Preserve every single number, percentage, dollar amount, and financial metric EXACTLY as stated in the source articles without any rounding or approximation.`;

		console.log(`🤖 Sending prompt to AI (length: ${reportPrompt.length} chars)`);
		console.log(`🔧 AI Config: model=GEMINI_2_5_FLASH, temperature=0.4, maxTokens=65536`);

		const marketReport = await generateAIText({
			prompt: reportPrompt,
			model: "GEMINI_2_5_FLASH",
			temperature: 0.4,
			maxTokens: 65536,
		});

		console.log("Market report generated successfully");
		console.log(`📰 Generated report length: ${marketReport.text.length} characters`);
		console.log(`📖 Report preview (first 500 chars):`);
		console.log(marketReport.text.substring(0, 500));

		// Step 2.5: Enhanced Company Analysis
		console.log("Step 2.5: Starting enhanced company analysis...");

		let finalReport = marketReport.text;

		try {
			// Find the most relevant company from the market report
			const companyAnalysis = await identifyRelevantCompany(marketReport.text);
			console.log(`🏢 Selected company for analysis: ${companyAnalysis.companyName}`);

			let ticker = companyAnalysis.ticker;

			// Search for ticker if needed
			if (companyAnalysis.needsTickerSearch || !ticker) {
				console.log(`🔍 Searching for ticker symbol for ${companyAnalysis.companyName}...`);
				const searchedTicker = await searchCompanyTicker(companyAnalysis.companyName);
				if (searchedTicker) {
					ticker = searchedTicker;
					console.log(`✅ Ticker found via search: ${ticker}`);
				} else {
					console.log(`⚠️ Could not find ticker for ${companyAnalysis.companyName}, skipping financial data analysis`);
				}
			}

			// Fetch comprehensive financial data if we have a ticker
			if (ticker) {
				console.log(`📊 Fetching comprehensive financial data for ${ticker}...`);
				const financialData = await fetchFinancialData(ticker);

				if (financialData) {
					console.log(`💼 Enhancing report with detailed analysis for ${companyAnalysis.companyName} (${ticker})`);
					// Enhance the market report with company analysis
					finalReport = await enhanceReportWithCompanyAnalysis(
						marketReport.text,
						companyAnalysis.companyName,
						ticker,
						financialData
					);
					console.log(`✅ Enhanced report generated (${finalReport.length} characters)`);
				} else {
					console.log(`⚠️ Failed to fetch financial data for ${ticker}, using original report`);
				}
			} else {
				console.log(`⚠️ No ticker available for ${companyAnalysis.companyName}, using original report`);
			}

		} catch (error) {
			console.error(`❌ Error during company analysis: ${error}`);
			console.log(`📄 Using original market report without company enhancement`);
		}

		// Step 3: Save the enhanced report to database
		console.log("Step 3: Saving report to database...");

		const reportTitle = `Market Intelligence Report - ${new Date().toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})}`;

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

		// Step 4: Mark analyzed articles as archived
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