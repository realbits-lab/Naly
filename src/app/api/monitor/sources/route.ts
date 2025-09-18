import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rssSources } from "@/lib/schema/rss";
import { eq } from "drizzle-orm";

// Default RSS sources based on compatibility testing (100% success rate sources)
const DEFAULT_RSS_SOURCES = [
	// Bloomberg RSS sources (100% success rate)
	{
		name: "Bloomberg Markets",
		feedUrl: "https://feeds.bloomberg.com/markets/news.rss",
		description: "Bloomberg markets and financial news",
		category: "markets",
		isActive: true,
		logoUrl: "https://www.bloomberg.com/favicon.ico"
	},
	{
		name: "Bloomberg Wealth",
		feedUrl: "https://feeds.bloomberg.com/wealth/news.rss",
		description: "Bloomberg wealth and investment news",
		category: "wealth",
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
	// CNBC RSS sources (100% success rate)
	{
		name: "CNBC Top News",
		feedUrl: "https://www.cnbc.com/id/100003114/device/rss/rss.html",
		description: "CNBC top business and financial news",
		category: "business",
		isActive: true,
		logoUrl: "https://www.cnbc.com/favicon.ico"
	},
	{
		name: "CNBC World Markets",
		feedUrl: "https://www.cnbc.com/id/100727362/device/rss/rss.html",
		description: "CNBC international markets and analysis",
		category: "markets",
		isActive: true,
		logoUrl: "https://www.cnbc.com/favicon.ico"
	},
	{
		name: "CNBC US Markets",
		feedUrl: "https://www.cnbc.com/id/15839135/device/rss/rss.html",
		description: "CNBC US markets and earnings",
		category: "markets",
		isActive: true,
		logoUrl: "https://www.cnbc.com/favicon.ico"
	},
	// Financial Times RSS sources (100% success rate)
	{
		name: "Financial Times Companies",
		feedUrl: "https://www.ft.com/companies?format=rss",
		description: "Financial Times company news and analysis",
		category: "companies",
		isActive: true,
		logoUrl: "https://www.ft.com/favicon.ico"
	},
	{
		name: "Financial Times Markets",
		feedUrl: "https://www.ft.com/markets?format=rss",
		description: "Financial Times markets and trading news",
		category: "markets",
		isActive: true,
		logoUrl: "https://www.ft.com/favicon.ico"
	},
	// MarketWatch RSS sources (100% success rate)
	{
		name: "MarketWatch Top Stories",
		feedUrl: "http://feeds.marketwatch.com/marketwatch/topstories/",
		description: "MarketWatch top financial stories",
		category: "finance",
		isActive: true,
		logoUrl: "https://www.marketwatch.com/favicon.ico"
	},
	{
		name: "MarketWatch Headlines",
		feedUrl: "http://feeds.marketwatch.com/marketwatch/realtimeheadlines/",
		description: "MarketWatch real-time headlines",
		category: "finance",
		isActive: true,
		logoUrl: "https://www.marketwatch.com/favicon.ico"
	},
	// Investment Analysis sources (100% success rate)
	{
		name: "Seeking Alpha Articles",
		feedUrl: "https://seekingalpha.com/feed.xml",
		description: "Seeking Alpha investment analysis and articles",
		category: "investment",
		isActive: true,
		logoUrl: "https://seekingalpha.com/favicon.ico"
	},
	{
		name: "Forbes Business",
		feedUrl: "https://www.forbes.com/business/feed/",
		description: "Forbes business news and insights",
		category: "business",
		isActive: true,
		logoUrl: "https://www.forbes.com/favicon.ico"
	},
	// Partial success sources (monitored)
	{
		name: "Yahoo Finance",
		feedUrl: "https://finance.yahoo.com/news/rssindex",
		description: "Yahoo Finance top stories (66.7% success rate)",
		category: "finance",
		isActive: true,
		logoUrl: "https://finance.yahoo.com/favicon.ico"
	},
	{
		name: "Seeking Alpha Market News",
		feedUrl: "https://seekingalpha.com/market_currents.xml",
		description: "Seeking Alpha breaking market news (66.7% success rate)",
		category: "investment",
		isActive: true,
		logoUrl: "https://seekingalpha.com/favicon.ico"
	}
];

export async function GET(request: NextRequest) {
	try {
		// Try to get sources from database
		let sources;
		try {
			sources = await db.select().from(rssSources).where(eq(rssSources.isActive, true));
		} catch (dbError) {
			// If database is not available, return default sources
			console.log("Database not available, using default RSS sources");
			sources = DEFAULT_RSS_SOURCES.map((source, index) => ({
				id: `default-${index}`,
				...source,
				createdAt: new Date(),
				updatedAt: new Date(),
				websiteUrl: null,
				language: "en",
				country: null,
				updateFrequency: 60,
				lastFetchedAt: null,
				lastSuccessfulFetch: null,
				fetchErrorCount: 0,
				lastFetchError: null,
			}));
		}

		// If no sources in database, seed with default sources
		if (sources.length === 0) {
			try {
				const insertedSources = await Promise.all(
					DEFAULT_RSS_SOURCES.map(source =>
						db.insert(rssSources).values(source).returning()
					)
				);
				sources = insertedSources.flat();
			} catch (seedError) {
				// If seeding fails, return default sources with IDs
				sources = DEFAULT_RSS_SOURCES.map((source, index) => ({
					id: `default-${index}`,
					...source,
					createdAt: new Date(),
					updatedAt: new Date(),
					websiteUrl: null,
					language: "en",
					country: null,
					updateFrequency: 60,
					lastFetchedAt: null,
					lastSuccessfulFetch: null,
					fetchErrorCount: 0,
					lastFetchError: null,
				}));
			}
		}

		return NextResponse.json(sources);
	} catch (error) {
		console.error("Error fetching RSS sources:", error);

		// Fallback to default sources
		const fallbackSources = DEFAULT_RSS_SOURCES.map((source, index) => ({
			id: `default-${index}`,
			...source,
			createdAt: new Date(),
			updatedAt: new Date(),
			websiteUrl: null,
			language: "en",
			country: null,
			updateFrequency: 60,
			lastFetchedAt: null,
			lastSuccessfulFetch: null,
			fetchErrorCount: 0,
			lastFetchError: null,
		}));

		return NextResponse.json(fallbackSources);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { name, feedUrl, description, category, logoUrl, websiteUrl } = body;

		if (!name || !feedUrl) {
			return NextResponse.json(
				{ error: "Name and feed URL are required" },
				{ status: 400 }
			);
		}

		const newSource = await db.insert(rssSources).values({
			name,
			feedUrl,
			description,
			category: category || "general",
			logoUrl,
			websiteUrl,
			isActive: true,
		}).returning();

		return NextResponse.json(newSource[0], { status: 201 });
	} catch (error) {
		console.error("Error creating RSS source:", error);
		return NextResponse.json(
			{ error: "Failed to create RSS source" },
			{ status: 500 }
		);
	}
}