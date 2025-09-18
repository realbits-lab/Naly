// Comprehensive financial RSS sources from docs/financial-rss-feeds.md
export const DEFAULT_RSS_SOURCES = [
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
	{
		name: "SEC Enforcement Actions",
		feedUrl: "https://www.sec.gov/enforcement-litigation/litigation-releases/rss",
		description: "SEC enforcement and litigation releases",
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

	// Reuters RSS sources (via Google News)
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
	{
		name: "Reuters Technology News",
		feedUrl: "https://news.google.com/rss/search?q=site:reuters.com/technology&hl=en-US&gl=US&ceid=US:en",
		description: "Reuters technology news via Google News RSS",
		category: "technology",
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

	// Fox Business
	{
		name: "Fox Business Economy",
		feedUrl: "https://moxie.foxbusiness.com/google-publisher/economy.xml",
		description: "Fox Business economic news and analysis",
		category: "economics",
		isActive: true,
		logoUrl: "https://www.foxbusiness.com/favicon.ico"
	},
	{
		name: "Fox Business Markets",
		feedUrl: "https://moxie.foxbusiness.com/google-publisher/markets.xml",
		description: "Fox Business markets and trading news",
		category: "markets",
		isActive: true,
		logoUrl: "https://www.foxbusiness.com/favicon.ico"
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
		name: "Seeking Alpha Market News",
		feedUrl: "https://seekingalpha.com/market_currents.xml",
		description: "Seeking Alpha market currents and news",
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
	{
		name: "Investing.com Economic Indicators",
		feedUrl: "https://www.investing.com/rss/news_95.rss",
		description: "Economic indicators and data analysis",
		category: "economics",
		isActive: true,
		logoUrl: "https://www.investing.com/favicon.ico"
	},
	{
		name: "Investing.com Stock Analysis",
		feedUrl: "https://www.investing.com/rss/stock.rss",
		description: "Stock analysis and market research",
		category: "stocks",
		isActive: true,
		logoUrl: "https://www.investing.com/favicon.ico"
	},

	// Research & Analysis
	{
		name: "Calculated Risk",
		feedUrl: "https://feeds.feedburner.com/CalculatedRisk",
		description: "Economic analysis and housing market insights",
		category: "economics",
		isActive: true,
		logoUrl: "https://www.calculatedriskblog.com/favicon.ico"
	},
	{
		name: "The Big Picture",
		feedUrl: "https://ritholtz.com/feed",
		description: "Market commentary and financial analysis by Barry Ritholtz",
		category: "finance",
		isActive: true,
		logoUrl: "https://ritholtz.com/favicon.ico"
	},

	// European Union - Central Bank & EU Institutions
	{
		name: "European Central Bank Press",
		feedUrl: "https://www.ecb.europa.eu/rss/press.html",
		description: "European Central Bank press releases",
		category: "central-banking",
		isActive: true,
		logoUrl: "https://www.ecb.europa.eu/favicon.ico"
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
		name: "Asia Times",
		feedUrl: "https://asiatimes.com/feed",
		description: "Asian politics, economics, and business news",
		category: "news",
		isActive: true,
		logoUrl: "https://asiatimes.com/favicon.ico"
	},
	{
		name: "South China Morning Post",
		feedUrl: "https://scmp.com/rss",
		description: "Hong Kong and China news coverage",
		category: "news",
		isActive: true,
		logoUrl: "https://www.scmp.com/favicon.ico"
	},
	{
		name: "SCMP China Economy",
		feedUrl: "https://scmp.com/rss/4/feed",
		description: "China economic news and analysis",
		category: "economics",
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
	},
	{
		name: "WSJ Technology",
		feedUrl: "https://feeds.a.dj.com/rss/RSSWSJD.xml",
		description: "Wall Street Journal technology coverage",
		category: "technology",
		isActive: true,
		logoUrl: "https://www.wsj.com/favicon.ico"
	},

	// Global Financial Data
	{
		name: "Trading Economics",
		feedUrl: "https://tradingeconomics.com/rss/feeds.aspx",
		description: "Global economic indicators and market data",
		category: "economics",
		isActive: true,
		logoUrl: "https://tradingeconomics.com/favicon.ico"
	},
	{
		name: "Investing.com Global",
		feedUrl: "https://investing.com/rss/news_1.rss",
		description: "Global financial news and market analysis",
		category: "finance",
		isActive: true,
		logoUrl: "https://www.investing.com/favicon.ico"
	}
];