"use client";

import {
	ChevronLeft,
	ChevronRight,
	Rss,
	Wifi,
	WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RssSource } from "./monitor-page-client";

interface RssSidebarProps {
	selectedSourceId: string | null;
	onSourceSelect: (source: RssSource) => void;
	isCollapsed: boolean;
	onToggleCollapse: () => void;
	isMobile: boolean;
}

// Iframe-compatible RSS sources (tested with Playwright MCP tool)
const DEFAULT_RSS_SOURCES: Omit<RssSource, 'id'>[] = [
	// Bloomberg RSS sources - IFRAME COMPATIBLE ✅
	{
		name: "Bloomberg Technology",
		feedUrl: "https://feeds.bloomberg.com/technology/news.rss",
		description: "Bloomberg technology and innovation news (iframe compatible)",
		category: "technology",
		isActive: true,
		logoUrl: "https://www.bloomberg.com/favicon.ico"
	},
	{
		name: "Bloomberg Politics",
		feedUrl: "https://feeds.bloomberg.com/politics/news.rss",
		description: "Bloomberg politics and policy news (iframe compatible)",
		category: "politics",
		isActive: true,
		logoUrl: "https://www.bloomberg.com/favicon.ico"
	}
];

export function RssSidebar({
	selectedSourceId,
	onSourceSelect,
	isCollapsed,
	onToggleCollapse,
	isMobile,
}: RssSidebarProps) {
	const [sources, setSources] = useState<RssSource[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchSources = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch('/api/monitor/sources');
			if (response.ok) {
				const fetchedSources = await response.json();
				setSources(fetchedSources);
			} else {
				// If API fails, use default sources with generated IDs
				const defaultSources = DEFAULT_RSS_SOURCES.map((source, index) => ({
					id: `default-${index}`,
					...source
				}));
				setSources(defaultSources);
			}
		} catch (error) {
			console.error('Error fetching RSS sources:', error);
			// Fallback to default sources
			const defaultSources = DEFAULT_RSS_SOURCES.map((source, index) => ({
				id: `default-${index}`,
				...source
			}));
			setSources(defaultSources);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchSources();
	}, [fetchSources]);


	const handleSourceClick = (source: RssSource) => {
		onSourceSelect(source);
	};

	if (isCollapsed && !isMobile) {
		return (
			<Card className="h-full border-r rounded-none">
				<CardHeader className="p-4 border-b">
					<div className="flex items-center justify-between">
						<Button
							variant="ghost"
							size="icon"
							onClick={onToggleCollapse}
							className="h-8 w-8"
						>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</CardHeader>
				<CardContent className="p-2 space-y-2">
					{loading ? (
						<div className="space-y-2">
							{[...Array(5)].map((_, i) => (
								<div key={i} className="w-8 h-8 bg-muted animate-pulse rounded" />
							))}
						</div>
					) : (
						sources.slice(0, 8).map((source) => (
							<Button
								key={source.id}
								variant={selectedSourceId === source.id ? "default" : "ghost"}
								size="icon"
								onClick={() => handleSourceClick(source)}
								className="w-8 h-8 flex-shrink-0"
								title={source.name}
							>
								{source.logoUrl ? (
									<img
										src={source.logoUrl}
										alt={source.name}
										className="w-4 h-4"
										onError={(e) => {
											e.currentTarget.style.display = 'none';
											e.currentTarget.nextElementSibling?.classList.remove('hidden');
										}}
									/>
								) : null}
								<Rss className={cn("h-4 w-4", source.logoUrl && "hidden")} />
							</Button>
						))
					)}
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="h-full border-r rounded-none">
			<CardHeader className="p-4 border-b">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg font-semibold flex items-center gap-2">
						<Rss className="h-5 w-5" />
						{!isMobile && "RSS Sources"}
					</CardTitle>
					{!isMobile && (
						<Button
							variant="ghost"
							size="icon"
							onClick={onToggleCollapse}
							className="h-8 w-8"
						>
							<ChevronLeft className="h-4 w-4" />
						</Button>
					)}
				</div>

			</CardHeader>

			<CardContent className="p-0 overflow-y-auto">
				{loading ? (
					<div className="p-4 space-y-4">
						{[...Array(5)].map((_, i) => (
							<div key={i} className="space-y-2">
								<div className="h-4 bg-muted animate-pulse rounded" />
								<div className="h-3 bg-muted animate-pulse rounded w-3/4" />
							</div>
						))}
					</div>
				) : (
					<div className="space-y-1 p-2">
						{sources.map((source) => (
							<Button
								key={source.id}
								variant={selectedSourceId === source.id ? "secondary" : "ghost"}
								onClick={() => handleSourceClick(source)}
								className="w-full justify-start h-auto p-3 text-left"
							>
								<div className="flex items-start gap-3 w-full">
									<div className="flex-shrink-0 mt-0.5">
										{source.logoUrl ? (
											<img
												src={source.logoUrl}
												alt={source.name}
												className="w-5 h-5 rounded"
												onError={(e) => {
													e.currentTarget.style.display = 'none';
													e.currentTarget.nextElementSibling?.classList.remove('hidden');
												}}
											/>
										) : null}
										<Rss className={cn("h-5 w-5", source.logoUrl && "hidden")} />
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<h3 className="font-medium text-sm truncate">
												{source.name}
											</h3>
											<div className="flex items-center gap-1">
												{source.isActive ? (
													<Wifi className="h-3 w-3 text-green-500" />
												) : (
													<WifiOff className="h-3 w-3 text-red-500" />
												)}
											</div>
										</div>
										{source.description && (
											<p className="text-xs text-muted-foreground line-clamp-2">
												{source.description}
											</p>
										)}
										<div className="flex items-center gap-2 mt-1">
											<Badge variant="secondary" className="text-xs">
												{source.category}
											</Badge>
										</div>
									</div>
								</div>
							</Button>
						))}
					</div>
				)}

				{!loading && sources.length === 0 && (
					<div className="p-8 text-center text-muted-foreground">
						<Rss className="h-12 w-12 mx-auto mb-4 opacity-50" />
						<p className="text-sm">No RSS sources found</p>
						<p className="text-xs mt-1">No sources available</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}