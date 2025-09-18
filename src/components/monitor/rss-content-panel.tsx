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
import Parser from "rss-parser";
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
	const [rssContent, setRssContent] = useState<string | null>(null);
	const [isLoadingRss, setIsLoadingRss] = useState(false);
	const [rssError, setRssError] = useState<string | null>(null);

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

	const fetchRssContent = async (articleUrl: string) => {
		setIsLoadingRss(true);
		setRssError(null);
		setRssContent(null);

		try {
			// Use CORS proxy for client-side RSS parsing (reliable 2025 option)
			const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(articleUrl)}`;
			const parser = new Parser();

			// Try to parse the URL as RSS content directly
			const response = await fetch(proxyUrl);
			const rssText = await response.text();

			// Check if the URL contains RSS feed content or if it's an article URL
			if (rssText.includes('<rss') || rssText.includes('<feed')) {
				// It's an RSS feed, parse it
				const feed = await parser.parseString(rssText);
				const article = feed.items.find(item => item.link === articleUrl);
				if (article && article.content) {
					setRssContent(article.content);
				} else if (article && article.contentSnippet) {
					setRssContent(`<p>${article.contentSnippet}</p>`);
				} else {
					throw new Error('Article content not found in RSS feed');
				}
			} else {
				// It's probably the article page itself, extract readable content
				// Simple content extraction - look for common article containers
				const parser = new DOMParser();
				const doc = parser.parseFromString(rssText, 'text/html');

				// Try to find article content in common containers
				const contentSelectors = [
					'article',
					'[role="main"]',
					'.article-content',
					'.post-content',
					'.entry-content',
					'.content',
					'main'
				];

				let content = '';
				for (const selector of contentSelectors) {
					const element = doc.querySelector(selector);
					if (element) {
						// Remove scripts, styles, and other unwanted elements
						const scripts = element.querySelectorAll('script, style, iframe, nav, header, footer, aside');
						scripts.forEach(el => el.remove());

						content = element.innerHTML;
						break;
					}
				}

				if (content) {
					setRssContent(content);
				} else {
					throw new Error('Could not extract article content');
				}
			}
		} catch (error) {
			console.error('Error fetching RSS content:', error);
			setRssError(error instanceof Error ? error.message : 'Failed to load RSS content');
		} finally {
			setIsLoadingRss(false);
		}
	};

	// Fetch RSS content when a new article is selected (desktop only)
	useEffect(() => {
		if (selectedArticle && !isMobile) {
			fetchRssContent(selectedArticle.link);
		} else {
			setRssContent(null);
			setRssError(null);
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

	// Desktop layout - show articles list and combined content with RSS parser
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

			{/* Combined Article Content with RSS Parser */}
			<div className="w-2/3">
				{selectedArticle ? (
					<Card className="h-full border-none rounded-none">
						<CardHeader className="border-b">
							<CardTitle className="text-lg line-clamp-2">
								{selectedArticle.title}
							</CardTitle>
							<div className="flex items-center justify-between">
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
								</div>
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
							<div className="h-[calc(100vh-12rem)]">
								{/* Article Summary Section */}
								{(selectedArticle.description || selectedArticle.content || (selectedArticle.categories && selectedArticle.categories.length > 0)) && (
									<div className="border-b bg-muted/20">
										<ScrollArea className="max-h-48 p-4">
											{selectedArticle.description && (
												<div className="mb-4">
													<p className="text-muted-foreground leading-relaxed text-sm">
														{selectedArticle.description}
													</p>
												</div>
											)}
											{selectedArticle.content && (
												<div className="mb-4">
													<div
														className="prose prose-sm max-w-none"
														dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
													/>
												</div>
											)}
											{selectedArticle.categories && selectedArticle.categories.length > 0 && (
												<div className="flex flex-wrap gap-2">
													{selectedArticle.categories.map((category, index) => (
														<Badge key={index} variant="secondary" className="text-xs">
															{typeof category === 'string' ? category : String(category)}
														</Badge>
													))}
												</div>
											)}
										</ScrollArea>
									</div>
								)}

								{/* RSS Content Section */}
								<div className="h-full">
									<ScrollArea className="h-full p-4">
										{isLoadingRss ? (
											<div className="flex items-center justify-center h-64">
												<div className="flex items-center gap-2">
													<Loader2 className="h-4 w-4 animate-spin" />
													<span className="text-sm text-muted-foreground">Loading article content...</span>
												</div>
											</div>
										) : rssError ? (
											<div className="flex flex-col items-center justify-center h-64 text-center">
												<div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg max-w-md">
													<h4 className="font-medium text-destructive mb-2">Failed to Load Content</h4>
													<p className="text-sm text-muted-foreground mb-4">{rssError}</p>
													<Button
														variant="outline"
														size="sm"
														onClick={() => openExternalLink(selectedArticle.link)}
													>
														<ExternalLink className="h-3 w-3 mr-2" />
														View Original Article
													</Button>
												</div>
											</div>
										) : rssContent ? (
											<div className="prose prose-sm max-w-none">
												<div dangerouslySetInnerHTML={{ __html: rssContent }} />
											</div>
										) : (
											<div className="flex items-center justify-center h-64">
												<div className="text-center text-muted-foreground">
													<Rss className="h-12 w-12 mx-auto mb-4 opacity-50" />
													<p className="text-sm">No content available</p>
													<Button
														variant="outline"
														size="sm"
														className="mt-4"
														onClick={() => openExternalLink(selectedArticle.link)}
													>
														<ExternalLink className="h-3 w-3 mr-2" />
														View Original Article
													</Button>
												</div>
											</div>
										)}
									</ScrollArea>
								</div>
							</div>
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
		</div>
	);
}