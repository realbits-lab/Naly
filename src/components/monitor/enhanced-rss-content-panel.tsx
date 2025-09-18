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
	Download,
	Image,
	Eye,
	RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { articleContentService, type EnhancedRSSContent, type ExtractedContent } from "@/lib/services/article-content-service";
import type { RssSource, RssArticle } from "./monitor-page-client";

interface EnhancedRssContentPanelProps {
	source?: RssSource | null;
	articles: RssArticle[];
	selectedArticle?: RssArticle | null;
	onArticleSelect?: (article: RssArticle) => void;
	onBack?: () => void;
	loading?: boolean;
	isMobile?: boolean;
}

export function EnhancedRssContentPanel({
	source,
	articles,
	selectedArticle,
	onArticleSelect,
	onBack,
	loading = false,
	isMobile = false,
}: EnhancedRssContentPanelProps) {
	const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
	const [enhancedContent, setEnhancedContent] = useState<EnhancedRSSContent | null>(null);
	const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null);
	const [isLoadingExtraction, setIsLoadingExtraction] = useState(false);
	const [extractionError, setExtractionError] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<'preview' | 'extracted'>('preview');

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

	const enhanceArticleContent = (article: RssArticle): EnhancedRSSContent => {
		return articleContentService.enhanceRSSContent({
			title: article.title,
			link: article.link,
			description: article.description,
			contentSnippet: article.description,
			content: article.content,
			pubDate: article.publishedAt,
			creator: article.author,
			author: article.author,
			categories: article.categories?.map(cat => typeof cat === 'string' ? cat : String(cat))
		});
	};

	const extractFullContent = async (articleUrl: string) => {
		setIsLoadingExtraction(true);
		setExtractionError(null);

		try {
			const strategy = articleContentService.getDisplayStrategy(articleUrl);
			const content = await articleContentService.getArticleContent(articleUrl, strategy);

			if (content) {
				setExtractedContent(content);
				setViewMode('extracted');
				// Update enhanced content to show extraction status
				if (enhancedContent) {
					setEnhancedContent({
						...enhancedContent,
						extractedContent: content,
						isContentExtracted: true
					});
				}
			} else {
				throw new Error('Content extraction failed. The article may not be accessible or the site blocks content extraction.');
			}
		} catch (error) {
			console.error('Error extracting content:', error);
			setExtractionError(error instanceof Error ? error.message : 'Failed to extract content');
		} finally {
			setIsLoadingExtraction(false);
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

	// Enhance article content when a new article is selected
	useEffect(() => {
		if (selectedArticle) {
			const enhanced = enhanceArticleContent(selectedArticle);
			setEnhancedContent(enhanced);
			setExtractedContent(null);
			setExtractionError(null);
			setViewMode('preview');
		} else {
			setEnhancedContent(null);
			setExtractedContent(null);
			setExtractionError(null);
		}
	}, [selectedArticle]);

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
						{/* Enhanced Mobile Content */}
						{enhancedContent && (
							<div className="space-y-4">
								{/* Summary */}
								<div>
									<p className="text-muted-foreground leading-relaxed">{enhancedContent.summary}</p>
									<div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
										<div className="flex items-center gap-1">
											<Clock className="h-4 w-4" />
											{enhancedContent.readTime} min read
										</div>
										{enhancedContent.images.length > 0 && (
											<div className="flex items-center gap-1">
												<Image className="h-4 w-4" />
												{enhancedContent.images.length} image{enhancedContent.images.length > 1 ? 's' : ''}
											</div>
										)}
									</div>
								</div>

								{/* Images Grid */}
								{enhancedContent.images.length > 0 && (
									<div className="grid grid-cols-1 gap-3">
										{enhancedContent.images.slice(0, 3).map((imageUrl, index) => (
											<img
												key={index}
												src={imageUrl}
												alt={`Article image ${index + 1}`}
												className="w-full h-48 object-cover rounded-lg border"
												onError={(e) => {
													e.currentTarget.style.display = 'none';
												}}
											/>
										))}
									</div>
								)}

								{/* Categories */}
								{enhancedContent.categories.length > 0 && (
									<div className="flex flex-wrap gap-2">
										{enhancedContent.categories.map((category, index) => (
											<Badge key={index} variant="secondary">
												{category}
											</Badge>
										))}
									</div>
								)}

								{/* Extracted Content */}
								{viewMode === 'extracted' && extractedContent && (
									<div className="border-t pt-4">
										<div className="flex items-center justify-between mb-4">
											<h4 className="font-medium">Extracted Content</h4>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setViewMode('preview')}
											>
												<Eye className="h-4 w-4 mr-2" />
												View Preview
											</Button>
										</div>
										<div
											className="prose prose-sm max-w-none"
											dangerouslySetInnerHTML={{ __html: extractedContent.content }}
										/>
									</div>
								)}

								{/* Error State */}
								{extractionError && (
									<div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
										<h4 className="font-medium text-destructive mb-2">Extraction Failed</h4>
										<p className="text-sm text-muted-foreground">{extractionError}</p>
									</div>
								)}

								{/* Action Buttons */}
								<div className="flex gap-3">
									<Button
										onClick={() => openExternalLink(enhancedContent.externalLink)}
										variant="outline"
										className="flex-1"
									>
										<ExternalLink className="h-4 w-4 mr-2" />
										Read Original
									</Button>
									{viewMode === 'preview' && (
										<Button
											onClick={() => extractFullContent(enhancedContent.externalLink)}
											disabled={isLoadingExtraction}
											className="flex-1"
										>
											{isLoadingExtraction ? (
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											) : (
												<Download className="h-4 w-4 mr-2" />
											)}
											Extract Full Content
										</Button>
									)}
								</div>
							</div>
						)}
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
								const enhanced = enhanceArticleContent(article);
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
												<div className="flex items-center gap-1">
													<Clock className="h-3 w-3" />
													{enhanced.readTime}m
												</div>
											</div>
										</CardHeader>
										{isExpanded && (
											<CardContent className="pt-0">
												{/* Enhanced Content Display */}
												<div className="space-y-4">
													{/* Enhanced Description */}
													{enhanced.cleanDescription && (
														<div>
															<p className="text-sm text-muted-foreground leading-relaxed">
																{enhanced.summary}
															</p>
															<div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
																<div className="flex items-center gap-1">
																	<Clock className="h-3 w-3" />
																	{enhanced.readTime} min read
																</div>
																{enhanced.images.length > 0 && (
																	<div className="flex items-center gap-1">
																		<Image className="h-3 w-3" />
																		{enhanced.images.length} image{enhanced.images.length > 1 ? 's' : ''}
																	</div>
																)}
															</div>
														</div>
													)}

													{/* Images */}
													{enhanced.images.length > 0 && (
														<div className="grid grid-cols-2 gap-2">
															{enhanced.images.slice(0, 2).map((imageUrl, index) => (
																<img
																	key={index}
																	src={imageUrl}
																	alt={`Article image ${index + 1}`}
																	className="w-full h-20 object-cover rounded border"
																	onError={(e) => {
																		e.currentTarget.style.display = 'none';
																	}}
																/>
															))}
														</div>
													)}

													{/* Categories */}
													{enhanced.categories.length > 0 && (
														<div className="flex flex-wrap gap-1">
															{enhanced.categories.map((category, index) => (
																<Badge key={index} variant="secondary" className="text-xs">
																	{category}
																</Badge>
															))}
														</div>
													)}

													{/* Action Buttons */}
													<div className="flex gap-2">
														<Button
															onClick={(e) => {
																e.stopPropagation();
																openExternalLink(article.link);
															}}
															size="sm"
															variant="outline"
														>
															<ExternalLink className="h-3 w-3 mr-2" />
															Read Original
														</Button>
														<Button
															onClick={(e) => {
																e.stopPropagation();
																extractFullContent(article.link);
															}}
															size="sm"
															disabled={isLoadingExtraction}
														>
															{isLoadingExtraction ? (
																<Loader2 className="h-3 w-3 mr-2 animate-spin" />
															) : (
																<Download className="h-3 w-3 mr-2" />
															)}
															Extract Content
														</Button>
													</div>
												</div>
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

	// Desktop layout - show articles list and combined content with enhanced RSS features
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
									{articles.map((article) => {
										const enhanced = enhanceArticleContent(article);
										return (
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
												<div>
													<p className="text-xs text-muted-foreground line-clamp-2 mb-2">
														{enhanced.summary}
													</p>
													<div className="flex items-center gap-2 text-xs text-muted-foreground">
														<Clock className="h-3 w-3" />
														{enhanced.readTime}m
														{enhanced.images.length > 0 && (
															<>
																<span>•</span>
																<Image className="h-3 w-3" />
																{enhanced.images.length}
															</>
														)}
													</div>
												</div>
												<div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
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
												{enhanced.categories.length > 0 && (
													<div className="flex flex-wrap gap-1 mt-2">
														{enhanced.categories.slice(0, 3).map((category, index) => (
															<Badge key={index} variant="secondary" className="text-xs">
																{category}
															</Badge>
														))}
													</div>
												)}
											</div>
										);
									})}
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

			{/* Enhanced Article Content */}
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
								{/* Enhanced Article Preview Section */}
								{enhancedContent && (
									<div className="border-b bg-muted/20">
										<ScrollArea className="max-h-64 p-4">
											<div className="space-y-4">
												{/* Enhanced Summary */}
												<div>
													<p className="text-muted-foreground leading-relaxed text-sm">
														{enhancedContent.summary}
													</p>
													<div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
														<div className="flex items-center gap-1">
															<Clock className="h-3 w-3" />
															{enhancedContent.readTime} min read
														</div>
														{enhancedContent.images.length > 0 && (
															<div className="flex items-center gap-1">
																<Image className="h-3 w-3" />
																{enhancedContent.images.length} image{enhancedContent.images.length > 1 ? 's' : ''}
															</div>
														)}
													</div>
												</div>

												{/* Article Images */}
												{enhancedContent.images.length > 0 && (
													<div className="grid grid-cols-2 gap-3">
														{enhancedContent.images.slice(0, 4).map((imageUrl, index) => (
															<img
																key={index}
																src={imageUrl}
																alt={`Article image ${index + 1}`}
																className="w-full h-24 object-cover rounded border"
																onError={(e) => {
																	e.currentTarget.style.display = 'none';
																}}
															/>
														))}
													</div>
												)}

												{/* Categories */}
												{enhancedContent.categories.length > 0 && (
													<div className="flex flex-wrap gap-2">
														{enhancedContent.categories.map((category, index) => (
															<Badge key={index} variant="secondary" className="text-xs">
																{category}
															</Badge>
														))}
													</div>
												)}

												{/* Action Buttons */}
												<div className="flex gap-2">
													<TooltipProvider>
														<Tooltip>
															<TooltipTrigger asChild>
																<Button
																	onClick={() => extractFullContent(enhancedContent.externalLink)}
																	size="sm"
																	variant={viewMode === 'extracted' ? 'default' : 'outline'}
																	disabled={isLoadingExtraction}
																>
																	{isLoadingExtraction ? (
																		<Loader2 className="h-3 w-3 mr-2 animate-spin" />
																	) : viewMode === 'extracted' ? (
																		<RefreshCw className="h-3 w-3 mr-2" />
																	) : (
																		<Download className="h-3 w-3 mr-2" />
																	)}
																	{viewMode === 'extracted' ? 'Re-extract' : 'Extract Content'}
																</Button>
															</TooltipTrigger>
															<TooltipContent>
																<p>Extract full article content using AI</p>
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
													{viewMode === 'extracted' && (
														<Button
															variant="ghost"
															size="sm"
															onClick={() => setViewMode('preview')}
														>
															<Eye className="h-3 w-3 mr-2" />
															View Preview
														</Button>
													)}
												</div>
											</div>
										</ScrollArea>
									</div>
								)}

								{/* Enhanced Content Section */}
								<div className="h-full">
									<ScrollArea className="h-full p-4">
										{isLoadingExtraction ? (
											<div className="flex items-center justify-center h-64">
												<div className="flex items-center gap-2">
													<Loader2 className="h-4 w-4 animate-spin" />
													<span className="text-sm text-muted-foreground">Extracting article content...</span>
												</div>
											</div>
										) : extractionError ? (
											<div className="flex flex-col items-center justify-center h-64 text-center">
												<div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg max-w-md">
													<h4 className="font-medium text-destructive mb-2">Content Extraction Failed</h4>
													<p className="text-sm text-muted-foreground mb-4">{extractionError}</p>
													<div className="flex gap-2">
														<Button
															variant="outline"
															size="sm"
															onClick={() => extractFullContent(selectedArticle.link)}
														>
															<RefreshCw className="h-3 w-3 mr-2" />
															Retry
														</Button>
														<Button
															variant="outline"
															size="sm"
															onClick={() => openExternalLink(selectedArticle.link)}
														>
															<ExternalLink className="h-3 w-3 mr-2" />
															View Original
														</Button>
													</div>
												</div>
											</div>
										) : viewMode === 'extracted' && extractedContent ? (
											<div className="space-y-4">
												<div className="flex items-center justify-between">
													<h4 className="font-medium text-green-600">✓ Content Extracted Successfully</h4>
													<div className="text-xs text-muted-foreground">
														{extractedContent.siteName && `from ${extractedContent.siteName}`}
													</div>
												</div>
												<div className="prose prose-sm max-w-none">
													{extractedContent.byline && (
														<p className="text-sm text-muted-foreground mb-4">{extractedContent.byline}</p>
													)}
													<div dangerouslySetInnerHTML={{ __html: extractedContent.content }} />
												</div>
											</div>
										) : (
											<div className="flex items-center justify-center h-64">
												<div className="text-center text-muted-foreground max-w-md">
													<Rss className="h-12 w-12 mx-auto mb-4 opacity-50" />
													<h4 className="font-medium mb-2">Article Content</h4>
													<p className="text-sm mb-4">
														Click "Extract Content" to load the full article, or view the original source.
													</p>
													<div className="flex gap-2 justify-center">
														<Button
															variant="outline"
															size="sm"
															onClick={() => extractFullContent(selectedArticle.link)}
														>
															<Download className="h-3 w-3 mr-2" />
															Extract Content
														</Button>
														<Button
															variant="outline"
															size="sm"
															onClick={() => openExternalLink(selectedArticle.link)}
														>
															<ExternalLink className="h-3 w-3 mr-2" />
															View Original
														</Button>
													</div>
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
								Choose an article from the list to view its enhanced content
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}