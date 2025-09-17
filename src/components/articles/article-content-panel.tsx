"use client";

import {
	Bookmark,
	Calendar,
	Clock,
	ExternalLink,
	Eye,
	Share2,
	Tag,
	TrendingUp,
	User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MarkdownContent } from "@/components/articles/markdown-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Article {
	id: string;
	title: string;
	summary?: string;
	content?: string;
	createdAt: string;
	sourcePublisher?: string;
	sourceCategory?: string;
	sentiment?: string;
	readingTime?: number;
}

interface ArticleContentPanelProps {
	article: Article | null;
}

export function ArticleContentPanel({ article }: ArticleContentPanelProps) {
	const [fullArticle, setFullArticle] = useState<Article | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (article) {
			fetchFullArticle(article.id);
		}
	}, [article]);

	const fetchFullArticle = async (articleId: string) => {
		try {
			setLoading(true);
			const response = await fetch(`/api/articles/${articleId}`);
			if (response.ok) {
				const data = await response.json();
				setFullArticle(data.article);
			} else {
				setFullArticle(article);
			}
		} catch (error) {
			console.error("Failed to fetch full article:", error);
			setFullArticle(article);
		} finally {
			setLoading(false);
		}
	};

	const getSentimentColor = (sentiment?: string) => {
		switch (sentiment) {
			case "positive":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "negative":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
			case "neutral":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
		}
	};

	const handleShare = () => {
		if (navigator.share && fullArticle) {
			navigator.share({
				title: fullArticle.title,
				text: fullArticle.summary,
				url: window.location.href,
			});
		} else {
			navigator.clipboard.writeText(window.location.href);
			toast.success("Link copied to clipboard");
		}
	};

	const handleBookmark = () => {
		toast.success("Article bookmarked");
	};

	if (!article) {
		return (
			<div className="flex-1 flex items-center justify-center bg-muted/20">
				<div className="text-center space-y-4">
					<div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
						<Eye className="h-8 w-8 text-muted-foreground" />
					</div>
					<div>
						<h3 className="text-lg font-medium text-foreground">
							Select an Article
						</h3>
						<p className="text-muted-foreground">
							Choose an article from the sidebar to view its content
						</p>
					</div>
				</div>
			</div>
		);
	}

	const displayArticle = fullArticle || article;

	return (
		<div className="flex-1 overflow-y-auto bg-background">
			<div className="max-w-4xl mx-auto p-6">
				{loading && (
					<div className="mb-6">
						<div className="h-8 bg-muted rounded animate-pulse mb-4" />
						<div className="h-4 bg-muted rounded animate-pulse mb-2" />
						<div className="h-4 bg-muted rounded animate-pulse w-3/4" />
					</div>
				)}

				{!loading && displayArticle && (
					<>
						{/* Article Header */}
						<div className="mb-8">
							<h1 className="text-3xl font-bold text-foreground mb-4 leading-tight">
								{displayArticle.title}
							</h1>

							{displayArticle.summary && (
								<p className="text-lg text-muted-foreground mb-6 leading-relaxed">
									{displayArticle.summary}
								</p>
							)}

							{/* Article Metadata */}
							<div className="flex flex-wrap items-center gap-4 pb-4 border-b border-border">
								<div className="flex items-center text-sm text-muted-foreground">
									<Calendar className="h-4 w-4 mr-2" />
									<span>
										{new Date(displayArticle.createdAt).toLocaleDateString(
											"en-US",
											{
												year: "numeric",
												month: "long",
												day: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											},
										)}
									</span>
								</div>

								{displayArticle.readingTime && (
									<div className="flex items-center text-sm text-muted-foreground">
										<Clock className="h-4 w-4 mr-2" />
										<span>{displayArticle.readingTime} min read</span>
									</div>
								)}

								{displayArticle.sourcePublisher && (
									<div className="flex items-center text-sm text-muted-foreground">
										<User className="h-4 w-4 mr-2" />
										<span>{displayArticle.sourcePublisher}</span>
									</div>
								)}

								{displayArticle.sentiment && (
									<Badge
										className={getSentimentColor(displayArticle.sentiment)}
									>
										<TrendingUp className="h-3 w-3 mr-1" />
										{displayArticle.sentiment}
									</Badge>
								)}

								{displayArticle.sourceCategory && (
									<Badge variant="secondary">
										<Tag className="h-3 w-3 mr-1" />
										{displayArticle.sourceCategory}
									</Badge>
								)}
							</div>

							{/* Action Buttons */}
							<div className="flex items-center gap-2 mt-4">
								<Button variant="outline" size="sm" onClick={handleShare}>
									<Share2 className="h-4 w-4 mr-2" />
									Share
								</Button>

								<Button variant="outline" size="sm" onClick={handleBookmark}>
									<Bookmark className="h-4 w-4 mr-2" />
									Bookmark
								</Button>

								<Button variant="outline" size="sm" asChild>
									<a
										href={`/news/${displayArticle.id}`}
										target="_blank"
										rel="noopener noreferrer"
									>
										<ExternalLink className="h-4 w-4 mr-2" />
										Open in New Tab
									</a>
								</Button>
							</div>
						</div>

						{/* Article Content */}
						{displayArticle.content ? (
							<div className="prose prose-lg max-w-none">
								<MarkdownContent content={displayArticle.content} />
							</div>
						) : (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center text-muted-foreground">
										<Eye className="h-5 w-5 mr-2" />
										Content Preview
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-muted-foreground">
										{displayArticle.summary ||
											"Full content is not available for this article."}
									</p>
									<Button className="mt-4" asChild>
										<a href={`/news/${displayArticle.id}`}>View Full Article</a>
									</Button>
								</CardContent>
							</Card>
						)}
					</>
				)}
			</div>
		</div>
	);
}
