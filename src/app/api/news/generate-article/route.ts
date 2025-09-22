import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiArticleGenerator } from "@/lib/ai-article-generator";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NewsService } from "@/lib/news-service";
import { translationService } from "@/lib/translation-service";
import { generatedArticles, articleTranslations } from "@/lib/schema";
import { eq } from "drizzle-orm";

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

// Schema for AI generation options
const aiOptionsSchema = z
	.object({
		audienceLevel: z.enum(["retail", "institutional", "professional"]).optional().default("professional"),
		analysisDepth: z.enum(["standard", "comprehensive", "executive_brief"]).optional().default("standard"),
		focusArea: z.enum(["market_impact", "investment_strategy", "risk_analysis"]).optional().default("market_impact"),
		generateVariations: z.boolean().optional().default(false),
		variationCount: z.number().min(1).max(5).optional().default(3),
	})
	.optional()
	.default({});

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
		const aiOptions = aiOptionsSchema.parse(body.aiOptions);

		const newsService = new NewsService();

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

		// Generate AI-powered comprehensive article
		let generatedArticleVariations;

		if (aiOptions.generateVariations) {
			console.log(`Generating ${aiOptions.variationCount} article variations...`);
			generatedArticleVariations = await aiArticleGenerator.generateArticleVariations(
				selectedArticle,
				relatedInfo,
				aiOptions.variationCount
			);
		} else {
			console.log("Generating single AI-powered article...");
			const singleArticle = await aiArticleGenerator.generateArticle(
				selectedArticle,
				relatedInfo,
				{
					audienceLevel: aiOptions.audienceLevel,
					analysisDepth: aiOptions.analysisDepth,
					focusArea: aiOptions.focusArea,
				}
			);
			generatedArticleVariations = [singleArticle];
		}

		// Use the first (or best) generated article
		const primaryGeneratedArticle = generatedArticleVariations[0];

		// Validate article quality
		const qualityCheck = aiArticleGenerator.validateArticleQuality(primaryGeneratedArticle);
		console.log(`Article quality score: ${qualityCheck.score}/100`);
		if (qualityCheck.issues.length > 0) {
			console.warn("Article quality issues:", qualityCheck.issues);
		}

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

		// Convert AI-generated article structure to database format
		const fullContent = `${primaryGeneratedArticle.content.introduction}\n\n${primaryGeneratedArticle.content.analysis}\n\n${primaryGeneratedArticle.content.market_context}\n\n${primaryGeneratedArticle.content.stakeholder_impact}\n\n${primaryGeneratedArticle.content.risk_assessment}\n\n${primaryGeneratedArticle.content.conclusion}`;

		// Save the generated article to database
		const [savedArticle] = await db
			.insert(generatedArticles)
			.values({
				userId: session.user.id,
				title: primaryGeneratedArticle.title,
				content: fullContent,
				summary: primaryGeneratedArticle.executive_summary,
				keyPoints: primaryGeneratedArticle.key_insights,
				marketAnalysis: `${primaryGeneratedArticle.market_analysis.immediate_impact}\n\n${primaryGeneratedArticle.market_analysis.medium_term_outlook}\n\n${primaryGeneratedArticle.market_analysis.long_term_implications}`,
				investmentImplications: primaryGeneratedArticle.investment_recommendations.portfolio_considerations,

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
				wordCount: Math.round(fullContent.length / 5), // Approximate word count
				readingTime: primaryGeneratedArticle.metadata.reading_time_minutes,
				aiModel: "gpt-4o-ai-gateway", // Using AI Gateway with GPT-4O
				generationMethod:
					selectedArticles && selectedArticles.length > 0
						? "ai-selected-articles"
						: customNews && customNews.title
							? "ai-custom"
							: "ai-auto",

				// Multi-language support
				sourceLanguage: "en",
				hasTranslations: "false", // Will be updated to "true" after translation
			})
			.returning();

		console.log(`Generated and saved article: ${primaryGeneratedArticle.title}`);
		console.log(`Article ID: ${savedArticle.id}`);

		// Generate Korean translation
		let koreanTranslation = null;
		try {
			console.log("Generating Korean translation...");
			koreanTranslation = await translationService.translateArticle(
				{
					title: primaryGeneratedArticle.title,
					content: fullContent,
					summary: primaryGeneratedArticle.executive_summary,
					marketAnalysis: `${primaryGeneratedArticle.market_analysis.immediate_impact}\n\n${primaryGeneratedArticle.market_analysis.medium_term_outlook}\n\n${primaryGeneratedArticle.market_analysis.long_term_implications}`,
					investmentImplications: primaryGeneratedArticle.investment_recommendations.portfolio_considerations,
				},
				"en",
				"ko"
			);

			// Save Korean translation to database
			await db.insert(articleTranslations).values({
				articleId: savedArticle.id,
				languageCode: "ko",
				title: koreanTranslation.title,
				content: koreanTranslation.content,
				summary: koreanTranslation.summary,
				marketAnalysis: koreanTranslation.marketAnalysis,
				investmentImplications: koreanTranslation.investmentImplications,
				translatedBy: koreanTranslation.translatedBy,
				translationQuality: koreanTranslation.translationQuality,
			});

			// Update article to indicate it has translations
			await db
				.update(generatedArticles)
				.set({ hasTranslations: "true" })
				.where(eq(generatedArticles.id, savedArticle.id));

			console.log("Korean translation saved successfully");
		} catch (translationError) {
			console.error("Failed to generate Korean translation:", translationError);
			// Continue without translation - don't fail the entire request
		}

		// Return the complete result
		return NextResponse.json({
			success: true,
			sourceNews: selectedArticle,
			relatedInformation: relatedInfo,
			generatedArticle: {
				id: savedArticle.id,
				title: primaryGeneratedArticle.title,
				content: fullContent,
				summary: primaryGeneratedArticle.executive_summary,
				keyInsights: primaryGeneratedArticle.key_insights,
				marketAnalysis: {
					immediate: primaryGeneratedArticle.market_analysis.immediate_impact,
					mediumTerm: primaryGeneratedArticle.market_analysis.medium_term_outlook,
					longTerm: primaryGeneratedArticle.market_analysis.long_term_implications,
					affectedSectors: primaryGeneratedArticle.market_analysis.affected_sectors,
					sentiment: primaryGeneratedArticle.market_analysis.sentiment_analysis,
				},
				investmentRecommendations: primaryGeneratedArticle.investment_recommendations,
				confidenceMetrics: primaryGeneratedArticle.confidence_metrics,
				metadata: {
					...primaryGeneratedArticle.metadata,
					wordCount: Math.round(fullContent.length / 5),
				},
				savedAt: savedArticle.createdAt,
				sourceLanguage: "en",
				hasTranslations: koreanTranslation ? true : false,
			},
			aiGeneration: {
				options: aiOptions,
				qualityScore: qualityCheck.score,
				qualityIssues: qualityCheck.issues,
				variationsGenerated: generatedArticleVariations.length,
				variations: aiOptions.generateVariations ? generatedArticleVariations.map((article, index) => ({
					index,
					title: article.title,
					summary: article.executive_summary,
					confidenceScore: (article.confidence_metrics.data_quality + article.confidence_metrics.prediction_confidence + article.confidence_metrics.analysis_depth) / 3,
				})) : null,
			},
			translations: koreanTranslation ? {
				ko: {
					title: koreanTranslation.title,
					content: koreanTranslation.content,
					summary: koreanTranslation.summary,
					marketAnalysis: koreanTranslation.marketAnalysis,
					investmentImplications: koreanTranslation.investmentImplications,
					languageCode: "ko",
					translationQuality: koreanTranslation.translationQuality,
					translatedBy: koreanTranslation.translatedBy,
				}
			} : null,
			metadata: {
				processingTime: "AI-powered real-time generation",
				aiModel: "GPT-4O via AI Gateway",
				aiProvider: "Vercel AI SDK",
				sources: newsResult.articles.length,
				generatedAt: new Date().toISOString(),
				articleId: savedArticle.id,
				supportedLanguages: ["en", ...(koreanTranslation ? ["ko"] : [])],
				translationStatus: koreanTranslation ? "completed" : "failed",
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
