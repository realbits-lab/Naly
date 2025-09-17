"use client";

import {
	Bot,
	Calendar,
	Clock,
	ExternalLink,
	Eye,
	FileText,
	Filter,
	Loader2,
	MoreVertical,
	Newspaper,
	Search,
	Trash2,
	TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Article {
	id: string;
	title: string;
	summary: string;
	content: string;
	keyPoints: string[];
	marketAnalysis: string;
	investmentImplications: string;
	sourceTitle: string;
	sourcePublisher: string;
	sourceCategory: string;
	sentiment: "positive" | "negative" | "neutral";
	keywords: string[];
	entities: string[];
	wordCount: number;
	readingTime: number;
	aiModel: string;
	createdAt: string;
}

interface ArticleListProps {
	refreshTrigger?: number;
	onArticleSelect?: (article: Article) => void;
	isPublic?: boolean;
}

export function ArticleList({
	refreshTrigger,
	onArticleSelect,
	isPublic,
}: ArticleListProps) {
	const [articles, setArticles] = useState<Article[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [selectedSentiment, setSelectedSentiment] = useState("all");
	const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null);

	const fetchArticles = async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				limit: "20",
				offset: "0",
			});

			if (selectedCategory !== "all") {
				params.append("category", selectedCategory);
			}
			if (selectedSentiment !== "all") {
				params.append("sentiment", selectedSentiment);
			}
			if (searchTerm.trim()) {
				params.append("search", searchTerm.trim());
			}

			const response = await fetch(`/api/articles?${params}`);
			if (!response.ok) {
				throw new Error("Failed to fetch articles");
			}

			const data = await response.json();
			setArticles(data.articles);
		} catch (error) {
			console.error("Failed to fetch articles:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchArticles();
	}, [selectedCategory, selectedSentiment, searchTerm, refreshTrigger]);

	const handleDeleteArticle = async (articleId: string) => {
		try {
			const response = await fetch(`/api/articles/${articleId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete article");
			}

			setArticles((prev) => prev.filter((article) => article.id !== articleId));
			setDeleteArticleId(null);
		} catch (error) {
			console.error("Failed to delete article:", error);
		}
	};

	const getSentimentColor = (sentiment: string) => {
		switch (sentiment) {
			case "positive":
				return "bg-green-100 text-green-800";
			case "negative":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getCategoryColor = (category: string) => {
		const colors = {
			financial: "bg-blue-100 text-blue-800",
			technology: "bg-purple-100 text-purple-800",
			energy: "bg-orange-100 text-orange-800",
			cryptocurrency: "bg-yellow-100 text-yellow-800",
			"monetary-policy": "bg-indigo-100 text-indigo-800",
		};
		return (
			colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
		);
	};

	const getModelIcon = (model: string) => {
		return model.includes("gpt") ? Bot : FileText;
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffHours = Math.floor(
			(now.getTime() - date.getTime()) / (1000 * 60 * 60),
		);

		if (diffHours < 1) return "Just now";
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffHours < 48) return "Yesterday";
		return date.toLocaleDateString();
	};

	const groupedArticles = articles.reduce(
		(groups, article) => {
			const category = article.sourceCategory || "other";
			if (!groups[category]) groups[category] = [];
			groups[category].push(article);
			return groups;
		},
		{} as Record<string, Article[]>,
	);

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Filters */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<FileText className="h-5 w-5" />
						<span>Generated Articles</span>
					</CardTitle>
					<CardDescription>
						Browse and manage your AI-generated financial analysis articles
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="flex-1">
							<div className="relative">
								<Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder="Search articles..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-9"
								/>
							</div>
						</div>
						<Select
							value={selectedCategory}
							onValueChange={setSelectedCategory}
						>
							<SelectTrigger className="w-full sm:w-48">
								<SelectValue placeholder="Category" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Categories</SelectItem>
								<SelectItem value="financial">Financial</SelectItem>
								<SelectItem value="technology">Technology</SelectItem>
								<SelectItem value="energy">Energy</SelectItem>
								<SelectItem value="cryptocurrency">Cryptocurrency</SelectItem>
								<SelectItem value="monetary-policy">Monetary Policy</SelectItem>
							</SelectContent>
						</Select>
						<Select
							value={selectedSentiment}
							onValueChange={setSelectedSentiment}
						>
							<SelectTrigger className="w-full sm:w-32">
								<SelectValue placeholder="Sentiment" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All</SelectItem>
								<SelectItem value="positive">Positive</SelectItem>
								<SelectItem value="negative">Negative</SelectItem>
								<SelectItem value="neutral">Neutral</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Articles */}
			{articles.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<FileText className="h-12 w-12 text-muted-foreground mb-4" />
						<h3 className="text-lg font-semibold mb-2">No articles found</h3>
						<p className="text-muted-foreground text-center mb-4">
							{searchTerm ||
							selectedCategory !== "all" ||
							selectedSentiment !== "all"
								? "Try adjusting your filters or search terms"
								: "Generate your first AI article to get started"}
						</p>
					</CardContent>
				</Card>
			) : (
				<Tabs defaultValue="list" className="space-y-4">
					<TabsList>
						<TabsTrigger value="list">List View</TabsTrigger>
						<TabsTrigger value="category">By Category</TabsTrigger>
					</TabsList>

					<TabsContent value="list" className="space-y-4">
						{articles.map((article) => {
							const ModelIcon = getModelIcon(article.aiModel);
							return (
								<Card
									key={article.id}
									className="hover:shadow-md transition-shadow"
								>
									<CardHeader>
										<div className="flex items-start justify-between">
											<div className="flex-1 min-w-0">
												<div className="flex items-center space-x-2 mb-2">
													<Badge
														className={getSentimentColor(article.sentiment)}
													>
														{article.sentiment}
													</Badge>
													<Badge
														className={getCategoryColor(article.sourceCategory)}
													>
														{article.sourceCategory}
													</Badge>
													<Badge
														variant="outline"
														className="flex items-center space-x-1"
													>
														<ModelIcon className="h-3 w-3" />
														<span>{article.aiModel}</span>
													</Badge>
												</div>
												<CardTitle
													className="text-lg line-clamp-2 cursor-pointer hover:text-primary"
													onClick={() => onArticleSelect?.(article)}
												>
													{article.title}
												</CardTitle>
												<CardDescription className="line-clamp-2 mt-1">
													{article.summary}
												</CardDescription>
											</div>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="sm"
														className="h-8 w-8 p-0"
													>
														<MoreVertical className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() => onArticleSelect?.(article)}
													>
														<Eye className="mr-2 h-4 w-4" />
														View Article
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														className="text-destructive focus:text-destructive"
														onClick={() => setDeleteArticleId(article.id)}
													>
														<Trash2 className="mr-2 h-4 w-4" />
														Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</CardHeader>
									<CardContent>
										<div className="flex items-center justify-between text-sm text-muted-foreground">
											<div className="flex items-center space-x-4">
												<span className="flex items-center space-x-1">
													<Newspaper className="h-3 w-3" />
													<span>{article.sourcePublisher}</span>
												</span>
												<span className="flex items-center space-x-1">
													<FileText className="h-3 w-3" />
													<span>{article.wordCount} words</span>
												</span>
												<span className="flex items-center space-x-1">
													<Clock className="h-3 w-3" />
													<span>{article.readingTime} min read</span>
												</span>
											</div>
											<span className="flex items-center space-x-1">
												<Calendar className="h-3 w-3" />
												<span>{formatDate(article.createdAt)}</span>
											</span>
										</div>

										{article.keyPoints.length > 0 && (
											<div className="mt-3 pt-3 border-t">
												<p className="text-xs font-medium text-muted-foreground mb-1">
													Key Points:
												</p>
												<p className="text-sm line-clamp-1">
													{article.keyPoints[0]}
												</p>
											</div>
										)}
									</CardContent>
								</Card>
							);
						})}
					</TabsContent>

					<TabsContent value="category" className="space-y-6">
						{Object.entries(groupedArticles).map(
							([category, categoryArticles]) => (
								<div key={category}>
									<div className="flex items-center space-x-2 mb-4">
										<Badge className={getCategoryColor(category)}>
											{category}
										</Badge>
										<span className="text-sm text-muted-foreground">
											({categoryArticles.length} articles)
										</span>
									</div>
									<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
										{categoryArticles.map((article) => (
											<Card
												key={article.id}
												className="hover:shadow-md transition-shadow cursor-pointer"
												onClick={() => onArticleSelect?.(article)}
											>
												<CardHeader className="pb-3">
													<div className="flex items-start justify-between mb-2">
														<Badge
															className={getSentimentColor(article.sentiment)}
														>
															{article.sentiment}
														</Badge>
														<span className="text-xs text-muted-foreground">
															{formatDate(article.createdAt)}
														</span>
													</div>
													<CardTitle className="text-sm line-clamp-2">
														{article.title}
													</CardTitle>
												</CardHeader>
												<CardContent className="pt-0">
													<div className="flex items-center justify-between text-xs text-muted-foreground">
														<span>{article.wordCount} words</span>
														<span>{article.readingTime} min</span>
													</div>
												</CardContent>
											</Card>
										))}
									</div>
								</div>
							),
						)}
					</TabsContent>
				</Tabs>
			)}

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={!!deleteArticleId}
				onOpenChange={() => setDeleteArticleId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Article</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this article? This action cannot
							be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={() =>
								deleteArticleId && handleDeleteArticle(deleteArticleId)
							}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
