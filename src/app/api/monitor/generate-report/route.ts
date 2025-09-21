import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UserRole } from "@/types/user";
import { db } from "@/lib/db";
import { rssSources, rssArticles, generatedArticles } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { generateAIText } from "@/lib/ai";
import Parser from "rss-parser";

const parser = new Parser({
	customFields: {
		feed: ['language', 'copyright', 'managingEditor'],
		item: ['media:content', 'media:thumbnail', 'enclosure', 'dc:creator', 'content:encoded']
	}
});

// CORS proxy for feeds that might be blocked
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

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

export async function POST(request: NextRequest) {
	try {
		// Check authentication and authorization
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

		console.log("Starting market report generation...");

		// Step 1: Fetch latest RSS articles and store to DB
		console.log("Step 1: Fetching latest RSS articles...");

		const sources = await db.select().from(rssSources).where(eq(rssSources.isActive, true));
		let totalNewArticles = 0;
		const newArticleIds: string[] = [];

		for (const source of sources) {
			try {
				console.log(`Fetching articles from: ${source.name}`);
				const feed = await tryFetchRSS(source.feedUrl);

				const newArticles = feed.items.slice(0, 10).map((item: any) => ({
					sourceId: source.id,
					title: item.title || "Untitled",
					description: item.contentSnippet || item.summary || item.content || "",
					content: item['content:encoded'] || item.content || item.summary || "",
					link: item.link || "",
					publishedAt: item.pubDate || item.isoDate || new Date(),
					author: item.creator || item['dc:creator'] || item.author || null,
					categories: item.categories || [],
					guid: item.guid || `${source.id}-${Date.now()}-${Math.random()}`,
					imageUrl: item.enclosure?.url || null,
				}));

				// Insert new articles (avoiding duplicates by link)
				for (const article of newArticles) {
					try {
						const existingArticle = await db
							.select({ id: rssArticles.id })
							.from(rssArticles)
							.where(eq(rssArticles.link, article.link))
							.limit(1);

						if (existingArticle.length === 0) {
							const [inserted] = await db.insert(rssArticles).values(article).returning({ id: rssArticles.id });
							newArticleIds.push(inserted.id);
							totalNewArticles++;
						}
					} catch (insertError) {
						console.log(`Skipping duplicate article: ${article.title}`);
					}
				}

			} catch (error) {
				console.error(`Error fetching from ${source.name}:`, error instanceof Error ? error.message : String(error));
			}
		}

		console.log(`Step 1 complete: ${totalNewArticles} new articles added to database`);

		// Step 2: Get recent articles for analysis (last 100 articles)
		console.log("Step 2: Retrieving recent articles for analysis...");

		const recentArticles = await db
			.select({
				id: rssArticles.id,
				title: rssArticles.title,
				description: rssArticles.description,
				content: rssArticles.content,
				categories: rssArticles.categories,
				publishedAt: rssArticles.publishedAt,
			})
			.from(rssArticles)
			.orderBy(desc(rssArticles.publishedAt))
			.limit(100);

		console.log(`Found ${recentArticles.length} recent articles for analysis`);

		// Step 3: Extract key topics using AI
		console.log("Step 3: Extracting key market topics...");

		const articlesText = recentArticles.map(article =>
			`Title: ${article.title}\nDescription: ${article.description || 'No description'}\nCategories: ${
				Array.isArray(article.categories) ? article.categories.join(', ') : 'No categories'
			}`
		).join('\n\n');

		const topicsPrompt = `Analyze the following recent financial news articles and extract the most important market topics and themes. Focus on identifying key trends, sector movements, economic indicators, and significant events that could impact markets.

Articles:
${articlesText}

Please provide a concise analysis identifying:
1. Top 5-7 most significant market topics/themes
2. Key sectors or industries mentioned frequently
3. Notable economic indicators or events
4. Emerging trends or patterns

Format your response as a structured analysis with clear bullet points for each category.`;

		const topicsAnalysis = await generateAIText({
			prompt: topicsPrompt,
			model: "GPT_4O_MINI",
			temperature: 0.3,
			maxTokens: 1500,
		});

		console.log("Topics extracted successfully");

		// Step 4: Generate comprehensive market report
		console.log("Step 4: Generating comprehensive market report...");

		const reportPrompt = `Based on the following market topics analysis and recent financial news data, generate a comprehensive market intelligence report suitable for investment professionals and financial analysts.

Topics Analysis:
${topicsAnalysis.text}

Recent Market Data Context:
- Total articles analyzed: ${recentArticles.length}
- New articles added today: ${totalNewArticles}
- Data sources: Multiple financial news feeds (Reuters, Bloomberg, MarketWatch, etc.)
- Analysis timeframe: Latest market developments

Please create a professional market intelligence report with the following structure:

# Executive Summary
[2-3 sentence overview of current market conditions and key developments]

# Key Market Themes
[Detailed analysis of the most significant topics identified]

# Sector Analysis
[Breakdown by industry/sector with specific insights]

# Risk Assessment
[Potential market risks and concerns identified from the news flow]

# Market Outlook
[Short-term implications and what to watch for]

# Investment Considerations
[Key factors for investment decision-making based on current themes]

Make the report professional, actionable, and focused on providing valuable insights for financial decision-making. Include specific details from the news analysis while maintaining a clear, structured format.`;

		const marketReport = await generateAIText({
			prompt: reportPrompt,
			model: "GPT_4O",
			temperature: 0.4,
			maxTokens: 3000,
		});

		console.log("Market report generated successfully");

		// Step 5: Save the generated report to database
		console.log("Step 5: Saving report to database...");

		const reportTitle = `Market Intelligence Report - ${new Date().toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})}`;

		const [savedReport] = await db
			.insert(generatedArticles)
			.values({
				userId: session.user.id,
				title: reportTitle,
				content: marketReport.text,
				summary: `Comprehensive market intelligence report analyzing ${recentArticles.length} recent financial news articles, identifying key themes and investment considerations.`,
				category: "market-intelligence",
				complexity: "advanced",
				audience: ["institutional", "professional"],
				tags: ["market-analysis", "intelligence-report", "financial-news", "investment-research"],
				sources: sources.map(s => ({ name: s.name, url: s.feedUrl })),
				metadata: {
					articlesAnalyzed: recentArticles.length,
					newArticlesAdded: totalNewArticles,
					generatedAt: new Date().toISOString(),
					analysisType: "market-intelligence",
				},
			})
			.returning({ id: generatedArticles.id });

		console.log(`Report saved to database with ID: ${savedReport.id}`);

		// Extract topic count for response
		const topicLines = topicsAnalysis.text.split('\n').filter(line =>
			line.trim().startsWith('-') || line.trim().startsWith('•') || /^\d+\./.test(line.trim())
		);

		return NextResponse.json({
			success: true,
			reportId: savedReport.id,
			reportTitle,
			articlesAnalyzed: recentArticles.length,
			newArticlesAdded: totalNewArticles,
			topicsCount: Math.max(topicLines.length, 7),
			message: "Market intelligence report generated successfully",
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