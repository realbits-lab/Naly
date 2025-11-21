import { NewsArticle, NewsFetchOptions, NewsFetchResult } from './types';

const GOOGLE_NEWS_RSS_BASE = 'https://news.google.com/rss/search';

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
}

function parseRssXml(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemContent = match[1];

    const title = extractTag(itemContent, 'title');
    const link = extractTag(itemContent, 'link');
    const pubDate = extractTag(itemContent, 'pubDate');
    const description = extractTag(itemContent, 'description');
    const source = extractTag(itemContent, 'source');

    if (title && link) {
      items.push({
        title: decodeHtmlEntities(title),
        link,
        pubDate: pubDate || new Date().toISOString(),
        description: decodeHtmlEntities(description || ''),
        source: source || 'Google News',
      });
    }
  }

  return items;
}

function extractTag(content: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
  const match = content.match(regex);
  return match ? (match[1] || match[2] || '').trim() : '';
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, '');
}

function isWithin24Hours(dateStr: string): boolean {
  const articleDate = new Date(dateStr);
  const now = new Date();
  const hoursDiff = (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60);
  return hoursDiff <= 24;
}

export async function fetchGoogleNews(options: NewsFetchOptions): Promise<NewsFetchResult> {
  const { topic, region, maxResults = 10 } = options;

  // 1. Build search query with region
  const query = encodeURIComponent(topic);
  const regionParam = region ? `&gl=${region}&hl=${region === 'KR' ? 'ko' : 'en'}` : '';
  const url = `${GOOGLE_NEWS_RSS_BASE}?q=${query}${regionParam}&ceid=${region || 'US'}:${region === 'KR' ? 'ko' : 'en'}`;

  try {
    // 2. Fetch RSS feed
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Google News: ${response.status}`);
    }

    const xml = await response.text();

    // 3. Parse RSS XML
    const items = parseRssXml(xml);

    // 4. Filter to last 24 hours and transform to NewsArticle
    const articles: NewsArticle[] = items
      .filter(item => isWithin24Hours(item.pubDate))
      .slice(0, maxResults)
      .map(item => ({
        title: item.title,
        description: item.description,
        url: item.link,
        publishedAt: new Date(item.pubDate).toISOString(),
        source: 'google',
        sourceName: item.source,
      }));

    return {
      articles,
      fetchedAt: new Date().toISOString(),
      source: 'google',
    };
  } catch (error) {
    console.error('Error fetching Google News:', error);
    return {
      articles: [],
      fetchedAt: new Date().toISOString(),
      source: 'google',
    };
  }
}
