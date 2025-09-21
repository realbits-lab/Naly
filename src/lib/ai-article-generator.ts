import { generateAIObject, AI_MODELS } from "@/lib/ai";
import { z } from "zod";

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

// Comprehensive schema for AI-generated article structure
const GeneratedArticleSchema = z.object({
	title: z.string().describe("An engaging, professional headline that captures the core financial implications"),
	executive_summary: z.string().describe("A concise 2-3 sentence overview for busy executives and investors"),
	content: z.object({
		introduction: z.string().describe("Context-setting opening that explains why this news matters now"),
		analysis: z.string().describe("Deep analytical breakdown of the financial and market implications"),
		market_context: z.string().describe("How this fits into current market conditions and trends"),
		stakeholder_impact: z.string().describe("Specific impacts on different market participants"),
		risk_assessment: z.string().describe("Potential risks and uncertainty factors to consider"),
		conclusion: z.string().describe("Forward-looking synthesis with key takeaways")
	}),
	key_insights: z.array(z.string()).min(4).max(8).describe("4-8 specific, actionable insights for investors"),
	market_analysis: z.object({
		immediate_impact: z.string().describe("Short-term market effects (1-7 days)"),
		medium_term_outlook: z.string().describe("Medium-term implications (1-6 months)"),
		long_term_implications: z.string().describe("Long-term strategic considerations (6+ months)"),
		affected_sectors: z.array(z.string()).describe("Specific sectors most likely to be impacted"),
		sentiment_analysis: z.enum(["strongly_positive", "positive", "neutral", "negative", "strongly_negative"]).describe("Overall market sentiment assessment")
	}),
	investment_recommendations: z.object({
		action_items: z.array(z.string()).describe("Specific actionable recommendations for different investor types"),
		risk_level: z.enum(["low", "moderate", "high", "very_high"]).describe("Overall risk level of the situation"),
		monitoring_points: z.array(z.string()).describe("Key metrics and events to monitor going forward"),
		portfolio_considerations: z.string().describe("How investors should think about portfolio adjustments")
	}),
	confidence_metrics: z.object({
		data_quality: z.number().min(1).max(10).describe("Quality of underlying data (1-10)"),
		prediction_confidence: z.number().min(1).max(10).describe("Confidence in forward-looking assessments (1-10)"),
		analysis_depth: z.number().min(1).max(10).describe("Comprehensiveness of analysis (1-10)")
	}),
	metadata: z.object({
		reading_time_minutes: z.number().describe("Estimated reading time in minutes"),
		complexity_level: z.enum(["beginner", "intermediate", "advanced", "expert"]).describe("Required financial knowledge level"),
		primary_audience: z.array(z.string()).describe("Primary target audience segments"),
		related_topics: z.array(z.string()).describe("Related financial topics and themes")
	})
});

type GeneratedArticleResult = z.infer<typeof GeneratedArticleSchema>;

export class AIArticleGenerator {
	/**
	 * Generate a comprehensive financial analysis article using AI
	 */
	async generateArticle(
		newsArticle: NewsArticle,
		relatedInfo: RelatedInfo,
		options: {
			audienceLevel?: "retail" | "institutional" | "professional";
			analysisDepth?: "standard" | "comprehensive" | "executive_brief";
			focusArea?: "market_impact" | "investment_strategy" | "risk_analysis";
		} = {}
	): Promise<GeneratedArticleResult> {
		const systemPrompt = this.createSystemPrompt(options);
		const analysisPrompt = this.createAnalysisPrompt(newsArticle, relatedInfo, options);

		try {
			const result = await generateAIObject({
				prompt: `${systemPrompt}\n\n${analysisPrompt}`,
				schema: GeneratedArticleSchema,
				model: "GEMINI_2_5_FLASH", // Use most capable model for article generation
				temperature: 0.3, // Lower temperature for more consistent, analytical output
			});

			return result;
		} catch (error) {
			console.error("AI article generation failed:", error);
			throw new Error(`Failed to generate AI-powered article: ${error.message}`);
		}
	}

	/**
	 * Generate multiple article variations for A/B testing
	 */
	async generateArticleVariations(
		newsArticle: NewsArticle,
		relatedInfo: RelatedInfo,
		variationCount: number = 3
	): Promise<GeneratedArticleResult[]> {
		const variations = await Promise.all(
			Array.from({ length: variationCount }, (_, index) => {
				const temperatureVariation = 0.2 + (index * 0.1); // 0.2, 0.3, 0.4
				const audienceLevels: Array<"retail" | "institutional" | "professional"> = ["retail", "institutional", "professional"];
				const analysisDepths: Array<"standard" | "comprehensive" | "executive_brief"> = ["standard", "comprehensive", "executive_brief"];

				return this.generateArticle(newsArticle, relatedInfo, {
					audienceLevel: audienceLevels[index % audienceLevels.length],
					analysisDepth: analysisDepths[index % analysisDepths.length],
				});
			})
		);

		return variations;
	}

	/**
	 * Create sophisticated system prompt for financial analysis
	 */
	private createSystemPrompt(options: any): string {
		const audienceLevel = options.audienceLevel || "professional";
		const analysisDepth = options.analysisDepth || "standard";

		return `You are a world-class financial analyst and investment strategist with deep expertise in:
- Macroeconomic analysis and market dynamics
- Sector-specific knowledge across all major industries
- Risk assessment and portfolio management
- Regulatory environment and policy implications
- Global financial markets interconnectedness

Your role is to transform financial news into sophisticated, actionable intelligence for ${audienceLevel} investors.

ANALYTICAL FRAMEWORK:
1. CAUSALITY: Always trace events back to root causes and forward to likely consequences
2. CONTEXT: Position every development within broader market, economic, and regulatory contexts
3. UNCERTAINTY: Explicitly acknowledge and quantify uncertainty in your assessments
4. ACTIONABILITY: Provide specific, implementable recommendations based on your analysis
5. TIMEFRAMES: Distinguish between immediate, medium-term, and long-term implications

QUALITY STANDARDS:
- Use specific data points, percentages, and quantitative measures wherever possible
- Cite logical reasoning chains for all major conclusions
- Consider contrarian viewpoints and alternative scenarios
- Maintain intellectual honesty about prediction limitations
- Focus on investment-relevant insights over general commentary

WRITING STYLE:
- Professional yet accessible tone appropriate for ${audienceLevel} audience
- Clear topic sentences and logical paragraph flow
- Specific rather than vague language
- Confident assertions supported by evidence
- Appropriate use of financial terminology

ANALYSIS DEPTH: ${analysisDepth}
${analysisDepth === "comprehensive" ? "Provide exhaustive analysis with detailed supporting evidence" :
  analysisDepth === "executive_brief" ? "Focus on key insights and strategic implications" :
  "Balance thoroughness with readability"}`;
	}

	/**
	 * Create detailed analysis prompt with market context
	 */
	private createAnalysisPrompt(
		newsArticle: NewsArticle,
		relatedInfo: RelatedInfo,
		options: any
	): string {
		const currentDate = new Date().toISOString().split('T')[0];
		const focusArea = options.focusArea || "market_impact";

		return `Analyze the following financial news event and generate a comprehensive investment analysis:

SOURCE ARTICLE:
Title: ${newsArticle.title}
Publisher: ${newsArticle.source}
Published: ${newsArticle.publishedAt}
Category: ${newsArticle.category}
URL: ${newsArticle.url}

CONTENT:
${newsArticle.content}

MARKET INTELLIGENCE:
Current Sentiment: ${relatedInfo.sentiment}
Market Impact Assessment: ${relatedInfo.marketImpact || "To be determined"}
Key Entities: ${relatedInfo.entities.join(", ")}
Relevant Keywords: ${relatedInfo.keywords.join(", ")}

ANALYSIS PARAMETERS:
Analysis Date: ${currentDate}
Primary Focus: ${focusArea}
Market Context: Consider current economic environment, recent policy changes, and sector trends

SPECIFIC REQUIREMENTS:

1. TITLE: Create a compelling headline that immediately conveys the investment significance

2. EXECUTIVE SUMMARY: Distill the core investment thesis into 2-3 sentences

3. CONTENT SECTIONS:
   - Introduction: Why this matters now for investors
   - Analysis: Deep dive into financial implications and mechanisms
   - Market Context: How this fits current market conditions
   - Stakeholder Impact: Winners, losers, and affected parties
   - Risk Assessment: Key risks and uncertainty factors
   - Conclusion: Synthesis and forward outlook

4. KEY INSIGHTS: 4-8 specific, actionable takeaways for investment decisions

5. MARKET ANALYSIS:
   - Immediate impact (days): Price movements, volatility expectations
   - Medium-term outlook (months): Sector rotation, earnings impacts
   - Long-term implications (6+ months): Structural changes, competitive dynamics
   - Affected sectors: Specific industries and sub-sectors
   - Sentiment assessment: Overall market emotion and investor psychology

6. INVESTMENT RECOMMENDATIONS:
   - Specific actions for different investor types (retail, institutional, professional)
   - Risk level categorization
   - Key monitoring points going forward
   - Portfolio adjustment considerations

7. CONFIDENCE METRICS:
   - Data quality: Reliability of underlying information
   - Prediction confidence: How certain are forward-looking assessments
   - Analysis depth: Comprehensiveness given available information

8. METADATA:
   - Estimate reading time based on content depth
   - Assess complexity level required to understand fully
   - Identify primary target audiences
   - Tag related financial topics and themes

CRITICAL SUCCESS FACTORS:
- Base all conclusions on logical reasoning chains
- Quantify impacts wherever possible (percentages, dollar amounts, timeframes)
- Consider multiple scenarios and alternative interpretations
- Acknowledge uncertainty and provide confidence intervals
- Focus on actionable intelligence rather than general commentary
- Maintain objectivity while providing clear directional guidance`;
	}

	/**
	 * Generate article with streaming for real-time updates
	 */
	async generateArticleStream(
		newsArticle: NewsArticle,
		relatedInfo: RelatedInfo,
		onPartialUpdate?: (partial: Partial<GeneratedArticleResult>) => void
	): Promise<GeneratedArticleResult> {
		// For now, use regular generation - streaming structured objects is complex
		// This could be enhanced with experimental streaming features in future
		return this.generateArticle(newsArticle, relatedInfo);
	}

	/**
	 * Validate generated article quality
	 */
	validateArticleQuality(article: GeneratedArticleResult): {
		isValid: boolean;
		score: number;
		issues: string[];
	} {
		const issues: string[] = [];
		let score = 100;

		// Check content completeness
		if (article.content.analysis.length < 200) {
			issues.push("Analysis section too brief");
			score -= 15;
		}

		if (article.key_insights.length < 4) {
			issues.push("Insufficient key insights");
			score -= 10;
		}

		// Check confidence metrics
		if (article.confidence_metrics.data_quality < 5) {
			issues.push("Low data quality confidence");
			score -= 10;
		}

		// Check market analysis depth
		if (article.market_analysis.affected_sectors.length === 0) {
			issues.push("No sector analysis provided");
			score -= 10;
		}

		// Check for investment actionability
		if (article.investment_recommendations.action_items.length < 3) {
			issues.push("Insufficient actionable recommendations");
			score -= 15;
		}

		return {
			isValid: score >= 70,
			score,
			issues
		};
	}
}

// Export singleton instance
export const aiArticleGenerator = new AIArticleGenerator();