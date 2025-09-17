"use client";

import {
	BarChart3,
	BookOpen,
	ChevronLeft,
	ChevronRight,
	Clock,
	MessageCircle,
	Share2,
	Star,
	TrendingDown,
	TrendingUp,
	User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface NarrativeGridProps {
	filters: {
		category: string;
		sentiment: string;
		timeframe: string;
		complexity: string;
		ticker: string;
		page: number;
	};
	userId?: string;
	isAuthenticated: boolean;
}

interface Narrative {
	id: string;
	title: string;
	summary: string;
	ticker: string;
	sentiment: "bullish" | "bearish" | "neutral";
	confidence: number;
	createdAt: string;
	readingTime: number;
	viewCount: number;
	likeCount: number;
	commentCount: number;
	category: string;
	hasVisualization: boolean;
	author: {
		type: "ai" | "human";
		name: string;
	};
	isBookmarked?: boolean;
	tags: string[];
}

export function NarrativeGrid({
	filters,
	userId,
	isAuthenticated,
}: NarrativeGridProps) {
	const [narratives, setNarratives] = useState<Narrative[]>([]);
	const [loading, setLoading] = useState(true);
	const [totalPages, setTotalPages] = useState(1);

	useEffect(() => {
		loadNarratives();
	}, [filters]);

	const loadNarratives = async () => {
		try {
			setLoading(true);
			await new Promise((resolve) => setTimeout(resolve, 800));

			// Mock data - would be replaced with actual API call
			const mockNarratives: Narrative[] = [
				{
					id: "1",
					title: "Microsoft Azure Gains Momentum in Enterprise AI Adoption",
					summary:
						"Microsoft's cloud platform continues to capture market share as enterprises increasingly adopt AI-powered solutions, driving significant revenue growth.",
					ticker: "MSFT",
					sentiment: "bullish",
					confidence: 0.84,
					createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
					readingTime: 4,
					viewCount: 1250,
					likeCount: 89,
					commentCount: 23,
					category: "Technology Analysis",
					hasVisualization: true,
					author: { type: "ai", name: "Naly AI" },
					isBookmarked: false,
					tags: ["Cloud Computing", "AI", "Enterprise"],
				},
				{
					id: "2",
					title:
						"Tesla Energy Division Shows Promise Despite Auto Sector Headwinds",
					summary:
						"While automotive sales face challenges, Tesla's energy storage and solar businesses demonstrate strong growth potential and expanding market opportunities.",
					ticker: "TSLA",
					sentiment: "neutral",
					confidence: 0.71,
					createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
					readingTime: 5,
					viewCount: 2156,
					likeCount: 145,
					commentCount: 67,
					category: "Company Deep Dive",
					hasVisualization: true,
					author: { type: "ai", name: "Naly AI" },
					isBookmarked: true,
					tags: ["Electric Vehicles", "Energy Storage", "Renewables"],
				},
				{
					id: "3",
					title:
						"Federal Reserve Policy Shift Creates Uncertainty for Growth Stocks",
					summary:
						"Recent Fed communications suggest potential policy changes that could significantly impact high-growth technology companies and their valuations.",
					ticker: "QQQ",
					sentiment: "bearish",
					confidence: 0.77,
					createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
					readingTime: 6,
					viewCount: 1834,
					likeCount: 92,
					commentCount: 45,
					category: "Market Analysis",
					hasVisualization: false,
					author: { type: "ai", name: "Naly AI" },
					isBookmarked: false,
					tags: ["Federal Reserve", "Monetary Policy", "Growth Stocks"],
				},
				{
					id: "4",
					title:
						"Nvidia's Data Center Business Faces New Competitive Pressures",
					summary:
						"Emerging competitors and changing market dynamics in the data center space could challenge Nvidia's dominant position in AI computing.",
					ticker: "NVDA",
					sentiment: "bearish",
					confidence: 0.69,
					createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
					readingTime: 3,
					viewCount: 3021,
					likeCount: 156,
					commentCount: 89,
					category: "Technology Analysis",
					hasVisualization: true,
					author: { type: "ai", name: "Naly AI" },
					isBookmarked: false,
					tags: ["Semiconductors", "AI Hardware", "Competition"],
				},
			];

			setNarratives(mockNarratives);
			setTotalPages(5); // Mock total pages
		} catch (error) {
			console.error("Error loading narratives:", error);
		} finally {
			setLoading(false);
		}
	};

	const getSentimentColor = (sentiment: Narrative["sentiment"]) => {
		switch (sentiment) {
			case "bullish":
				return "text-bull";
			case "bearish":
				return "text-bear";
			case "neutral":
				return "text-neutral";
			default:
				return "text-muted-foreground";
		}
	};

	const getSentimentBadge = (sentiment: Narrative["sentiment"]) => {
		switch (sentiment) {
			case "bullish":
				return { variant: "bull" as const, icon: TrendingUp };
			case "bearish":
				return { variant: "bear" as const, icon: TrendingDown };
			case "neutral":
				return { variant: "neutral" as const, icon: BarChart3 };
			default:
				return { variant: "secondary" as const, icon: BarChart3 };
		}
	};

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{[...Array(6)].map((_, i) => (
						<Card key={i} className="animate-pulse">
							<CardContent className="p-6">
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<div className="h-5 bg-muted rounded w-16" />
										<div className="h-5 bg-muted rounded w-20" />
									</div>
									<div className="h-4 bg-muted rounded w-full" />
									<div className="h-4 bg-muted rounded w-3/4" />
									<div className="h-3 bg-muted rounded w-1/2" />
									<div className="flex items-center space-x-2">
										<div className="h-5 bg-muted rounded w-12" />
										<div className="h-5 bg-muted rounded w-16" />
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Results */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{narratives.map((narrative) => {
					const sentimentBadge = getSentimentBadge(narrative.sentiment);
					const SentimentIcon = sentimentBadge.icon;

					return (
						<Card
							key={narrative.id}
							className="group hover:shadow-lg transition-all duration-200"
						>
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between space-x-2">
									<div className="flex items-center space-x-2">
										<Badge variant="outline" className="text-xs font-mono">
											{narrative.ticker}
										</Badge>
										<Badge variant="outline" className="text-xs">
											{narrative.category}
										</Badge>
									</div>

									<div className="flex items-center space-x-1">
										{narrative.hasVisualization && (
											<Badge variant="secondary" className="text-xs">
												<BarChart3 className="h-3 w-3 mr-1" />
												Visual
											</Badge>
										)}

										{narrative.isBookmarked && (
											<Star className="h-4 w-4 text-bull fill-bull" />
										)}
									</div>
								</div>
							</CardHeader>

							<CardContent>
								<div className="space-y-4">
									<div>
										<Link href={`/narratives/${narrative.id}`}>
											<h3 className="font-semibold text-base group-hover:text-bull transition-colors cursor-pointer leading-tight">
												{narrative.title}
											</h3>
										</Link>

										<p className="text-sm text-muted-foreground mt-2 line-clamp-2">
											{narrative.summary}
										</p>
									</div>

									{/* Tags */}
									<div className="flex flex-wrap gap-1">
										{narrative.tags.slice(0, 3).map((tag) => (
											<Badge key={tag} variant="outline" className="text-xs">
												{tag}
											</Badge>
										))}
									</div>

									{/* Sentiment & Confidence */}
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-2">
											<Badge
												variant={sentimentBadge.variant}
												className="text-xs"
											>
												<SentimentIcon className="h-3 w-3 mr-1" />
												{narrative.sentiment.charAt(0).toUpperCase() +
													narrative.sentiment.slice(1)}
											</Badge>
											<span className="text-xs text-muted-foreground">
												{Math.round(narrative.confidence * 100)}% confidence
											</span>
										</div>
									</div>

									{/* Meta information */}
									<div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
										<div className="flex items-center space-x-3">
											<div className="flex items-center space-x-1">
												<User className="h-3 w-3" />
												<span>{narrative.author.name}</span>
											</div>

											<div className="flex items-center space-x-1">
												<Clock className="h-3 w-3" />
												<span>{narrative.readingTime} min read</span>
											</div>
										</div>

										<div className="flex items-center space-x-3">
											<span>{narrative.viewCount.toLocaleString()} views</span>

											{isAuthenticated && (
												<div className="flex items-center space-x-2">
													<button className="flex items-center space-x-1 hover:text-bull transition-colors">
														<MessageCircle className="h-3 w-3" />
														<span>{narrative.commentCount}</span>
													</button>

													<button className="flex items-center space-x-1 hover:text-bull transition-colors">
														<Share2 className="h-3 w-3" />
													</button>
												</div>
											)}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-center space-x-2">
					<Button
						variant="outline"
						size="sm"
						disabled={filters.page <= 1}
						onClick={() => {
							// Navigate to previous page
							const params = new URLSearchParams(window.location.search);
							params.set("page", String(filters.page - 1));
							window.location.search = params.toString();
						}}
					>
						<ChevronLeft className="h-4 w-4 mr-1" />
						Previous
					</Button>

					<div className="flex items-center space-x-1">
						{[...Array(Math.min(5, totalPages))].map((_, i) => {
							const page = i + 1;
							const isActive = page === filters.page;

							return (
								<Button
									key={page}
									variant={isActive ? "default" : "outline"}
									size="sm"
									className={isActive ? "bg-bull hover:bg-bull/90" : ""}
								>
									{page}
								</Button>
							);
						})}
					</div>

					<Button
						variant="outline"
						size="sm"
						disabled={filters.page >= totalPages}
						onClick={() => {
							// Navigate to next page
							const params = new URLSearchParams(window.location.search);
							params.set("page", String(filters.page + 1));
							window.location.search = params.toString();
						}}
					>
						Next
						<ChevronRight className="h-4 w-4 ml-1" />
					</Button>
				</div>
			)}

			{narratives.length === 0 && !loading && (
				<div className="text-center py-12">
					<BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-muted-foreground mb-2">
						No narratives found
					</h3>
					<p className="text-sm text-muted-foreground mb-4">
						Try adjusting your filters or search terms
					</p>
					<Button variant="outline">Clear Filters</Button>
				</div>
			)}
		</div>
	);
}
