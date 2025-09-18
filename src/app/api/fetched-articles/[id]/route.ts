import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchedArticles, userArticleInteractions } from "@/lib/schema/fetched-articles";
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

		// Fetch full article
		const article = await db
			.select()
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

		// Only return full content for completed articles
		if (articleData.status !== 'completed') {
			return NextResponse.json(
				{
					id: articleData.id,
					status: articleData.status,
					url: articleData.url,
					title: articleData.title,
					error: articleData.status === 'failed' ? articleData.errorMessage : undefined,
					message: getStatusMessage(articleData.status)
				},
				{ status: articleData.status === 'failed' ? 422 : 202 }
			);
		}

		// Get user/session info for interaction tracking
		const userId = request.headers.get('x-user-id');
		const sessionId = request.headers.get('x-session-id') ||
						 request.cookies.get('session-id')?.value;

		// Track view interaction (async, don't wait for it)
		if (userId || sessionId) {
			trackArticleView(articleData.id, userId, sessionId).catch(console.error);
		}

		// Increment view count
		db.update(fetchedArticles)
			.set({
				viewCount: (articleData.viewCount || 0) + 1,
				updatedAt: new Date()
			})
			.where(eq(fetchedArticles.id, id))
			.catch(console.error); // Don't wait for this

		// Build response with full article data
		const response = {
			id: articleData.id,
			url: articleData.url,
			title: articleData.title,
			description: articleData.description,
			content: articleData.content,
			textContent: articleData.textContent,
			wordCount: articleData.wordCount,
			readingTimeMinutes: articleData.readingTimeMinutes,
			author: articleData.author,
			publisher: articleData.publisher,
			publishedAt: articleData.publishedAt,
			featuredImage: articleData.featuredImage,
			images: articleData.images,
			meta: articleData.meta,
			summary: articleData.summary,
			keywords: articleData.keywords,
			entities: articleData.entities,
			sentiment: articleData.sentiment,
			topics: articleData.topics,
			viewCount: (articleData.viewCount || 0) + 1,
			status: articleData.status,
			fetchCompletedAt: articleData.fetchCompletedAt,
			createdAt: articleData.createdAt,
			updatedAt: new Date() // Update to reflect view count increment
		};

		// Set cache headers for completed articles
		const headers = new Headers();
		headers.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
		headers.set('Content-Type', 'application/json');

		return NextResponse.json(response, { headers });

	} catch (error) {
		console.error('Error fetching article:', error);
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

/**
 * Track article view interaction
 */
async function trackArticleView(articleId: string, userId?: string | null, sessionId?: string | null) {
	try {
		await db.insert(userArticleInteractions).values({
			articleId,
			userId: userId || undefined,
			sessionId: sessionId || undefined,
			action: 'view',
			metadata: {
				timestamp: new Date().toISOString(),
				userAgent: 'unknown' // Could be passed from headers if needed
			}
		});
	} catch (error) {
		console.error('Error tracking article view:', error);
		// Don't throw - this is not critical
	}
}

/**
 * Get human-readable status message
 */
function getStatusMessage(status: string): string {
	switch (status) {
		case 'pending':
			return 'Article is queued for processing';
		case 'processing':
			return 'Article is currently being processed';
		case 'failed':
			return 'Article processing failed';
		case 'completed':
			return 'Article processed successfully';
		default:
			return 'Unknown status';
	}
}