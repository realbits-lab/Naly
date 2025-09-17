"use client";

import {
	AlertTriangle,
	Award,
	BarChart3,
	BookOpen,
	ChevronRight,
	Clock,
	Lightbulb,
	RefreshCw,
	Shield,
	Star,
	Target,
	TrendingDown,
	TrendingUp,
	X,
	Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type {
	Recommendation,
	RecommendationType,
} from "@/lib/recommendations/recommendation-engine";
import { cn } from "@/lib/utils";

interface RecommendationWidgetProps {
	userId: string;
	types?: RecommendationType[];
	limit?: number;
	showHeader?: boolean;
	className?: string;
}

export function RecommendationWidget({
	userId,
	types,
	limit = 5,
	showHeader = true,
	className,
}: RecommendationWidgetProps) {
	const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
	const [loading, setLoading] = useState(true);
	const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

	const loadRecommendations = useCallback(async () => {
		try {
			setLoading(true);

			const params = new URLSearchParams();
			if (types?.length) params.append("types", types.join(","));
			if (limit) params.append("limit", limit.toString());

			const response = await fetch(`/api/recommendations?${params.toString()}`);
			const data = await response.json();

			if (data.success) {
				// Filter out dismissed recommendations
				const activeRecommendations = data.data.recommendations.filter(
					(rec: Recommendation) => !dismissedIds.has(rec.id),
				);
				setRecommendations(activeRecommendations);
			}
		} catch (error) {
			console.error("Error loading recommendations:", error);
		} finally {
			setLoading(false);
		}
	}, [types, limit, dismissedIds]);

	useEffect(() => {
		loadRecommendations();
	}, [loadRecommendations, userId]);

	const handleDismiss = async (recommendationId: string) => {
		setDismissedIds((prev) => new Set([...prev, recommendationId]));
		setRecommendations((prev) =>
			prev.filter((rec) => rec.id !== recommendationId),
		);

		// Track dismissal
		try {
			await fetch("/api/recommendations", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					type: "CLICK",
					objectId: recommendationId,
					objectType: "recommendation",
					metadata: { action: "dismiss" },
				}),
			});
		} catch (error) {
			console.error("Error tracking dismissal:", error);
		}
	};

	const handleAction = async (
		recommendation: Recommendation,
		action: string,
	) => {
		// Track interaction
		try {
			await fetch("/api/recommendations", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					type: "CLICK",
					objectId: recommendation.id,
					objectType: "recommendation",
					metadata: { action, type: recommendation.type },
				}),
			});
		} catch (error) {
			console.error("Error tracking action:", error);
		}
	};

	const getRecommendationIcon = (type: RecommendationType) => {
		switch (type) {
			case "INVESTMENT_OPPORTUNITY":
				return TrendingUp;
			case "PORTFOLIO_REBALANCE":
				return BarChart3;
			case "CONTENT_DISCOVERY":
				return BookOpen;
			case "RISK_ALERT":
				return AlertTriangle;
			case "LEARNING_RESOURCE":
				return Award;
			case "MARKET_INSIGHT":
				return Lightbulb;
			case "TRADING_STRATEGY":
				return Target;
			case "NEWS_ALERT":
				return Zap;
			default:
				return Lightbulb;
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "urgent":
				return "text-red-500 bg-red-50 border-red-200";
			case "high":
				return "text-orange-500 bg-orange-50 border-orange-200";
			case "medium":
				return "text-blue-500 bg-blue-50 border-blue-200";
			case "low":
				return "text-gray-500 bg-gray-50 border-gray-200";
			default:
				return "text-gray-500 bg-gray-50 border-gray-200";
		}
	};

	const getPriorityBadge = (priority: string) => {
		switch (priority) {
			case "urgent":
				return { variant: "destructive" as const, label: "Urgent" };
			case "high":
				return { variant: "secondary" as const, label: "High" };
			case "medium":
				return { variant: "outline" as const, label: "Medium" };
			case "low":
				return { variant: "outline" as const, label: "Low" };
			default:
				return { variant: "outline" as const, label: "Normal" };
		}
	};

	if (loading) {
		return (
			<Card className={className}>
				{showHeader && (
					<CardHeader>
						<CardTitle className="text-sm font-medium flex items-center space-x-2">
							<Skeleton className="h-4 w-4" />
							<Skeleton className="h-4 w-32" />
						</CardTitle>
					</CardHeader>
				)}
				<CardContent>
					<div className="space-y-4">
						{[...Array(3)].map((_, i) => (
							<div
								key={i}
								className="flex items-start space-x-3 p-3 border rounded-lg"
							>
								<Skeleton className="h-5 w-5 mt-1" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-3/4" />
									<Skeleton className="h-3 w-full" />
									<div className="flex items-center space-x-2">
										<Skeleton className="h-5 w-16" />
										<Skeleton className="h-5 w-12" />
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	if (recommendations.length === 0) {
		return (
			<Card className={className}>
				{showHeader && (
					<CardHeader>
						<CardTitle className="text-sm font-medium flex items-center space-x-2">
							<Lightbulb className="h-4 w-4" />
							<span>Recommendations</span>
						</CardTitle>
					</CardHeader>
				)}
				<CardContent>
					<div className="text-center py-8">
						<Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
						<p className="text-sm text-muted-foreground mb-2">
							No recommendations available
						</p>
						<p className="text-xs text-muted-foreground">
							Check back later for personalized insights
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={className}>
			{showHeader && (
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
					<CardTitle className="text-sm font-medium flex items-center space-x-2">
						<Lightbulb className="h-4 w-4 text-bull" />
						<span>AI Recommendations</span>
					</CardTitle>

					<div className="flex items-center space-x-2">
						<Badge variant="secondary" className="text-xs">
							{recommendations.length} active
						</Badge>
						<Button
							variant="ghost"
							size="sm"
							onClick={loadRecommendations}
							disabled={loading}
						>
							<RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
						</Button>
					</div>
				</CardHeader>
			)}

			<CardContent>
				<div className="space-y-3">
					{recommendations.map((recommendation) => {
						const Icon = getRecommendationIcon(recommendation.type);
						const priorityBadge = getPriorityBadge(recommendation.priority);

						return (
							<div
								key={recommendation.id}
								className={cn(
									"flex items-start space-x-3 p-3 border rounded-lg transition-colors hover:bg-muted/30",
									getPriorityColor(recommendation.priority),
								)}
							>
								<div className="flex-shrink-0 mt-0.5">
									<Icon className="h-4 w-4" />
								</div>

								<div className="flex-1 min-w-0 space-y-2">
									<div className="flex items-start justify-between">
										<h4 className="text-sm font-medium line-clamp-2 flex-1 pr-2">
											{recommendation.title}
										</h4>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleDismiss(recommendation.id)}
											className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
										>
											<X className="h-3 w-3" />
										</Button>
									</div>

									<p className="text-xs text-muted-foreground line-clamp-2">
										{recommendation.description}
									</p>

									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-2">
											<Badge
												variant={priorityBadge.variant}
												className="text-xs"
											>
												{priorityBadge.label}
											</Badge>

											<div className="flex items-center space-x-1 text-xs text-muted-foreground">
												<Star className="h-3 w-3" />
												<span>
													{Math.round(recommendation.confidence * 100)}%
												</span>
											</div>

											{recommendation.metadata.ticker && (
												<Badge variant="outline" className="text-xs font-mono">
													{recommendation.metadata.ticker}
												</Badge>
											)}
										</div>

										{recommendation.actionable && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													handleAction(recommendation, "view_details")
												}
												className="h-6 text-xs"
											>
												View
												<ChevronRight className="h-3 w-3 ml-1" />
											</Button>
										)}
									</div>

									{recommendation.metadata.expectedReturn && (
										<div className="flex items-center space-x-2 text-xs">
											<span className="text-muted-foreground">
												Expected return:
											</span>
											<span
												className={cn(
													"font-medium",
													recommendation.metadata.expectedReturn > 0
														? "text-bull"
														: "text-bear",
												)}
											>
												{recommendation.metadata.expectedReturn > 0 ? "+" : ""}
												{recommendation.metadata.expectedReturn.toFixed(1)}%
											</span>
										</div>
									)}

									{recommendation.expiresAt && (
										<div className="flex items-center space-x-1 text-xs text-muted-foreground">
											<Clock className="h-3 w-3" />
											<span>
												Expires{" "}
												{new Date(
													recommendation.expiresAt,
												).toLocaleDateString()}
											</span>
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>

				{recommendations.length > 0 && (
					<div className="mt-4 pt-3 border-t">
						<Button
							variant="ghost"
							size="sm"
							className="w-full text-xs"
							onClick={() => handleAction(recommendations[0], "view_all")}
						>
							View All Recommendations
							<ChevronRight className="h-3 w-3 ml-1" />
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
