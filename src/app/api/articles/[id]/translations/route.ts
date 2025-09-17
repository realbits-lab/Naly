import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatedArticles, articleTranslations } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { isValidLocale, type Locale } from "@/i18n/config";

interface RouteParams {
	params: {
		id: string;
	};
}

export async function GET(
	request: NextRequest,
	{ params }: RouteParams
) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const { searchParams } = new URL(request.url);
		const language = searchParams.get("lang") as Locale | null;

		// Validate language parameter
		if (language && !isValidLocale(language)) {
			return NextResponse.json(
				{ error: "Invalid language code" },
				{ status: 400 }
			);
		}

		// Fetch the original article
		const [article] = await db
			.select()
			.from(generatedArticles)
			.where(eq(generatedArticles.id, params.id))
			.limit(1);

		if (!article) {
			return NextResponse.json(
				{ error: "Article not found" },
				{ status: 404 }
			);
		}

		// Check if user has access to this article
		if (article.userId !== session.user.id) {
			return NextResponse.json(
				{ error: "Access denied" },
				{ status: 403 }
			);
		}

		// If specific language requested
		if (language) {
			if (language === article.sourceLanguage) {
				// Return original article
				return NextResponse.json({
					success: true,
					article: {
						id: article.id,
						title: article.title,
						content: article.content,
						summary: article.summary,
						marketAnalysis: article.marketAnalysis,
						investmentImplications: article.investmentImplications,
						languageCode: article.sourceLanguage,
						isOriginal: true,
						translationQuality: "original",
						createdAt: article.createdAt,
						updatedAt: article.updatedAt,
					},
					metadata: {
						sourceLanguage: article.sourceLanguage,
						hasTranslations: article.hasTranslations === "true",
						wordCount: article.wordCount,
						readingTime: article.readingTime,
					},
				});
			} else {
				// Return translation
				const [translation] = await db
					.select()
					.from(articleTranslations)
					.where(
						eq(articleTranslations.articleId, params.id) &&
						eq(articleTranslations.languageCode, language)
					)
					.limit(1);

				if (!translation) {
					return NextResponse.json(
						{ error: `Translation not available in ${language}` },
						{ status: 404 }
					);
				}

				return NextResponse.json({
					success: true,
					article: {
						id: article.id,
						title: translation.title,
						content: translation.content,
						summary: translation.summary,
						marketAnalysis: translation.marketAnalysis,
						investmentImplications: translation.investmentImplications,
						languageCode: translation.languageCode,
						isOriginal: false,
						translationQuality: translation.translationQuality,
						translatedBy: translation.translatedBy,
						createdAt: translation.createdAt,
						updatedAt: translation.updatedAt,
					},
					metadata: {
						sourceLanguage: article.sourceLanguage,
						hasTranslations: article.hasTranslations === "true",
						originalCreatedAt: article.createdAt,
					},
				});
			}
		}

		// Return all available languages and translations
		const translations = await db
			.select()
			.from(articleTranslations)
			.where(eq(articleTranslations.articleId, params.id));

		const availableLanguages = [
			{
				languageCode: article.sourceLanguage,
				isOriginal: true,
				title: article.title,
				summary: article.summary,
				createdAt: article.createdAt,
			},
			...translations.map(t => ({
				languageCode: t.languageCode,
				isOriginal: false,
				title: t.title,
				summary: t.summary,
				translationQuality: t.translationQuality,
				translatedBy: t.translatedBy,
				createdAt: t.createdAt,
			}))
		];

		return NextResponse.json({
			success: true,
			articleId: article.id,
			sourceLanguage: article.sourceLanguage,
			hasTranslations: article.hasTranslations === "true",
			availableLanguages,
			metadata: {
				wordCount: article.wordCount,
				readingTime: article.readingTime,
				sentiment: article.sentiment,
				aiModel: article.aiModel,
				generationMethod: article.generationMethod,
				createdAt: article.createdAt,
			},
		});
	} catch (error) {
		console.error("Failed to fetch article translations:", error);
		return NextResponse.json(
			{ error: "Failed to fetch article translations" },
			{ status: 500 }
		);
	}
}