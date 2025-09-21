import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UserRole } from "@/types/user";
import { db } from "@/lib/db";
import { rssSources, rssArticles, generatedArticles } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(request: NextRequest) {
	try {
		// Check authentication and authorization
		const session = await auth();

		if (!session?.user) {
			return NextResponse.json(
				{ error: "Unauthorized: Please sign in" },
				{ status: 401 }
			);
		}

		if (session.user.role !== UserRole.MANAGER) {
			return NextResponse.json(
				{ error: "Forbidden: Only managers can access this endpoint" },
				{ status: 403 }
			);
		}

		console.log("Starting MOCK market report generation...");

		// Step 1: Simulate fetching RSS articles
		console.log("Step 1: Simulating RSS article fetch...");
		const sources = await db.select().from(rssSources).where(eq(rssSources.isActive, true));
		const totalNewArticles = 5; // Mock number

		console.log(`Step 1 complete: ${totalNewArticles} new articles (simulated)`);

		// Step 2: Get recent articles for analysis
		console.log("Step 2: Retrieving recent articles for analysis...");
		const recentArticles = await db
			.select({
				id: rssArticles.id,
				title: rssArticles.title,
				description: rssArticles.description,
				content: rssArticles.content,
				categories: rssArticles.categories,
				publishedAt: rssArticles.publishedAt,
			})
			.from(rssArticles)
			.orderBy(desc(rssArticles.publishedAt))
			.limit(100);

		console.log(`Found ${recentArticles.length} recent articles for analysis`);

		// Step 3: Mock AI topic extraction
		console.log("Step 3: Generating mock market topics...");
		const mockTopicsAnalysis = `
## Top Market Topics and Themes

### 1. Most Significant Market Topics
• **Federal Reserve Policy Shift**: Markets responding to anticipated rate cuts
• **AI Infrastructure Boom**: Major tech companies expanding AI capabilities
• **China Tech Resurgence**: Chinese stocks outperforming amid regulatory easing
• **Energy Sector Volatility**: Oil and gas prices fluctuating on geopolitical tensions
• **Crypto Market Recovery**: Bitcoin and altcoins gaining institutional interest

### 2. Key Sectors Mentioned
• Technology (35% of coverage) - Focus on AI, semiconductors, cloud computing
• Financial Services (25%) - Banks adjusting to rate environment
• Energy (15%) - Traditional and renewable energy competition
• Healthcare (10%) - Biotech innovations and pharma developments
• Consumer Goods (15%) - Retail adaptation to changing consumer behavior

### 3. Notable Economic Indicators
• CPI showing signs of moderation
• Employment data suggesting labor market cooling
• GDP growth projections revised upward
• Dollar index showing relative strength
• Treasury yields stabilizing after volatility

### 4. Emerging Trends
• Increased M&A activity in tech sector
• Growing focus on supply chain resilience
• ESG considerations affecting investment flows
• Regional banking consolidation accelerating
• Rise of alternative investment platforms`;

		console.log("Topics extracted successfully (mock)");

		// Step 4: Generate mock market report
		console.log("Step 4: Generating comprehensive market report (mock)...");
		const mockMarketReport = `
# Executive Summary
Current market conditions reflect a complex interplay of monetary policy shifts, technological innovation, and geopolitical realignments. The anticipated Federal Reserve rate cuts are creating optimism across equity markets, while the rapid advancement in AI infrastructure continues to drive tech sector valuations.

# Key Market Themes

## 1. Monetary Policy Transition
The Federal Reserve's signaled pivot towards a more accommodative stance has sparked renewed optimism across risk assets. Market participants are pricing in a 75% probability of rate cuts within the next quarter, leading to sector rotation favoring growth stocks and rate-sensitive sectors.

## 2. Artificial Intelligence Revolution
The AI infrastructure buildout continues at an unprecedented pace, with major tech companies committing over $500 billion in combined capital expenditure for 2025. This investment surge is creating ripple effects throughout the semiconductor supply chain and data center industries.

## 3. Geopolitical Realignment
China's regulatory easing and renewed focus on technological self-sufficiency has led to a significant outperformance of Chinese tech stocks, with the Hang Seng Tech Index up 35% year-to-date. This trend suggests a potential shift in global tech leadership dynamics.

# Sector Analysis

## Technology Sector
The technology sector remains the primary driver of market gains, with AI-related stocks leading the charge. Semiconductor manufacturers are experiencing unprecedented demand, though supply chain constraints continue to pose challenges. Cloud computing providers are seeing accelerated growth as enterprises increase AI adoption.

## Financial Services
Banks are navigating a challenging environment as net interest margins compress with anticipated rate cuts. However, investment banking revenues are surging due to increased M&A activity and capital markets transactions. Regional banks continue consolidation efforts to achieve scale efficiencies.

## Energy Markets
Energy markets exhibit heightened volatility driven by geopolitical tensions and the ongoing energy transition. Traditional energy companies are generating strong cash flows while simultaneously investing in renewable alternatives. The renewable energy sector is benefiting from policy support and declining technology costs.

# Risk Assessment

## Primary Risks
• **Inflation Resurgence**: Despite recent moderation, structural inflation pressures remain
• **Geopolitical Escalation**: Ongoing conflicts could disrupt global supply chains
• **Tech Valuation Concerns**: AI-driven valuations may be ahead of fundamentals
• **Credit Market Stress**: Commercial real estate and leveraged loans showing weakness
• **Regulatory Uncertainty**: Potential policy changes could impact sector dynamics

## Mitigation Factors
• Central bank flexibility to respond to economic shocks
• Corporate earnings resilience despite macro headwinds
• Strong consumer balance sheets supporting demand
• Technological productivity gains offsetting cost pressures

# Market Outlook

Near-term market dynamics will be influenced by the pace and magnitude of Federal Reserve policy adjustments. We expect continued volatility as markets digest economic data and corporate earnings. The technology sector should maintain leadership, though valuation discipline becomes increasingly important.

Key catalysts to monitor include:
• Q4 earnings season and 2026 guidance
• Federal Reserve meeting outcomes and communication
• Geopolitical developments in key regions
• AI adoption metrics and infrastructure buildout progress

# Investment Considerations

## Opportunities
1. **Quality Growth Stocks**: Companies with strong competitive moats and AI exposure
2. **Dividend Aristocrats**: Defensive positioning with income generation
3. **Emerging Markets**: Selective exposure to beneficiaries of policy easing
4. **Alternative Assets**: Diversification through commodities and real assets

## Recommended Actions
• Maintain balanced portfolio allocation with slight overweight to quality growth
• Consider defensive hedges through options strategies
• Increase allocation to international markets showing relative strength
• Monitor sector rotation opportunities as rate environment evolves
• Focus on companies with strong free cash flow generation

## Risk Management
• Implement stop-loss disciplines on speculative positions
• Maintain adequate cash reserves for opportunistic deployment
• Regularly rebalance to target allocations
• Consider tail-risk hedging strategies for black swan events

---
*This report is based on analysis of ${recentArticles.length} recent market articles and represents a comprehensive view of current market conditions and forward-looking considerations.*`;

		console.log("Market report generated successfully (mock)");

		// Step 5: Save the mock report to database
		console.log("Step 5: Saving mock report to database...");

		const reportTitle = `Market Intelligence Report (TEST) - ${new Date().toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})}`;

		const [savedReport] = await db
			.insert(generatedArticles)
			.values({
				userId: session.user.id,
				title: reportTitle,
				content: mockMarketReport,
				summary: `Mock market intelligence report for testing purposes. Analyzed ${recentArticles.length} recent financial news articles.`,
				modelUsed: "mock-generator",
				promptTokens: 0,
				completionTokens: 0,
				temperature: 0,
				maxTokens: 0,
				metadata: {
					articlesAnalyzed: recentArticles.length,
					newArticlesAdded: totalNewArticles,
					generatedAt: new Date().toISOString(),
					analysisType: "mock-market-intelligence",
					testMode: true,
				},
			})
			.returning({ id: generatedArticles.id });

		console.log(`Mock report saved to database with ID: ${savedReport.id}`);

		return NextResponse.json({
			success: true,
			reportId: savedReport.id,
			reportTitle,
			articlesAnalyzed: recentArticles.length,
			newArticlesAdded: totalNewArticles,
			topicsCount: 5,
			message: "Mock market intelligence report generated successfully for testing",
			testMode: true,
		});

	} catch (error) {
		console.error("Error generating mock market report:", error);
		return NextResponse.json(
			{
				error: "Failed to generate mock market report",
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
}