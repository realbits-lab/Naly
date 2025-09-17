"use client";

import {
	ChevronLeft,
	ChevronRight,
	Clock,
	Filter,
	Newspaper,
	RefreshCw,
	Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

interface NewsSidebarProps {
	selectedArticleId: string | null;
	onArticleSelect: (article: Article) => void;
	isCollapsed: boolean;
	onToggleCollapse: () => void;
}

export function NewsSidebar({
	selectedArticleId,
	onArticleSelect,
	isCollapsed,
	onToggleCollapse,
}: NewsSidebarProps) {
	const [articles, setArticles] = useState<Article[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");

	const fetchArticles = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/articles?limit=100&offset=0");
			if (response.ok) {
				const data = await response.json();
				setArticles(Array.isArray(data.articles) ? data.articles : []);

				// Auto-select first article if none selected
				if (!selectedArticleId && data.articles && data.articles.length > 0) {
					onArticleSelect(data.articles[0]);
				}
			}
		} catch (error) {
			console.error("Failed to fetch articles:", error);
			setArticles([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchArticles();
	}, []);

	const filteredArticles = articles.filter((article) => {
		const matchesSearch = article.title
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
		const matchesCategory =
			selectedCategory === "all" || article.sourceCategory === selectedCategory;
		return matchesSearch && matchesCategory;
	});

	const categories = [
		"all",
		...Array.from(
			new Set(articles.map((a) => a.sourceCategory).filter(Boolean)),
		),
	];

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

	return (
		<div
			className={cn(
				"flex flex-col bg-card border-r border-border h-full transition-all duration-300",
				isCollapsed ? "w-16" : "w-80",
			)}
		>
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b border-border">
				{!isCollapsed && (
					<div className="flex items-center space-x-2">
						<Newspaper className="h-5 w-5 text-primary" />
						<h2 className="text-lg font-semibold">News</h2>
						<Badge variant="secondary">{articles.length}</Badge>
					</div>
				)}
				<button
					onClick={onToggleCollapse}
					className="p-1 rounded-md hover:bg-muted transition-colors"
				>
					{isCollapsed ? (
						<ChevronRight className="h-4 w-4" />
					) : (
						<ChevronLeft className="h-4 w-4" />
					)}
				</button>
			</div>

			{!isCollapsed && (
				<>
					{/* Search and Filters */}
					<div className="p-4 border-b border-border space-y-3">
						<div className="relative">
							<Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
							<input
								type="text"
								placeholder="Search articles..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
							/>
						</div>

						<div className="flex items-center justify-between">
							<select
								value={selectedCategory}
								onChange={(e) => setSelectedCategory(e.target.value)}
								className="text-sm border border-border rounded-md px-3 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
							>
								{categories.map((category) => (
									<option key={category} value={category}>
										{category === "all" ? "All Categories" : category}
									</option>
								))}
							</select>

							<Button
								variant="outline"
								size="sm"
								onClick={fetchArticles}
								disabled={loading}
							>
								<RefreshCw
									className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
								/>
							</Button>
						</div>
					</div>

					{/* Articles List */}
					<div className="flex-1 overflow-y-auto">
						{loading ? (
							<div className="p-4 space-y-3">
								{[...Array(5)].map((_, i) => (
									<div
										key={i}
										className="h-20 bg-muted rounded animate-pulse"
									/>
								))}
							</div>
						) : (
							<div className="p-2">
								{filteredArticles.map((article) => (
									<button
										key={article.id}
										onClick={() => onArticleSelect(article)}
										className={cn(
											"w-full text-left p-3 mb-2 rounded-lg border transition-all duration-200 hover:shadow-sm",
											selectedArticleId === article.id
												? "bg-primary/10 border-primary shadow-sm"
												: "bg-card border-border hover:bg-muted/50",
										)}
									>
										<div className="space-y-2">
											<h3
												className={cn(
													"font-medium text-sm leading-5 line-clamp-3",
													selectedArticleId === article.id
														? "text-primary"
														: "text-foreground",
												)}
											>
												{article.title}
											</h3>

											{article.summary && (
												<p className="text-xs text-muted-foreground line-clamp-2">
													{article.summary}
												</p>
											)}

											<div className="flex items-center justify-between">
												<div className="flex items-center text-xs text-muted-foreground">
													<Clock className="h-3 w-3 mr-1" />
													<span>
														{new Date(article.createdAt).toLocaleDateString()}
													</span>
												</div>

												{article.sentiment && (
													<Badge
														className={getSentimentColor(article.sentiment)}
													>
														{article.sentiment}
													</Badge>
												)}
											</div>

											{article.sourcePublisher && (
												<div className="text-xs text-muted-foreground">
													{article.sourcePublisher}
												</div>
											)}
										</div>
									</button>
								))}

								{filteredArticles.length === 0 && !loading && (
									<div className="text-center py-8 text-muted-foreground">
										<Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
										<p>No articles found</p>
									</div>
								)}
							</div>
						)}
					</div>
				</>
			)}

			{/* Collapsed state */}
			{isCollapsed && (
				<div className="p-2 space-y-2 overflow-y-auto">
					{articles.slice(0, 10).map((article) => (
						<button
							key={article.id}
							onClick={() => onArticleSelect(article)}
							className={cn(
								"w-full p-2 rounded-md transition-colors",
								selectedArticleId === article.id
									? "bg-primary text-primary-foreground"
									: "hover:bg-muted",
							)}
							title={article.title}
						>
							<div className="w-2 h-2 bg-current rounded-full mx-auto" />
						</button>
					))}
				</div>
			)}
		</div>
	);
}
