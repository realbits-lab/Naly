#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Get URL from command line arguments
const targetUrl = process.argv[2];

if (!targetUrl) {
  console.error('Usage: node extract-rss-urls.js <url>');
  process.exit(1);
}

// Validate URL
let parsedUrl;
try {
  parsedUrl = new URL(targetUrl);
} catch (error) {
  console.error('Error: Invalid URL provided');
  console.error(error.message);
  process.exit(1);
}

// Choose appropriate module based on protocol
const client = parsedUrl.protocol === 'https:' ? https : http;

const request = client.get(targetUrl, (response) => {
  let data = '';

  response.on('data', (chunk) => {
    data += chunk;
  });

  response.on('end', () => {
    // Extract RSS URLs from HTML
    const rssUrls = extractRSSUrls(data);

    // Output as JSON array
    console.log(JSON.stringify(rssUrls, null, 2));
  });
});

request.on('error', (error) => {
  console.error('Request failed:', error.message);
  process.exit(1);
});

request.setTimeout(10000, () => {
  console.error('Request timeout');
  request.destroy();
  process.exit(1);
});

function extractRSSUrls(html) {
  const rssUrls = [];

  // Pattern to match RSS feed URLs in href attributes
  const hrefPattern = /href\s*=\s*["']([^"']*\.xml[^"']*)["']/gi;
  // Pattern to match RSS feed URLs in direct text
  const urlPattern = /https?:\/\/[^\s<>"']+\.xml(?:\?[^\s<>"']*)?/gi;

  let match;

  // Extract from href attributes
  while ((match = hrefPattern.exec(html)) !== null) {
    const url = match[1];
    if (url.includes('rss') || url.includes('feed') || url.includes('xml')) {
      // Convert relative URLs to absolute
      const fullUrl = url.startsWith('http') ? url : `https://www.nasdaq.com${url}`;
      if (!rssUrls.includes(fullUrl)) {
        rssUrls.push(fullUrl);
      }
    }
  }

  // Extract direct URLs from text content
  while ((match = urlPattern.exec(html)) !== null) {
    const url = match[0];
    if (url.includes('nasdaq.com') && (url.includes('rss') || url.includes('feed'))) {
      if (!rssUrls.includes(url)) {
        rssUrls.push(url);
      }
    }
  }

  // Also look for specific patterns in the NASDAQ RSS page
  const nasdaqRssPattern = /https:\/\/[^"'\s]*nasdaq\.com[^"'\s]*(?:rss|feed)[^"'\s]*/gi;
  while ((match = nasdaqRssPattern.exec(html)) !== null) {
    const url = match[0];
    if (!rssUrls.includes(url)) {
      rssUrls.push(url);
    }
  }

  // Look for table rows containing RSS links (common pattern on feed listing pages)
  const tableRowPattern = /<tr[^>]*>.*?<\/tr>/gis;
  const linkPattern = /<a[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi;

  while ((match = tableRowPattern.exec(html)) !== null) {
    const rowHtml = match[0];
    let linkMatch;
    while ((linkMatch = linkPattern.exec(rowHtml)) !== null) {
      const url = linkMatch[1];
      if (url.includes('.xml') || url.includes('rss') || url.includes('feed')) {
        const fullUrl = url.startsWith('http') ? url : `https://www.nasdaq.com${url}`;
        if (!rssUrls.includes(fullUrl)) {
          rssUrls.push(fullUrl);
        }
      }
    }
  }

  return rssUrls.sort();
}