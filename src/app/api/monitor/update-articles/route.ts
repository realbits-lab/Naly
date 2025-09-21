import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import { db } from "@/lib/db";
import { rssSources, rssArticles } from "@/lib/schema/rss";
import { eq, desc, and, notExists } from "drizzle-orm";
import { DEFAULT_RSS_SOURCES } from "@/lib/constants/rss-sources";

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

		const fetchResults = [];
		const newArticleIds = [];
		let totalNewArticles = 0;
		let totalProcessedSources = 0;
		let totalFailedSources = 0;

		// Process each source
		for (const source of sources) {
			try {
				console.log(`Fetching RSS feed for ${source.name}...`);
				const feed = await tryFetchRSS(source.feedUrl);

				// Process and save articles
				const articlesToInsert = [];

				for (const item of feed.items.slice(0, 50)) { // Limit to 50 items per source
					const articleData = {
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
					};

					articlesToInsert.push(articleData);
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
						fetchErrorCount: (source.fetchErrorCount || 0) + 1,
						lastFetchError: error.message,
					})
					.where(eq(rssSources.id, source.id));

				totalFailedSources++;

				fetchResults.push({
					sourceId: source.id,
					sourceName: source.name,
					status: 'error',
					error: error.message,
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
			{ error: "Failed to update articles", details: error.message },
			{ status: 500 }
		);
	}
}

// GET endpoint to fetch articles from database only
export async function GET(request: NextRequest) {
	try {
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
			{ error: "Failed to fetch articles", details: error.message },
			{ status: 500 }
		);
	}
}