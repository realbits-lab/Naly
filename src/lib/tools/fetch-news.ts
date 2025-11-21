import { tool } from 'ai';
import { z } from 'zod';
import { fetchNews, type NewsSource } from '../services/news';

export const fetchNewsTool = tool({
  description: 'Fetch latest 24-hour news from major news sources (Google News, Naver, Yahoo). Use this tool to gather real-time news data for research and reporting.',
  inputSchema: z.object({
    topic: z.string().describe('Topic or keyword to search for news'),
    region: z.string().optional().describe('Region code (e.g., US, KR, JP) for localized news'),
    sources: z
      .array(z.enum(['google', 'naver', 'yahoo']))
      .optional()
      .describe('News sources to fetch from. Defaults to all sources.'),
    maxResults: z
      .number()
      .optional()
      .describe('Maximum number of articles to return. Defaults to 20.'),
  }),
  execute: async ({ topic, region, sources, maxResults }) => {
    const result = await fetchNews({
      topic,
      region,
      sources: sources as NewsSource[] | undefined,
      maxResults,
    });

    return {
      success: true,
      totalArticles: result.articles.length,
      fetchedAt: result.fetchedAt,
      articles: result.articles.map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        publishedAt: article.publishedAt,
        source: article.sourceName,
      })),
      sourceSummary: result.sourceResults.map(sr => ({
        source: sr.source,
        articleCount: sr.articles.length,
      })),
    };
  },
});
