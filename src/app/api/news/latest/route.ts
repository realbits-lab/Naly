import { type NextRequest, NextResponse } from "next/server";
import { NewsService } from "@/lib/news-service";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const category = searchParams.get("category");
		const limit = parseInt(searchParams.get("limit") || "10");
		const offset = parseInt(searchParams.get("offset") || "0");

		console.log("🔍 Fetching latest news for public access...");

		const newsService = new NewsService();

		// Fetch latest news using real financial data
		const articles = await newsService.fetchLatestNews();

		// Filter by category if specified
		const filteredArticles = category && category !== "all"
			? articles.filter((article) => article.category === category)
			: articles;

		// Apply pagination
		const paginatedArticles = filteredArticles.slice(offset, offset + limit);

		// Transform articles to match expected format for NewsSidebar
		const transformedArticles = paginatedArticles.map(article => ({
			id: `news-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			title: article.title,
			summary: article.summary,
			content: article.content,
			createdAt: article.publishedAt,
			sourcePublisher: article.source,
			sourceCategory: article.category,
			sentiment: "neutral", // Will be analyzed by enhanced service
			readingTime: Math.ceil(article.content.length / 1000), // Rough estimate
		}));

		console.log(`✅ Successfully fetched ${transformedArticles.length} news articles`);

		return NextResponse.json({
			articles: transformedArticles,
			pagination: {
				total: filteredArticles.length,
				limit,
				offset,
				hasMore: offset + limit < filteredArticles.length,
			},
			filters: {
				category,
			},
			metadata: {
				fetchedAt: new Date().toISOString(),
				source: "real-financial-apis",
				totalAvailable: articles.length
			}
		});
	} catch (error) {
		console.error("❌ Failed to fetch latest news:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch latest news",
				message: error instanceof Error ? error.message : "Unknown error",
				articles: [], // Return empty array for graceful degradation
				pagination: {
					total: 0,
					limit: parseInt(request.url.split("limit=")[1]?.split("&")[0] || "10"),
					offset: parseInt(request.url.split("offset=")[1]?.split("&")[0] || "0"),
					hasMore: false
				}
			},
			{ status: 500 },
		);
	}
}