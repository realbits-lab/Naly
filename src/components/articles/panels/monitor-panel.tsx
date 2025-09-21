"use client";

import {
	Activity,
	AlertTriangle,
	BarChart3,
	Calendar,
	Clock,
	Download,
	ExternalLink,
	FileText,
	Globe,
	RefreshCw,
	TrendingDown,
	TrendingUp,
	Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArticleStatsCards } from "@/components/articles/article-stats-cards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Article {
	id: string;
	title: string;
	description: string;
	link: string;
	publishedAt: string;
	author: string | null;
	categories: string[] | null;
	sentiment: string | null;
	imageUrl: string | null;
	isNew?: boolean;
	sourceName: string;
	sourceCategory: string;
	sourceLogo: string | null;
}

interface UpdateSummary {
	totalSources: number;
	processedSources: number;
	failedSources: number;
	newArticles: number;
	totalArticles: number;
}

export function MonitorPanel() {
	const [articles, setArticles] = useState<Article[]>([]);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [updateSummary, setUpdateSummary] = useState<UpdateSummary | null>(null);
	const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
	const [isGeneratingReport, setIsGeneratingReport] = useState(false);

	// Fetch articles from database on mount
	useEffect(() => {
		fetchArticlesFromDatabase();
	}, []);

	const fetchArticlesFromDatabase = async () => {
		try {
			setIsLoading(true);
			const response = await fetch('/api/monitor/update-articles?limit=200');

			if (!response.ok) {
				throw new Error('Failed to fetch articles');
			}

			const data = await response.json();
			setArticles(data.articles || []);
		} catch (error) {
			console.error('Error fetching articles:', error);
			toast.error('Failed to load articles');
		} finally {
			setIsLoading(false);
		}
	};

	const handleUpdate = async () => {
		setIsUpdating(true);

		try {
			toast.info('Fetching latest articles from all sources...', {
				duration: 10000,
			});

			const response = await fetch('/api/monitor/update-articles', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error('Failed to update articles');
			}

			const data = await response.json();

			// Update articles with new data
			setArticles(data.articles || []);
			setUpdateSummary(data.summary);
			setLastUpdateTime(new Date());

			// Show success message with summary
			if (data.summary.newArticles > 0) {
				toast.success(
					`Successfully fetched ${data.summary.newArticles} new articles from ${data.summary.processedSources} sources`,
					{
						duration: 5000,
					}
				);
			} else {
				toast.info('No new articles found', {
					duration: 3000,
				});
			}

			// Log any failed sources
			if (data.summary.failedSources > 0) {
				toast.warning(
					`Failed to fetch from ${data.summary.failedSources} source(s). Check console for details.`,
					{
						duration: 5000,
					}
				);
			}

		} catch (error) {
			console.error('Error updating articles:', error);
			toast.error('Failed to update articles');
		} finally {
			setIsUpdating(false);
		}
	};

	const handleGenerateReport = async () => {
		setIsGeneratingReport(true);

		try {
			toast.info('Generating comprehensive market report...', {
				duration: 20000,
			});

			const response = await fetch('/api/monitor/generate-report', {
				method: 'POST',
			});

			if (!response.ok) {
				throw new Error('Failed to generate report');
			}

			const result = await response.json();

			toast.success(`Market report generated successfully! Found ${result.topicsCount} key topics.`, {
				duration: 5000,
			});

			// Optionally refresh articles to show any newly fetched ones
			await fetchArticlesFromDatabase();

		} catch (error) {
			console.error('Error generating report:', error);
			toast.error('Failed to generate market report. Please try again.');
		} finally {
			setIsGeneratingReport(false);
		}
	};

	const getSentimentColor = (sentiment: string | null) => {
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

	const getCategoryColor = (category: string) => {
		const colors: Record<string, string> = {
			markets: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
			technology: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
			economics: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
			business: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
			cryptocurrency: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
			stocks: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
			finance: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
			investment: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
		};
		return colors[category] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
	};

	const formatTimeAgo = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

		if (seconds < 60) return `${seconds}s ago`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	};

	return (
		<div className="h-full overflow-auto">
			<div className="p-6">
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-foreground">
							Real-time Monitoring
						</h1>
						<p className="text-muted-foreground mt-1">
							Track latest financial news from all RSS sources
						</p>
					</div>
					<div className="flex items-center gap-2">
						{lastUpdateTime && (
							<span className="text-sm text-muted-foreground">
								Last updated: {formatTimeAgo(lastUpdateTime.toISOString())}
							</span>
						)}
						<Button
							onClick={handleUpdate}
							disabled={isUpdating}
							variant="default"
						>
							<RefreshCw
								className={`h-4 w-4 mr-2 ${isUpdating ? "animate-spin" : ""}`}
							/>
							Update Articles
						</Button>
						<Button
							onClick={handleGenerateReport}
							disabled={isGeneratingReport || isUpdating}
							variant="secondary"
						>
							<Zap
								className={`h-4 w-4 mr-2 ${isGeneratingReport ? "animate-pulse" : ""}`}
							/>
							Generate Market Report
						</Button>
					</div>
				</div>

				<div className="space-y-6">
					{/* Update Summary */}
					{updateSummary && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Activity className="h-5 w-5 text-primary" />
									<span>Last Update Summary</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
									<div className="text-center p-3 border rounded-lg">
										<div className="text-2xl font-bold text-primary">
											{updateSummary.totalSources}
										</div>
										<div className="text-xs text-muted-foreground">
											Total Sources
										</div>
									</div>
									<div className="text-center p-3 border rounded-lg">
										<div className="text-2xl font-bold text-green-600">
											{updateSummary.processedSources}
										</div>
										<div className="text-xs text-muted-foreground">
											Processed
										</div>
									</div>
									<div className="text-center p-3 border rounded-lg">
										<div className="text-2xl font-bold text-red-600">
											{updateSummary.failedSources}
										</div>
										<div className="text-xs text-muted-foreground">
											Failed
										</div>
									</div>
									<div className="text-center p-3 border rounded-lg">
										<div className="text-2xl font-bold text-blue-600">
											{updateSummary.newArticles}
										</div>
										<div className="text-xs text-muted-foreground">
											New Articles
										</div>
									</div>
									<div className="text-center p-3 border rounded-lg">
										<div className="text-2xl font-bold text-primary">
											{updateSummary.totalArticles}
										</div>
										<div className="text-xs text-muted-foreground">
											Total in DB
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Article Statistics */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<FileText className="h-5 w-5 text-primary" />
								<span>Article Analytics</span>
							</CardTitle>
							<CardDescription>
								Performance metrics and statistics for generated articles
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ArticleStatsCards />
						</CardContent>
					</Card>

					{/* Articles List */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<Globe className="h-5 w-5 text-primary" />
								<span>Latest Articles</span>
								<Badge variant="secondary">{articles.length} articles</Badge>
							</CardTitle>
							<CardDescription>
								Latest articles fetched from all RSS sources
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ScrollArea className="h-[600px] pr-4">
								{isLoading ? (
									<div className="space-y-3">
										{[...Array(5)].map((_, i) => (
											<div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
										))}
									</div>
								) : articles.length === 0 ? (
									<div className="text-center py-8 text-muted-foreground">
										<Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
										<p>No articles found in database</p>
										<p className="text-sm mt-2">Click "Update Articles" to fetch latest news</p>
									</div>
								) : (
									<div className="space-y-4">
										{articles.map((article) => (
											<div
												key={article.id}
												className={`p-4 border rounded-lg hover:bg-muted/50 transition-all ${
													article.isNew
														? 'ring-2 ring-primary ring-offset-2 animate-pulse-once'
														: ''
												}`}
											>
												{/* Article Header */}
												<div className="flex items-start justify-between mb-2">
													<div className="flex items-center space-x-2">
														{article.sourceLogo ? (
															<img
																src={article.sourceLogo}
																alt={article.sourceName}
																className="w-5 h-5 rounded"
																onError={(e) => {
																	e.currentTarget.style.display = 'none';
																}}
															/>
														) : (
															<Globe className="h-5 w-5 text-muted-foreground" />
														)}
														<span className="font-medium text-sm">
															{article.sourceName}
														</span>
														<Badge className={getCategoryColor(article.sourceCategory)}>
															{article.sourceCategory}
														</Badge>
														{article.sentiment && (
															<Badge className={getSentimentColor(article.sentiment)}>
																{article.sentiment}
															</Badge>
														)}
														{article.isNew && (
															<Badge className="bg-primary text-primary-foreground animate-pulse">
																NEW
															</Badge>
														)}
													</div>
													<div className="flex items-center space-x-2 text-xs text-muted-foreground">
														<Clock className="h-3 w-3" />
														<span>{formatTimeAgo(article.publishedAt)}</span>
													</div>
												</div>

												{/* Article Title */}
												<h3 className="font-semibold text-foreground mb-2">
													{article.title}
												</h3>

												{/* Article Description */}
												{article.description && (
													<p className="text-sm text-muted-foreground mb-3 line-clamp-2">
														{article.description}
													</p>
												)}

												{/* Article Footer */}
												<div className="flex items-center justify-between">
													<div className="flex items-center space-x-4 text-xs text-muted-foreground">
														{article.author && (
															<span className="flex items-center space-x-1">
																<span>By {article.author}</span>
															</span>
														)}
														{article.categories && article.categories.length > 0 && (
															<div className="flex items-center space-x-1">
																{article.categories.slice(0, 3).map((cat, idx) => (
																	<Badge key={idx} variant="outline" className="text-xs">
																		{cat}
																	</Badge>
																))}
															</div>
														)}
													</div>
													{article.link && (
														<Button
															variant="ghost"
															size="sm"
															onClick={() => window.open(article.link, '_blank')}
														>
															<ExternalLink className="h-3 w-3 mr-1" />
															Read
														</Button>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</ScrollArea>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}