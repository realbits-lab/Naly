import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchedArticles } from "@/lib/schema/fetched-articles";
import { eq } from "drizzle-orm";

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params;

		if (!id) {
			return NextResponse.json(
				{ error: "Article ID is required" },
				{ status: 400 }
			);
		}

		// Fetch article status
		const article = await db
			.select({
				id: fetchedArticles.id,
				url: fetchedArticles.url,
				title: fetchedArticles.title,
				status: fetchedArticles.status,
				fetchStartedAt: fetchedArticles.fetchStartedAt,
				fetchCompletedAt: fetchedArticles.fetchCompletedAt,
				errorMessage: fetchedArticles.errorMessage,
				retryCount: fetchedArticles.retryCount,
				wordCount: fetchedArticles.wordCount,
				readingTimeMinutes: fetchedArticles.readingTimeMinutes,
				author: fetchedArticles.author,
				publisher: fetchedArticles.publisher,
				publishedAt: fetchedArticles.publishedAt,
				featuredImage: fetchedArticles.featuredImage,
				createdAt: fetchedArticles.createdAt,
				updatedAt: fetchedArticles.updatedAt
			})
			.from(fetchedArticles)
			.where(eq(fetchedArticles.id, id))
			.limit(1);

		if (article.length === 0) {
			return NextResponse.json(
				{ error: "Article not found" },
				{ status: 404 }
			);
		}

		const articleData = article[0];

		// Calculate processing time if applicable
		let processingTimeMs: number | null = null;
		if (articleData.fetchStartedAt) {
			const endTime = articleData.fetchCompletedAt || new Date();
			processingTimeMs = endTime.getTime() - articleData.fetchStartedAt.getTime();
		}

		// Determine next poll interval based on status and processing time
		let nextPollInterval: number = 2000; // Default 2 seconds

		switch (articleData.status) {
			case 'pending':
				nextPollInterval = 3000; // 3 seconds for pending
				break;
			case 'processing':
				// Adaptive polling based on how long it's been processing
				if (processingTimeMs && processingTimeMs > 30000) {
					nextPollInterval = 10000; // 10 seconds if processing for > 30s
				} else if (processingTimeMs && processingTimeMs > 10000) {
					nextPollInterval = 5000; // 5 seconds if processing for > 10s
				} else {
					nextPollInterval = 2000; // 2 seconds for fresh processing
				}
				break;
			case 'completed':
			case 'failed':
				nextPollInterval = 0; // No need to poll completed/failed articles
				break;
		}

		// Build response based on status
		const response: any = {
			id: articleData.id,
			url: articleData.url,
			status: articleData.status,
			createdAt: articleData.createdAt,
			updatedAt: articleData.updatedAt,
			nextPollInterval
		};

		// Add timing information if available
		if (articleData.fetchStartedAt) {
			response.fetchStartedAt = articleData.fetchStartedAt;
		}

		if (articleData.fetchCompletedAt) {
			response.fetchCompletedAt = articleData.fetchCompletedAt;
		}

		if (processingTimeMs !== null) {
			response.processingTimeMs = processingTimeMs;
		}

		// Add basic info if available (even for pending/processing)
		if (articleData.title) {
			response.title = articleData.title;
		}

		if (articleData.author) {
			response.author = articleData.author;
		}

		if (articleData.publisher) {
			response.publisher = articleData.publisher;
		}

		if (articleData.publishedAt) {
			response.publishedAt = articleData.publishedAt;
		}

		// Add completion info for completed articles
		if (articleData.status === 'completed') {
			response.wordCount = articleData.wordCount;
			response.readingTimeMinutes = articleData.readingTimeMinutes;
			response.featuredImage = articleData.featuredImage;
		}

		// Add error info for failed articles
		if (articleData.status === 'failed') {
			response.errorMessage = articleData.errorMessage;
			response.retryCount = articleData.retryCount;
		}

		// Add cache headers based on status
		const headers = new Headers();

		if (articleData.status === 'completed' || articleData.status === 'failed') {
			// Cache completed/failed status for 1 hour
			headers.set('Cache-Control', 'public, max-age=3600');
		} else {
			// Don't cache pending/processing status
			headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
		}

		return NextResponse.json(response, { headers });

	} catch (error) {
		console.error('Error fetching article status:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// Support for preflight requests
export async function OPTIONS() {
	return new NextResponse(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		},
	});
}