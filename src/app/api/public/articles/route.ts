import { and, desc, eq, like } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
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

		// Build where conditions for public access
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
			.select({ count: generatedArticles.id })
			.from(generatedArticles)
			.where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

		const totalCount = totalCountResult.length;

		return NextResponse.json({
			success: true,
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
		console.error("Failed to fetch public articles:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to fetch articles",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
