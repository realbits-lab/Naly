import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

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
	metadata: {
		wordCount: number;
		readingTime: number;
		sentiment: string;
		categories: string[];
		generatedAt: string;
	};
}

export class ArticleGenerator {
	constructor(private apiKey?: string) {
		this.apiKey = apiKey || process.env.OPENAI_API_KEY;
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
			if (!this.apiKey) {
				// Fallback to creative mock title
				return this.generateMockCreativeTitle(newsArticle, relatedInfo, companyName);
			}

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

			const { text } = await generateText({
				model: openai("gpt-4"),
				prompt: titlePrompt,
				maxTokens: 200,
				temperature: 0.9, // Higher temperature for more creativity
			});

			const parsed = JSON.parse(text);
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

			if (!this.apiKey) {
				// Fallback to mock generation if no API key
				return {
					...this.generateMockArticle(newsArticle, relatedInfo),
					title: creativeTitle
				};
			}

			const prompt = this.createPrompt(newsArticle, relatedInfo);

			const { text } = await generateText({
				model: openai("gpt-4"),
				prompt,
				maxTokens: 2000,
				temperature: 0.7,
			});

			const article = this.parseGeneratedText(text, newsArticle, relatedInfo);
			// Override with creative title
			article.title = creativeTitle;
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
			return {
				...this.generateMockArticle(newsArticle, relatedInfo),
				title: creativeTitle
			};
		}
	}

	private createPrompt(
		newsArticle: NewsArticle,
		relatedInfo: RelatedInfo,
	): string {
		return `You are a financial analyst and expert writer. Based on the following news article and related information, write a comprehensive analysis article for investors and financial professionals.

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
  "content": "A comprehensive 800-1000 word analysis article with clear paragraphs, professional tone, and actionable insights",
  "summary": "A concise 2-3 sentence summary of the key points",
  "keyPoints": ["List of 4-6 key takeaways as bullet points"],
  "marketAnalysis": "Detailed analysis of how this news affects financial markets",
  "investmentImplications": "Specific implications for investors and trading strategies"
}

Note: Do not include a title field as it will be generated separately.

Guidelines:
- Write in a professional, analytical tone
- Include specific market implications
- Provide actionable insights for investors
- Use clear, jargon-free language where possible
- Structure the content with logical flow
- Include relevant financial context and background
- Make predictions or assessments based on the data
- Ensure all content is original and not copied from the source`;
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
