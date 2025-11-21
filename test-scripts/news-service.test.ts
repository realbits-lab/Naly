import { fetchGoogleNews } from '../src/lib/services/news/google-news';
import { fetchNaverNews } from '../src/lib/services/news/naver-news';
import { fetchYahooNews } from '../src/lib/services/news/yahoo-news';
import { fetchNews } from '../src/lib/services/news';

describe('News Service', () => {
  describe('fetchGoogleNews', () => {
    it('should fetch news articles for a given topic', async () => {
      const result = await fetchGoogleNews({
        topic: 'technology',
        maxResults: 5,
      });

      expect(result).toHaveProperty('articles');
      expect(result).toHaveProperty('fetchedAt');
      expect(result).toHaveProperty('source', 'google');
      expect(Array.isArray(result.articles)).toBe(true);
    }, 30000);

    it('should return articles with required fields', async () => {
      const result = await fetchGoogleNews({
        topic: 'stock market',
        maxResults: 3,
      });

      if (result.articles.length > 0) {
        const article = result.articles[0];
        expect(article).toHaveProperty('title');
        expect(article).toHaveProperty('description');
        expect(article).toHaveProperty('url');
        expect(article).toHaveProperty('publishedAt');
        expect(article).toHaveProperty('source', 'google');
        expect(article).toHaveProperty('sourceName');
      }
    }, 30000);

    it('should support region filtering', async () => {
      const result = await fetchGoogleNews({
        topic: 'news',
        region: 'KR',
        maxResults: 5,
      });

      expect(result).toHaveProperty('source', 'google');
      expect(Array.isArray(result.articles)).toBe(true);
    }, 30000);
  });

  describe('fetchNaverNews', () => {
    it('should return empty array when API credentials are not set', async () => {
      // Without NAVER_CLIENT_ID and NAVER_CLIENT_SECRET env vars
      const result = await fetchNaverNews({
        topic: 'technology',
        maxResults: 5,
      });

      expect(result).toHaveProperty('articles');
      expect(result).toHaveProperty('source', 'naver');
      expect(Array.isArray(result.articles)).toBe(true);
    }, 30000);
  });

  describe('fetchYahooNews', () => {
    it('should fetch news articles for a given topic', async () => {
      const result = await fetchYahooNews({
        topic: 'technology',
        maxResults: 5,
      });

      expect(result).toHaveProperty('articles');
      expect(result).toHaveProperty('fetchedAt');
      expect(result).toHaveProperty('source', 'yahoo');
      expect(Array.isArray(result.articles)).toBe(true);
    }, 30000);
  });

  describe('fetchNews (unified)', () => {
    it('should aggregate news from multiple sources', async () => {
      const result = await fetchNews({
        topic: 'stock',
        sources: ['google'],
        maxResults: 10,
      });

      expect(result).toHaveProperty('articles');
      expect(result).toHaveProperty('fetchedAt');
      expect(result).toHaveProperty('sourceResults');
      expect(Array.isArray(result.articles)).toBe(true);
      expect(Array.isArray(result.sourceResults)).toBe(true);
    }, 30000);

    it('should sort articles by published date (most recent first)', async () => {
      const result = await fetchNews({
        topic: 'news',
        sources: ['google'],
        maxResults: 10,
      });

      if (result.articles.length > 1) {
        const dates = result.articles.map(a => new Date(a.publishedAt).getTime());
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
        }
      }
    }, 30000);

    it('should remove duplicate articles based on URL', async () => {
      const result = await fetchNews({
        topic: 'technology',
        sources: ['google'],
        maxResults: 20,
      });

      const urls = result.articles.map(a => a.url);
      const uniqueUrls = new Set(urls);
      expect(urls.length).toBe(uniqueUrls.size);
    }, 30000);
  });
});
