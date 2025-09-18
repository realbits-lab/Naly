import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rssArticles } from '@/lib/schema/rss';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
	try {
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
				content: rssArticles.extractedContent,
				textContent: rssArticles.extractedTextContent,
				excerpt: rssArticles.excerpt,
				byline: rssArticles.byline,
				siteName: rssArticles.siteName,
				publishedTime: rssArticles.publishedAt,
			})
			.from(rssArticles)
			.where(eq(rssArticles.link, url))
			.limit(1);

		if (existingArticle.length > 0 && existingArticle[0].content) {
			// Return the cached content
			return NextResponse.json({
				title: existingArticle[0].title,
				content: existingArticle[0].content,
				textContent: existingArticle[0].textContent,
				excerpt: existingArticle[0].excerpt,
				byline: existingArticle[0].byline,
				siteName: existingArticle[0].siteName,
				publishedTime: existingArticle[0].publishedTime,
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