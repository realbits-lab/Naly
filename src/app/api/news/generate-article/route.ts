import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ArticleGenerator } from "@/lib/article-generator";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NewsService } from "@/lib/news-service";
import { generatedArticles } from "@/lib/schema";

// Schema for optional custom news input
const customNewsSchema = z
	.object({
		title: z.string().optional(),
		content: z.string().optional(),
		source: z.string().optional(),
		category: z.string().optional(),
	})
	.optional();

// Schema for selected articles
const selectedArticlesSchema = z
	.array(
		z.object({
			id: z.string(),
			title: z.string(),
			summary: z.string().optional(),
			content: z.string().optional(),
			source: z.string().optional(),
			publishedAt: z.string().optional(),
		}),
	)
	.optional();

export async function POST(request: NextRequest) {
	try {
		// Debug request headers
		console.log(
			"Request headers:",
			Object.fromEntries(request.headers.entries()),
		);
		console.log("Request cookies:", request.cookies.getAll());

		const session = await auth();

		console.log("Session object:", JSON.stringify(session, null, 2));
		console.log("User ID:", session?.user?.id);

		if (!session?.user?.id) {
			console.error("Authentication failed - no user ID found");
			return NextResponse.json(
				{
					error: "Unauthorized",
					debug: {
						hasSession: !!session,
						hasUser: !!session?.user,
						userId: session?.user?.id,
					},
				},
				{ status: 401 },
			);
		}

		const body = await request.json();
		const customNews = customNewsSchema.parse(body.customNews);
		const selectedArticles = selectedArticlesSchema.parse(
			body.selectedArticles,
		);

		const newsService = new NewsService();
		const articleGenerator = new ArticleGenerator();

		let newsResult;

		if (selectedArticles && selectedArticles.length > 0) {
			// Use selected articles provided by user
			console.log(`Processing ${selectedArticles.length} selected articles`);

			// Convert selected articles to the format expected by the news service
			const processedArticles = selectedArticles.map((article) => ({
				title: article.title,
				content: article.content || article.summary || "",
				url: `selected://article-${article.id}`,
				source: article.source || "Selected Article",
				publishedAt: article.publishedAt || new Date().toISOString(),
				category: "selected",
			}));

			// Use the first article as primary and gather related info
			const primaryArticle = processedArticles[0];
			const relatedInfo =
				await newsService.gatherRelatedInformation(primaryArticle);

			// Gather additional sources information
			const additionalSources = processedArticles.length > 1
				? processedArticles
					.slice(1)
					.map((article) => ({
						title: article.title,
						source: article.source,
						summary: article.content.substring(0, 200) + "...",
					}))
				: [];

			newsResult = {
				articles: processedArticles,
				relatedInfo,
			};
		} else if (customNews && customNews.title && customNews.content) {
			// Use custom news provided by user
			const customArticle = {
				title: customNews.title,
				content: customNews.content,
				url: "custom://user-provided",
				source: customNews.source || "User Provided",
				publishedAt: new Date().toISOString(),
				category: customNews.category || "general",
			};

			const relatedInfo =
				await newsService.gatherRelatedInformation(customArticle);
			newsResult = {
				articles: [customArticle],
				relatedInfo,
			};
		} else {
			// Fetch latest famous news automatically
			newsResult = await newsService.processLatestNews();
		}

		const selectedArticle = newsResult.articles[0];
		const relatedInfo = newsResult.relatedInfo;

		// Generate the comprehensive article
		const generatedArticle = await articleGenerator.generateArticle(
			selectedArticle,
			relatedInfo,
		);

		// Verify we still have a valid user ID before saving
		if (!session.user?.id) {
			console.error("Lost user session during article generation");
			return NextResponse.json(
				{
					error: "Session expired during processing",
					message: "Please sign in again and try the operation again",
				},
				{ status: 401 },
			);
		}

		console.log("About to save article with user ID:", session.user.id);

		// Save the generated article to database
		const [savedArticle] = await db
			.insert(generatedArticles)
			.values({
				userId: session.user.id,
				title: generatedArticle.title,
				content: generatedArticle.content,
				summary: generatedArticle.summary,
				keyPoints: generatedArticle.keyPoints,
				marketAnalysis: generatedArticle.marketAnalysis,
				investmentImplications: generatedArticle.investmentImplications,

				// Source information - use primary article
				sourceTitle: selectedArticle.title,
				sourceContent: selectedArticle.content,
				sourceUrl: selectedArticle.url,
				sourcePublisher: selectedArticle.source,
				sourceCategory: selectedArticle.category,

				// Analysis metadata
				sentiment: relatedInfo.sentiment,
				keywords: relatedInfo.keywords,
				entities: relatedInfo.entities,
				marketImpact: relatedInfo.marketImpact,

				// Article metadata
				wordCount: generatedArticle.metadata.wordCount,
				readingTime: generatedArticle.metadata.readingTime,
				aiModel: process.env.OPENAI_API_KEY ? "gpt-4" : "mock",
				generationMethod:
					selectedArticles && selectedArticles.length > 0
						? "selected-articles"
						: customNews && customNews.title
							? "custom"
							: "auto",
			})
			.returning();

		console.log(`Generated and saved article: ${generatedArticle.title}`);
		console.log(`Article ID: ${savedArticle.id}`);

		// Return the complete result
		return NextResponse.json({
			success: true,
			sourceNews: selectedArticle,
			relatedInformation: relatedInfo,
			generatedArticle: {
				...generatedArticle,
				id: savedArticle.id,
				savedAt: savedArticle.createdAt,
			},
			metadata: {
				processingTime: "Real-time generation",
				aiModel: process.env.OPENAI_API_KEY ? "GPT-4" : "Mock Generation",
				sources: newsResult.articles.length,
				generatedAt: new Date().toISOString(),
				articleId: savedArticle.id,
			},
		});
	} catch (error) {
		console.error("Failed to generate article:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid input format", details: error.errors },
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{
				error: "Failed to generate article",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const category = searchParams.get("category");
		const limit = parseInt(searchParams.get("limit") || "1");

		const newsService = new NewsService();

		// Fetch latest news
		const articles = await newsService.fetchLatestNews();

		// Filter by category if specified
		const filteredArticles = category
			? articles.filter((article) => article.category === category)
			: articles;

		// Select the specified number of articles
		const selectedArticles = filteredArticles.slice(0, limit);

		// Get related information for each article
		const articlesWithInfo = await Promise.all(
			selectedArticles.map(async (article) => {
				const relatedInfo = await newsService.gatherRelatedInformation(article);
				return {
					article,
					relatedInfo,
				};
			}),
		);

		return NextResponse.json({
			success: true,
			count: articlesWithInfo.length,
			articles: articlesWithInfo,
			availableCategories: [
				"monetary-policy",
				"technology",
				"energy",
				"cryptocurrency",
				"business",
				"financial",
			],
		});
	} catch (error) {
		console.error("Failed to fetch news:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch news",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
