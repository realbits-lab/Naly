import { NewsArticle, NewsFetchOptions, NewsFetchResult } from './types';
import { fetchGoogleNews } from './google-news';
import { fetchNaverNews } from './naver-news';
import { fetchYahooNews } from './yahoo-news';

export type NewsSource = 'google' | 'naver' | 'yahoo';

export interface UnifiedNewsFetchOptions extends NewsFetchOptions {
  sources?: NewsSource[];
}

export interface UnifiedNewsFetchResult {
  articles: NewsArticle[];
  fetchedAt: string;
  sourceResults: NewsFetchResult[];
}

export async function fetchNews(options: UnifiedNewsFetchOptions): Promise<UnifiedNewsFetchResult> {
  const { sources = ['google', 'naver', 'yahoo'], ...fetchOptions } = options;

  // 1. Build fetch promises based on selected sources
  const fetchPromises: Promise<NewsFetchResult>[] = [];

  if (sources.includes('google')) {
    fetchPromises.push(fetchGoogleNews(fetchOptions));
  }
  if (sources.includes('naver')) {
    fetchPromises.push(fetchNaverNews(fetchOptions));
  }
  if (sources.includes('yahoo')) {
    fetchPromises.push(fetchYahooNews(fetchOptions));
  }

  // 2. Fetch from all sources in parallel
  const results = await Promise.all(fetchPromises);

  // 3. Aggregate all articles
  const allArticles: NewsArticle[] = results.flatMap(result => result.articles);

  // 4. Sort by published date (most recent first)
  allArticles.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  // 5. Remove duplicates based on URL
  const seenUrls = new Set<string>();
  const uniqueArticles = allArticles.filter(article => {
    if (seenUrls.has(article.url)) {
      return false;
    }
    seenUrls.add(article.url);
    return true;
  });

  // 6. Limit to maxResults
  const maxResults = options.maxResults || 20;
  const limitedArticles = uniqueArticles.slice(0, maxResults);

  return {
    articles: limitedArticles,
    fetchedAt: new Date().toISOString(),
    sourceResults: results,
  };
}

export { type NewsArticle, type NewsFetchOptions, type NewsFetchResult } from './types';
