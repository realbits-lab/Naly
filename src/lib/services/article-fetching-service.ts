import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export interface ArticleMetadata {
	title?: string;
	description?: string;
	author?: string;
	publisher?: string;
	publishedAt?: Date;
	featuredImage?: string;
	images?: string[];
	meta?: Record<string, any>;
}

export interface ArticleContent {
	title: string;
	content: string;
	textContent: string;
	wordCount: number;
	readingTimeMinutes: number;
	author?: string;
	publisher?: string;
	publishedAt?: Date;
	featuredImage?: string;
	images: string[];
	meta: Record<string, any>;
}

export class ArticleFetchingService {
	private static readonly TIMEOUT_MS = 10000;
	private static readonly USER_AGENT = 'Mozilla/5.0 (compatible; Naly Article Fetcher/1.0)';

	/**
	 * Fetch and parse an article from a URL
	 */
	public static async fetchArticle(url: string): Promise<ArticleContent> {
		try {
			console.log(`Fetching article: ${url}`);

			// Validate URL
			const parsedUrl = new URL(url);
			if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
				throw new Error('Invalid URL protocol. Only HTTP and HTTPS are supported.');
			}

			// Fetch the HTML content
			const htmlContent = await this.fetchHtml(url);

			// Parse and extract article content
			const articleContent = await this.parseArticleContent(url, htmlContent);

			console.log(`Successfully processed article: ${articleContent.title}`);
			return articleContent;

		} catch (error) {
			console.error(`Error fetching article ${url}:`, error);
			throw error;
		}
	}

	/**
	 * Fetch HTML content from URL
	 */
	private static async fetchHtml(url: string): Promise<string> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

		try {
			const response = await fetch(url, {
				headers: {
					'User-Agent': this.USER_AGENT,
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
					'Accept-Language': 'en-US,en;q=0.5',
					'Accept-Encoding': 'gzip, deflate',
					'DNT': '1',
					'Connection': 'keep-alive',
					'Upgrade-Insecure-Requests': '1',
				},
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const contentType = response.headers.get('content-type');
			if (!contentType || !contentType.includes('text/html')) {
				throw new Error(`Invalid content type: ${contentType}`);
			}

			return await response.text();

		} catch (error) {
			clearTimeout(timeoutId);
			if (error.name === 'AbortError') {
				throw new Error('Request timeout');
			}
			throw error;
		}
	}

	/**
	 * Parse HTML and extract article content using Mozilla Readability
	 */
	private static async parseArticleContent(url: string, html: string): Promise<ArticleContent> {
		// Create DOM
		const dom = new JSDOM(html, { url });
		const document = dom.window.document;

		// Extract metadata first
		const metadata = this.extractMetadata(document, url);

		// Use Readability to extract main content
		const reader = new Readability(document, {
			keepClasses: false,
			disableJSONLD: false,
		});

		const article = reader.parse();

		if (!article) {
			throw new Error('Could not extract article content');
		}

		// Clean and process content
		const textContent = this.extractTextContent(article.content);
		const wordCount = this.countWords(textContent);
		const readingTimeMinutes = this.calculateReadingTime(wordCount);

		// Extract images from content
		const images = this.extractImages(article.content, url);

		return {
			title: article.title || metadata.title || 'Untitled Article',
			content: article.content,
			textContent,
			wordCount,
			readingTimeMinutes,
			author: metadata.author,
			publisher: metadata.publisher,
			publishedAt: metadata.publishedAt,
			featuredImage: metadata.featuredImage,
			images,
			meta: {
				...metadata.meta,
				byline: article.byline,
				excerpt: article.excerpt,
				siteName: article.siteName,
				lang: article.lang,
				readabilityLength: article.length,
			}
		};
	}

	/**
	 * Extract metadata from HTML document
	 */
	private static extractMetadata(document: Document, url: string): ArticleMetadata {
		const getMetaContent = (selector: string): string | null => {
			const element = document.querySelector(selector);
			return element?.getAttribute('content') || null;
		};

		const getText = (selector: string): string | null => {
			const element = document.querySelector(selector);
			return element?.textContent?.trim() || null;
		};

		// Extract title
		const title =
			getMetaContent('meta[property="og:title"]') ||
			getMetaContent('meta[name="twitter:title"]') ||
			getText('title') ||
			getText('h1');

		// Extract description
		const description =
			getMetaContent('meta[property="og:description"]') ||
			getMetaContent('meta[name="twitter:description"]') ||
			getMetaContent('meta[name="description"]');

		// Extract author
		const author =
			getMetaContent('meta[name="author"]') ||
			getMetaContent('meta[property="article:author"]') ||
			getText('[rel="author"]') ||
			getText('.author') ||
			getText('.byline');

		// Extract publisher
		const publisher =
			getMetaContent('meta[property="og:site_name"]') ||
			getMetaContent('meta[name="twitter:site"]') ||
			getText('.publisher') ||
			this.extractPublisherFromUrl(url);

		// Extract published date
		const publishedAt = this.extractPublishedDate(document);

		// Extract featured image
		const featuredImage =
			getMetaContent('meta[property="og:image"]') ||
			getMetaContent('meta[name="twitter:image"]') ||
			document.querySelector('img')?.src;

		// Extract additional images
		const images = this.extractImagesFromMeta(document);

		// Extract additional metadata
		const meta = {
			url,
			canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
			keywords: getMetaContent('meta[name="keywords"]'),
			robots: getMetaContent('meta[name="robots"]'),
			viewport: getMetaContent('meta[name="viewport"]'),
			themeColor: getMetaContent('meta[name="theme-color"]'),
			appleTouchIcon: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'),
		};

		return {
			title,
			description,
			author,
			publisher,
			publishedAt,
			featuredImage,
			images,
			meta,
		};
	}

	/**
	 * Extract published date from various possible locations
	 */
	private static extractPublishedDate(document: Document): Date | undefined {
		const selectors = [
			'meta[property="article:published_time"]',
			'meta[name="pubdate"]',
			'meta[name="publishdate"]',
			'time[datetime]',
			'time[pubdate]',
			'.published',
			'.pubdate',
			'.date',
		];

		for (const selector of selectors) {
			const element = document.querySelector(selector);
			if (element) {
				const dateStr = element.getAttribute('content') ||
							   element.getAttribute('datetime') ||
							   element.textContent;

				if (dateStr) {
					const date = new Date(dateStr);
					if (!isNaN(date.getTime())) {
						return date;
					}
				}
			}
		}

		return undefined;
	}

	/**
	 * Extract images from meta tags
	 */
	private static extractImagesFromMeta(document: Document): string[] {
		const images: string[] = [];

		// Open Graph images
		document.querySelectorAll('meta[property="og:image"]').forEach(meta => {
			const src = meta.getAttribute('content');
			if (src && !images.includes(src)) {
				images.push(src);
			}
		});

		// Twitter images
		document.querySelectorAll('meta[name="twitter:image"]').forEach(meta => {
			const src = meta.getAttribute('content');
			if (src && !images.includes(src)) {
				images.push(src);
			}
		});

		return images;
	}

	/**
	 * Extract images from article content
	 */
	private static extractImages(htmlContent: string, baseUrl: string): string[] {
		const dom = new JSDOM(htmlContent);
		const images: string[] = [];

		dom.window.document.querySelectorAll('img').forEach(img => {
			let src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');

			if (src) {
				// Convert relative URLs to absolute
				if (src.startsWith('/')) {
					const base = new URL(baseUrl);
					src = `${base.protocol}//${base.host}${src}`;
				} else if (!src.startsWith('http')) {
					src = new URL(src, baseUrl).href;
				}

				if (!images.includes(src)) {
					images.push(src);
				}
			}
		});

		return images;
	}

	/**
	 * Extract plain text from HTML content
	 */
	private static extractTextContent(htmlContent: string): string {
		const dom = new JSDOM(htmlContent);
		return dom.window.document.body.textContent?.trim() || '';
	}

	/**
	 * Count words in text
	 */
	private static countWords(text: string): number {
		return text.split(/\s+/).filter(word => word.length > 0).length;
	}

	/**
	 * Calculate reading time in minutes (assuming 200 words per minute)
	 */
	private static calculateReadingTime(wordCount: number): number {
		return Math.ceil(wordCount / 200);
	}

	/**
	 * Extract publisher name from URL
	 */
	private static extractPublisherFromUrl(url: string): string | undefined {
		try {
			const hostname = new URL(url).hostname;
			return hostname.replace(/^www\./, '').split('.')[0];
		} catch {
			return undefined;
		}
	}
}

export default ArticleFetchingService;