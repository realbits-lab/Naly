import { generateAIText, AI_MODELS } from "./ai";
import { InfographicGenerator } from "./infographic-generator";
import { SlideInfographicGenerator } from "./slide-infographic-generator";

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

interface RelatedInfo {
	marketImpact?: string;
	sentiment: "positive" | "negative" | "neutral";
	keywords: string[];
	entities: string[];
}

interface GeneratedArticle {
	title: string;
	content: string;
	summary: string;
	keyPoints: string[];
	marketAnalysis: string;
	investmentImplications: string;
	infographicContent?: string;
	metadata: {
		wordCount: number;
		readingTime: number;
		sentiment: string;
		categories: string[];
		generatedAt: string;
	};
}

export class ArticleGenerator {
	private infographicGenerator: InfographicGenerator;
	private slideInfographicGenerator: SlideInfographicGenerator;
	private useSlideFormat: boolean = true; // Default to new slide format

	constructor(private apiKey?: string, useSlideFormat: boolean = true) {
		this.apiKey = apiKey || process.env.OPENAI_API_KEY;
		this.infographicGenerator = new InfographicGenerator();
		this.slideInfographicGenerator = new SlideInfographicGenerator(this.apiKey);
		this.useSlideFormat = useSlideFormat;
	}

	private extractCompanyName(entities: string[]): string | null {
		// Common company patterns and known companies
		const knownCompanies = [
			'Google', 'Amazon', 'Apple', 'Microsoft', 'Meta', 'Facebook', 'Netflix', 'Tesla',
			'OpenAI', 'Anthropic', 'NVIDIA', 'Intel', 'AMD', 'IBM', 'Oracle', 'Salesforce',
			'Adobe', 'Uber', 'Lyft', 'Airbnb', 'Twitter', 'X', 'SpaceX', 'Boeing', 'Lockheed Martin',
			'JPMorgan', 'Goldman Sachs', 'Bank of America', 'Wells Fargo', 'Citigroup',
			'Walmart', 'Target', 'Costco', 'Home Depot', 'Starbucks', 'McDonald\'s',
			'Coca-Cola', 'PepsiCo', 'Disney', 'Warner Bros', 'Sony', 'Samsung', 'LG',
			'Toyota', 'Ford', 'GM', 'Volkswagen', 'BMW', 'Mercedes-Benz', 'Ferrari',
			'Pfizer', 'Johnson & Johnson', 'Moderna', 'AstraZeneca', 'Merck',
			'ExxonMobil', 'Chevron', 'Shell', 'BP', 'Saudi Aramco'
		];

		for (const entity of entities) {
			for (const company of knownCompanies) {
				if (entity.toLowerCase().includes(company.toLowerCase())) {
					return company;
				}
			}
			// Check if entity looks like a company name (has Inc., Corp., Ltd., etc.)
			if (/\b(Inc\.?|Corp\.?|Corporation|Ltd\.?|LLC|Company|Co\.)\b/i.test(entity)) {
				return entity.replace(/\b(Inc\.?|Corp\.?|Corporation|Ltd\.?|LLC|Company|Co\.)\b/gi, '').trim();
			}
		}
		return entities[0] || null; // Return first entity as fallback
	}

	async generateCreativeTitle(
		newsArticle: NewsArticle,
		relatedInfo: RelatedInfo,
		companyName: string | null
	): Promise<string> {
		try {
			// Always use AI for creative title generation

			const titlePrompt = `You are a creative headline writer for financial news. Generate an engaging, thought-provoking title that captures attention while remaining professional.

Original News: ${newsArticle.title}
Category: ${newsArticle.category}
Sentiment: ${relatedInfo.sentiment}
Key Entities: ${relatedInfo.entities.join(', ')}

Create 3 different creative titles with different styles:
1. A question that sparks curiosity
2. A bold statement or prediction
3. An analytical insight

Respond ONLY with a JSON object in this exact format:
{
  "titles": [
    "Title 1 (question style)",
    "Title 2 (bold statement)",
    "Title 3 (analytical insight)"
  ]
}

Guidelines:
- Be creative and engaging
- Avoid clickbait - maintain professional credibility
- Make it relevant to investors and financial professionals
- Each title should be 60-100 characters
- Use active voice and strong verbs`;

			const { text } = await generateAIText({
				prompt: titlePrompt,
				model: "GPT_4O",
				maxTokens: 200,
				temperature: 0.9, // Higher temperature for more creativity
			});

			// Clean the response to handle markdown code blocks
			const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
			const parsed = JSON.parse(cleanText);
			const titles = parsed.titles || [];

			// Select the best title based on sentiment
			let selectedTitle = titles[0];
			if (relatedInfo.sentiment === 'positive' && titles[1]) {
				selectedTitle = titles[1]; // Bold statement for positive news
			} else if (relatedInfo.sentiment === 'neutral' && titles[2]) {
				selectedTitle = titles[2]; // Analytical insight for neutral news
			}

			// Add company prefix if available
			if (companyName) {
				return `${companyName}: ${selectedTitle}`;
			}
			return selectedTitle;

		} catch (error) {
			console.error("Failed to generate creative title with AI:", error);
			return this.generateMockCreativeTitle(newsArticle, relatedInfo, companyName);
		}
	}

	private generateMockCreativeTitle(
		newsArticle: NewsArticle,
		relatedInfo: RelatedInfo,
		companyName: string | null
	): string {
		// Creative title templates based on sentiment and category
		const templates = {
			positive: [
				"What This Breakthrough Means for Investors",
				"The Hidden Opportunity Everyone's Missing",
				"Why Smart Money Is Moving Now",
				"This Could Change Everything in {category}",
				"The Turning Point We've Been Waiting For"
			],
			negative: [
				"The Risk Nobody's Talking About",
				"What Went Wrong and What's Next",
				"The Warning Signs Were There All Along",
				"Why Investors Should Pay Attention Now",
				"The {category} Shakeup Has Just Begun"
			],
			neutral: [
				"Decoding the Latest {category} Developments",
				"What the Data Really Tells Us",
				"The Strategy Shift You Need to Know",
				"Understanding the New Market Dynamics",
				"The {category} Landscape Is Evolving"
			]
		};

		const sentimentTemplates = templates[relatedInfo.sentiment] || templates.neutral;
		const randomIndex = Math.floor(Math.random() * sentimentTemplates.length);
		let title = sentimentTemplates[randomIndex];

		// Replace category placeholder
		title = title.replace('{category}', newsArticle.category.charAt(0).toUpperCase() + newsArticle.category.slice(1));

		// Add company prefix if available
		if (companyName) {
			return `${companyName}: ${title}`;
		}
		return title;
	}

	async generateArticle(
		newsArticle: NewsArticle,
		relatedInfo: RelatedInfo,
	): Promise<GeneratedArticle> {
		try {
			// Extract company name from entities
			const companyName = this.extractCompanyName(relatedInfo.entities);

			// Generate creative title first
			const creativeTitle = await this.generateCreativeTitle(
				newsArticle,
				relatedInfo,
				companyName
			);

			// Always use AI generation - remove API key check
			if (false) {
				// This block is now disabled - always use AI
				const mockArticle = this.generateMockArticle(newsArticle, relatedInfo);
				mockArticle.title = creativeTitle;

				// Generate infographic for mock article too
				if (this.useSlideFormat) {
					const slides = await this.slideInfographicGenerator.generateSlides({
						title: creativeTitle,
						summary: mockArticle.summary,
						keyPoints: mockArticle.keyPoints,
						sentiment: relatedInfo.sentiment,
						entities: relatedInfo.entities,
						keywords: relatedInfo.keywords,
						marketAnalysis: mockArticle.marketAnalysis,
						investmentImplications: mockArticle.investmentImplications,
						wordCount: mockArticle.metadata.wordCount,
						readingTime: mockArticle.metadata.readingTime,
						companyName
					});
					mockArticle.infographicContent = this.slideInfographicGenerator.generateHTML({
						title: creativeTitle,
						summary: mockArticle.summary,
						keyPoints: mockArticle.keyPoints,
						sentiment: relatedInfo.sentiment,
						entities: relatedInfo.entities,
						keywords: relatedInfo.keywords,
						marketAnalysis: mockArticle.marketAnalysis,
						investmentImplications: mockArticle.investmentImplications,
						wordCount: mockArticle.metadata.wordCount,
						readingTime: mockArticle.metadata.readingTime,
						companyName
					}, slides);
				} else {
					mockArticle.infographicContent = this.infographicGenerator.generateInfographic({
					title: creativeTitle,
					summary: mockArticle.summary,
					keyPoints: mockArticle.keyPoints,
					sentiment: relatedInfo.sentiment,
					entities: relatedInfo.entities,
					keywords: relatedInfo.keywords,
					marketAnalysis: mockArticle.marketAnalysis,
					investmentImplications: mockArticle.investmentImplications,
					wordCount: mockArticle.metadata.wordCount,
					readingTime: mockArticle.metadata.readingTime,
						companyName
					});
				}

				return mockArticle;
			}

			const prompt = this.createPrompt(newsArticle, relatedInfo);

			const { text } = await generateAIText({
				prompt,
				model: "GPT_4O", // Use AI Gateway via the ai utility
				maxTokens: 5000, // Increased for comprehensive analysis
				temperature: 0.6, // Slightly lower for more focused analysis
			});

			const article = this.parseGeneratedText(text, newsArticle, relatedInfo);
			// Override with creative title
			article.title = creativeTitle;

			// Generate infographic content (use slide format if enabled)
			if (this.useSlideFormat) {
				const slides = await this.slideInfographicGenerator.generateSlides({
					title: creativeTitle,
					summary: article.summary,
					keyPoints: article.keyPoints,
					sentiment: relatedInfo.sentiment,
					entities: relatedInfo.entities,
					keywords: relatedInfo.keywords,
					marketAnalysis: article.marketAnalysis,
					investmentImplications: article.investmentImplications,
					wordCount: article.metadata.wordCount,
					readingTime: article.metadata.readingTime,
					companyName
				});
				article.infographicContent = this.slideInfographicGenerator.generateHTML({
					title: creativeTitle,
					summary: article.summary,
					keyPoints: article.keyPoints,
					sentiment: relatedInfo.sentiment,
					entities: relatedInfo.entities,
					keywords: relatedInfo.keywords,
					marketAnalysis: article.marketAnalysis,
					investmentImplications: article.investmentImplications,
					wordCount: article.metadata.wordCount,
					readingTime: article.metadata.readingTime,
					companyName
				}, slides);
			} else {
				article.infographicContent = this.infographicGenerator.generateInfographic({
				title: creativeTitle,
				summary: article.summary,
				keyPoints: article.keyPoints,
				sentiment: relatedInfo.sentiment,
				entities: relatedInfo.entities,
				keywords: relatedInfo.keywords,
				marketAnalysis: article.marketAnalysis,
				investmentImplications: article.investmentImplications,
				wordCount: article.metadata.wordCount,
				readingTime: article.metadata.readingTime,
					companyName
				});
			}

			return article;
		} catch (error) {
			console.error("Failed to generate article with AI:", error);
			// Fallback to mock generation
			const companyName = this.extractCompanyName(relatedInfo.entities);
			const creativeTitle = await this.generateCreativeTitle(
				newsArticle,
				relatedInfo,
				companyName
			);
			const fallbackArticle = this.generateMockArticle(newsArticle, relatedInfo);
			fallbackArticle.title = creativeTitle;

			// Generate infographic for fallback article
			if (this.useSlideFormat) {
				const slides = await this.slideInfographicGenerator.generateSlides({
					title: creativeTitle,
					summary: fallbackArticle.summary,
					keyPoints: fallbackArticle.keyPoints,
					sentiment: relatedInfo.sentiment,
					entities: relatedInfo.entities,
					keywords: relatedInfo.keywords,
					marketAnalysis: fallbackArticle.marketAnalysis,
					investmentImplications: fallbackArticle.investmentImplications,
					wordCount: fallbackArticle.metadata.wordCount,
					readingTime: fallbackArticle.metadata.readingTime,
					companyName
				});
				fallbackArticle.infographicContent = this.slideInfographicGenerator.generateHTML({
					title: creativeTitle,
					summary: fallbackArticle.summary,
					keyPoints: fallbackArticle.keyPoints,
					sentiment: relatedInfo.sentiment,
					entities: relatedInfo.entities,
					keywords: relatedInfo.keywords,
					marketAnalysis: fallbackArticle.marketAnalysis,
					investmentImplications: fallbackArticle.investmentImplications,
					wordCount: fallbackArticle.metadata.wordCount,
					readingTime: fallbackArticle.metadata.readingTime,
					companyName
				}, slides);
			} else {
				fallbackArticle.infographicContent = this.infographicGenerator.generateInfographic({
				title: creativeTitle,
				summary: fallbackArticle.summary,
				keyPoints: fallbackArticle.keyPoints,
				sentiment: relatedInfo.sentiment,
				entities: relatedInfo.entities,
				keywords: relatedInfo.keywords,
				marketAnalysis: fallbackArticle.marketAnalysis,
				investmentImplications: fallbackArticle.investmentImplications,
				wordCount: fallbackArticle.metadata.wordCount,
				readingTime: fallbackArticle.metadata.readingTime,
					companyName
				});
			}

			return fallbackArticle;
		}
	}

	private createPrompt(
		newsArticle: NewsArticle,
		relatedInfo: RelatedInfo,
	): string {
		return `You are a senior financial analyst and expert writer. Based on the following news article and related information, write a comprehensive, data-driven analysis article for investors and financial professionals.

ORIGINAL NEWS:
Title: ${newsArticle.title}
Source: ${newsArticle.source}
Content: ${newsArticle.content}
Category: ${newsArticle.category}

RELATED INFORMATION:
Market Impact: ${relatedInfo.marketImpact}
Sentiment: ${relatedInfo.sentiment}
Key Entities: ${relatedInfo.entities.join(", ")}
Keywords: ${relatedInfo.keywords.join(", ")}

Please provide your response in the following JSON format:
{
  "content": "A comprehensive 1500-2000 word analysis article with specific financial data, metrics, percentages, dollar amounts, and quantitative insights. Include multiple sections with detailed analysis.",
  "summary": "A detailed 3-4 sentence summary highlighting key financial metrics and numerical insights",
  "keyPoints": ["List of 6-8 key takeaways with specific numbers, percentages, or financial metrics where applicable"],
  "marketAnalysis": "Detailed quantitative analysis with specific financial metrics, historical comparisons, and numerical forecasts",
  "investmentImplications": "Specific investment strategies with target prices, risk assessments, and numerical portfolio allocation suggestions"
}

CRITICAL REQUIREMENTS - MUST INCLUDE:
1. SPECIFIC FINANCIAL METRICS: Include revenue figures, profit margins, stock price targets, market valuations, growth rates, etc.
2. QUANTITATIVE DATA: Use percentages, dollar amounts, ratios, and specific numbers throughout
3. HISTORICAL COMPARISONS: Compare to previous quarters/years with specific figures
4. MARKET METRICS: Include P/E ratios, market cap changes, trading volumes, sector performance data
5. FORECASTS WITH NUMBERS: Provide specific price targets, growth projections, timeline estimates
6. RISK METRICS: Include volatility measures, beta coefficients, risk-adjusted returns
7. SECTOR ANALYSIS: Compare performance to industry benchmarks with specific metrics

STRUCTURE REQUIREMENTS:
- Executive Summary with key financial highlights
- Detailed Financial Analysis with tables/metrics
- Market Impact Assessment with quantitative measures
- Competitive Analysis with numerical comparisons
- Risk Assessment with specific risk metrics
- Investment Thesis with target prices and timelines
- Conclusion with actionable recommendations

TONE & STYLE:
- Professional financial journalism style
- Include specific citations of financial data
- Use industry-standard financial terminology
- Provide both bullish and bearish scenarios with probabilities
- Include assumptions and methodology behind forecasts
- Maintain objectivity while providing clear investment guidance

EXAMPLES OF REQUIRED CONTENT:
- "Revenue increased 23.4% YoY to $4.2B, beating consensus estimates by $340M"
- "Trading at 24.5x forward P/E, compared to sector average of 18.2x"
- "Target price of $185 implies 22% upside potential over 12-month horizon"
- "Risk-adjusted return of 1.34 Sharpe ratio indicates favorable risk-reward profile"

Ensure all content is original, comprehensive, and provides genuine analytical value to professional investors.`;
	}

	private parseGeneratedText(
		text: string,
		newsArticle: NewsArticle,
		relatedInfo: RelatedInfo,
	): GeneratedArticle {
		try {
			const parsed = JSON.parse(text);

			return {
				title: "Generated Financial Analysis", // Title will be overridden with creative title
				content: parsed.content || text,
				summary:
					parsed.summary || "AI-generated analysis of recent financial news",
				keyPoints: parsed.keyPoints || [],
				marketAnalysis:
					parsed.marketAnalysis || "Market analysis not available",
				investmentImplications:
					parsed.investmentImplications ||
					"Investment implications under review",
				metadata: {
					wordCount: this.countWords(parsed.content || text),
					readingTime: Math.ceil(this.countWords(parsed.content || text) / 200),
					sentiment: relatedInfo.sentiment,
					categories: [newsArticle.category],
					generatedAt: new Date().toISOString(),
				},
			};
		} catch (error) {
			// If parsing fails, treat the entire text as content
			return {
				title: "AI-Generated Financial Analysis", // Title will be overridden with creative title
				content: text,
				summary:
					"Analysis of recent financial developments and market implications",
				keyPoints: [],
				marketAnalysis: relatedInfo.marketImpact || "Market analysis pending",
				investmentImplications:
					"Please consult with financial advisors for investment decisions",
				metadata: {
					wordCount: this.countWords(text),
					readingTime: Math.ceil(this.countWords(text) / 200),
					sentiment: relatedInfo.sentiment,
					categories: [newsArticle.category],
					generatedAt: new Date().toISOString(),
				},
			};
		}
	}

	private generateMockArticle(
		newsArticle: NewsArticle,
		relatedInfo: RelatedInfo,
	): GeneratedArticle {
		const mockContent = this.createMockContent(newsArticle, relatedInfo);

		return {
			title: `Market Analysis: ${newsArticle.title}`,
			content: mockContent,
			summary: `Our analysis of ${newsArticle.source}'s report on ${newsArticle.category} developments reveals ${relatedInfo.sentiment} market implications with potential impact on investor portfolios.`,
			keyPoints: [
				`${relatedInfo.sentiment.charAt(0).toUpperCase() + relatedInfo.sentiment.slice(1)} sentiment detected in market developments`,
				`Key entities involved: ${relatedInfo.entities.slice(0, 3).join(", ")}`,
				`Market impact assessment: ${relatedInfo.marketImpact?.slice(0, 50)}...`,
				"Recommended portfolio review for affected sectors",
				"Monitor regulatory and policy developments",
				"Consider risk management adjustments",
			],
			marketAnalysis:
				relatedInfo.marketImpact ||
				"Market impact assessment indicates mixed signals across sectors with potential for increased volatility in the near term.",
			investmentImplications: this.generateInvestmentImplications(
				newsArticle,
				relatedInfo,
			),
			metadata: {
				wordCount: this.countWords(mockContent),
				readingTime: Math.ceil(this.countWords(mockContent) / 200),
				sentiment: relatedInfo.sentiment,
				categories: [newsArticle.category],
				generatedAt: new Date().toISOString(),
			},
		};
	}

	private createMockContent(
		newsArticle: NewsArticle,
		relatedInfo: RelatedInfo,
	): string {
		const sentimentWord =
			relatedInfo.sentiment === "positive"
				? "optimistic"
				: relatedInfo.sentiment === "negative"
					? "cautious"
					: "mixed";
		const entities = relatedInfo.entities.slice(0, 4).join(", ");

		return `# Market Analysis: Understanding Recent Developments

Recent developments in the ${newsArticle.category} sector have captured significant market attention, with ${newsArticle.source} reporting on key changes that could reshape investor expectations in the coming months.

## Executive Summary

The latest news regarding "${newsArticle.title}" presents a ${sentimentWord} outlook for market participants. Our analysis indicates that key stakeholders including ${entities} are positioned to experience varying degrees of impact from these developments.

## Detailed Analysis

The reported developments signal important shifts in market dynamics. ${newsArticle.content.slice(0, 200)}... This trend suggests that investors should pay close attention to how these changes unfold over the next quarter.

### Market Context

Current market conditions provide an interesting backdrop for these developments. The ${relatedInfo.sentiment} sentiment reflected in recent data points suggests that market participants are ${relatedInfo.sentiment === "positive" ? "optimistic about future prospects" : relatedInfo.sentiment === "negative" ? "exercising increased caution" : "taking a wait-and-see approach"}.

### Sector Impact Assessment

The ${newsArticle.category} sector is particularly positioned to experience ${relatedInfo.marketImpact || "significant changes in the near term"}. Historical precedents suggest that similar developments have led to both opportunities and challenges for investors.

## Risk Factors and Considerations

Several risk factors merit attention:

1. **Market Volatility**: Current conditions suggest increased volatility potential
2. **Regulatory Environment**: Policy changes could impact sector dynamics
3. **Global Economic Context**: Broader economic trends may influence outcomes
4. **Sector-Specific Challenges**: Industry-specific factors require monitoring

## Strategic Recommendations

Based on our analysis, we recommend that investors:

- Monitor developments closely over the next 30-60 days
- Review portfolio allocations in affected sectors
- Consider risk management adjustments where appropriate
- Stay informed about regulatory and policy changes
- Consult with financial advisors for personalized strategies

## Conclusion

The current news cycle presents both opportunities and challenges for market participants. While the ${relatedInfo.sentiment} sentiment provides directional guidance, investors should maintain a balanced perspective and focus on long-term fundamentals.

As always, market conditions can change rapidly, and this analysis should be considered alongside other research and professional investment advice. The key is to remain informed, flexible, and aligned with individual investment objectives and risk tolerance.

*This analysis is based on publicly available information and should not be considered as personalized investment advice. Please consult with qualified financial professionals before making investment decisions.*`;
	}

	private generateInvestmentImplications(
		newsArticle: NewsArticle,
		relatedInfo: RelatedInfo,
	): string {
		const implications = {
			"monetary-policy": {
				positive:
					"Consider increasing exposure to growth sectors and interest-rate sensitive assets. Monitor bond yields and equity valuations.",
				negative:
					"Review defensive positioning and consider shorter-duration fixed income. Monitor credit spreads and risk assets.",
				neutral:
					"Maintain balanced allocation while monitoring policy signals. Consider tactical adjustments based on data releases.",
			},
			technology: {
				positive:
					"Technology sector may benefit from continued innovation investment. Consider growth-oriented tech positions.",
				negative:
					"Exercise caution with high-valuation tech names. Consider defensive tech positions or sector rotation.",
				neutral:
					"Mixed signals suggest selective approach to tech investments. Focus on fundamental strength.",
			},
			energy: {
				positive:
					"Energy sector positioning may be favorable. Consider commodity exposure and energy infrastructure.",
				negative:
					"Energy sector headwinds suggest caution. Monitor commodity trends and regulatory developments.",
				neutral:
					"Energy sector remains volatile. Consider hedged exposure and monitor supply-demand dynamics.",
			},
			cryptocurrency: {
				positive:
					"Digital asset adoption trends support selective crypto exposure within risk parameters.",
				negative:
					"Crypto volatility concerns suggest reduced exposure and careful risk management.",
				neutral:
					"Crypto markets remain news-driven. Maintain disciplined approach to digital asset allocation.",
			},
		};

		const categoryKey = newsArticle.category as keyof typeof implications;
		const sentimentKey =
			relatedInfo.sentiment as keyof (typeof implications)[typeof categoryKey];

		return (
			implications[categoryKey]?.[sentimentKey] ||
			"Investment implications require careful analysis of individual circumstances. Consider professional financial advice for portfolio adjustments."
		);
	}

	private countWords(text: string): number {
		return text
			.trim()
			.split(/\s+/)
			.filter((word) => word.length > 0).length;
	}

	async generateMultipleArticles(
		articles: NewsArticle[],
		relatedInfos: RelatedInfo[],
	): Promise<GeneratedArticle[]> {
		const results = await Promise.all(
			articles.map((article, index) =>
				this.generateArticle(article, relatedInfos[index] || relatedInfos[0]),
			),
		);
		return results;
	}
}
