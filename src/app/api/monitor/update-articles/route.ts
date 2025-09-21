import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import { db } from "@/lib/db";
import { rssSources, rssArticles } from "@/lib/schema/rss";
import { eq, desc, and, notExists } from "drizzle-orm";
import { DEFAULT_RSS_SOURCES } from "@/lib/constants/rss-sources";
import { auth } from "@/lib/auth";
import { UserRole } from "@/types/user";

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

// Helper function to fetch full article content from URL
async function fetchArticleContent(url: string): Promise<string | null> {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

		const response = await fetch(url, {
			signal: controller.signal,
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
			}
		});

		clearTimeout(timeout);

		if (!response.ok) {
			console.log(`Failed to fetch article from ${url}: ${response.status}`);
			return null;
		}

		const html = await response.text();

		// Basic HTML to text extraction (remove scripts, styles, and HTML tags)
		const textContent = html
			.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
			.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
			.replace(/<[^>]+>/g, ' ') // Remove HTML tags
			.replace(/\s+/g, ' ') // Normalize whitespace
			.trim()
			.slice(0, 50000); // Limit to 50k characters

		return textContent;

	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			console.log(`Timeout fetching article from ${url}`);
		} else {
			console.log(`Error fetching article from ${url}:`, error);
		}
		return null;
	}
}

// Helper function to process articles in batches with parallel fetching
async function fetchArticleContentsInBatch(articles: any[], batchSize = 5): Promise<(string | null)[]> {
	const results: (string | null)[] = [];

	for (let i = 0; i < articles.length; i += batchSize) {
		const batch = articles.slice(i, i + batchSize);
		const batchResults = await Promise.all(
			batch.map(article => fetchArticleContent(article.link))
		);
		results.push(...batchResults);
	}

	return results;
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
		// Get all active RSS sources
		let sources = [];
		try {
			sources = await db.select().from(rssSources).where(eq(rssSources.isActive, true));
		} catch (dbError) {
			// Fallback for when database is not available - use comprehensive sources
			sources = DEFAULT_RSS_SOURCES.map((source, index) => ({
				id: `default-${index}`,
				...source
			}));
		}

		if (!sources || sources.length === 0) {
			// Initialize sources from defaults if none exist
			await Promise.all(
				DEFAULT_RSS_SOURCES.map(source =>
					db.insert(rssSources).values({
						name: source.name,
						description: source.description,
						feedUrl: source.feedUrl,
						category: source.category,
						isActive: source.isActive,
						logoUrl: source.logoUrl,
						language: 'en',
						updateFrequency: 60,
					}).onConflictDoNothing()
				)
			);
			sources = await db.select().from(rssSources).where(eq(rssSources.isActive, true));
		}

		const fetchResults: any[] = [];
		const newArticleIds: string[] = [];
		let totalNewArticles = 0;
		let totalProcessedSources = 0;
		let totalFailedSources = 0;

		// Process each source
		for (const source of sources) {
			try {
				console.log(`Fetching RSS feed for ${source.name}...`);
				const feed = await tryFetchRSS(source.feedUrl);

				// Process and save articles - limit to 5 items per source
				const feedItems = feed.items.slice(0, 5);
				const articlesToInsert = [];

				// Prepare article data
				const articleDataList = feedItems.map(item => ({
					sourceId: source.id,
					title: item.title || "Untitled",
					description: item.contentSnippet || item.summary || item.content || "",
					content: item['content:encoded'] || item.content || item.summary || "",
					link: item.link || "",
					publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
					author: item.creator || item['dc:creator'] || item.author || null,
					categories: item.categories || [],
					guid: item.guid || `${source.id}-${item.link}`,
					imageUrl: item.enclosure?.url ||
							 item['media:thumbnail']?.url ||
							 item['media:content']?.url ||
							 null,
					isProcessed: false,
					fullContent: null as string | null, // Will be populated below
				}));

				// Fetch full content for all articles in parallel (batched)
				console.log(`Fetching full content for ${articleDataList.length} articles from ${source.name}...`);
				const fullContents = await fetchArticleContentsInBatch(articleDataList, 5);

				// Combine article data with full content
				for (let i = 0; i < articleDataList.length; i++) {
					const { fullContent, ...baseData } = articleDataList[i];
					const articleData = {
						...baseData,
						// Only include fullContent if the column exists in DB
						// Comment out until DB migration is complete
						// fullContent: fullContents[i],
					};
					articlesToInsert.push(articleData);

					// Log successful content fetch for debugging
					if (fullContents[i]) {
						console.log(`✓ Fetched full content for: ${baseData.title || 'Untitled'} (${fullContents[i].length} chars)`);
					}
				}

				// Batch insert articles
				if (articlesToInsert.length > 0) {
					const insertedArticles = await db.insert(rssArticles)
						.values(articlesToInsert)
						.onConflictDoNothing()
						.returning({ id: rssArticles.id });

					totalNewArticles += insertedArticles.length;
					newArticleIds.push(...insertedArticles.map(a => a.id));
				}

				// Update source fetch status
				await db.update(rssSources)
					.set({
						lastFetchedAt: new Date(),
						lastSuccessfulFetch: new Date(),
						fetchErrorCount: 0,
						lastFetchError: null,
					})
					.where(eq(rssSources.id, source.id));

				totalProcessedSources++;

				fetchResults.push({
					sourceId: source.id,
					sourceName: source.name,
					status: 'success',
					articlesCount: articlesToInsert.length,
					newArticlesCount: newArticleIds.length,
				});

			} catch (error) {
				console.error(`Failed to fetch RSS for ${source.name}:`, error);

				// Update error status
				await db.update(rssSources)
					.set({
						lastFetchedAt: new Date(),
						fetchErrorCount: ('fetchErrorCount' in source ? (source.fetchErrorCount || 0) : 0) + 1,
						lastFetchError: error instanceof Error ? error.message : String(error),
					})
					.where(eq(rssSources.id, source.id));

				totalFailedSources++;

				fetchResults.push({
					sourceId: source.id,
					sourceName: source.name,
					status: 'error',
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		// Get all articles from database with source information
		const allArticles = await db
			.select({
				id: rssArticles.id,
				title: rssArticles.title,
				description: rssArticles.description,
				link: rssArticles.link,
				publishedAt: rssArticles.publishedAt,
				author: rssArticles.author,
				categories: rssArticles.categories,
				sentiment: rssArticles.sentiment,
				imageUrl: rssArticles.imageUrl,
				isNew: rssArticles.id,
				sourceName: rssSources.name,
				sourceCategory: rssSources.category,
				sourceLogo: rssSources.logoUrl,
			})
			.from(rssArticles)
			.innerJoin(rssSources, eq(rssArticles.sourceId, rssSources.id))
			.orderBy(desc(rssArticles.publishedAt))
			.limit(200);

		// Mark new articles
		const articlesWithNewFlag = allArticles.map(article => ({
			...article,
			isNew: newArticleIds.includes(article.id),
		}));

		return NextResponse.json({
			success: true,
			summary: {
				totalSources: sources.length,
				processedSources: totalProcessedSources,
				failedSources: totalFailedSources,
				newArticles: totalNewArticles,
				totalArticles: articlesWithNewFlag.length,
			},
			articles: articlesWithNewFlag,
			fetchResults,
			newArticleIds,
		});

	} catch (error) {
		console.error("Error updating articles:", error);
		return NextResponse.json(
			{ error: "Failed to update articles", details: error instanceof Error ? error.message : String(error) },
			{ status: 500 }
		);
	}
}

// GET endpoint to fetch articles from database only
export async function GET(request: NextRequest) {
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
		const { searchParams } = new URL(request.url);
		const limit = parseInt(searchParams.get('limit') || '100');

		// Get all articles from database with source information
		const articles = await db
			.select({
				id: rssArticles.id,
				title: rssArticles.title,
				description: rssArticles.description,
				link: rssArticles.link,
				publishedAt: rssArticles.publishedAt,
				author: rssArticles.author,
				categories: rssArticles.categories,
				sentiment: rssArticles.sentiment,
				imageUrl: rssArticles.imageUrl,
				sourceName: rssSources.name,
				sourceCategory: rssSources.category,
				sourceLogo: rssSources.logoUrl,
			})
			.from(rssArticles)
			.innerJoin(rssSources, eq(rssArticles.sourceId, rssSources.id))
			.orderBy(desc(rssArticles.publishedAt))
			.limit(limit);

		return NextResponse.json({
			success: true,
			articles,
			totalCount: articles.length,
		});

	} catch (error) {
		console.error("Error fetching articles:", error);
		return NextResponse.json(
			{ error: "Failed to fetch articles", details: error instanceof Error ? error.message : String(error) },
			{ status: 500 }
		);
	}
}