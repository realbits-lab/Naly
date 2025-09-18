import { Readability } from '@mozilla/readability';

export interface RSSItem {
  title: string;
  link: string;
  description?: string;
  contentSnippet?: string;
  content?: string;
  pubDate?: string;
  creator?: string;
  author?: string;
  categories?: string[];
  enclosure?: {
    url: string;
    type: string;
  };
}

export interface ExtractedContent {
  title: string;
  content: string;
  textContent: string;
  excerpt: string;
  byline?: string;
  dir?: string;
  siteName?: string;
  publishedTime?: string;
}

export interface EnhancedRSSContent {
  title: string;
  description: string;
  cleanDescription: string;
  images: string[];
  summary: string;
  readTime: number;
  externalLink: string;
  author?: string;
  publishDate?: string;
  categories: string[];
  extractedContent?: ExtractedContent;
  isContentExtracted: boolean;
}

export type ContentDisplayStrategy = 'iframe' | 'extract' | 'progressive' | 'external';

interface ContentCache {
  [url: string]: {
    content: ExtractedContent;
    timestamp: number;
    expiresAt: number;
  };
}

class ArticleContentService {
  private cache: ContentCache = {};
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  // Multiple CORS proxy options for better reliability
  private readonly CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://cors-anywhere.herokuapp.com/',
    'https://thingproxy.freeboard.io/fetch/'
  ];

  // External API configurations (add API keys to env variables)
  private readonly EXTERNAL_APIS = {
    diffbot: {
      url: 'https://api.diffbot.com/v3/article',
      token: process.env.DIFFBOT_API_TOKEN,
      enabled: !!process.env.DIFFBOT_API_TOKEN
    },
    scraperapi: {
      url: 'http://api.scraperapi.com',
      key: process.env.SCRAPERAPI_KEY,
      enabled: !!process.env.SCRAPERAPI_KEY
    }
  };

  constructor() {
    this.loadCacheFromStorage();
  }

  /**
   * Main method to get enhanced RSS content
   */
  enhanceRSSContent(rssItem: RSSItem): EnhancedRSSContent {
    const cleanDescription = this.cleanAndFormatDescription(rssItem.contentSnippet || rssItem.description || '');
    const images = this.extractImagesFromContent(rssItem.content || rssItem.description || '');
    const summary = this.generateSummary(cleanDescription);
    const readTime = this.estimateReadTime(cleanDescription);

    return {
      title: rssItem.title,
      description: rssItem.description || '',
      cleanDescription,
      images,
      summary,
      readTime,
      externalLink: rssItem.link,
      author: rssItem.creator || rssItem.author,
      publishDate: rssItem.pubDate,
      categories: rssItem.categories || [],
      isContentExtracted: false
    };
  }

  /**
   * Extract full article content using progressive enhancement
   */
  async getArticleContent(articleUrl: string, strategy: ContentDisplayStrategy = 'progressive'): Promise<ExtractedContent | null> {
    // Check cache first
    const cached = this.getCachedContent(articleUrl);
    if (cached) {
      return cached;
    }

    try {
      let content: ExtractedContent | null = null;

      switch (strategy) {
        case 'iframe':
          content = await this.tryIframe(articleUrl);
          break;
        case 'extract':
          content = await this.extractContent(articleUrl);
          break;
        case 'progressive':
          content = await this.progressiveEnhancement(articleUrl);
          break;
        default:
          return null;
      }

      // Cache successful extraction
      if (content) {
        this.cacheContent(articleUrl, content);
      }

      return content;
    } catch (error) {
      console.error('Failed to get article content:', error);
      return null;
    }
  }

  /**
   * Progressive enhancement strategy - try best method first, fallback gracefully
   */
  private async progressiveEnhancement(articleUrl: string): Promise<ExtractedContent | null> {
    try {
      // Primary: Use our server-side API (no CORS issues)
      const serverResult = await this.extractWithServerAPI(articleUrl);
      if (serverResult) return serverResult;

      // Fallback: Try external APIs (if available and configured)
      if (this.EXTERNAL_APIS.diffbot.enabled) {
        const diffbotResult = await this.extractWithDiffbot(articleUrl);
        if (diffbotResult) return diffbotResult;
      }

      if (this.EXTERNAL_APIS.scraperapi.enabled) {
        const scraperapiResult = await this.extractWithScraperAPI(articleUrl);
        if (scraperapiResult) return scraperapiResult;
      }

      // Last resort: CORS proxy method (keeping for backward compatibility)
      return await this.extractContent(articleUrl);
    } catch (error) {
      console.warn('Content extraction failed, falling back to external link:', error);
      return null;
    }
  }

  /**
   * Extract content using Mozilla Readability algorithm
   */
  private async extractContent(articleUrl: string): Promise<ExtractedContent | null> {
    try {
      const html = await this.fetchThroughProxy(articleUrl);
      return this.parseWithReadability(html, articleUrl);
    } catch (error) {
      console.error('Content extraction failed:', error);
      throw error;
    }
  }

  /**
   * Fetch HTML content through CORS proxy with multiple fallbacks
   */
  private async fetchThroughProxy(articleUrl: string): Promise<string> {
    let lastError: Error | null = null;

    // Try each CORS proxy until one succeeds
    for (const proxy of this.CORS_PROXIES) {
      try {
        const proxyUrl = `${proxy}${encodeURIComponent(articleUrl)}`;

        const response = await fetch(proxyUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader)',
          },
          timeout: 10000, // 10 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        if (html && html.length > 100) { // Basic validation
          return html;
        }
        throw new Error('Empty or invalid response');
      } catch (error) {
        console.warn(`Proxy ${proxy} failed:`, error);
        lastError = error as Error;
        continue; // Try next proxy
      }
    }

    throw lastError || new Error('All CORS proxies failed');
  }

  /**
   * Parse HTML using Mozilla Readability
   */
  private parseWithReadability(html: string, url: string): ExtractedContent | null {
    try {
      // Create a document for Readability
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Set the document URL for relative link resolution
      const baseElement = doc.createElement('base');
      baseElement.href = url;
      doc.head.insertBefore(baseElement, doc.head.firstChild);

      // Create Readability instance and parse
      const reader = new Readability(doc, {
        debug: false,
        maxElemsToParse: 5000,
        nbTopCandidates: 5,
        charThreshold: 500,
        classesToPreserve: ['highlight', 'quote', 'pullquote']
      });

      const article = reader.parse();

      if (!article) {
        throw new Error('Readability failed to parse article');
      }

      return {
        title: article.title,
        content: article.content,
        textContent: article.textContent,
        excerpt: article.excerpt,
        byline: article.byline,
        dir: article.dir,
        siteName: article.siteName,
        publishedTime: article.publishedTime
      };
    } catch (error) {
      console.error('Readability parsing failed:', error);
      return null;
    }
  }

  /**
   * Attempt iframe embedding (for sites that allow it)
   */
  private async tryIframe(articleUrl: string): Promise<ExtractedContent | null> {
    return new Promise((resolve) => {
      // Create a hidden iframe to test if the site allows embedding
      const testIframe = document.createElement('iframe');
      testIframe.src = articleUrl;
      testIframe.style.display = 'none';
      testIframe.sandbox = 'allow-same-origin allow-scripts';

      const timeout = setTimeout(() => {
        document.body.removeChild(testIframe);
        resolve(null); // Iframe blocked or took too long
      }, 3000);

      testIframe.onload = () => {
        clearTimeout(timeout);
        document.body.removeChild(testIframe);

        // If iframe loaded successfully, return basic content structure
        resolve({
          title: 'External Content',
          content: `<iframe src="${articleUrl}" class="w-full h-96 border rounded-lg" sandbox="allow-same-origin allow-scripts allow-popups"></iframe>`,
          textContent: 'Content loaded in iframe',
          excerpt: 'External content loaded successfully'
        });
      };

      testIframe.onerror = () => {
        clearTimeout(timeout);
        document.body.removeChild(testIframe);
        resolve(null);
      };

      document.body.appendChild(testIframe);
    });
  }

  /**
   * Clean and format RSS description/content
   */
  private cleanAndFormatDescription(description: string): string {
    if (!description) return '';

    return description
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Extract images from RSS content
   */
  private extractImagesFromContent(content: string): string[] {
    if (!content) return [];

    const imageRegex = /<img[^>]+src\s*=\s*['"](https?:\/\/[^'"]+)['"]/gi;
    const images: string[] = [];
    let match;

    while ((match = imageRegex.exec(content)) !== null) {
      const imageUrl = match[1];
      if (this.isValidImageUrl(imageUrl)) {
        images.push(imageUrl);
      }
    }

    // Also check for enclosure images in RSS
    const enclosureRegex = /enclosure[^>]+url\s*=\s*['"](https?:\/\/[^'"]+)['"]/gi;
    while ((match = enclosureRegex.exec(content)) !== null) {
      const imageUrl = match[1];
      if (this.isValidImageUrl(imageUrl)) {
        images.push(imageUrl);
      }
    }

    return [...new Set(images)]; // Remove duplicates
  }

  /**
   * Validate if URL is likely an image
   */
  private isValidImageUrl(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url);
  }

  /**
   * Generate a smart summary from content
   */
  private generateSummary(content: string, maxLength: number = 200): string {
    if (!content || content.length <= maxLength) return content;

    // Find the first complete sentence that fits within maxLength
    const sentences = content.split(/[.!?]+\s+/);
    let summary = '';

    for (const sentence of sentences) {
      if ((summary + sentence).length <= maxLength) {
        summary += (summary ? '. ' : '') + sentence;
      } else {
        break;
      }
    }

    return summary || content.substring(0, maxLength - 3) + '...';
  }

  /**
   * Estimate reading time based on content length
   */
  private estimateReadTime(content: string): number {
    if (!content) return 0;

    const wordsPerMinute = 200; // Average reading speed
    const wordCount = content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);

    return Math.max(1, readTime); // Minimum 1 minute
  }

  /**
   * Cache management
   */
  private getCachedContent(url: string): ExtractedContent | null {
    const cached = this.cache[url];

    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      delete this.cache[url];
      this.saveCacheToStorage();
      return null;
    }

    return cached.content;
  }

  private cacheContent(url: string, content: ExtractedContent): void {
    this.cache[url] = {
      content,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION
    };

    this.saveCacheToStorage();
  }

  private loadCacheFromStorage(): void {
    try {
      // Only access localStorage in browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        const cached = localStorage.getItem('rss-content-cache');
        if (cached) {
          this.cache = JSON.parse(cached);

          // Clean expired entries
          const now = Date.now();
          for (const [url, entry] of Object.entries(this.cache)) {
            if (now > entry.expiresAt) {
              delete this.cache[url];
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
      this.cache = {};
    }
  }

  private saveCacheToStorage(): void {
    try {
      // Only access localStorage in browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('rss-content-cache', JSON.stringify(this.cache));
      }
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  /**
   * Get content display strategy for a specific domain
   */
  getDisplayStrategy(url: string): ContentDisplayStrategy {
    const domain = this.extractDomain(url);

    // Known sites that block iframe embedding
    const blockedDomains = [
      'bloomberg.com',
      'cnbc.com',
      'reuters.com',
      'ft.com',
      'wsj.com',
      'nytimes.com',
      'washingtonpost.com',
      'economist.com'
    ];

    if (blockedDomains.some(blocked => domain.includes(blocked))) {
      return 'extract';
    }

    return 'progressive';
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return '';
    }
  }

  /**
   * Extract content using our server-side API (no CORS issues)
   */
  private async extractWithServerAPI(articleUrl: string): Promise<ExtractedContent | null> {
    try {
      const response = await fetch(`/api/monitor/article?url=${encodeURIComponent(articleUrl)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Server API failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.content) {
        return {
          title: data.title || '',
          content: data.content || '',
          textContent: data.textContent || '',
          excerpt: data.excerpt || '',
          byline: data.byline || '',
          siteName: data.siteName || '',
          publishedTime: data.publishedTime || ''
        };
      }
      return null;
    } catch (error) {
      console.warn('Server API extraction failed:', error);
      return null;
    }
  }

  /**
   * Extract content using Diffbot API
   */
  private async extractWithDiffbot(articleUrl: string): Promise<ExtractedContent | null> {
    if (!this.EXTERNAL_APIS.diffbot.enabled) return null;

    try {
      const response = await fetch(`${this.EXTERNAL_APIS.diffbot.url}?token=${this.EXTERNAL_APIS.diffbot.token}&url=${encodeURIComponent(articleUrl)}`, {
        timeout: 15000,
      });

      if (!response.ok) {
        throw new Error(`Diffbot API failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.objects && data.objects.length > 0) {
        const article = data.objects[0];
        return {
          title: article.title || '',
          content: article.html || article.text || '',
          textContent: article.text || '',
          excerpt: article.summary || '',
          byline: article.author || '',
          siteName: article.siteName || '',
          publishedTime: article.date || ''
        };
      }
      return null;
    } catch (error) {
      console.warn('Diffbot extraction failed:', error);
      return null;
    }
  }

  /**
   * Extract content using ScraperAPI
   */
  private async extractWithScraperAPI(articleUrl: string): Promise<ExtractedContent | null> {
    if (!this.EXTERNAL_APIS.scraperapi.enabled) return null;

    try {
      const response = await fetch(`${this.EXTERNAL_APIS.scraperapi.url}?api_key=${this.EXTERNAL_APIS.scraperapi.key}&url=${encodeURIComponent(articleUrl)}`, {
        timeout: 15000,
      });

      if (!response.ok) {
        throw new Error(`ScraperAPI failed: ${response.status}`);
      }

      const html = await response.text();
      // Use Readability to parse the clean HTML from ScraperAPI
      return this.parseWithReadability(html, articleUrl);
    } catch (error) {
      console.warn('ScraperAPI extraction failed:', error);
      return null;
    }
  }

  /**
   * Clear all cached content
   */
  clearCache(): void {
    this.cache = {};
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('rss-content-cache');
    }
  }
}

// Create singleton instance
export const articleContentService = new ArticleContentService();
export default ArticleContentService;