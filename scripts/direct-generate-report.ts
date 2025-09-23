import { db } from '../src/lib/db';
import { rssArticles, generatedArticles, users } from '../src/lib/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { generateAIText } from '../src/lib/ai';

async function directGenerateReport() {
  console.log('🚀 Starting direct market report generation...');

  try {
    // Find a manager user for the report
    const [managerUser] = await db
      .select()
      .from(users)
      .where(eq(users.role, 'manager'))
      .limit(1);

    if (!managerUser) {
      console.error('❌ No manager user found');
      return;
    }

    console.log(`👤 Using manager user: ${managerUser.email}`);

    // Step 1: Fetch latest unarchived articles
    console.log("📰 Fetching latest unarchived articles...");

    const recentArticles = await db
      .select({
        id: rssArticles.id,
        title: rssArticles.title,
        description: rssArticles.description,
        content: rssArticles.content,
        fullContent: rssArticles.fullContent,
        categories: rssArticles.categories,
        publishedAt: rssArticles.publishedAt,
        link: rssArticles.link,
        author: rssArticles.author,
      })
      .from(rssArticles)
      .where(eq(rssArticles.isArchived, false))
      .orderBy(desc(rssArticles.publishedAt))
      .limit(10);

    console.log(`📊 Found ${recentArticles.length} recent articles for analysis`);

    if (recentArticles.length === 0) {
      console.error('❌ No unarchived articles found');
      return;
    }

    // Step 2: Generate market report
    console.log("🤖 Generating comprehensive market report...");

    const articlesText = recentArticles.map(article => {
      const contentToUse = article.fullContent
        ? article.fullContent.substring(0, 2000)
        : (article.content || article.description || 'No content available');

      return `Title: ${article.title}
Content: ${contentToUse}
Categories: ${Array.isArray(article.categories) ? article.categories.join(', ') : 'No categories'}
Author: ${article.author || 'Unknown'}
Link: ${article.link}`;
    }).join('\n\n---\n\n');

    const reportPrompt = `Analyze the following recent financial news articles and generate a comprehensive market intelligence report suitable for investment professionals and financial analysts.

FINANCIAL NEWS ARTICLES:
${articlesText}

CRITICAL NUMERICAL DATA PRESERVATION REQUIREMENTS:
- PRESERVE ALL NUMERICAL DATA EXACTLY as stated in the source articles
- Include EXACT stock prices, percentage changes, revenue figures
- Include EXACT market cap, employee counts, and all financial metrics
- Quote specific numbers directly from the articles with proper attribution

ANALYSIS REQUIREMENTS:
Create a comprehensive market intelligence report with the following structure:

# Executive Summary
[2-3 sentence overview of current market conditions and key developments]

# Key Market Themes
[Detailed analysis of the most significant topics with EXACT numerical data]

# Sector Analysis
[Breakdown by industry/sector with specific insights and ALL EXACT financial figures]

# Risk Assessment
[Potential market risks with concrete examples and PRECISE numerical data]

# Market Outlook
[Short-term implications with EXACT forecasts and projections when available]

# Investment Considerations
[Key factors for investment decision-making with COMPLETE numerical accuracy]

Make the report professional, actionable, and focused on providing valuable insights for financial decision-making. PRESERVE every single number, percentage, dollar amount, and financial metric EXACTLY as stated in the source articles.`;

    const marketReport = await generateAIText({
      prompt: reportPrompt,
      model: "GEMINI_2_5_FLASH",
      temperature: 0.1,
      maxTokens: 65536,
    });

    console.log(`✅ Market report generated (${marketReport.text.length} characters)`);

    // Step 3: Save to database
    console.log("💾 Saving report to database...");

    const reportTitle = `Market Intelligence Report - ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`;

    const [savedReport] = await db
      .insert(generatedArticles)
      .values({
        userId: managerUser.id,
        title: reportTitle,
        content: marketReport.text,
        summary: `Enhanced market intelligence report analyzing ${recentArticles.length} recent financial news articles, identifying key themes and investment considerations.`,
        sourceCategory: "market-intelligence",
        marketAnalysis: marketReport.text,
        investmentImplications: "See Market Outlook and Investment Considerations sections in the full report",
        keywords: ["market-analysis", "intelligence-report", "financial-news", "investment-research"],
        entities: recentArticles.map(article => article.title.substring(0, 50)),
        marketImpact: "Comprehensive analysis of current market conditions and trends",
        aiModel: "GEMINI_2_5_FLASH",
        generationMethod: "ai",
        wordCount: marketReport.text.length,
        readingTime: Math.ceil(marketReport.text.length / 200),
      })
      .returning({ id: generatedArticles.id });

    console.log(`📝 Report saved with ID: ${savedReport.id}`);

    // Step 4: Archive processed articles
    console.log("📦 Archiving processed articles...");

    const articleIds = recentArticles.map(article => article.id);

    await db
      .update(rssArticles)
      .set({
        isArchived: true,
        isProcessed: true,
        processedAt: new Date(),
      })
      .where(inArray(rssArticles.id, articleIds));

    console.log(`✅ Archived ${articleIds.length} articles`);

    console.log('🎉 Market intelligence report generated successfully!');
    console.log(`📋 Report Details:`);
    console.log(`- Title: ${reportTitle}`);
    console.log(`- Word Count: ${marketReport.text.length}`);
    console.log(`- Reading Time: ${Math.ceil(marketReport.text.length / 200)} minutes`);
    console.log(`- Articles Analyzed: ${recentArticles.length}`);

  } catch (error) {
    console.error('❌ Error generating market report:', error);
  }
}

directGenerateReport().catch(console.error);