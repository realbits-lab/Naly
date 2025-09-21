import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchedArticles, articleFetchQueue } from "@/lib/schema/fetched-articles";
import { eq, and } from "drizzle-orm";
import { ArticleFetchingService } from "@/lib/services/article-fetching-service";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { url, priority = 1 } = body;

		if (!url) {
			return NextResponse.json(
				{ error: "URL is required" },
				{ status: 400 }
			);
		}

		// Validate URL
		try {
			new URL(url);
		} catch {
			return NextResponse.json(
				{ error: "Invalid URL format" },
				{ status: 400 }
			);
		}

		// Get user/session info for tracking
		const userId = request.headers.get('x-user-id'); // From auth middleware
		const sessionId = request.headers.get('x-session-id') ||
						 request.cookies.get('session-id')?.value ||
						 crypto.randomUUID();

		// Check if article already exists and is fresh
		const existingArticle = await db
			.select()
			.from(fetchedArticles)
			.where(eq(fetchedArticles.url, url))
			.limit(1);

		if (existingArticle.length > 0) {
			const article = existingArticle[0];

			// If article is less than 24 hours old and completed, return it
			const isRecent = article.fetchCompletedAt &&
							(Date.now() - article.fetchCompletedAt.getTime()) < 24 * 60 * 60 * 1000;

			if (article.status === 'completed' && isRecent) {
				return NextResponse.json({
					id: article.id,
					status: 'completed',
					url: article.url,
					title: article.title,
					cached: true
				});
			}

			// If article exists but is stale or failed, we'll re-fetch it
			if (article.status === 'failed' || !isRecent) {
				await db
					.update(fetchedArticles)
					.set({
						status: 'pending',
						fetchStartedAt: null,
						fetchCompletedAt: null,
						errorMessage: null,
						retryCount: 0,
						isStale: false,
						updatedAt: new Date()
					})
					.where(eq(fetchedArticles.id, article.id));

				// Add to queue for re-processing
				await db.insert(articleFetchQueue).values({
					url,
					priority,
					requestedBy: userId,
					sessionId,
					status: 'queued'
				});

				return NextResponse.json({
					id: article.id,
					status: 'pending',
					url: article.url,
					message: 'Article queued for re-processing'
				});
			}

			// If article is currently being processed
			if (article.status === 'processing') {
				return NextResponse.json({
					id: article.id,
					status: 'processing',
					url: article.url,
					message: 'Article is currently being processed'
				});
			}
		}

		// Check if already in queue
		const existingQueueItem = await db
			.select()
			.from(articleFetchQueue)
			.where(and(
				eq(articleFetchQueue.url, url),
				eq(articleFetchQueue.status, 'queued')
			))
			.limit(1);

		if (existingQueueItem.length > 0) {
			// Update priority if higher
			if (existingQueueItem[0]?.priority !== null && priority > existingQueueItem[0].priority) {
				await db
					.update(articleFetchQueue)
					.set({ priority, updatedAt: new Date() })
					.where(eq(articleFetchQueue.id, existingQueueItem[0].id));
			}

			return NextResponse.json({
				id: existingQueueItem[0].fetchedArticleId,
				status: 'queued',
				url: url,
				message: 'Article is already in processing queue'
			});
		}

		// For high priority requests, process immediately
		if (priority >= 5) {
			try {
				// Create article record
				const [newArticle] = await db.insert(fetchedArticles).values({
					url,
					status: 'processing',
					fetchStartedAt: new Date(),
					requestedBy: userId,
					sessionId
				}).returning();

				// Process the article immediately in the background
				processArticleInBackground(newArticle.id, url);

				return NextResponse.json({
					id: newArticle.id,
					status: 'processing',
					url: url,
					message: 'Article processing started'
				});

			} catch (error) {
				console.error('Error creating article record:', error);
				return NextResponse.json(
					{ error: 'Failed to start article processing' },
					{ status: 500 }
				);
			}
		}

		// Add to queue for background processing
		try {
			// Create article record
			const [newArticle] = await db.insert(fetchedArticles).values({
				url,
				status: 'pending',
				requestedBy: userId,
				sessionId
			}).returning();

			// Add to processing queue
			await db.insert(articleFetchQueue).values({
				url,
				priority,
				requestedBy: userId,
				sessionId,
				fetchedArticleId: newArticle.id,
				status: 'queued'
			});

			return NextResponse.json({
				id: newArticle.id,
				status: 'pending',
				url: url,
				message: 'Article queued for processing'
			});

		} catch (error) {
			console.error('Error queuing article:', error);
			return NextResponse.json(
				{ error: 'Failed to queue article for processing' },
				{ status: 500 }
			);
		}

	} catch (error) {
		console.error('Error in article fetch endpoint:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

/**
 * Process article in background (non-blocking)
 */
async function processArticleInBackground(articleId: string, url: string) {
	try {
		console.log(`Processing article ${articleId}: ${url}`);

		// Fetch and parse the article
		const articleContent = await ArticleFetchingService.fetchArticle(url);

		// Update the database with the processed content
		await db
			.update(fetchedArticles)
			.set({
				status: 'completed',
				title: articleContent.title,
				content: articleContent.content,
				textContent: articleContent.textContent,
				wordCount: articleContent.wordCount,
				readingTimeMinutes: articleContent.readingTimeMinutes,
				author: articleContent.author,
				publisher: articleContent.publisher,
				publishedAt: articleContent.publishedAt,
				featuredImage: articleContent.featuredImage,
				images: articleContent.images,
				meta: articleContent.meta,
				fetchCompletedAt: new Date(),
				updatedAt: new Date()
			})
			.where(eq(fetchedArticles.id, articleId));

		console.log(`Successfully processed article ${articleId}`);

	} catch (error) {
		console.error(`Error processing article ${articleId}:`, error);

		// Update status to failed
		await db
			.update(fetchedArticles)
			.set({
				status: 'failed',
				errorMessage: error instanceof Error ? error.message : 'Unknown error',
				fetchCompletedAt: new Date(),
				updatedAt: new Date()
			})
			.where(eq(fetchedArticles.id, articleId));
	}
}