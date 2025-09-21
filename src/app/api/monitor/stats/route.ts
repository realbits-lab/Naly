import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UserRole } from "@/types/user";
import { db } from "@/lib/db";
import { rssArticles, rssSources } from "@/lib/schema/rss";
import { eq, desc, and, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
	try {
		// Check authentication
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

		// Get total sources count
		const sources = await db.select({
			id: rssSources.id,
			isActive: rssSources.isActive
		}).from(rssSources);

		const totalSources = sources.filter(s => s.isActive).length;

		// Get all articles and manually count
		const allArticles = await db
			.select({
				id: rssArticles.id,
				isProcessed: rssArticles.isProcessed,
				isArchived: rssArticles.isArchived,
			})
			.from(rssArticles);

		// Get recent unprocessed articles with source info
		const recentUnprocessedArticles = await db
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
				isProcessed: rssArticles.isProcessed,
				fullContent: rssArticles.fullContent,
				sourceName: rssSources.name,
				sourceCategory: rssSources.category,
				sourceLogo: rssSources.logoUrl,
			})
			.from(rssArticles)
			.innerJoin(rssSources, eq(rssArticles.sourceId, rssSources.id))
			.where(eq(rssArticles.isProcessed, false))
			.orderBy(desc(rssArticles.publishedAt))
			.limit(10);

		// Manually count to avoid SQL object issues
		const statsData = {
			totalArticles: allArticles.length,
			processedArticles: allArticles.filter(a => a.isProcessed).length,
			unprocessedArticles: allArticles.filter(a => !a.isProcessed).length,
			archivedArticles: allArticles.filter(a => a.isArchived).length,
		};

		// Calculate summary for "Last Update" based on unprocessed articles
		const updateSummary = {
			totalSources: totalSources,
			processedSources: totalSources, // All active sources are considered "processed" when fetching
			failedSources: 0, // This would need tracking in a separate table or field
			newArticles: statsData.unprocessedArticles,
			totalArticles: recentUnprocessedArticles.length, // Latest 10 unprocessed articles
		};

		return NextResponse.json({
			success: true,
			summary: updateSummary,
			articles: recentUnprocessedArticles.map(article => ({
				id: String(article.id),
				title: String(article.title || ''),
				description: String(article.description || ''),
				link: String(article.link || ''),
				publishedAt: article.publishedAt?.toISOString() || new Date().toISOString(),
				author: article.author ? String(article.author) : null,
				categories: Array.isArray(article.categories) ? article.categories.map(c => String(c)) : [],
				sentiment: article.sentiment ? String(article.sentiment) : null,
				imageUrl: article.imageUrl ? String(article.imageUrl) : null,
				isProcessed: Boolean(article.isProcessed),
				fullContent: article.fullContent ? String(article.fullContent) : null,
				sourceName: String(article.sourceName || ''),
				sourceCategory: String(article.sourceCategory || ''),
				sourceLogo: article.sourceLogo ? String(article.sourceLogo) : null,
				isNew: !article.isProcessed,
			})),
			stats: {
				total: statsData.totalArticles,
				processed: statsData.processedArticles,
				unprocessed: statsData.unprocessedArticles,
				archived: statsData.archivedArticles,
			}
		});

	} catch (error) {
		console.error("Error fetching monitor stats:", error);
		return NextResponse.json(
			{ error: "Failed to fetch monitor statistics", details: error instanceof Error ? error.message : String(error) },
			{ status: 500 }
		);
	}
}