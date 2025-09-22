#!/usr/bin/env tsx

import { gateway } from 'ai';
import { generateText } from 'ai';
import { db } from '../src/lib/db';
import { generatedArticles } from '../src/lib/schema/articles';
import { rssArticles, rssArticleViews, rssSources } from '../src/lib/schema/rss';
import Parser from 'rss-parser';
import { eq } from 'drizzle-orm';

interface RSSFeedItem {
  title?: string;
  link?: string;
  pubDate?: string;
  creator?: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
  categories?: string[];
  isoDate?: string;
  summary?: string;
}

interface RSSFeed {
  title?: string;
  description?: string;
  link?: string;
  feedUrl?: string;
  items: RSSFeedItem[];
}

interface RSSSource {
  id: string;
  name: string;
  feedUrl: string;
  description: string | null;
  category: string;
  isActive: boolean;
  logoUrl: string | null;
  fetchErrorCount?: number;
}

class RSSFetcher {
  private parser: Parser<RSSFeed, RSSFeedItem>;

  constructor() {
    this.parser = new Parser({
      customFields: {
        item: ['content:encoded', 'content']
      }
    });
  }

  async fetchRSSFeed(url: string): Promise<RSSFeed> {
    try {
      console.log(`🔍 Fetching RSS feed from: ${url}`);
      const feed = await this.parser.parseURL(url);
      console.log(`✅ Successfully fetched ${feed.items?.length || 0} items from ${url}`);
      return feed;
    } catch (error) {
      console.error(`❌ Error fetching RSS feed from ${url}:`, error);
      throw error;
    }
  }

  async saveRSSArticles(source: RSSSource, feed: RSSFeed): Promise<string[]> {
    const savedArticleIds: string[] = [];

    for (const item of feed.items.slice(0, 5)) { // Limit to 5 articles per source
      try {
        // Check if article already exists
        const existingArticle = await db
          .select()
          .from(rssArticles)
          .where(eq(rssArticles.link, item.link || ''))
          .limit(1);

        if (existingArticle.length > 0) {
          console.log(`⏭️  Article already exists: ${item.title}`);
          continue;
        }

        const articleData = {
          sourceId: source.id,
          title: item.title || 'Untitled',
          description: item.contentSnippet?.substring(0, 500) || null,
          content: item.content || item.contentSnippet || '',
          link: item.link || '',
          guid: item.guid || item.link || '',
          author: item.creator || null,
          publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
          categories: item.categories || [],
          sentiment: null,
          keywords: [],
          entities: [],
          isProcessed: false,
        };

        const [savedArticle] = await db
          .insert(rssArticles)
          .values(articleData)
          .returning({ id: rssArticles.id });

        savedArticleIds.push(savedArticle.id);
        console.log(`💾 Saved article: ${articleData.title}`);
      } catch (error) {
        console.error(`❌ Error saving article "${item.title}":`, error);
      }
    }

    return savedArticleIds;
  }

  async generateAIReport(rssArticle: any): Promise<void> {
    try {
      console.log(`🤖 Generating AI report for: ${rssArticle.title}`);

      const prompt = `
You are a financial analyst AI. Analyze the following financial news article and generate a comprehensive report.

Article Title: ${rssArticle.title}
Article Content: ${rssArticle.content || rssArticle.description}
Source: ${rssArticle.sourceId}
Published: ${rssArticle.publishedAt}

Please provide:
1. A concise summary (2-3 sentences)
2. Key financial points and implications
3. Market analysis and potential impact
4. Investment implications
5. Sentiment analysis (positive, negative, or neutral)
6. Extract relevant keywords and entities

Format your response as a structured analysis that would be valuable for financial decision-making.
`;

      const { text } = await generateText({
        model: gateway('google/gemini-2.5-flash-lite'),
        prompt,
        maxTokens: 1000,
      });

      // Parse AI response and extract components
      const lines = text.split('\n').filter(line => line.trim());

      // Simple extraction logic - in production, you'd want more sophisticated parsing
      let summary = '';
      let keyPoints = '';
      let marketAnalysis = '';
      let investmentImplications = '';
      let sentiment = 'neutral';
      let keywords: string[] = [];

      // Extract summary (first few lines)
      summary = lines.slice(0, 3).join(' ').substring(0, 500);

      // Simple sentiment analysis from the response
      const sentimentMatch = text.toLowerCase().match(/(positive|negative|neutral|bullish|bearish)/);
      if (sentimentMatch) {
        sentiment = sentimentMatch[1] === 'bullish' ? 'positive' :
                   sentimentMatch[1] === 'bearish' ? 'negative' :
                   sentimentMatch[1];
      }

      // Extract keywords (simple approach)
      keywords = text.toLowerCase()
        .match(/\b(stock|market|economy|inflation|fed|earnings|revenue|profit|loss|growth|decline|investment|trading|finance|technology|ai|crypto|blockchain)\b/g) || [];
      keywords = [...new Set(keywords)].slice(0, 10); // Remove duplicates and limit

      // Calculate reading time for generated content
      const generatedWordCount = text.split(' ').length;
      const generatedReadingTime = Math.max(1, Math.ceil(generatedWordCount / 200));

      // Save generated article
      const generatedArticleData = {
        userId: '00000000-0000-0000-0000-000000000000', // System user
        title: `Analysis: ${rssArticle.title}`,
        content: text,
        summary,
        keyPoints: [keyPoints],
        marketAnalysis,
        investmentImplications,
        sourceTitle: rssArticle.title,
        sourceContent: rssArticle.content,
        sourceUrl: rssArticle.link,
        sourcePublisher: rssArticle.sourceId,
        sourceCategory: 'analysis',
        sentiment,
        keywords,
        entities: [], // Could be enhanced with NER
        marketImpact: 'medium', // Could be determined by AI
        wordCount: generatedWordCount,
        readingTime: generatedReadingTime,
        aiModel: 'google/gemini-2.5-flash-lite',
        generationMethod: 'ai',
        sourceLanguage: 'en',
        hasTranslations: 'false',
      };

      await db.insert(generatedArticles).values(generatedArticleData);
      console.log(`✅ Generated AI report for: ${rssArticle.title}`);

    } catch (error) {
      console.error(`❌ Error generating AI report for "${rssArticle.title}":`, error);
    }
  }
}

async function main() {
  console.log('🚀 Starting RSS fetching and report generation...');

  const fetcher = new RSSFetcher();

  try {
    // Get active RSS sources
    const sources = await db
      .select()
      .from(rssSources)
      .where(eq(rssSources.isActive, true));

    console.log(`📡 Found ${sources.length} active RSS sources`);

    for (const source of sources) {
      try {
        console.log(`\n📰 Processing source: ${source.name}`);

        // Fetch RSS feed
        const feed = await fetcher.fetchRSSFeed(source.feedUrl);

        // Save RSS articles
        const savedArticleIds = await fetcher.saveRSSArticles(source, feed);

        // Generate AI reports for saved articles
        for (const articleId of savedArticleIds) {
          const rssArticle = await db
            .select()
            .from(rssArticles)
            .where(eq(rssArticles.id, articleId))
            .limit(1);

          if (rssArticle.length > 0) {
            await fetcher.generateAIReport(rssArticle[0]);
          }
        }

        // Update source's last fetched time
        await db
          .update(rssSources)
          .set({
            lastFetchedAt: new Date(),
            lastSuccessfulFetch: new Date(),
            fetchErrorCount: 0,
            lastFetchError: null
          })
          .where(eq(rssSources.id, source.id));

        console.log(`✅ Completed processing source: ${source.name}`);

      } catch (error) {
        console.error(`❌ Error processing source "${source.name}":`, error);

        // Update source's error status
        await db
          .update(rssSources)
          .set({
            lastFetchedAt: new Date(),
            fetchErrorCount: (source.fetchErrorCount || 0) + 1,
            lastFetchError: error instanceof Error ? error.message : 'Unknown error'
          })
          .where(eq(rssSources.id, source.id));
      }
    }

    // Generate summary report
    const totalRssArticles = await db.select().from(rssArticles);
    const totalGeneratedArticles = await db.select().from(generatedArticles);

    console.log('\n📊 Summary Report:');
    console.log(`📰 Total RSS articles: ${totalRssArticles.length}`);
    console.log(`🤖 Total generated reports: ${totalGeneratedArticles.length}`);
    console.log(`📡 Processed sources: ${sources.length}`);

    console.log('\n✅ RSS fetching and report generation completed successfully!');

  } catch (error) {
    console.error('❌ Fatal error in main process:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main()
    .then(() => {
      console.log('🎉 Process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Process failed:', error);
      process.exit(1);
    });
}

export { RSSFetcher, main };