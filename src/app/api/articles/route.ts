import { and, count, desc, eq, inArray, like, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatedArticles } from "@/lib/schema";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const limit = parseInt(searchParams.get("limit") || "10");
		const offset = parseInt(searchParams.get("offset") || "0");
		const category = searchParams.get("category");
		const sentiment = searchParams.get("sentiment");
		const search = searchParams.get("search");

		// Build where conditions - show all public articles
		const whereConditions = [];

		if (category && category !== "all") {
			whereConditions.push(eq(generatedArticles.sourceCategory, category));
		}

		if (sentiment && sentiment !== "all") {
			whereConditions.push(eq(generatedArticles.sentiment, sentiment));
		}

		if (search && search.trim()) {
			whereConditions.push(like(generatedArticles.title, `%${search.trim()}%`));
		}

		const articles = await db
			.select({
				id: generatedArticles.id,
				title: generatedArticles.title,
				summary: generatedArticles.summary,
				keyPoints: generatedArticles.keyPoints,
				marketAnalysis: generatedArticles.marketAnalysis,
				investmentImplications: generatedArticles.investmentImplications,
				sourceTitle: generatedArticles.sourceTitle,
				sourcePublisher: generatedArticles.sourcePublisher,
				sourceCategory: generatedArticles.sourceCategory,
				sentiment: generatedArticles.sentiment,
				keywords: generatedArticles.keywords,
				entities: generatedArticles.entities,
				wordCount: generatedArticles.wordCount,
				readingTime: generatedArticles.readingTime,
				aiModel: generatedArticles.aiModel,
				createdAt: generatedArticles.createdAt,
			})
			.from(generatedArticles)
			.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
			.orderBy(desc(generatedArticles.createdAt))
			.limit(limit)
			.offset(offset);

		// Get total count for pagination
		const totalCountResult = await db
			.select({ count: count() })
			.from(generatedArticles)
			.where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

		const totalCount = totalCountResult[0]?.count || 0;

		return NextResponse.json({
			articles,
			pagination: {
				total: totalCount,
				limit,
				offset,
				hasMore: offset + limit < totalCount,
			},
			filters: {
				category,
				sentiment,
				search,
			},
		});
	} catch (error) {
		console.error("Failed to fetch articles:", error);
		return NextResponse.json(
			{ error: "Failed to fetch articles" },
			{ status: 500 },
		);
	}
}

// Get article statistics (public access)
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { action } = body;

		if (action === "stats") {
			// Get article statistics for all articles
			const stats = await db
				.select({
					sourceCategory: generatedArticles.sourceCategory,
					sentiment: generatedArticles.sentiment,
					aiModel: generatedArticles.aiModel,
					wordCount: generatedArticles.wordCount,
					readingTime: generatedArticles.readingTime,
					createdAt: generatedArticles.createdAt,
				})
				.from(generatedArticles)
				.orderBy(desc(generatedArticles.createdAt));

			// Process statistics
			const categoryCounts = stats.reduce(
				(acc, article) => {
					const category = article.sourceCategory || "unknown";
					acc[category] = (acc[category] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>,
			);

			const sentimentCounts = stats.reduce(
				(acc, article) => {
					const sentiment = article.sentiment || "neutral";
					acc[sentiment] = (acc[sentiment] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>,
			);

			const modelCounts = stats.reduce(
				(acc, article) => {
					const model = article.aiModel || "unknown";
					acc[model] = (acc[model] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>,
			);

			const avgWordCount =
				stats.length > 0
					? Math.round(
							stats.reduce(
								(sum, article) => sum + (article.wordCount || 0),
								0,
							) / stats.length,
						)
					: 0;

			const avgReadingTime =
				stats.length > 0
					? Math.round(
							stats.reduce(
								(sum, article) => sum + (article.readingTime || 0),
								0,
							) / stats.length,
						)
					: 0;

			// Get articles created in the last 7 days
			const sevenDaysAgo = new Date();
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

			const recentArticles = stats.filter(
				(article) =>
					article.createdAt && new Date(article.createdAt) > sevenDaysAgo,
			);

			return NextResponse.json({
				totalArticles: stats.length,
				categoryCounts,
				sentimentCounts,
				modelCounts,
				averages: {
					wordCount: avgWordCount,
					readingTime: avgReadingTime,
				},
				recent: {
					last7Days: recentArticles.length,
					thisWeek: recentArticles.length,
				},
			});
		}

		return NextResponse.json({ error: "Invalid action" }, { status: 400 });
	} catch (error) {
		console.error("Failed to process request:", error);
		return NextResponse.json(
			{ error: "Failed to process request" },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user || session.user.role !== "admin") {
			return NextResponse.json(
				{ error: "Unauthorized - Admin access required" },
				{ status: 403 },
			);
		}

		const body = await request.json();
		const { action, articleIds } = body;

		if (
			action !== "delete" ||
			!Array.isArray(articleIds) ||
			articleIds.length === 0
		) {
			return NextResponse.json(
				{
					error:
						'Invalid request - action must be "delete" and articleIds must be a non-empty array',
				},
				{ status: 400 },
			);
		}

		const result = await db
			.delete(generatedArticles)
			.where(inArray(generatedArticles.id, articleIds));

		return NextResponse.json({
			success: true,
			deletedCount: result.rowCount || 0,
			message: `Successfully deleted ${result.rowCount || 0} article(s)`,
		});
	} catch (error) {
		console.error("Failed to delete articles:", error);
		return NextResponse.json(
			{ error: "Failed to delete articles" },
			{ status: 500 },
		);
	}
}
