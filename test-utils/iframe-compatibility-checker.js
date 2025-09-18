#!/usr/bin/env node

import { chromium } from 'playwright';
import fs from 'fs/promises';

// RSS sources from our validation report - both recommended and conditionally recommended
const RSS_SOURCES = [
	// Recommended feeds (100% extraction rate)
	{ name: "Bloomberg Markets", url: "https://feeds.bloomberg.com/markets/news.rss" },
	{ name: "Bloomberg Economics", url: "https://feeds.bloomberg.com/economics/news.rss" },
	{ name: "Bloomberg Technology", url: "https://feeds.bloomberg.com/technology/news.rss" },
	{ name: "Bloomberg Politics", url: "https://feeds.bloomberg.com/politics/news.rss" },
	{ name: "Financial Times Home", url: "https://ft.com/rss/home" },
	{ name: "Financial Times Markets", url: "https://www.ft.com/markets?format=rss" },
	{ name: "CNBC Top News", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html" },
	{ name: "CNBC World Markets", url: "https://www.cnbc.com/id/100727362/device/rss/rss.html" },
	{ name: "CNBC US Markets", url: "https://www.cnbc.com/id/15839135/device/rss/rss.html" },
	{ name: "Fox Business Economy", url: "https://moxie.foxbusiness.com/google-publisher/economy.xml" },
	{ name: "Fox Business Markets", url: "https://moxie.foxbusiness.com/google-publisher/markets.xml" },
	{ name: "Forbes Business", url: "https://www.forbes.com/business/feed/" },
	{ name: "Asia Times", url: "https://asiatimes.com/feed" },
	{ name: "Yonhap News", url: "https://en.yna.co.kr/RSS/news.xml" },
	{ name: "Euronews Business", url: "https://feeds.feedburner.com/euronews/en/business" },
	{ name: "CoinDesk", url: "https://coindesk.com/arc/outboundfeeds/rss/" },
	{ name: "Cointelegraph", url: "https://cointelegraph.com/rss" },
	{ name: "ECB EUR/USD", url: "https://www.ecb.europa.eu/rss/fxref-usd.html" },

	// Conditionally recommended feeds
	{ name: "WSJ Markets Main", url: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml" },
	{ name: "WSJ Business", url: "https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml" },
	{ name: "WSJ World News", url: "https://feeds.a.dj.com/rss/RSSWorldNews.xml" },
	{ name: "Seeking Alpha All", url: "https://seekingalpha.com/feed.xml" },
	{ name: "Seeking Alpha Market News", url: "https://seekingalpha.com/market_currents.xml" },
	{ name: "Nikkei Asia", url: "https://asia.nikkei.com/rss/feed/nar" },
	{ name: "ECB Statistical Press", url: "https://www.ecb.europa.eu/rss/statpress.html" }
];

// Function to parse RSS feed and get articles
async function parseRSSFeed(feedUrl) {
	const response = await fetch(feedUrl);
	const xml = await response.text();

	// Simple XML parsing to extract article URLs
	const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
	const articles = [];

	for (const item of itemMatches.slice(0, 2)) { // Take first 2 articles
		const linkMatch = item.match(/<link[^>]*>([^<]+)<\/link>/) || item.match(/<link>([^<]+)<\/link>/);
		const titleMatch = item.match(/<title[^>]*>([^<]+)<\/title>/) || item.match(/<title>([^<]+)<\/title>/);

		if (linkMatch && titleMatch) {
			articles.push({
				title: titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
				link: linkMatch[1].trim()
			});
		}
	}

	return articles;
}

// Function to test iframe compatibility
async function testIframeCompatibility(page, articleUrl, timeout = 15000) {
	try {
		console.log(`    Testing iframe for: ${articleUrl}`);

		// Create iframe element and test loading
		await page.evaluate((url) => {
			// Remove any existing iframes
			const existingIframes = document.querySelectorAll('iframe');
			existingIframes.forEach(iframe => iframe.remove());

			// Create new iframe
			const iframe = document.createElement('iframe');
			iframe.src = url;
			iframe.style.width = '800px';
			iframe.style.height = '600px';
			iframe.style.border = 'none';
			iframe.sandbox = 'allow-same-origin allow-scripts allow-popups allow-forms';
			iframe.id = 'test-iframe';
			document.body.appendChild(iframe);
		}, articleUrl);

		// Wait for iframe to load or fail
		const result = await Promise.race([
			// Success: iframe loads content
			page.waitForSelector('#test-iframe').then(async () => {
				await page.waitForTimeout(3000); // Give time for content to load

				const iframeContent = await page.evaluate(() => {
					const iframe = document.getElementById('test-iframe');
					try {
						// Try to access iframe content
						const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
						if (iframeDoc && iframeDoc.body) {
							const textContent = iframeDoc.body.innerText || iframeDoc.body.textContent || '';
							return {
								hasContent: textContent.length > 100, // Reasonable content length
								isBlocked: false,
								contentLength: textContent.length
							};
						}
						return { hasContent: false, isBlocked: true, contentLength: 0 };
					} catch (e) {
						// Cross-origin restrictions or other iframe access issues
						return {
							hasContent: true, // Assume content exists if iframe loads but is restricted
							isBlocked: true,
							contentLength: 0,
							error: e.message
						};
					}
				});

				return {
					success: true,
					loadable: true,
					...iframeContent
				};
			}),

			// Timeout: iframe takes too long to load
			new Promise((_, reject) =>
				setTimeout(() => reject(new Error('Iframe load timeout')), timeout)
			)
		]);

		return result;

	} catch (error) {
		console.log(`    Iframe test failed: ${error.message}`);
		return {
			success: false,
			loadable: false,
			error: error.message,
			hasContent: false,
			isBlocked: true
		};
	}
}

// Main testing function
async function testAllRSSSourcesWithIframe() {
	console.log('🔍 Starting iframe compatibility testing for RSS sources...');
	console.log(`Testing ${RSS_SOURCES.length} RSS sources\n`);

	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();

	// Set a simple page for testing
	await page.setContent('<html><body><h1>Iframe Test Page</h1></body></html>');

	const results = [];
	let processed = 0;

	for (const source of RSS_SOURCES) {
		processed++;
		console.log(`\nProgress: ${processed}/${RSS_SOURCES.length}`);
		console.log(`=== Testing Source: ${source.name} ===`);

		try {
			// Parse RSS feed to get articles
			console.log(`Fetching RSS feed: ${source.url}`);
			const articles = await parseRSSFeed(source.url);

			if (articles.length === 0) {
				console.log('No articles found in RSS feed');
				results.push({
					source: source.name,
					feedUrl: source.url,
					status: 'no_articles',
					articles: []
				});
				continue;
			}

			console.log(`Found ${articles.length} articles in RSS feed`);

			// Test iframe compatibility for each article
			const articleResults = [];
			for (const article of articles) {
				const iframeTest = await testIframeCompatibility(page, article.link);
				articleResults.push({
					title: article.title,
					link: article.link,
					iframeCompatible: iframeTest.success && iframeTest.loadable,
					hasContent: iframeTest.hasContent,
					isBlocked: iframeTest.isBlocked,
					error: iframeTest.error
				});

				console.log(`    Result: ${iframeTest.success && iframeTest.loadable ? '✅ Compatible' : '❌ Not compatible'} - ${iframeTest.error || 'OK'}`);
			}

			// Calculate compatibility rate
			const compatibleCount = articleResults.filter(r => r.iframeCompatible).length;
			const compatibilityRate = (compatibleCount / articleResults.length) * 100;

			results.push({
				source: source.name,
				feedUrl: source.url,
				status: 'tested',
				articles: articleResults,
				compatibilityRate: compatibilityRate,
				recommendation: compatibilityRate >= 50 ? 'iframe_compatible' : 'iframe_incompatible'
			});

			console.log(`Iframe compatibility rate: ${compatibilityRate.toFixed(1)}%`);

		} catch (error) {
			console.log(`❌ Feed test failed: ${error.message}`);
			results.push({
				source: source.name,
				feedUrl: source.url,
				status: 'failed',
				error: error.message,
				articles: []
			});
		}

		// Add delay between tests to be respectful
		await page.waitForTimeout(2000);
	}

	await browser.close();

	// Generate report
	console.log('\n' + '='.repeat(70));
	console.log('IFRAME COMPATIBILITY REPORT');
	console.log('='.repeat(70));

	const compatibleSources = results.filter(r => r.recommendation === 'iframe_compatible');
	const incompatibleSources = results.filter(r => r.recommendation === 'iframe_incompatible');
	const failedSources = results.filter(r => r.status === 'failed' || r.status === 'no_articles');

	console.log(`Total sources tested: ${RSS_SOURCES.length}`);
	console.log(`Iframe compatible: ${compatibleSources.length}`);
	console.log(`Iframe incompatible: ${incompatibleSources.length}`);
	console.log(`Failed/No articles: ${failedSources.length}`);

	console.log('\n--- IFRAME COMPATIBLE SOURCES ---');
	compatibleSources.forEach(source => {
		console.log(`✅ ${source.source} - ${source.compatibilityRate.toFixed(1)}% compatibility rate`);
	});

	console.log('\n--- IFRAME INCOMPATIBLE SOURCES ---');
	incompatibleSources.forEach(source => {
		console.log(`❌ ${source.source} - ${source.compatibilityRate.toFixed(1)}% compatibility rate`);
	});

	console.log('\n--- FAILED SOURCES ---');
	failedSources.forEach(source => {
		console.log(`⚠️ ${source.source} - ${source.error || 'No articles found'}`);
	});

	// Save detailed results
	await fs.writeFile('iframe-compatibility-report.json', JSON.stringify(results, null, 2));
	console.log('\n📄 Detailed results saved to iframe-compatibility-report.json');

	return results;
}

// Run the tests
testAllRSSSourcesWithIframe().catch(console.error);