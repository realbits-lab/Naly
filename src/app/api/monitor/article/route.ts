import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import DOMPurify from "dompurify";
import { auth } from "@/lib/auth";
import { UserRole } from "@/types/user";

export async function GET(request: NextRequest) {
	try {
		// Check authentication and authorization
		const session = await auth();

		if (!session?.user) {
			return NextResponse.json(
				{ error: "Unauthorized: Please sign in" },
				{ status: 401 }
			);
		}

		if (session.user.role !== UserRole.MANAGER) {
			return NextResponse.json(
				{ error: "Forbidden: Only managers can access this endpoint" },
				{ status: 403 }
			);
		}
		const { searchParams } = new URL(request.url);
		const articleUrl = searchParams.get('url');

		if (!articleUrl) {
			return NextResponse.json(
				{ error: "Article URL is required" },
				{ status: 400 }
			);
		}

		// Validate URL format
		try {
			new URL(articleUrl);
		} catch {
			return NextResponse.json(
				{ error: "Invalid URL format" },
				{ status: 400 }
			);
		}

		console.log(`Fetching article content from: ${articleUrl}`);

		// Different headers for different websites
		const getHeadersForUrl = (url: string) => {
			const domain = new URL(url).hostname;

			// Base headers that work for most sites
			const baseHeaders = {
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.5',
				'Accept-Encoding': 'gzip, deflate',
				'DNT': '1',
				'Connection': 'keep-alive',
				'Upgrade-Insecure-Requests': '1',
				'Cache-Control': 'no-cache',
			};

			// Site-specific headers
			if (domain.includes('yahoo.com')) {
				return {
					...baseHeaders,
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
					'Referer': 'https://finance.yahoo.com/',
				};
			} else if (domain.includes('cnbc.com')) {
				return {
					...baseHeaders,
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
					'Referer': 'https://www.cnbc.com/',
				};
			} else if (domain.includes('reuters.com')) {
				return {
					...baseHeaders,
					'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
					'Referer': 'https://www.reuters.com/',
				};
			} else if (domain.includes('marketwatch.com')) {
				return {
					...baseHeaders,
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0',
					'Referer': 'https://www.marketwatch.com/',
				};
			} else {
				// Default for Bloomberg and others
				return {
					...baseHeaders,
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				};
			}
		};

		// Fetch the article HTML with retry logic
		let response;
		let lastError;

		// Try multiple times with different strategies
		const fetchStrategies = [
			// Strategy 1: Normal fetch with site-specific headers
			() => fetch(articleUrl, {
				headers: getHeadersForUrl(articleUrl),
				redirect: 'follow',
				signal: AbortSignal.timeout(30000)
			}),

			// Strategy 2: Add random delay and different user agent
			async () => {
				await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
				const headers = getHeadersForUrl(articleUrl);
				headers['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
				return fetch(articleUrl, {
					headers,
					redirect: 'follow',
					signal: AbortSignal.timeout(30000)
				});
			},

			// Strategy 3: Try with minimal headers
			() => fetch(articleUrl, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				},
				redirect: 'follow',
				signal: AbortSignal.timeout(30000)
			})
		];

		for (let i = 0; i < fetchStrategies.length; i++) {
			try {
				console.log(`Trying fetch strategy ${i + 1} for ${articleUrl}`);
				response = await fetchStrategies[i]();

				if (response.ok) {
					console.log(`Strategy ${i + 1} succeeded with status ${response.status}`);
					break;
				} else {
					console.log(`Strategy ${i + 1} failed with status ${response.status}`);
					lastError = new Error(`HTTP error! status: ${response.status}`);
				}
			} catch (error) {
				console.log(`Strategy ${i + 1} threw error:`, error);
				lastError = error;
				continue;
			}
		}

		if (!response || !response.ok) {
			throw lastError || new Error('All fetch strategies failed');
		}

		const html = await response.text();

		if (!html || html.trim().length === 0) {
			throw new Error('Empty response from article URL');
		}

		// Create a JSDOM instance
		const dom = new JSDOM(html, {
			url: articleUrl,
			resources: "usable",
			runScripts: "outside-only"
		});

		const document = dom.window.document;

		// Use Readability to extract the main content with fallback strategies
		let article = null;

		// Try different Readability configurations
		const configs = [
			{ keepClasses: true, disableJSONLD: false },
			{ keepClasses: false, disableJSONLD: true },
			{ keepClasses: false, disableJSONLD: false, charThreshold: 500 },
			{ keepClasses: true, disableJSONLD: true, charThreshold: 0 }
		];

		for (const config of configs) {
			try {
				const reader = new Readability(document, config);
				article = reader.parse();
				if (article && article.content && article.content.trim().length > 100) {
					console.log(`Successfully extracted content with config:`, config);
					break;
				}
			} catch (error) {
				console.log(`Failed with config ${JSON.stringify(config)}:`, error);
				continue;
			}
		}

		// If Readability fails completely, try fallback extraction
		if (!article || !article.content || article.content.trim().length < 100) {
			console.log('Readability failed, trying fallback extraction...');

			// Try to extract content using common article selectors
			const fallbackSelectors = [
				'article',
				'.article-content',
				'.entry-content',
				'.post-content',
				'[data-module="ArticleBody"]',
				'.story-body',
				'.article-text',
				'main',
				'.content'
			];

			let fallbackContent = '';
			let fallbackTitle = document.querySelector('h1')?.textContent ||
							   document.querySelector('title')?.textContent ||
							   'Untitled Article';

			for (const selector of fallbackSelectors) {
				const element = document.querySelector(selector);
				if (element) {
					// Get text content and basic formatting
					const textContent = element.textContent?.trim() || '';
					if (textContent.length > 200) {
						fallbackContent = `<div>${textContent}</div>`;
						console.log(`Found content using selector: ${selector}`);
						break;
					}
				}
			}

			if (fallbackContent) {
				article = {
					title: fallbackTitle,
					content: fallbackContent,
					textContent: fallbackContent.replace(/<[^>]*>/g, ''),
					length: fallbackContent.length,
					byline: null,
					publishedTime: null,
					siteName: new URL(articleUrl).hostname,
					lang: null,
					dir: null
				};
			}
		}

		if (!article || !article.content) {
			throw new Error('Failed to extract article content using all available methods');
		}

		// Sanitize the content using DOMPurify in Node.js environment
		const window = dom.window;
		const purify = DOMPurify(window);

		const cleanContent = purify.sanitize(article.content, {
			ALLOWED_TAGS: [
				'p', 'br', 'strong', 'em', 'u', 'i', 'b', 'mark', 'small', 'del', 'ins', 'sub', 'sup',
				'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
				'ul', 'ol', 'li',
				'blockquote', 'pre', 'code',
				'a', 'img',
				'table', 'thead', 'tbody', 'tr', 'th', 'td',
				'div', 'span', 'section', 'article'
			],
			ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],
			KEEP_CONTENT: true,
			ALLOW_DATA_ATTR: false
		});

		// Extract plain text for summary/description if needed
		const tempDoc = new JSDOM(cleanContent);
		const plainText = tempDoc.window.document.body.textContent || '';
		const excerpt = plainText.slice(0, 300) + (plainText.length > 300 ? '...' : '');

		const extractedArticle = {
			title: article.title || 'Untitled Article',
			content: cleanContent,
			textContent: plainText,
			excerpt: excerpt,
			byline: article.byline || null,
			length: article.length || 0,
			publishedTime: article.publishedTime || null,
			siteName: article.siteName || null,
			lang: article.lang || null,
			dir: article.dir || null,
			url: articleUrl,
			extractedAt: new Date().toISOString()
		};

		// Clean up DOM
		dom.window.close();

		return NextResponse.json(extractedArticle);

	} catch (error) {
		console.error("Error extracting article content:", error);

		// Return more specific error messages based on error type
		if (error instanceof TypeError && error.message.includes('fetch')) {
			return NextResponse.json(
				{ error: "Failed to fetch article: Network error or invalid URL" },
				{ status: 502 }
			);
		}

		if (error instanceof Error && error.name === 'AbortError') {
			return NextResponse.json(
				{ error: "Request timeout: Article took too long to fetch" },
				{ status: 408 }
			);
		}

		return NextResponse.json(
			{
				error: "Failed to extract article content",
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
}