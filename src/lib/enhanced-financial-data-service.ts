import { WebSearch } from "./web-search";

interface FinancialEntity {
	symbol: string;
	name: string;
	type: "stock" | "crypto" | "commodity" | "currency" | "index";
	exchange?: string;
	sector?: string;
}

interface MarketData {
	symbol: string;
	price: number;
	change: number;
	changePercent: number;
	volume?: number;
	marketCap?: number;
	timestamp: string;
}

interface EconomicIndicator {
	name: string;
	value: number;
	change?: number;
	unit: string;
	releaseDate: string;
	importance: "high" | "medium" | "low";
}

interface RelatedNews {
	title: string;
	summary: string;
	url: string;
	source: string;
	publishedAt: string;
	sentiment: "positive" | "negative" | "neutral";
	relevanceScore: number;
}

interface EnhancedRelatedInfo {
	// Enhanced keyword extraction
	keywords: {
		financial: string[];
		technical: string[];
		geographic: string[];
		temporal: string[];
	};

	// Advanced entity extraction
	entities: {
		companies: FinancialEntity[];
		markets: string[];
		currencies: string[];
		commodities: string[];
		economicIndicators: string[];
		geopoliticalAreas: string[];
	};

	// Market sentiment and data
	sentiment: {
		overall: "positive" | "negative" | "neutral";
		confidence: number;
		sources: string[];
		technicalSentiment?: "bullish" | "bearish" | "neutral";
	};

	// Real market data
	marketData: MarketData[];

	// Economic context
	economicIndicators: EconomicIndicator[];

	// Related content
	relatedNews: RelatedNews[];

	// Market impact analysis
	marketImpact: {
		immediate: string;
		shortTerm: string;
		longTerm: string;
		affectedSectors: string[];
		riskFactors: string[];
		opportunities: string[];
		confidence: number;
	};

	// Correlation analysis
	correlations: {
		historicalEvents: Array<{
			event: string;
			date: string;
			similarity: number;
			outcome: string;
		}>;
		marketCorrelations: Array<{
			asset: string;
			correlation: number;
			timeframe: string;
		}>;
	};
}

export class EnhancedFinancialDataService {
	private webSearch: WebSearch;

	constructor() {
		this.webSearch = new WebSearch();
	}

	async gatherRelatedInformation(article: {
		title: string;
		content: string;
		source?: string;
		category?: string;
	}): Promise<EnhancedRelatedInfo> {
		console.log("🔍 Starting enhanced financial data gathering...");

		try {
			// Parallel data gathering for performance
			const [
				keywords,
				entities,
				sentiment,
				marketData,
				economicIndicators,
				relatedNews,
				marketImpact,
				correlations
			] = await Promise.all([
				this.extractEnhancedKeywords(article),
				this.extractFinancialEntities(article),
				this.analyzeAdvancedSentiment(article),
				this.fetchRelevantMarketData(article),
				this.fetchEconomicIndicators(article),
				this.searchRelatedNews(article),
				this.assessRealMarketImpact(article),
				this.analyzeMarketCorrelations(article)
			]);

			console.log("✅ Enhanced financial data gathering completed");

			return {
				keywords,
				entities,
				sentiment,
				marketData,
				economicIndicators,
				relatedNews,
				marketImpact,
				correlations
			};
		} catch (error) {
			console.error("❌ Enhanced financial data gathering failed:", error);
			throw new Error(`Failed to gather enhanced financial data: ${error}`);
		}
	}

	private async extractEnhancedKeywords(article: {
		title: string;
		content: string;
	}): Promise<EnhancedRelatedInfo["keywords"]> {
		const text = `${article.title} ${article.content}`.toLowerCase();

		// Financial terminology extraction
		const financialTerms = this.extractFinancialTerms(text);
		const technicalTerms = this.extractTechnicalTerms(text);
		const geographicTerms = this.extractGeographicTerms(text);
		const temporalTerms = this.extractTemporalTerms(text);

		return {
			financial: financialTerms,
			technical: technicalTerms,
			geographic: geographicTerms,
			temporal: temporalTerms
		};
	}

	private extractFinancialTerms(text: string): string[] {
		const financialPatterns = [
			// Market terms
			/(?:stock|share|equity|bond|commodity|forex|currency|crypto|bitcoin|ethereum)/gi,
			// Economic terms
			/(?:inflation|gdp|unemployment|interest.rate|federal.reserve|fed|ecb|boe)/gi,
			// Trading terms
			/(?:trading|volatility|volume|market.cap|p\/e.ratio|dividend|yield)/gi,
			// Corporate terms
			/(?:earnings|revenue|profit|merger|acquisition|ipo|buyback)/gi
		];

		const matches = new Set<string>();
		financialPatterns.forEach(pattern => {
			const found = text.match(pattern);
			if (found) {
				found.forEach(term => matches.add(term.toLowerCase()));
			}
		});

		return Array.from(matches).slice(0, 15);
	}

	private extractTechnicalTerms(text: string): string[] {
		const technicalPatterns = [
			/(?:support|resistance|breakout|trend|momentum|rsi|macd|bollinger)/gi,
			/(?:bullish|bearish|oversold|overbought|fibonacci|moving.average)/gi
		];

		const matches = new Set<string>();
		technicalPatterns.forEach(pattern => {
			const found = text.match(pattern);
			if (found) {
				found.forEach(term => matches.add(term.toLowerCase()));
			}
		});

		return Array.from(matches).slice(0, 10);
	}

	private extractGeographicTerms(text: string): string[] {
		const geographicPatterns = [
			/(?:united.states|usa|us|china|europe|eu|japan|uk|germany|france)/gi,
			/(?:asia|america|africa|wall.street|nasdaq|nyse|london|tokyo)/gi
		];

		const matches = new Set<string>();
		geographicPatterns.forEach(pattern => {
			const found = text.match(pattern);
			if (found) {
				found.forEach(term => matches.add(term.toLowerCase()));
			}
		});

		return Array.from(matches).slice(0, 8);
	}

	private extractTemporalTerms(text: string): string[] {
		const temporalPatterns = [
			/(?:q1|q2|q3|q4|quarterly|annual|monthly|daily|year.end|fiscal)/gi,
			/(?:2024|2025|2026|next.year|this.year|last.year)/gi
		];

		const matches = new Set<string>();
		temporalPatterns.forEach(pattern => {
			const found = text.match(pattern);
			if (found) {
				found.forEach(term => matches.add(term.toLowerCase()));
			}
		});

		return Array.from(matches).slice(0, 6);
	}

	private async extractFinancialEntities(article: {
		title: string;
		content: string;
	}): Promise<EnhancedRelatedInfo["entities"]> {
		const text = `${article.title} ${article.content}`;

		// Extract different types of financial entities
		const companies = await this.extractCompanyEntities(text);
		const markets = this.extractMarketEntities(text);
		const currencies = this.extractCurrencyEntities(text);
		const commodities = this.extractCommodityEntities(text);
		const economicIndicators = this.extractEconomicIndicatorEntities(text);
		const geopoliticalAreas = this.extractGeopoliticalEntities(text);

		return {
			companies,
			markets,
			currencies,
			commodities,
			economicIndicators,
			geopoliticalAreas
		};
	}

	private async extractCompanyEntities(text: string): Promise<FinancialEntity[]> {
		// Known major companies and their symbols
		const companyPatterns = [
			{ pattern: /apple|aapl/gi, symbol: "AAPL", name: "Apple Inc.", type: "stock" as const, sector: "Technology" },
			{ pattern: /microsoft|msft/gi, symbol: "MSFT", name: "Microsoft Corporation", type: "stock" as const, sector: "Technology" },
			{ pattern: /google|alphabet|googl/gi, symbol: "GOOGL", name: "Alphabet Inc.", type: "stock" as const, sector: "Technology" },
			{ pattern: /amazon|amzn/gi, symbol: "AMZN", name: "Amazon.com Inc.", type: "stock" as const, sector: "Consumer Discretionary" },
			{ pattern: /tesla|tsla/gi, symbol: "TSLA", name: "Tesla Inc.", type: "stock" as const, sector: "Automotive" },
			{ pattern: /nvidia|nvda/gi, symbol: "NVDA", name: "NVIDIA Corporation", type: "stock" as const, sector: "Technology" },
			{ pattern: /bitcoin|btc/gi, symbol: "BTC", name: "Bitcoin", type: "crypto" as const },
			{ pattern: /ethereum|eth/gi, symbol: "ETH", name: "Ethereum", type: "crypto" as const }
		];

		const foundEntities: FinancialEntity[] = [];

		companyPatterns.forEach(({ pattern, symbol, name, type, sector }) => {
			if (pattern.test(text)) {
				foundEntities.push({
					symbol,
					name,
					type,
					sector,
					exchange: type === "stock" ? "NASDAQ" : undefined
				});
			}
		});

		return foundEntities;
	}

	private extractMarketEntities(text: string): string[] {
		const marketPatterns = [
			/nasdaq|nyse|s&p.500|dow.jones|ftse|dax|nikkei|hang.seng/gi
		];

		const matches = new Set<string>();
		marketPatterns.forEach(pattern => {
			const found = text.match(pattern);
			if (found) {
				found.forEach(term => matches.add(term.toLowerCase()));
			}
		});

		return Array.from(matches);
	}

	private extractCurrencyEntities(text: string): string[] {
		const currencyPatterns = [
			/usd|eur|gbp|jpy|cny|cad|aud|chf|dollar|euro|pound|yen/gi
		];

		const matches = new Set<string>();
		currencyPatterns.forEach(pattern => {
			const found = text.match(pattern);
			if (found) {
				found.forEach(term => matches.add(term.toLowerCase()));
			}
		});

		return Array.from(matches);
	}

	private extractCommodityEntities(text: string): string[] {
		const commodityPatterns = [
			/gold|silver|oil|crude|copper|platinum|wheat|corn|soybeans|coffee/gi
		];

		const matches = new Set<string>();
		commodityPatterns.forEach(pattern => {
			const found = text.match(pattern);
			if (found) {
				found.forEach(term => matches.add(term.toLowerCase()));
			}
		});

		return Array.from(matches);
	}

	private extractEconomicIndicatorEntities(text: string): string[] {
		const indicatorPatterns = [
			/cpi|ppi|pce|nfp|gdp|unemployment|jobless|inflation|deflation/gi,
			/federal.funds.rate|discount.rate|prime.rate|yield.curve/gi
		];

		const matches = new Set<string>();
		indicatorPatterns.forEach(pattern => {
			const found = text.match(pattern);
			if (found) {
				found.forEach(term => matches.add(term.toLowerCase()));
			}
		});

		return Array.from(matches);
	}

	private extractGeopoliticalEntities(text: string): string[] {
		const geoPatterns = [
			/united.states|china|european.union|russia|india|brazil|canada/gi,
			/middle.east|asia.pacific|north.america|latin.america/gi
		];

		const matches = new Set<string>();
		geoPatterns.forEach(pattern => {
			const found = text.match(pattern);
			if (found) {
				found.forEach(term => matches.add(term.toLowerCase()));
			}
		});

		return Array.from(matches);
	}

	private async analyzeAdvancedSentiment(article: {
		title: string;
		content: string;
	}): Promise<EnhancedRelatedInfo["sentiment"]> {
		const text = `${article.title} ${article.content}`.toLowerCase();

		// Enhanced sentiment analysis with financial context
		const financialSentiment = this.analyzeFinancialSentiment(text);
		const technicalSentiment = this.analyzeTechnicalSentiment(text);

		// Combine sentiment scores
		const overallSentiment = this.combineeSentimentScores(financialSentiment, technicalSentiment);

		return {
			overall: overallSentiment.sentiment,
			confidence: overallSentiment.confidence,
			sources: ["financial_lexicon", "technical_analysis", "market_context"],
			technicalSentiment: technicalSentiment.sentiment
		};
	}

	private analyzeFinancialSentiment(text: string): { score: number; confidence: number } {
		const positiveFinancialTerms = [
			"growth", "gain", "rally", "surge", "bullish", "optimistic", "recovery",
			"expansion", "profit", "revenue", "beat.expectations", "outperform"
		];

		const negativeFinancialTerms = [
			"decline", "loss", "crash", "bearish", "pessimistic", "recession",
			"contraction", "deficit", "miss.expectations", "underperform", "volatility"
		];

		let positiveScore = 0;
		let negativeScore = 0;

		positiveFinancialTerms.forEach(term => {
			const matches = text.match(new RegExp(term.replace(".", "\\."), "g"));
			positiveScore += matches ? matches.length : 0;
		});

		negativeFinancialTerms.forEach(term => {
			const matches = text.match(new RegExp(term.replace(".", "\\."), "g"));
			negativeScore += matches ? matches.length : 0;
		});

		const totalScore = positiveScore + negativeScore;
		const sentimentScore = totalScore === 0 ? 0 : (positiveScore - negativeScore) / totalScore;
		const confidence = Math.min(totalScore * 0.1, 1);

		return { score: sentimentScore, confidence };
	}

	private analyzeTechnicalSentiment(text: string): { sentiment: "bullish" | "bearish" | "neutral"; confidence: number } {
		const bullishTerms = ["breakout", "uptrend", "support", "momentum", "oversold"];
		const bearishTerms = ["breakdown", "downtrend", "resistance", "overbought", "bearish"];

		let bullishCount = 0;
		let bearishCount = 0;

		bullishTerms.forEach(term => {
			if (text.includes(term)) bullishCount++;
		});

		bearishTerms.forEach(term => {
			if (text.includes(term)) bearishCount++;
		});

		const totalTerms = bullishCount + bearishCount;
		let sentiment: "bullish" | "bearish" | "neutral" = "neutral";

		if (bullishCount > bearishCount) sentiment = "bullish";
		else if (bearishCount > bullishCount) sentiment = "bearish";

		const confidence = totalTerms * 0.2;

		return { sentiment, confidence: Math.min(confidence, 1) };
	}

	private combineeSentimentScores(
		financial: { score: number; confidence: number },
		technical: { sentiment: string; confidence: number }
	): { sentiment: "positive" | "negative" | "neutral"; confidence: number } {
		const combinedConfidence = (financial.confidence + technical.confidence) / 2;

		let sentiment: "positive" | "negative" | "neutral" = "neutral";

		if (financial.score > 0.2) sentiment = "positive";
		else if (financial.score < -0.2) sentiment = "negative";

		return { sentiment, confidence: combinedConfidence };
	}

	private async fetchRelevantMarketData(article: {
		title: string;
		content: string;
	}): Promise<MarketData[]> {
		// In a real implementation, this would call financial APIs like:
		// - Alpha Vantage
		// - Yahoo Finance API
		// - IEX Cloud
		// - Polygon.io
		// - Financial Modeling Prep

		console.log("📊 Fetching market data...");

		// Simulate API calls with realistic data structure
		const mockMarketData: MarketData[] = [
			{
				symbol: "SPY",
				price: 445.32,
				change: 2.45,
				changePercent: 0.55,
				volume: 45123000,
				timestamp: new Date().toISOString()
			},
			{
				symbol: "AAPL",
				price: 175.84,
				change: -1.23,
				changePercent: -0.69,
				volume: 52341000,
				timestamp: new Date().toISOString()
			}
		];

		return mockMarketData;
	}

	private async fetchEconomicIndicators(article: {
		title: string;
		content: string;
	}): Promise<EconomicIndicator[]> {
		// In a real implementation, this would call APIs like:
		// - FRED (Federal Reserve Economic Data)
		// - Trading Economics API
		// - World Bank Data API
		// - IMF Data API

		console.log("📈 Fetching economic indicators...");

		const mockIndicators: EconomicIndicator[] = [
			{
				name: "Consumer Price Index",
				value: 3.2,
				change: 0.1,
				unit: "% YoY",
				releaseDate: new Date().toISOString(),
				importance: "high"
			},
			{
				name: "Federal Funds Rate",
				value: 5.25,
				unit: "%",
				releaseDate: new Date().toISOString(),
				importance: "high"
			}
		];

		return mockIndicators;
	}

	private async searchRelatedNews(article: {
		title: string;
		content: string;
	}): Promise<RelatedNews[]> {
		console.log("🔍 Searching for related news...");

		try {
			// Extract key terms for search
			const keywords = await this.extractEnhancedKeywords(article);
			const searchTerms = [
				...keywords.financial.slice(0, 3),
				...keywords.technical.slice(0, 2)
			].join(" ");

			// Use web search to find related financial news
			const searchResults = await this.webSearch.search(
				`${searchTerms} financial news market analysis`,
				{ maxResults: 5 }
			);

			// Transform search results to RelatedNews format
			const relatedNews: RelatedNews[] = searchResults.map((result, index) => ({
				title: result.title,
				summary: result.snippet,
				url: result.url,
				source: result.source || "Web Search",
				publishedAt: new Date().toISOString(),
				sentiment: this.analyzeSentimentFromSnippet(result.snippet),
				relevanceScore: Math.max(0.8 - (index * 0.1), 0.3)
			}));

			return relatedNews;
		} catch (error) {
			console.error("Failed to search related news:", error);
			return [];
		}
	}

	private analyzeSentimentFromSnippet(snippet: string): "positive" | "negative" | "neutral" {
		const text = snippet.toLowerCase();
		const positiveWords = ["growth", "gain", "positive", "strong", "bullish"];
		const negativeWords = ["decline", "loss", "negative", "weak", "bearish"];

		const positiveCount = positiveWords.filter(word => text.includes(word)).length;
		const negativeCount = negativeWords.filter(word => text.includes(word)).length;

		if (positiveCount > negativeCount) return "positive";
		if (negativeCount > positiveCount) return "negative";
		return "neutral";
	}

	private async assessRealMarketImpact(article: {
		title: string;
		content: string;
	}): Promise<EnhancedRelatedInfo["marketImpact"]> {
		console.log("⚖️ Assessing market impact...");

		// Extract entities and sentiment for impact analysis
		const entities = await this.extractFinancialEntities(article);
		const sentiment = await this.analyzeAdvancedSentiment(article);

		// Analyze sectors affected
		const affectedSectors = this.identifyAffectedSectors(entities, article);
		const riskFactors = this.identifyRiskFactors(article);
		const opportunities = this.identifyOpportunities(article, sentiment);

		// Generate impact assessment
		const immediate = this.generateImmediateImpact(sentiment, entities);
		const shortTerm = this.generateShortTermImpact(affectedSectors, sentiment);
		const longTerm = this.generateLongTermImpact(article, entities);

		return {
			immediate,
			shortTerm,
			longTerm,
			affectedSectors,
			riskFactors,
			opportunities,
			confidence: sentiment.confidence
		};
	}

	private identifyAffectedSectors(
		entities: EnhancedRelatedInfo["entities"],
		article: { content: string }
	): string[] {
		const sectors: string[] = [];

		// Add sectors based on company entities
		entities.companies.forEach(company => {
			if (company.sector && !sectors.includes(company.sector)) {
				sectors.push(company.sector);
			}
		});

		// Add sectors based on content analysis
		const content = article.content.toLowerCase();
		const sectorKeywords = {
			"Technology": ["tech", "software", "ai", "digital", "cloud"],
			"Healthcare": ["health", "pharma", "biotech", "medical", "drug"],
			"Financial": ["bank", "finance", "insurance", "fintech", "payment"],
			"Energy": ["oil", "gas", "renewable", "solar", "wind", "energy"],
			"Real Estate": ["property", "housing", "reit", "construction"]
		};

		Object.entries(sectorKeywords).forEach(([sector, keywords]) => {
			if (keywords.some(keyword => content.includes(keyword)) && !sectors.includes(sector)) {
				sectors.push(sector);
			}
		});

		return sectors;
	}

	private identifyRiskFactors(article: { title: string; content: string }): string[] {
		const text = `${article.title} ${article.content}`.toLowerCase();
		const riskKeywords = [
			"volatility", "uncertainty", "inflation", "recession", "geopolitical",
			"regulation", "supply chain", "interest rate", "credit risk", "liquidity"
		];

		return riskKeywords.filter(risk => text.includes(risk.replace(" ", ".")));
	}

	private identifyOpportunities(
		article: { title: string; content: string },
		sentiment: EnhancedRelatedInfo["sentiment"]
	): string[] {
		const text = `${article.title} ${article.content}`.toLowerCase();
		const opportunities: string[] = [];

		if (sentiment.overall === "positive") {
			const opportunityKeywords = [
				"growth", "expansion", "innovation", "efficiency", "market share",
				"cost reduction", "new product", "partnership", "acquisition"
			];

			opportunityKeywords.forEach(opportunity => {
				if (text.includes(opportunity.replace(" ", "."))) {
					opportunities.push(opportunity);
				}
			});
		}

		return opportunities;
	}

	private generateImmediateImpact(
		sentiment: EnhancedRelatedInfo["sentiment"],
		entities: EnhancedRelatedInfo["entities"]
	): string {
		const hasStocks = entities.companies.some(c => c.type === "stock");
		const hasCrypto = entities.companies.some(c => c.type === "crypto");

		if (sentiment.overall === "positive") {
			return `Immediate positive sentiment likely to support ${hasStocks ? 'equity' : 'market'} prices${hasCrypto ? ' and crypto assets' : ''} in the near term.`;
		} else if (sentiment.overall === "negative") {
			return `Immediate negative sentiment may pressure ${hasStocks ? 'stock' : 'market'} valuations${hasCrypto ? ' and digital assets' : ''} in the short term.`;
		}

		return "Mixed market signals suggest cautious near-term price action with increased volatility.";
	}

	private generateShortTermImpact(
		sectors: string[],
		sentiment: EnhancedRelatedInfo["sentiment"]
	): string {
		if (sectors.length === 0) {
			return "Broad market impact expected with sector rotation based on fundamental shifts.";
		}

		const sectorList = sectors.slice(0, 3).join(", ");
		const sentimentDirection = sentiment.overall === "positive" ? "outperformance" :
								  sentiment.overall === "negative" ? "underperformance" : "mixed performance";

		return `${sectorList} sectors likely to experience ${sentimentDirection} over the next 3-6 months.`;
	}

	private generateLongTermImpact(
		article: { content: string },
		entities: EnhancedRelatedInfo["entities"]
	): string {
		const hasRegulation = article.content.toLowerCase().includes("regulat");
		const hasTechnology = entities.companies.some(c => c.sector === "Technology");

		if (hasRegulation) {
			return "Regulatory changes may reshape industry dynamics and competitive positioning over 12-24 months.";
		}

		if (hasTechnology) {
			return "Technology adoption trends suggest sustained impact on digital transformation and innovation cycles.";
		}

		return "Long-term implications depend on sustained fundamental changes and market adaptation cycles.";
	}

	private async analyzeMarketCorrelations(article: {
		title: string;
		content: string;
	}): Promise<EnhancedRelatedInfo["correlations"]> {
		console.log("🔗 Analyzing market correlations...");

		// In a real implementation, this would:
		// - Query historical market data
		// - Analyze similar events
		// - Calculate correlation coefficients
		// - Use machine learning for pattern recognition

		const historicalEvents = [
			{
				event: "Federal Reserve Rate Decision",
				date: "2023-07-26",
				similarity: 0.85,
				outcome: "Market rally following dovish signals"
			},
			{
				event: "Technology Earnings Season",
				date: "2023-10-15",
				similarity: 0.72,
				outcome: "Mixed results with AI focus driving selective gains"
			}
		];

		const marketCorrelations = [
			{
				asset: "S&P 500",
				correlation: 0.78,
				timeframe: "30 days"
			},
			{
				asset: "USD Index",
				correlation: -0.45,
				timeframe: "30 days"
			}
		];

		return {
			historicalEvents,
			marketCorrelations
		};
	}
}