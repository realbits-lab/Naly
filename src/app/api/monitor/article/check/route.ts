import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rssArticles } from '@/lib/schema/rss';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { UserRole } from '@/types/user';

export async function GET(request: NextRequest) {
	try {
		// Check authentication and authorization
		const session = await auth();

		if (!session?.user) {
			return NextResponse.json(
				{ error: 'Unauthorized: Please sign in' },
				{ status: 401 }
			);
		}

		if (session.user.role !== UserRole.MANAGER) {
			return NextResponse.json(
				{ error: 'Forbidden: Only managers can access this endpoint' },
				{ status: 403 }
			);
		}
		const { searchParams } = new URL(request.url);
		const url = searchParams.get('url');

		if (!url) {
			return NextResponse.json(
				{ error: 'URL parameter is required' },
				{ status: 400 }
			);
		}

		// Check if we have this article in the database with extracted content
		const existingArticle = await db
			.select({
				title: rssArticles.title,
				content: rssArticles.content,
				description: rssArticles.description,
				author: rssArticles.author,
				publishedAt: rssArticles.publishedAt,
			})
			.from(rssArticles)
			.where(eq(rssArticles.link, url))
			.limit(1);

		if (existingArticle.length > 0 && existingArticle[0].content) {
			// Return the cached content
			return NextResponse.json({
				title: existingArticle[0].title,
				content: existingArticle[0].content,
				textContent: existingArticle[0].content,
				excerpt: existingArticle[0].description,
				byline: existingArticle[0].author,
				siteName: null,
				publishedTime: existingArticle[0].publishedAt,
				cached: true
			});
		}

		// Article not found or no extracted content
		return NextResponse.json({ content: null, cached: false });

	} catch (error) {
		console.error('Error checking for cached article content:', error);
		return NextResponse.json(
			{ error: 'Failed to check for cached content' },
			{ status: 500 }
		);
	}
}