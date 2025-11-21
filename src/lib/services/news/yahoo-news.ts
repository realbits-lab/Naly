import { NewsArticle, NewsFetchOptions, NewsFetchResult } from './types';

const YAHOO_NEWS_RSS_BASE = 'https://news.yahoo.com/rss';

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
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

    if (title && link) {
      items.push({
        title: decodeHtmlEntities(title),
        link,
        pubDate: pubDate || new Date().toISOString(),
        description: decodeHtmlEntities(description || ''),
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

export async function fetchYahooNews(options: NewsFetchOptions): Promise<NewsFetchResult> {
  const { topic, maxResults = 10 } = options;

  // 1. Yahoo News RSS URL with search
  const query = encodeURIComponent(topic);
  const url = `${YAHOO_NEWS_RSS_BASE}/search?p=${query}`;

  try {
    // 2. Fetch RSS feed
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
      },
    });

    if (!response.ok) {
      // 3. Fall back to category feed if search fails
      const fallbackUrl = YAHOO_NEWS_RSS_BASE;
      const fallbackResponse = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
        },
      });

      if (!fallbackResponse.ok) {
        throw new Error(`Failed to fetch Yahoo News: ${fallbackResponse.status}`);
      }

      const xml = await fallbackResponse.text();
      const items = parseRssXml(xml);

      // 4. Filter by topic keyword in title or description
      const filteredItems = items.filter(
        item =>
          item.title.toLowerCase().includes(topic.toLowerCase()) ||
          item.description.toLowerCase().includes(topic.toLowerCase())
      );

      const articles: NewsArticle[] = filteredItems
        .filter(item => isWithin24Hours(item.pubDate))
        .slice(0, maxResults)
        .map(item => ({
          title: item.title,
          description: item.description,
          url: item.link,
          publishedAt: new Date(item.pubDate).toISOString(),
          source: 'yahoo',
          sourceName: 'Yahoo News',
        }));

      return {
        articles,
        fetchedAt: new Date().toISOString(),
        source: 'yahoo',
      };
    }

    const xml = await response.text();
    const items = parseRssXml(xml);

    // 5. Filter to last 24 hours and transform to NewsArticle
    const articles: NewsArticle[] = items
      .filter(item => isWithin24Hours(item.pubDate))
      .slice(0, maxResults)
      .map(item => ({
        title: item.title,
        description: item.description,
        url: item.link,
        publishedAt: new Date(item.pubDate).toISOString(),
        source: 'yahoo',
        sourceName: 'Yahoo News',
      }));

    return {
      articles,
      fetchedAt: new Date().toISOString(),
      source: 'yahoo',
    };
  } catch (error) {
    console.error('Error fetching Yahoo News:', error);
    return {
      articles: [],
      fetchedAt: new Date().toISOString(),
      source: 'yahoo',
    };
  }
}
