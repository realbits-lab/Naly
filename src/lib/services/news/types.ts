export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  sourceName: string;
}

export interface NewsFetchOptions {
  topic: string;
  region?: string;
  maxResults?: number;
}

export interface NewsFetchResult {
  articles: NewsArticle[];
  fetchedAt: string;
  source: string;
}
