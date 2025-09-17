"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LatestNewsPanel } from "@/components/articles/latest-news-panel";

interface Article {
	id: string;
	title: string;
	summary: string;
	content: string;
	source: string;
	publishedAt: string;
	sentiment?: "positive" | "negative" | "neutral";
	category?: string;
	symbols?: string[];
	url?: string;
}

export function NewsPanel() {
	const [selectedArticles, setSelectedArticles] = useState<Article[]>([]);
	const [isGenerating, setIsGenerating] = useState(false);

	const handleGenerateFromSelected = async (articles: Article[]) => {
		setSelectedArticles(articles);
		setIsGenerating(true);

		try {
			console.log(
				`Generating article from ${articles.length} selected articles`,
			);

			const response = await fetch("/api/news/generate-article", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					selectedArticles: articles.map((article) => ({
						id: article.id,
						title: article.title,
						summary: article.summary,
						content: article.content,
						source: article.source,
						publishedAt: article.publishedAt,
					})),
				}),
			});

			if (!response.ok) {
				throw new Error(`Failed to generate article: ${response.statusText}`);
			}

			const result = await response.json();
			console.log(
				"Article generated successfully:",
				result.generatedArticle.title,
			);
			console.log("Article saved with ID:", result.metadata.articleId);

			// Show success message
			toast.success(
				`Successfully generated article: "${result.generatedArticle.title}"`,
				{
					description: `Article saved with ID: ${result.metadata.articleId}`,
					duration: 5000,
				},
			);
		} catch (error) {
			console.error("Failed to generate article:", error);
			toast.error("Failed to generate article", {
				description: "Please try again or check the console for more details.",
				duration: 5000,
			});
		} finally {
			setIsGenerating(false);
			setSelectedArticles([]);
		}
	};

	return (
		<div className="h-full overflow-auto">
			<div className="p-6">
				<div className="mb-6">
					<h1 className="text-2xl font-bold text-foreground">
						Latest News Creation
					</h1>
					<p className="text-muted-foreground mt-1">
						Generate articles from the latest financial news and market updates
					</p>
				</div>

				<div className="max-w-4xl">
					<LatestNewsPanel
						onGenerateFromSelected={handleGenerateFromSelected}
						isGenerating={isGenerating}
					/>
				</div>

				{selectedArticles.length > 0 && (
					<div className="mt-6 p-4 bg-muted rounded-lg">
						<h3 className="font-medium mb-2">
							Selected Articles for Generation:
						</h3>
						<ul className="space-y-1">
							{selectedArticles.map((article) => (
								<li key={article.id} className="text-sm text-muted-foreground">
									• {article.title}
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</div>
	);
}
