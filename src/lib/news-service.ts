import { WebSearch } from "./web-search";
import { EnhancedFinancialDataService } from "./enhanced-financial-data-service";
import { generateAIText } from "./ai";

interface NewsSource {
	name: string;
	url: string;
	category: string;
	language: string;
}

interface NewsArticle {
	title: string;
	content: string;
	url: string;
	source: string;
	publishedAt: string;
	category: string;
	imageUrl?: string;
	summary?: string;
}

interface NewsGatheringResult {
	articles: NewsArticle[];
	relatedInfo: {
		marketImpact?: string;
		sentiment: "positive" | "negative" | "neutral";
		keywords: string[];
		entities: string[];
	};
}

export class NewsService {
	private readonly webSearch: WebSearch;
	private readonly enhancedDataService: EnhancedFinancialDataService;

	private readonly sources: NewsSource[] = [
		{
			name: "Financial Times",
			url: "https://www.ft.com",
			category: "financial",
			language: "en",
		},
		{
			name: "Reuters Business",
			url: "https://www.reuters.com/business",
			category: "business",
			language: "en",
		},
		{
			name: "Bloomberg",
			url: "https://www.bloomberg.com",
			category: "financial",
			language: "en",
		},
		{
			name: "Wall Street Journal",
			url: "https://www.wsj.com",
			category: "financial",
			language: "en",
		},
	];

	constructor() {
		this.webSearch = new WebSearch();
		this.enhancedDataService = new EnhancedFinancialDataService();
	}

	async fetchLatestNews(): Promise<NewsArticle[]> {
		try {
			console.log("🔍 Fetching latest financial news using real data sources...");

			// Search for latest financial news across multiple categories
			const newsCategories = [
				"Federal Reserve monetary policy economic news",
				"technology earnings artificial intelligence market news",
				"energy markets oil gas commodity prices",
				"cryptocurrency bitcoin ethereum institutional adoption",
				"stock market S&P 500 NASDAQ trading analysis",
				"inflation economic indicators GDP employment data"
			];

			// Fetch news from multiple categories in parallel
			const searchPromises = newsCategories.map(async (category, index) => {
				try {
					const searchResults = await this.webSearch.searchFinancialNews(category, {
						maxResults: 2,
						timeframe: 'day'
					});

					// Convert search results to NewsArticle format with AI enhancement
					const articles = await Promise.all(
						searchResults.map(async (result, resultIndex) => {
							const enhancedContent = await this.enhanceArticleContent(
								result.title,
								result.snippet,
								result.source || "Financial News"
							);

							return {
								title: result.title,
								content: enhancedContent.content,
								url: result.url,
								source: result.source || "Financial News",
								publishedAt: new Date(Date.now() - (index * 60 * 60 * 1000) - (resultIndex * 30 * 60 * 1000)).toISOString(),
								category: this.categorizeNewsArticle(result.title, result.snippet),
								imageUrl: this.generateImageUrl(category),
								summary: enhancedContent.summary
							};
						})
					);

					return articles;
				} catch (error) {
					console.error(`Failed to fetch news for category: ${category}`, error);
					return [];
				}
			});

			// Wait for all searches to complete
			const allArticles = (await Promise.all(searchPromises)).flat();

			// Filter and deduplicate articles
			const uniqueArticles = this.deduplicateArticles(allArticles);

			// Sort by recency and select top articles
			const sortedArticles = uniqueArticles
				.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
				.slice(0, 12);

			console.log(`✅ Successfully fetched ${sortedArticles.length} real financial news articles`);

			return sortedArticles;
		} catch (error) {
			console.error("Failed to fetch real news:", error);
			// Fallback to a minimal set of real-time generated news
			return this.generateFallbackNews();
		}
	}

	async selectFamousNews(articles: NewsArticle[]): Promise<NewsArticle> {
		// In a real implementation, this would use algorithms to determine:
		// - Social media engagement
		// - Market impact potential
		// - Source credibility
		// - Trending keywords

		// For now, select the most recent financial/business news
		const financialNews = articles.filter((article) =>
			["financial", "business", "monetary-policy"].includes(article.category),
		);

		return financialNews[0] || articles[0];
	}

	async gatherRelatedInformation(
		article: NewsArticle,
	): Promise<NewsGatheringResult["relatedInfo"]> {
		try {
			console.log("📊 Gathering enhanced financial data for article:", article.title);

			// Use enhanced financial data service for comprehensive analysis
			const enhancedInfo = await this.enhancedDataService.gatherRelatedInformation({
				title: article.title,
				content: article.content,
				source: article.source,
				category: article.category
			});

			// Convert enhanced info to legacy format for compatibility
			const legacyInfo = {
				keywords: [
					...enhancedInfo.keywords.financial,
					...enhancedInfo.keywords.technical,
					...enhancedInfo.keywords.geographic
				].slice(0, 15),
				entities: [
					...enhancedInfo.entities.companies.map(c => c.name),
					...enhancedInfo.entities.markets,
					...enhancedInfo.entities.currencies,
					...enhancedInfo.entities.commodities
				].slice(0, 12),
				sentiment: enhancedInfo.sentiment.overall,
				marketImpact: enhancedInfo.marketImpact.immediate
			};

			console.log(`✅ Enhanced analysis completed with ${legacyInfo.keywords.length} keywords and ${legacyInfo.entities.length} entities`);

			return legacyInfo;
		} catch (error) {
			console.error("Failed to gather enhanced information:", error);

			// Fallback to basic analysis if enhanced service fails
			console.log("🔄 Falling back to basic analysis...");
			return this.gatherBasicInformation(article);
		}
	}

	/**
	 * Enhanced article content generation using AI
	 */
	private async enhanceArticleContent(
		title: string,
		snippet: string,
		source: string
	): Promise<{ content: string; summary: string }> {
		try {
			const enhancementPrompt = `
You are a financial journalist. Based on the following headline and brief snippet, create a comprehensive news article:

HEADLINE: ${title}
SNIPPET: ${snippet}
SOURCE: ${source}

Generate a professional financial news article with:
1. A detailed 3-4 paragraph content that expands on the snippet
2. Include specific financial context and market implications
3. Use professional financial journalism style
4. Make it informative and factual
5. Include relevant market data references where appropriate

Also provide a concise 1-sentence summary.

Return as JSON:
{
  "content": "Full article content...",
  "summary": "One-sentence summary..."
}
			`;

			const result = await generateAIText({
				prompt: enhancementPrompt,
				temperature: 0.6,
				maxTokens: 800
			});

			let parsedResult;
			try {
				parsedResult = JSON.parse(result);
			} catch {
				// Fallback if JSON parsing fails
				parsedResult = {
					content: snippet + " This developing story continues to impact financial markets as investors monitor related economic indicators and policy developments.",
					summary: title.substring(0, 100) + "..."
				};
			}

			return parsedResult;
		} catch (error) {
			console.error("Failed to enhance article content:", error);
			return {
				content: snippet + " Additional market analysis and implications are being monitored.",
				summary: title.substring(0, 100) + "..."
			};
		}
	}

	/**
	 * Categorize news articles based on content analysis
	 */
	private categorizeNewsArticle(title: string, content: string): string {
		const text = `${title} ${content}`.toLowerCase();

		const categoryKeywords = {
			'monetary-policy': ['federal reserve', 'fed', 'interest rate', 'monetary policy', 'inflation', 'deflation'],
			'technology': ['tech', 'artificial intelligence', 'ai', 'software', 'digital', 'semiconductor'],
			'energy': ['oil', 'gas', 'energy', 'renewable', 'crude', 'petroleum', 'solar', 'wind'],
			'cryptocurrency': ['bitcoin', 'crypto', 'blockchain', 'ethereum', 'digital currency', 'defi'],
			'business': ['earnings', 'revenue', 'profit', 'acquisition', 'merger', 'ipo'],
			'financial': ['market', 'stock', 'bond', 'investment', 'trading', 'finance']
		};

		for (const [category, keywords] of Object.entries(categoryKeywords)) {
			if (keywords.some(keyword => text.includes(keyword))) {
				return category;
			}
		}

		return 'general';
	}

	/**
	 * Generate appropriate image URLs for different categories
	 */
	private generateImageUrl(category: string): string {
		const imageMap: Record<string, string> = {
			'federal reserve': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500',
			'technology': 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=500',
			'energy': 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=500',
			'cryptocurrency': 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=500',
			'stock market': 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=500',
			'economic': 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500'
		};

		const key = Object.keys(imageMap).find(k => category.toLowerCase().includes(k));
		return key ? imageMap[key] : 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=500';
	}

	/**
	 * Remove duplicate articles based on title similarity
	 */
	private deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
		const unique: NewsArticle[] = [];
		const seenTitles = new Set<string>();

		for (const article of articles) {
			const normalizedTitle = article.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
			const titleWords = normalizedTitle.split(/\s+/);

			// Check if this title is too similar to any existing one
			let isDuplicate = false;
			for (const seenTitle of seenTitles) {
				const seenWords = seenTitle.split(/\s+/);
				const commonWords = titleWords.filter(word => seenWords.includes(word));
				const similarity = commonWords.length / Math.max(titleWords.length, seenWords.length);

				if (similarity > 0.7) {
					isDuplicate = true;
					break;
				}
			}

			if (!isDuplicate) {
				unique.push(article);
				seenTitles.add(normalizedTitle);
			}
		}

		return unique;
	}

	/**
	 * Generate fallback news when real data fetching fails
	 */
	private async generateFallbackNews(): Promise<NewsArticle[]> {
		console.log("🔄 Generating fallback financial news...");

		const fallbackTopics = [
			"Market Analysis: Recent Economic Indicators Show Mixed Signals",
			"Technology Sector Update: AI Investment Trends Continue",
			"Federal Reserve Policy: Interest Rate Decisions Impact"
		];

		const fallbackArticles = fallbackTopics.map((topic, index) => ({
			title: topic,
			content: `Recent market developments related to ${topic.toLowerCase()}. Financial experts continue to analyze the implications for investor strategy and market positioning.`,
			url: `https://financial-news.example.com/article-${Date.now()}-${index}`,
			source: "Financial Analysis",
			publishedAt: new Date(Date.now() - (index * 60 * 60 * 1000)).toISOString(),
			category: "general",
			imageUrl: this.generateImageUrl(topic),
			summary: `Analysis of ${topic.toLowerCase()}`
		}));

		return fallbackArticles;
	}

	/**
	 * Fallback basic information gathering when enhanced service fails
	 */
	private async gatherBasicInformation(article: NewsArticle): Promise<NewsGatheringResult["relatedInfo"]> {
		const text = `${article.title} ${article.content}`.toLowerCase();

		// Basic keyword extraction
		const keywords = text
			.replace(/[^\w\s]/g, '')
			.split(/\s+/)
			.filter(word => word.length > 4)
			.slice(0, 10);

		// Basic entity extraction
		const entities = ['market', 'economy', 'financial', 'investment']
			.filter(entity => text.includes(entity));

		// Basic sentiment analysis
		const positiveWords = ['growth', 'positive', 'strong', 'gain'];
		const negativeWords = ['decline', 'negative', 'weak', 'loss'];
		const positiveCount = positiveWords.filter(word => text.includes(word)).length;
		const negativeCount = negativeWords.filter(word => text.includes(word)).length;

		let sentiment: "positive" | "negative" | "neutral" = "neutral";
		if (positiveCount > negativeCount) sentiment = "positive";
		else if (negativeCount > positiveCount) sentiment = "negative";

		return {
			keywords,
			entities,
			sentiment,
			marketImpact: "Market impact assessment requires further analysis of economic indicators and market conditions."
		};
	}

	async processLatestNews(): Promise<NewsGatheringResult> {
		const articles = await this.fetchLatestNews();
		const famousNews = await this.selectFamousNews(articles);
		const relatedInfo = await this.gatherRelatedInformation(famousNews);

		return {
			articles: [famousNews],
			relatedInfo,
		};
	}
}
