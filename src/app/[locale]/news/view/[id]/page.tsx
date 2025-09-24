import {
	ArrowLeft,
	Calendar,
	Clock,
	Tag,
	TrendingUp,
	User,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/articles/markdown-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { generatedArticles } from "@/lib/schema";
import { eq } from "drizzle-orm";

interface NewsViewPageProps {
	params: {
		locale: string;
		id: string;
	};
}

// Fetch generated article from database by ID
async function getGeneratedArticle(id: string) {
	try {
		const [article] = await db
			.select()
			.from(generatedArticles)
			.where(eq(generatedArticles.id, id))
			.limit(1);

		if (!article) {
			return null;
		}

		return {
			id: article.id,
			title: article.title,
			content: article.content,
			summary: article.summary,
			source: article.sourcePublisher || "AI Generated",
			category: article.sourceCategory || "market-intelligence",
			publishedAt: article.createdAt?.toISOString() || new Date().toISOString(),
			marketAnalysis: article.marketAnalysis,
			investmentImplications: article.investmentImplications,
			sentiment: article.sentiment,
			keywords: article.keywords as string[] || [],
			entities: article.entities as string[] || [],
			marketImpact: article.marketImpact,
			wordCount: article.wordCount,
			readingTime: article.readingTime,
			aiModel: article.aiModel,
		};
	} catch (error) {
		console.error("Failed to fetch generated article:", error);
		return null;
	}
}

export default async function NewsViewPage({ params }: NewsViewPageProps) {
	const article = await getGeneratedArticle(params.id);

	if (!article) {
		notFound();
	}

	// Build localized back link
	const backLink = `/${params.locale}/news`;

	return (
		<div className="container mx-auto px-4 py-8 max-w-4xl">
			<div className="mb-6">
				<Link
					href={backLink}
					className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to News
				</Link>
			</div>

			<article className="space-y-6">
				<header className="space-y-4">
					<h1 className="text-3xl md:text-4xl font-bold leading-tight">
						{article.title}
					</h1>

					<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
						<div className="flex items-center">
							<Calendar className="mr-1 h-4 w-4" />
							{new Date(article.publishedAt).toLocaleDateString("en-US", {
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						</div>

						<div className="flex items-center">
							<Clock className="mr-1 h-4 w-4" />
							{Math.ceil(article.content.length / 1000)} min read
						</div>

						{article.source && (
							<div className="flex items-center">
								<User className="mr-1 h-4 w-4" />
								{article.source}
							</div>
						)}

						{article.category && (
							<div className="flex items-center">
								<Tag className="mr-1 h-4 w-4" />
								<span className="capitalize">
									{article.category.replace("-", " ")}
								</span>
							</div>
						)}
					</div>
				</header>

				{article.summary && (
					<Card>
						<CardHeader>
							<CardTitle>Summary</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-foreground leading-relaxed">
								{article.summary}
							</p>
						</CardContent>
					</Card>
				)}

				<Card>
					<CardHeader>
						<CardTitle>Market Intelligence Report</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="prose prose-gray dark:prose-invert max-w-none">
							<MarkdownContent content={article.content} />
						</div>
					</CardContent>
				</Card>

				{article.marketAnalysis && (
					<Card>
						<CardHeader>
							<CardTitle>Market Analysis</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="prose prose-gray dark:prose-invert max-w-none">
								<MarkdownContent content={article.marketAnalysis} />
							</div>
						</CardContent>
					</Card>
				)}

				{article.investmentImplications && (
					<Card>
						<CardHeader>
							<CardTitle>Investment Implications</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="prose prose-gray dark:prose-invert max-w-none">
								<MarkdownContent content={article.investmentImplications} />
							</div>
						</CardContent>
					</Card>
				)}

				{article.marketImpact && (
					<Card>
						<CardHeader>
							<CardTitle>Market Impact Assessment</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-foreground leading-relaxed">
								{article.marketImpact}
							</p>
						</CardContent>
					</Card>
				)}

				{(article.keywords.length > 0 || article.entities.length > 0) && (
					<Card>
						<CardHeader>
							<CardTitle>Key Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{article.keywords.length > 0 && (
								<div>
									<h4 className="text-sm font-semibold mb-2">Keywords</h4>
									<div className="flex flex-wrap gap-2">
										{article.keywords.map((keyword, index) => (
											<span
												key={index}
												className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs"
											>
												{keyword}
											</span>
										))}
									</div>
								</div>
							)}
							{article.entities.length > 0 && (
								<div>
									<h4 className="text-sm font-semibold mb-2">Key Entities</h4>
									<div className="flex flex-wrap gap-2">
										{article.entities.map((entity, index) => (
											<span
												key={index}
												className="inline-flex items-center px-2 py-1 rounded-md bg-secondary/50 text-secondary-foreground text-xs"
											>
												{entity}
											</span>
										))}
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				)}

				<Card>
					<CardHeader>
						<CardTitle>Report Metadata</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
							{article.sentiment && (
								<div>
									<span className="font-medium">Market Sentiment:</span>{" "}
									<span className="capitalize">{article.sentiment}</span>
								</div>
							)}
							{article.wordCount && (
								<div>
									<span className="font-medium">Word Count:</span>{" "}
									{article.wordCount.toLocaleString()}
								</div>
							)}
							{article.readingTime && (
								<div>
									<span className="font-medium">Reading Time:</span>{" "}
									{article.readingTime} minutes
								</div>
							)}
							{article.aiModel && (
								<div>
									<span className="font-medium">AI Model:</span>{" "}
									{article.aiModel}
								</div>
							)}
						</div>
						<p className="text-xs text-muted-foreground mt-4">
							This report was generated using AI analysis of real-time financial data sources and market intelligence.
							Content is dynamically created to provide the latest market insights and investment considerations.
						</p>
					</CardContent>
				</Card>
			</article>
		</div>
	);
}