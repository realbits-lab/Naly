import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UserRole } from "@/types/user";
import { db } from "@/lib/db";
import { rssSources, rssArticles, generatedArticles } from "@/lib/schema";
import { eq, desc, inArray } from "drizzle-orm";
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

		// Step 2: Extract key topics using AI (changed from Step 3)
		console.log("Step 2: Extracting key market topics...");

		// Use full content if available, otherwise fall back to description/content
		const articlesText = recentArticles.map(article => {
			const contentToUse = article.fullContent
				? article.fullContent.substring(0, 2000) // Use first 2000 chars of full content
				: (article.content || article.description || 'No content available');

			return `Title: ${article.title}
Content: ${contentToUse}
Categories: ${Array.isArray(article.categories) ? article.categories.join(', ') : 'No categories'}
Author: ${article.author || 'Unknown'}
Link: ${article.link}`;
		}).join('\n\n---\n\n');

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
			model: "GEMINI_2_5_FLASH_LITE",
			temperature: 0.3,
			maxTokens: 1500,
		});

		console.log("Topics extracted successfully");

		// Step 3: Generate comprehensive market report
		console.log("Step 3: Generating comprehensive market report...");

		const reportPrompt = `Based on the following market topics analysis and recent financial news data, generate a comprehensive market intelligence report suitable for investment professionals and financial analysts.

Topics Analysis:
${topicsAnalysis.text}

Recent Market Data Context:
- Total articles analyzed: ${recentArticles.length}
- Data sources: Multiple financial news feeds
- Analysis timeframe: Latest market developments from database

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
			model: "GEMINI_2_5_FLASH",
			temperature: 0.4,
			maxTokens: 3000,
		});

		console.log("Market report generated successfully");

		// Step 4: Save the generated report to database
		console.log("Step 4: Saving report to database...");

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
				sources: recentArticles.map(article => ({
					name: article.title.substring(0, 50),
					url: article.link
				})),
				metadata: {
					articlesAnalyzed: recentArticles.length,
					articleIds: recentArticles.map(a => a.id),
					generatedAt: new Date().toISOString(),
					analysisType: "market-intelligence",
				},
			})
			.returning({ id: generatedArticles.id });

		console.log(`Report saved to database with ID: ${savedReport.id}`);

		// Step 5: Mark analyzed articles as archived
		console.log("Step 5: Marking analyzed articles as archived...");

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

		// Extract topic count for response
		const topicLines = topicsAnalysis.text.split('\n').filter(line =>
			line.trim().startsWith('-') || line.trim().startsWith('•') || /^\d+\./.test(line.trim())
		);

		return NextResponse.json({
			success: true,
			reportId: savedReport.id,
			reportTitle,
			articlesAnalyzed: recentArticles.length,
			articlesArchived: articleIds.length,
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