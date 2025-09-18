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

// Comprehensive financial RSS sources from docs/financial-rss-feeds.md
const DEFAULT_RSS_SOURCES: Omit<RssSource, 'id'>[] = [
	// United States - Government & Central Bank Sources
	{
		name: "Federal Reserve Press Releases",
		feedUrl: "https://www.federalreserve.gov/feeds/press_all.xml",
		description: "Federal Reserve official press releases and policy announcements",
		category: "central-banking",
		isActive: true,
		logoUrl: "https://www.federalreserve.gov/favicon.ico"
	},
	{
		name: "SEC Press Releases",
		feedUrl: "https://www.sec.gov/news/pressreleases.rss",
		description: "U.S. Securities and Exchange Commission press releases",
		category: "regulation",
		isActive: true,
		logoUrl: "https://www.sec.gov/favicon.ico"
	},

	// Bloomberg RSS sources
	{
		name: "Bloomberg Markets",
		feedUrl: "https://feeds.bloomberg.com/markets/news.rss",
		description: "Bloomberg markets and financial news",
		category: "markets",
		isActive: true,
		logoUrl: "https://www.bloomberg.com/favicon.ico"
	},
	{
		name: "Bloomberg Economics",
		feedUrl: "https://feeds.bloomberg.com/economics/news.rss",
		description: "Bloomberg economics and policy analysis",
		category: "economics",
		isActive: true,
		logoUrl: "https://www.bloomberg.com/favicon.ico"
	},
	{
		name: "Bloomberg Technology",
		feedUrl: "https://feeds.bloomberg.com/technology/news.rss",
		description: "Bloomberg technology and innovation news",
		category: "technology",
		isActive: true,
		logoUrl: "https://www.bloomberg.com/favicon.ico"
	},
	{
		name: "Bloomberg Politics",
		feedUrl: "https://feeds.bloomberg.com/politics/news.rss",
		description: "Bloomberg politics and policy news",
		category: "politics",
		isActive: true,
		logoUrl: "https://www.bloomberg.com/favicon.ico"
	},

	// Reuters RSS sources
	{
		name: "Reuters Business News",
		feedUrl: "https://news.google.com/rss/search?q=site:reuters.com/business&hl=en-US&gl=US&ceid=US:en",
		description: "Reuters business news via Google News RSS",
		category: "business",
		isActive: true,
		logoUrl: "https://www.reuters.com/favicon.ico"
	},
	{
		name: "Reuters Markets News",
		feedUrl: "https://news.google.com/rss/search?q=site:reuters.com/markets&hl=en-US&gl=US&ceid=US:en",
		description: "Reuters markets and trading news via Google News RSS",
		category: "markets",
		isActive: true,
		logoUrl: "https://www.reuters.com/favicon.ico"
	},

	// Financial Times
	{
		name: "Financial Times Home",
		feedUrl: "https://ft.com/rss/home",
		description: "Financial Times main news feed",
		category: "news",
		isActive: true,
		logoUrl: "https://www.ft.com/favicon.ico"
	},
	{
		name: "Financial Times Markets",
		feedUrl: "https://www.ft.com/markets?format=rss",
		description: "Financial Times markets coverage",
		category: "markets",
		isActive: true,
		logoUrl: "https://www.ft.com/favicon.ico"
	},

	// Investment Analysis
	{
		name: "Seeking Alpha",
		feedUrl: "https://seekingalpha.com/feed.xml",
		description: "Seeking Alpha investment analysis and market insights",
		category: "investment",
		isActive: true,
		logoUrl: "https://seekingalpha.com/favicon.ico"
	},
	{
		name: "The Motley Fool",
		feedUrl: "https://fool.com/a/feeds/partner/google",
		description: "The Motley Fool investment advice and analysis",
		category: "investment",
		isActive: true,
		logoUrl: "https://www.fool.com/favicon.ico"
	},

	// European News
	{
		name: "Euronews Business",
		feedUrl: "https://feeds.feedburner.com/euronews/en/business",
		description: "European business and economic news",
		category: "business",
		isActive: true,
		logoUrl: "https://www.euronews.com/favicon.ico"
	},

	// South Korea
	{
		name: "Korea Economic Daily Global",
		feedUrl: "https://www.kedglobal.com/newsRss",
		description: "Korean business and economic news in English",
		category: "business",
		isActive: true,
		logoUrl: "https://www.kedglobal.com/favicon.ico"
	},
	{
		name: "BusinessKorea",
		feedUrl: "https://businesskorea.co.kr/rss/allEnglishArticles",
		description: "Korean business news and market analysis",
		category: "business",
		isActive: true,
		logoUrl: "https://businesskorea.co.kr/favicon.ico"
	},

	// Pan-Asia & Global
	{
		name: "Nikkei Asia",
		feedUrl: "https://asia.nikkei.com/rss/feed/nar",
		description: "Asian business and economic news",
		category: "business",
		isActive: true,
		logoUrl: "https://asia.nikkei.com/favicon.ico"
	},
	{
		name: "South China Morning Post",
		feedUrl: "https://scmp.com/rss",
		description: "Hong Kong and China news coverage",
		category: "news",
		isActive: true,
		logoUrl: "https://www.scmp.com/favicon.ico"
	},

	// Cryptocurrency & Digital Assets
	{
		name: "CoinDesk",
		feedUrl: "https://coindesk.com/arc/outboundfeeds/rss/",
		description: "Cryptocurrency news and blockchain analysis",
		category: "cryptocurrency",
		isActive: true,
		logoUrl: "https://www.coindesk.com/favicon.ico"
	},
	{
		name: "Cointelegraph",
		feedUrl: "https://cointelegraph.com/rss",
		description: "Blockchain and cryptocurrency industry news",
		category: "cryptocurrency",
		isActive: true,
		logoUrl: "https://cointelegraph.com/favicon.ico"
	},

	// Wall Street Journal
	{
		name: "WSJ Markets Main",
		feedUrl: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",
		description: "Wall Street Journal markets coverage",
		category: "markets",
		isActive: true,
		logoUrl: "https://www.wsj.com/favicon.ico"
	},
	{
		name: "WSJ Business",
		feedUrl: "https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml",
		description: "Wall Street Journal business news",
		category: "business",
		isActive: true,
		logoUrl: "https://www.wsj.com/favicon.ico"
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

			<CardContent className="p-0">
				<div className="h-[calc(100vh-8rem)] overflow-y-auto">
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
									variant={selectedSourceId === source.id ? "default" : "ghost"}
									onClick={() => handleSourceClick(source)}
									className={cn(
										"w-full justify-start h-auto p-3 text-left transition-colors duration-150 ease-linear",
										selectedSourceId === source.id && "bg-primary text-primary-foreground shadow-sm"
									)}
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
			</div>
			</CardContent>
		</Card>
	);
}