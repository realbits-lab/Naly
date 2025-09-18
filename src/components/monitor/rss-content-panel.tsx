"use client";

import { useState, useEffect } from "react";
import {
	ArrowLeft,
	Calendar,
	ExternalLink,
	Rss,
	User,
	Clock,
	ChevronDown,
	ChevronUp,
	Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { RssSource, RssArticle } from "./monitor-page-client";

interface RssContentPanelProps {
	source?: RssSource | null;
	articles: RssArticle[];
	selectedArticle?: RssArticle | null;
	onArticleSelect?: (article: RssArticle) => void;
	onBack?: () => void;
	loading?: boolean;
	isMobile?: boolean;
}

export function RssContentPanel({
	source,
	articles,
	selectedArticle,
	onArticleSelect,
	onBack,
	loading = false,
	isMobile = false,
}: RssContentPanelProps) {
	const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
	const [fullArticleContent, setFullArticleContent] = useState<string | null>(null);
	const [isLoadingContent, setIsLoadingContent] = useState(false);
	const [contentError, setContentError] = useState<string | null>(null);

	const formatDate = (dateString?: string) => {
		if (!dateString) return "Unknown date";
		try {
			return new Date(dateString).toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			});
		} catch {
			return "Unknown date";
		}
	};

	const handleArticleClick = (article: RssArticle) => {
		if (isMobile || !onArticleSelect) {
			// Toggle expansion on mobile or when no select handler
			setExpandedArticleId(
				expandedArticleId === article.id ? null : article.id
			);
		} else {
			// Select article for desktop view
			onArticleSelect(article);
		}
	};

	const openExternalLink = (url: string) => {
		window.open(url, "_blank", "noopener,noreferrer");
	};

	const fetchFullArticleContent = async (articleUrl: string) => {
		setIsLoadingContent(true);
		setContentError(null);
		setFullArticleContent(null);

		try {
			const response = await fetch(`/api/monitor/article?url=${encodeURIComponent(articleUrl)}`);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `HTTP ${response.status}`);
			}

			const articleData = await response.json();
			setFullArticleContent(articleData.content);
		} catch (error) {
			console.error('Error fetching full article content:', error);
			setContentError(error instanceof Error ? error.message : 'Failed to load article content');
		} finally {
			setIsLoadingContent(false);
		}
	};

	// Fetch full content when a new article is selected (desktop only)
	useEffect(() => {
		if (selectedArticle && !isMobile) {
			fetchFullArticleContent(selectedArticle.link);
		} else {
			setFullArticleContent(null);
			setContentError(null);
		}
	}, [selectedArticle, isMobile]);

	// Show placeholder when no source is selected
	if (!source) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center text-muted-foreground max-w-md">
					<Rss className="h-16 w-16 mx-auto mb-4 opacity-50" />
					<h3 className="text-lg font-medium mb-2">Select an RSS Source</h3>
					<p className="text-sm">
						Choose an RSS source from the sidebar to view its latest articles
					</p>
				</div>
			</div>
		);
	}

	// Mobile layout - show either articles list or selected article
	if (isMobile) {
		if (selectedArticle) {
			// Show selected article details
			return (
				<div className="h-full flex flex-col">
					<div className="p-4 border-b">
						<Button variant="ghost" onClick={onBack} className="mb-4">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Articles
						</Button>
						<h1 className="text-xl font-bold">{selectedArticle.title}</h1>
						<div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
							<div className="flex items-center gap-1">
								<Calendar className="h-4 w-4" />
								{formatDate(selectedArticle.publishedAt)}
							</div>
							{selectedArticle.author && (
								<div className="flex items-center gap-1">
									<User className="h-4 w-4" />
									{selectedArticle.author}
								</div>
							)}
						</div>
					</div>
					<ScrollArea className="flex-1 p-4">
						{selectedArticle.description && (
							<div className="mb-4">
								<p className="text-muted-foreground">{selectedArticle.description}</p>
							</div>
						)}
						{selectedArticle.content && (
							<div
								className="prose prose-sm max-w-none"
								dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
							/>
						)}
						<div className="mt-6">
							<Button onClick={() => openExternalLink(selectedArticle.link)}>
								<ExternalLink className="h-4 w-4 mr-2" />
								Read Full Article
							</Button>
						</div>
					</ScrollArea>
				</div>
			);
		}

		// Show articles list with expand/collapse functionality
		return (
			<div className="h-full flex flex-col">
				<div className="p-4 border-b">
					<Button variant="ghost" onClick={onBack} className="mb-4">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Sources
					</Button>
					<h1 className="text-xl font-bold">{source.name}</h1>
					<p className="text-sm text-muted-foreground">{source.description}</p>
				</div>
				<ScrollArea className="flex-1">
					{loading ? (
						<div className="p-4 space-y-4">
							{[...Array(5)].map((_, i) => (
								<Card key={i} className="p-4">
									<div className="space-y-2">
										<div className="h-4 bg-muted animate-pulse rounded" />
										<div className="h-3 bg-muted animate-pulse rounded w-3/4" />
										<div className="h-3 bg-muted animate-pulse rounded w-1/2" />
									</div>
								</Card>
							))}
						</div>
					) : (
						<div className="p-4 space-y-4">
							{articles.map((article) => {
								const isExpanded = expandedArticleId === article.id;
								return (
									<Card key={article.id} className="overflow-hidden">
										<CardHeader
											className="pb-2 cursor-pointer"
											onClick={() => handleArticleClick(article)}
										>
											<div className="flex items-start justify-between">
												<CardTitle className="text-base line-clamp-2">
													{article.title}
												</CardTitle>
												{isExpanded ? (
													<ChevronUp className="h-4 w-4 flex-shrink-0 mt-1" />
												) : (
													<ChevronDown className="h-4 w-4 flex-shrink-0 mt-1" />
												)}
											</div>
											<div className="flex items-center gap-4 text-xs text-muted-foreground">
												<div className="flex items-center gap-1">
													<Calendar className="h-3 w-3" />
													{formatDate(article.publishedAt)}
												</div>
												{article.author && (
													<div className="flex items-center gap-1">
														<User className="h-3 w-3" />
														{article.author}
													</div>
												)}
											</div>
										</CardHeader>
										{isExpanded && (
											<CardContent className="pt-0">
												{article.description && (
													<p className="text-sm text-muted-foreground mb-4">
														{article.description}
													</p>
												)}
												{article.categories && article.categories.length > 0 && (
													<div className="flex flex-wrap gap-1 mb-4">
														{article.categories.map((category, index) => (
															<Badge key={index} variant="secondary" className="text-xs">
																{typeof category === 'string' ? category : String(category)}
															</Badge>
														))}
													</div>
												)}
												<Button
													onClick={(e) => {
														e.stopPropagation();
														openExternalLink(article.link);
													}}
													size="sm"
												>
													<ExternalLink className="h-3 w-3 mr-2" />
													Read More
												</Button>
											</CardContent>
										)}
									</Card>
								);
							})}
						</div>
					)}
				</ScrollArea>
			</div>
		);
	}

	// Desktop layout - show articles list, article summary, and full content in three columns
	return (
		<div className="h-full flex">
			{/* Articles List */}
			<div className="w-1/3 border-r">
				<Card className="h-full border-none rounded-none">
					<CardHeader className="border-b">
						<CardTitle className="flex items-center gap-2">
							<img
								src={source.logoUrl}
								alt={source.name}
								className="w-5 h-5 rounded"
								onError={(e) => {
									e.currentTarget.style.display = 'none';
									e.currentTarget.nextElementSibling?.classList.remove('hidden');
								}}
							/>
							<Rss className={cn("h-5 w-5", source.logoUrl && "hidden")} />
							{source.name}
						</CardTitle>
						<p className="text-sm text-muted-foreground">{source.description}</p>
					</CardHeader>
					<CardContent className="p-0">
						<ScrollArea className="h-[calc(100vh-12rem)]">
							{loading ? (
								<div className="p-4 space-y-4">
									{[...Array(8)].map((_, i) => (
										<div key={i} className="p-4 border-b space-y-2">
											<div className="h-4 bg-muted animate-pulse rounded" />
											<div className="h-3 bg-muted animate-pulse rounded w-3/4" />
											<div className="h-3 bg-muted animate-pulse rounded w-1/2" />
										</div>
									))}
								</div>
							) : (
								<div className="divide-y">
									{articles.map((article) => (
										<div
											key={article.id}
											className={cn(
												"p-4 cursor-pointer hover:bg-muted/50 transition-colors",
												selectedArticle?.id === article.id && "bg-muted"
											)}
											onClick={() => onArticleSelect?.(article)}
										>
											<h3 className="font-medium text-sm line-clamp-2 mb-2">
												{article.title}
											</h3>
											{article.description && (
												<p className="text-xs text-muted-foreground line-clamp-2 mb-2">
													{article.description}
												</p>
											)}
											<div className="flex items-center gap-3 text-xs text-muted-foreground">
												<div className="flex items-center gap-1">
													<Calendar className="h-3 w-3" />
													{formatDate(article.publishedAt)}
												</div>
												{article.author && (
													<div className="flex items-center gap-1">
														<User className="h-3 w-3" />
														{article.author}
													</div>
												)}
											</div>
											{article.categories && article.categories.length > 0 && (
												<div className="flex flex-wrap gap-1 mt-2">
													{article.categories.slice(0, 3).map((category, index) => (
														<Badge key={index} variant="secondary" className="text-xs">
															{typeof category === 'string' ? category : String(category)}
														</Badge>
													))}
												</div>
											)}
										</div>
									))}
								</div>
							)}

							{!loading && articles.length === 0 && (
								<div className="p-8 text-center text-muted-foreground">
									<Rss className="h-12 w-12 mx-auto mb-4 opacity-50" />
									<p className="text-sm">No articles found</p>
									<p className="text-xs mt-1">This RSS source may be empty or unavailable</p>
								</div>
							)}
						</ScrollArea>
					</CardContent>
				</Card>
			</div>

			{/* Article Summary */}
			<div className="w-1/3 border-r">
				{selectedArticle ? (
					<Card className="h-full border-none rounded-none">
						<CardHeader className="border-b">
							<CardTitle className="text-lg line-clamp-2">
								{selectedArticle.title}
							</CardTitle>
							<div className="flex items-center gap-4 text-sm text-muted-foreground">
								<div className="flex items-center gap-1">
									<Calendar className="h-4 w-4" />
									{formatDate(selectedArticle.publishedAt)}
								</div>
								{selectedArticle.author && (
									<div className="flex items-center gap-1">
										<User className="h-4 w-4" />
										{selectedArticle.author}
									</div>
								)}
								<Button
									onClick={() => openExternalLink(selectedArticle.link)}
									size="sm"
									variant="outline"
								>
									<ExternalLink className="h-3 w-3 mr-2" />
									Open Original
								</Button>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<ScrollArea className="h-[calc(100vh-12rem)] p-6">
								{selectedArticle.description && (
									<div className="mb-6">
										<p className="text-muted-foreground leading-relaxed">
											{selectedArticle.description}
										</p>
									</div>
								)}
								{selectedArticle.content && (
									<div
										className="prose prose-sm max-w-none"
										dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
									/>
								)}
								{selectedArticle.categories && selectedArticle.categories.length > 0 && (
									<div className="mt-6 pt-6 border-t">
										<h4 className="text-sm font-medium mb-2">Categories</h4>
										<div className="flex flex-wrap gap-2">
											{selectedArticle.categories.map((category, index) => (
												<Badge key={index} variant="secondary">
													{typeof category === 'string' ? category : String(category)}
												</Badge>
											))}
										</div>
									</div>
								)}
							</ScrollArea>
						</CardContent>
					</Card>
				) : (
					<div className="h-full flex items-center justify-center">
						<div className="text-center text-muted-foreground max-w-md">
							<Rss className="h-16 w-16 mx-auto mb-4 opacity-50" />
							<h3 className="text-lg font-medium mb-2">Select an Article</h3>
							<p className="text-sm">
								Choose an article from the list to view its content
							</p>
						</div>
					</div>
				)}
			</div>

			{/* Full Article Content */}
			<div className="w-1/3">
				{selectedArticle ? (
					<Card className="h-full border-none rounded-none">
						<CardHeader className="border-b">
							<CardTitle className="text-sm font-medium">
								Full Article Content
							</CardTitle>
							<div className="flex items-center gap-2">
								{isLoadingContent && (
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Loader2 className="h-3 w-3 animate-spin" />
										Loading content...
									</div>
								)}
								{contentError && (
									<div className="text-sm text-red-500">
										{contentError}
									</div>
								)}
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<ScrollArea className="h-[calc(100vh-12rem)]">
								<div className="p-6">
									{isLoadingContent ? (
										<div className="flex items-center justify-center py-8">
											<div className="text-center">
												<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
												<p className="text-sm text-muted-foreground">
													Extracting article content...
												</p>
											</div>
										</div>
									) : contentError ? (
										<div className="text-center py-8">
											<div className="text-red-500 mb-4">
												<ExternalLink className="h-8 w-8 mx-auto mb-2" />
												<p className="text-sm font-medium">Failed to load content</p>
												<p className="text-xs text-muted-foreground mt-1">
													{contentError?.includes('Network error') || contentError?.includes('HTTP error') ?
														'This website blocks automated content extraction. Please use "Open Original" to read the full article.' :
														contentError
													}
												</p>
											</div>
											<Button
												onClick={() => fetchFullArticleContent(selectedArticle.link)}
												size="sm"
												variant="outline"
											>
												Try Again
											</Button>
										</div>
									) : fullArticleContent ? (
										<div
											className="prose prose-sm max-w-none"
											dangerouslySetInnerHTML={{ __html: fullArticleContent }}
										/>
									) : null}
								</div>
							</ScrollArea>
						</CardContent>
					</Card>
				) : (
					<div className="h-full flex items-center justify-center">
						<div className="text-center text-muted-foreground max-w-md">
							<Rss className="h-16 w-16 mx-auto mb-4 opacity-50" />
							<h3 className="text-lg font-medium mb-2">Full Article</h3>
							<p className="text-sm">
								Select an article to view its complete content
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}