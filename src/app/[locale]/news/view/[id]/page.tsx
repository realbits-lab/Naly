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
import { NewsService } from "@/lib/news-service";

interface NewsViewPageProps {
	params: {
		locale: string;
		id: string;
	};
	searchParams: {
		title?: string;
		content?: string;
		source?: string;
		category?: string;
		publishedAt?: string;
		summary?: string;
	};
}

// This function reconstructs the article from URL parameters or fetches fresh news
async function getNewsArticle(id: string, searchParams: NewsViewPageProps['searchParams']) {
	try {
		// If we have URL parameters, use them to reconstruct the article
		if (searchParams.title && searchParams.content) {
			return {
				id,
				title: decodeURIComponent(searchParams.title),
				content: decodeURIComponent(searchParams.content),
				source: searchParams.source ? decodeURIComponent(searchParams.source) : "Financial News",
				category: searchParams.category ? decodeURIComponent(searchParams.category) : "general",
				publishedAt: searchParams.publishedAt || new Date().toISOString(),
				summary: searchParams.summary ? decodeURIComponent(searchParams.summary) : undefined,
			};
		}

		// Fallback: fetch fresh news and try to find a matching article
		const newsService = new NewsService();
		const articles = await newsService.fetchLatestNews();

		// Try to find an article that matches the ID pattern
		const matchingArticle = articles.find(article =>
			id.includes(article.title.slice(0, 20).replace(/\s+/g, '-').toLowerCase())
		);

		if (matchingArticle) {
			return {
				id,
				title: matchingArticle.title,
				content: matchingArticle.content,
				source: matchingArticle.source,
				category: matchingArticle.category,
				publishedAt: matchingArticle.publishedAt,
				summary: matchingArticle.summary,
			};
		}

		return null;
	} catch (error) {
		console.error("Failed to fetch news article:", error);
		return null;
	}
}

export default async function NewsViewPage({ params, searchParams }: NewsViewPageProps) {
	const article = await getNewsArticle(params.id, searchParams);

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
							<p className="text-muted-foreground leading-relaxed">
								{article.summary}
							</p>
						</CardContent>
					</Card>
				)}

				<Card>
					<CardHeader>
						<CardTitle>Article Content</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="prose prose-gray dark:prose-invert max-w-none">
							<MarkdownContent content={article.content} />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Real-Time Financial News</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							This article was generated from real-time financial data sources and web search using AI analysis.
							Content is updated dynamically to provide the latest market insights and financial intelligence.
						</p>
					</CardContent>
				</Card>
			</article>
		</div>
	);
}