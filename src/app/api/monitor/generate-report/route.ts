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
[Detailed analysis of the most significant topics identified from the articles, with specific references to the news content]

# Sector Analysis
[Breakdown by industry/sector with specific insights derived from the article content]

# Risk Assessment
[Potential market risks and concerns identified from the news flow, with concrete examples from the articles]

# Market Outlook
[Short-term implications and what to watch for based on the trends identified]

# Investment Considerations
[Key factors for investment decision-making based on current themes, supported by specific article insights]

CONTEXT:
- Total articles analyzed: ${recentArticles.length}
- Data sources: Multiple financial news feeds
- Analysis timeframe: Latest market developments from database

Make the report professional, actionable, and focused on providing valuable insights for financial decision-making. Include specific details and references from the article analysis while maintaining a clear, structured format. Ensure the analysis flows logically from topic identification through comprehensive market intelligence.`;

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

		// Step 3: Save the generated report to database
		console.log("Step 3: Saving report to database...");

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
				sourceCategory: "market-intelligence",
				marketAnalysis: marketReport.text,
				investmentImplications: "See Market Outlook and Investment Considerations sections in the full report",
				keywords: ["market-analysis", "intelligence-report", "financial-news", "investment-research"],
				entities: recentArticles.map(article => article.title.substring(0, 50)),
				marketImpact: "Comprehensive analysis of current market conditions and trends",
				aiModel: "GEMINI_2_5_FLASH",
				generationMethod: "ai",
				wordCount: marketReport.text.length,
				readingTime: Math.ceil(marketReport.text.length / 200), // Assuming 200 words per minute
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

		// Extract topic count for response from the generated report
		const topicLines = marketReport.text.split('\n').filter((line: string) =>
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