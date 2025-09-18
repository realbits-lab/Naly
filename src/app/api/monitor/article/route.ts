import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import DOMPurify from "dompurify";

export async function GET(request: NextRequest) {
	try {
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

		// Fetch the article HTML
		const response = await fetch(articleUrl, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.5',
				'Accept-Encoding': 'gzip, deflate',
				'DNT': '1',
				'Connection': 'keep-alive',
				'Upgrade-Insecure-Requests': '1',
			},
			redirect: 'follow',
			// Add timeout to prevent hanging requests
			signal: AbortSignal.timeout(30000) // 30 seconds timeout
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
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

		// Use Readability to extract the main content
		const reader = new Readability(document, {
			// Keep images in the extracted content
			keepClasses: true,
			// Don't extract JSON-LD metadata to focus on article content
			disableJSONLD: false,
		});

		const article = reader.parse();

		if (!article) {
			throw new Error('Failed to extract article content using Readability');
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

		if (error.name === 'AbortError') {
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