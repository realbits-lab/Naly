import { tool } from 'ai';
import { z } from 'zod';

/**
 * Firecrawl Deep Research Tool
 * Unlike simple news headlines, this tool scrapes full article text, analysis, and documents
 * Critical for Superforecasting: headlines are often misleading, full context is required
 */
export const deepResearchTool = tool({
  description: `Perform deep web research by scraping and reading full article content.
Use this when you need to:
- Read full analysis beyond headlines (Bloomberg, Reuters, SEC filings)
- Extract specific sections from research reports
- Get detailed context on regulatory changes, earnings call transcripts, etc.
Returns clean markdown text suitable for LLM analysis.`,
  inputSchema: z.object({
    url: z.string().url().describe('Specific URL to scrape and analyze'),
    focus: z
      .string()
      .optional()
      .describe('Optional: specific section to focus on (e.g., "Risks", "Outlook", "Q&A")'),
  }),
  execute: async ({ url, focus }) => {
    const apiKey = process.env.FIRECRAWL_API_KEY;

    if (!apiKey) {
      return {
        error: 'Firecrawl API key not configured',
        recommendation: 'Proceed with headline-level news analysis only',
        url,
      };
    }

    try {
      // Dynamic import to avoid bundling issues
      const FirecrawlApp = (await import('@mendable/firecrawl-js')).default;
      const app = new FirecrawlApp({ apiKey });

      // Scrape the URL
      const scrapeResult = await app.scrapeUrl(url, {
        formats: ['markdown'],
        onlyMainContent: true,
      });

      if (!scrapeResult.success) {
        return {
          error: 'Failed to scrape URL',
          url,
          recommendation: 'Try alternative sources or manual research',
        };
      }

      const content = scrapeResult.markdown || '';

      // If focus is specified, try to extract that section
      let focusedContent = content;
      if (focus && content) {
        const focusRegex = new RegExp(`##.*${focus}[\\s\\S]*?(?=##|$)`, 'i');
        const match = content.match(focusRegex);
        if (match) {
          focusedContent = match[0];
        }
      }

      // Truncate if too long (keep first 8000 chars for token efficiency)
      const truncatedContent =
        focusedContent.length > 8000
          ? focusedContent.substring(0, 8000) + '\n\n[...Content truncated for length...]'
          : focusedContent;

      return {
        source: url,
        title: scrapeResult.metadata?.title || 'Unknown',
        author: scrapeResult.metadata?.author,
        publishedDate: scrapeResult.metadata?.publishedTime,
        contentLength: content.length,
        content: truncatedContent,
        focusApplied: focus || 'full article',
        credibilitySignals: {
          hasAuthor: !!scrapeResult.metadata?.author,
          hasPublishDate: !!scrapeResult.metadata?.publishedTime,
          sourceType: url.includes('sec.gov')
            ? 'Official Filing'
            : url.includes('bloomberg.com') || url.includes('reuters.com')
              ? 'Premium News'
              : url.includes('.gov')
                ? 'Government'
                : 'General',
        },
      };
    } catch (error: any) {
      return {
        error: `Scraping failed: ${error.message}`,
        url,
        recommendation: 'Source may be behind paywall or blocking scrapers. Try alternative URLs.',
      };
    }
  },
});

/**
 * Firecrawl Search Tool
 * Searches the web and returns relevant URLs for deep research
 * Use this before deepResearchTool to find credible sources
 */
export const webSearchTool = tool({
  description: `Search the web for relevant articles and sources.
Use this to find credible sources before deep reading with deepResearchTool.
Filters for high-quality sources automatically.`,
  inputSchema: z.object({
    query: z.string().describe('Search query (e.g., "Apple Q1 2025 earnings analysis")'),
    limit: z.number().default(5).describe('Number of results to return (default 5)'),
  }),
  execute: async ({ query, limit = 5 }) => {
    const apiKey = process.env.FIRECRAWL_API_KEY;

    if (!apiKey) {
      return {
        error: 'Firecrawl API key not configured',
        recommendation: 'Use manual URL specification with deepResearchTool',
      };
    }

    try {
      const FirecrawlApp = (await import('@mendable/firecrawl-js')).default;
      const app = new FirecrawlApp({ apiKey });

      const searchResults = await app.search(query, {
        limit,
        lang: 'en',
      });

      if (!searchResults.success || !searchResults.data) {
        return {
          error: 'Search failed',
          query,
          results: [],
        };
      }

      // Prioritize credible sources
      const credibilityScore = (url: string): number => {
        if (url.includes('sec.gov') || url.includes('.gov')) return 10;
        if (
          url.includes('bloomberg.com') ||
          url.includes('reuters.com') ||
          url.includes('wsj.com')
        )
          return 9;
        if (
          url.includes('ft.com') ||
          url.includes('economist.com') ||
          url.includes('cnbc.com')
        )
          return 8;
        if (url.includes('forbes.com') || url.includes('fortune.com')) return 7;
        return 5;
      };

      const rankedResults = Array.isArray(searchResults.data)
        ? searchResults.data
            .map((result: any) => ({
              url: result.url,
              title: result.title,
              description: result.description,
              credibilityScore: credibilityScore(result.url),
            }))
            .sort((a, b) => b.credibilityScore - a.credibilityScore)
        : [];

      return {
        query,
        totalResults: rankedResults.length,
        results: rankedResults,
        recommendation:
          rankedResults.length > 0
            ? `Use deepResearchTool on top URLs: ${rankedResults.slice(0, 3).map((r) => r.url).join(', ')}`
            : 'No results found. Refine query or use direct URLs.',
      };
    } catch (error: any) {
      return {
        error: `Search failed: ${error.message}`,
        query,
        results: [],
      };
    }
  },
});
