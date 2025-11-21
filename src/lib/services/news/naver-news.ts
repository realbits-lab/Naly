import { NewsArticle, NewsFetchOptions, NewsFetchResult } from './types';

const NAVER_API_BASE = 'https://openapi.naver.com/v1/search/news.json';

interface NaverNewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
}

interface NaverNewsResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverNewsItem[];
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, '')
    .replace(/<b>/g, '')
    .replace(/<\/b>/g, '');
}

function isWithin24Hours(dateStr: string): boolean {
  const articleDate = new Date(dateStr);
  const now = new Date();
  const hoursDiff = (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60);
  return hoursDiff <= 24;
}

export async function fetchNaverNews(options: NewsFetchOptions): Promise<NewsFetchResult> {
  const { topic, maxResults = 10 } = options;

  // 1. Check for Naver API credentials
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('Naver API credentials not configured. Skipping Naver News.');
    return {
      articles: [],
      fetchedAt: new Date().toISOString(),
      source: 'naver',
    };
  }

  try {
    // 2. Fetch from Naver Search API
    const query = encodeURIComponent(topic);
    const url = `${NAVER_API_BASE}?query=${query}&display=${maxResults}&sort=date`;

    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Naver News: ${response.status}`);
    }

    const data: NaverNewsResponse = await response.json();

    // 3. Filter to last 24 hours and transform to NewsArticle
    const articles: NewsArticle[] = data.items
      .filter(item => isWithin24Hours(item.pubDate))
      .map(item => ({
        title: decodeHtmlEntities(item.title),
        description: decodeHtmlEntities(item.description),
        url: item.originallink || item.link,
        publishedAt: new Date(item.pubDate).toISOString(),
        source: 'naver',
        sourceName: 'Naver News',
      }));

    return {
      articles,
      fetchedAt: new Date().toISOString(),
      source: 'naver',
    };
  } catch (error) {
    console.error('Error fetching Naver News:', error);
    return {
      articles: [],
      fetchedAt: new Date().toISOString(),
      source: 'naver',
    };
  }
}
