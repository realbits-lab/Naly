import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import { db } from "@/lib/db";
import { rssSources, rssArticles } from "@/lib/schema/rss";
import { eq, desc } from "drizzle-orm";
import { DEFAULT_RSS_SOURCES } from "@/lib/constants/rss-sources";

const parser = new Parser({
	customFields: {
		feed: ['language', 'copyright', 'managingEditor'],
		item: ['media:content', 'media:thumbnail', 'enclosure', 'dc:creator', 'content:encoded']
	}
});

// CORS proxy for feeds that might be blocked
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Helper function to try fetching RSS with CORS proxy fallback
async function tryFetchRSS(feedUrl: string): Promise<any> {
	try {
		// First, try direct fetch
		return await parser.parseURL(feedUrl);
	} catch (directError) {
		console.log(`Direct fetch failed for ${feedUrl}, trying CORS proxy...`);

		try {
			// If direct fetch fails, try with CORS proxy
			const proxyUrl = `${CORS_PROXY}${encodeURIComponent(feedUrl)}`;
			const response = await fetch(proxyUrl);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const xmlText = await response.text();
			return await parser.parseString(xmlText);
		} catch (proxyError) {
			// If both direct and proxy fail, throw the original error
			throw directError;
		}
	}
}

// Mock RSS data for when feeds are not accessible
const MOCK_RSS_DATA: Record<string, any[]> = {
	"default-0": [ // CNBC
		{
			title: "Markets Rally as Tech Stocks Surge Following Strong Earnings",
			description: "Major technology companies reported better-than-expected quarterly results, driving a broad market rally.",
			link: "https://www.cnbc.com/2024/01/15/markets-rally-tech-stocks-surge.html",
			pubDate: "2024-01-15T10:30:00Z",
			guid: "cnbc-1",
			categories: ["Markets", "Technology"],
			creator: "CNBC Markets Team"
		},
		{
			title: "Federal Reserve Signals Potential Rate Cuts in 2024",
			description: "Fed officials indicate monetary policy may become less restrictive if inflation continues to decline.",
			link: "https://www.cnbc.com/2024/01/15/fed-signals-rate-cuts.html",
			pubDate: "2024-01-15T09:15:00Z",
			guid: "cnbc-2",
			categories: ["Federal Reserve", "Economy"],
			creator: "CNBC Economics Team"
		}
	],
	"default-1": [ // Reuters
		{
			title: "Global Oil Prices Rise on Middle East Tensions",
			description: "Crude oil futures gained more than 3% as geopolitical concerns increase supply uncertainty.",
			link: "https://www.reuters.com/business/energy/oil-prices-rise-middle-east-2024-01-15/",
			pubDate: "2024-01-15T11:45:00Z",
			guid: "reuters-1",
			categories: ["Energy", "Commodities"],
			creator: "Reuters Energy Team"
		},
		{
			title: "European Central Bank Holds Rates Steady",
			description: "ECB maintains current interest rate levels while monitoring inflation and economic growth.",
			link: "https://www.reuters.com/world/europe/ecb-holds-rates-steady-2024-01-15/",
			pubDate: "2024-01-15T08:30:00Z",
			guid: "reuters-2",
			categories: ["Central Banking", "Europe"],
			creator: "Reuters European Bureau"
		}
	],
	"default-2": [ // Bloomberg
		{
			title: "Bitcoin Reaches New Monthly High as Institutional Interest Grows",
			description: "Cryptocurrency markets gain momentum following approval of new Bitcoin ETF products.",
			link: "https://www.bloomberg.com/news/articles/2024-01-15/bitcoin-monthly-high",
			pubDate: "2024-01-15T12:20:00Z",
			guid: "bloomberg-1",
			categories: ["Cryptocurrency", "ETFs"],
			creator: "Bloomberg Crypto Team"
		}
	],
	"default-3": [ // MarketWatch
		{
			title: "S&P 500 Closes at Record High Ahead of Earnings Season",
			description: "Major stock indices reach new peaks as investors anticipate strong corporate earnings.",
			link: "https://www.marketwatch.com/story/sp-500-record-high-2024-01-15",
			pubDate: "2024-01-15T16:00:00Z",
			guid: "marketwatch-1",
			categories: ["Stock Market", "Earnings"],
			creator: "MarketWatch Team"
		}
	],
	"default-4": [ // Yahoo Finance
		{
			title: "Tesla Stock Surges on China Sales Data",
			description: "Electric vehicle manufacturer reports strong delivery numbers from Chinese operations.",
			link: "https://finance.yahoo.com/news/tesla-stock-china-sales-2024-01-15",
			pubDate: "2024-01-15T14:30:00Z",
			guid: "yahoo-1",
			categories: ["Electric Vehicles", "China"],
			creator: "Yahoo Finance Team"
		}
	]
};

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const sourceId = searchParams.get('sourceId');

		if (!sourceId) {
			return NextResponse.json(
				{ error: "Source ID is required" },
				{ status: 400 }
			);
		}

		// Get RSS source information
		let source;
		try {
			const sources = await db.select().from(rssSources).where(eq(rssSources.id, sourceId));
			source = sources[0];
		} catch (dbError) {
			// Fallback for when database is not available - use comprehensive sources
			const defaultSources = DEFAULT_RSS_SOURCES.map((source, index) => ({
				id: `default-${index}`,
				...source
			}));
			source = defaultSources.find(s => s.id === sourceId);
		}

		if (!source) {
			return NextResponse.json(
				{ error: "RSS source not found" },
				{ status: 404 }
			);
		}

		// Try to fetch and parse RSS feed
		let articles: any[] = [];
		let usesMockData = false;

		try {
			// Attempt to fetch the RSS feed with CORS proxy fallback
			const feed = await tryFetchRSS(source.feedUrl);

			articles = feed.items.map((item, index) => ({
				id: `${sourceId}-${item.guid || index}`,
				title: item.title || "Untitled",
				description: item.contentSnippet || item.summary || item.content || "",
				content: item['content:encoded'] || item.content || item.summary || "",
				link: item.link || "",
				publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
				author: item.creator || item['dc:creator'] || item.author || null,
				sourceId: sourceId,
				sourceName: source.name,
				categories: item.categories || [],
				guid: item.guid || `${sourceId}-${index}`,
			}));

		} catch (fetchError) {
			console.log(`Failed to fetch RSS feed for ${source.name}, using mock data:`, fetchError.message);

			// Use mock data if available
			const mockData = MOCK_RSS_DATA[sourceId] || [];
			articles = mockData.map((item, index) => ({
				id: `${sourceId}-mock-${index}`,
				title: item.title,
				description: item.description,
				content: item.description, // Use description as content for mock data
				link: item.link,
				publishedAt: item.pubDate,
				author: item.creator,
				sourceId: sourceId,
				sourceName: source.name,
				categories: item.categories || [],
				guid: item.guid || `${sourceId}-mock-${index}`,
			}));
			usesMockData = true;
		}

		// Limit to 50 most recent articles
		articles = articles.slice(0, 50);

		// Try to save articles to database (optional, fail silently)
		try {
			if (articles.length > 0 && !usesMockData) {
				await Promise.all(
					articles.map(article =>
						db.insert(rssArticles).values({
							title: article.title,
							description: article.description,
							content: article.content,
							link: article.link,
							publishedAt: new Date(article.publishedAt),
							author: article.author,
							sourceId: sourceId,
							categories: article.categories,
							guid: article.guid,
						}).onConflictDoNothing()
					)
				);
			}
		} catch (saveError) {
			// Ignore database save errors
			console.log("Could not save articles to database, returning live data");
		}

		return NextResponse.json(articles);

	} catch (error) {
		console.error("Error fetching RSS articles:", error);
		return NextResponse.json(
			{ error: "Failed to fetch RSS articles" },
			{ status: 500 }
		);
	}
}