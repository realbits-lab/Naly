#!/usr/bin/env node

import fetch from 'node-fetch';
import { promises as fs } from 'fs';

// Configuration
const TEST_CONFIG = {
  timeout: 30000,
  maxArticlesPerFeed: 2,
  outputFile: 'rss-validation-report.json',
  logFile: 'rss-validation.log',
  apiBaseUrl: 'http://localhost:4000'
};

// Comprehensive RSS sources from our documentation
const RSS_SOURCES_TO_TEST = [
  // Bloomberg sources (known to work)
  { name: 'Bloomberg Markets', url: 'https://feeds.bloomberg.com/markets/news.rss', category: 'markets' },
  { name: 'Bloomberg Economics', url: 'https://feeds.bloomberg.com/economics/news.rss', category: 'economics' },
  { name: 'Bloomberg Technology', url: 'https://feeds.bloomberg.com/technology/news.rss', category: 'technology' },
  { name: 'Bloomberg Politics', url: 'https://feeds.bloomberg.com/politics/news.rss', category: 'politics' },

  // Reuters sources
  { name: 'Reuters Business', url: 'http://feeds.reuters.com/reuters/businessNews', category: 'business' },
  { name: 'Reuters Top News', url: 'http://feeds.reuters.com/reuters/topNews', category: 'general' },
  { name: 'Reuters Hot Stocks', url: 'http://feeds.reuters.com/reuters/hotStocksNews', category: 'stocks' },

  // Financial Times
  { name: 'Financial Times Home', url: 'https://ft.com/rss/home', category: 'general' },
  { name: 'Financial Times Markets', url: 'https://www.ft.com/markets?format=rss', category: 'markets' },

  // Wall Street Journal
  { name: 'WSJ Markets Main', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', category: 'markets' },
  { name: 'WSJ Business', url: 'https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml', category: 'business' },
  { name: 'WSJ World News', url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', category: 'world' },

  // CNBC sources (known to work)
  { name: 'CNBC Top News', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', category: 'business' },
  { name: 'CNBC World Markets', url: 'https://www.cnbc.com/id/100727362/device/rss/rss.html', category: 'markets' },
  { name: 'CNBC US Markets', url: 'https://www.cnbc.com/id/15839135/device/rss/rss.html', category: 'markets' },

  // Fox Business
  { name: 'Fox Business Economy', url: 'https://moxie.foxbusiness.com/google-publisher/economy.xml', category: 'economics' },
  { name: 'Fox Business Markets', url: 'https://moxie.foxbusiness.com/google-publisher/markets.xml', category: 'markets' },

  // MarketWatch sources (known to work)
  { name: 'MarketWatch Top Stories', url: 'http://feeds.marketwatch.com/marketwatch/topstories/', category: 'finance' },
  { name: 'MarketWatch Headlines', url: 'http://feeds.marketwatch.com/marketwatch/realtimeheadlines/', category: 'finance' },

  // Investment sources
  { name: 'Seeking Alpha All', url: 'https://seekingalpha.com/feed.xml', category: 'investment' },
  { name: 'Seeking Alpha Market News', url: 'https://seekingalpha.com/market_currents.xml', category: 'investment' },
  { name: 'Forbes Business', url: 'https://www.forbes.com/business/feed/', category: 'business' },
  { name: 'Motley Fool', url: 'https://fool.com/a/feeds/partner/google', category: 'investment' },

  // Yahoo Finance
  { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex', category: 'finance' },

  // Investing.com
  { name: 'Investing.com Economic Indicators', url: 'https://www.investing.com/rss/news_95.rss', category: 'economics' },
  { name: 'Investing.com SEC Filings', url: 'https://www.investing.com/rss/news_1064.rss', category: 'filings' },

  // CNN sources
  { name: 'CNN Business', url: 'http://rss.cnn.com/rss/edition_business.rss', category: 'business' },
  { name: 'CNN Money', url: 'http://rss.cnn.com/rss/money_news_international.rss', category: 'money' },

  // Asian sources
  { name: 'Nikkei Asia', url: 'https://asia.nikkei.com/rss/feed/nar', category: 'asia' },
  { name: 'Asia Times', url: 'https://asiatimes.com/feed', category: 'asia' },
  { name: 'Korea Economic Daily', url: 'https://kedglobal.com/newsRss', category: 'korea' },
  { name: 'Yonhap News', url: 'https://en.yna.co.kr/RSS/news.xml', category: 'korea' },
  { name: 'BusinessKorea', url: 'https://businesskorea.co.kr/rss/allEnglishArticles', category: 'korea' },

  // European sources
  { name: 'Euronews Business', url: 'https://feeds.feedburner.com/euronews/en/business', category: 'europe' },

  // Crypto sources
  { name: 'CoinDesk', url: 'https://coindesk.com/arc/outboundfeeds/rss/', category: 'crypto' },
  { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss', category: 'crypto' },

  // Federal Reserve
  { name: 'Federal Reserve', url: 'https://www.federalreserve.gov/feeds/press_all.xml', category: 'monetary' },

  // ECB
  { name: 'ECB Statistical Press', url: 'https://www.ecb.europa.eu/rss/statpress.html', category: 'monetary' },
  { name: 'ECB EUR/USD', url: 'https://www.ecb.europa.eu/rss/fxref-usd.html', category: 'forex' }
];

class RSSValidationChecker {
  constructor() {
    this.results = {
      testTimestamp: new Date().toISOString(),
      totalFeeds: RSS_SOURCES_TO_TEST.length,
      validFeeds: 0,
      invalidFeeds: 0,
      extractableFeeds: 0,
      nonExtractableFeeds: 0,
      feedResults: [],
      recommendations: {
        recommended: [],
        conditionallyRecommended: [],
        notRecommended: []
      }
    };
    this.logEntries = [];
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    this.logEntries.push(logEntry);
    console.log(logEntry);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchRSSFeed(feedUrl) {
    try {
      this.log(`Fetching RSS feed: ${feedUrl}`);
      const response = await fetch(feedUrl, {
        timeout: TEST_CONFIG.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        }
      });

      if (!response.ok) {
        throw new Error(`RSS fetch failed: ${response.status} ${response.statusText}`);
      }

      const rssContent = await response.text();
      return this.parseRSSContent(rssContent);
    } catch (error) {
      throw new Error(`RSS fetch error: ${error.message}`);
    }
  }

  parseRSSContent(rssContent) {
    const articles = [];

    // Enhanced RSS parsing to extract articles with more information
    const itemMatches = rssContent.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];

    for (const itemMatch of itemMatches.slice(0, TEST_CONFIG.maxArticlesPerFeed)) {
      const article = {};

      // Extract title
      const titleMatch = itemMatch.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch) {
        article.title = titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
      }

      // Extract link
      const linkMatch = itemMatch.match(/<link[^>]*>([\s\S]*?)<\/link>/i) ||
                       itemMatch.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
      if (linkMatch) {
        article.url = linkMatch[1].trim();
      }

      // Extract description/summary
      const descMatch = itemMatch.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
      if (descMatch) {
        article.description = descMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '').trim();
      }

      // Extract content if available
      const contentMatch = itemMatch.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i);
      if (contentMatch) {
        article.content = contentMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
      }

      // Extract publication date
      const pubDateMatch = itemMatch.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
      if (pubDateMatch) {
        article.publishedAt = pubDateMatch[1].trim();
      }

      if (article.title && article.url) {
        articles.push(article);
      }
    }

    return articles;
  }

  async testArticleExtraction(articleUrl) {
    try {
      this.log(`Testing article extraction: ${articleUrl}`);
      const apiUrl = `${TEST_CONFIG.apiBaseUrl}/api/monitor/article?url=${encodeURIComponent(articleUrl)}`;

      const response = await fetch(apiUrl, {
        timeout: TEST_CONFIG.timeout,
        headers: {
          'Accept': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || `HTTP ${response.status}`,
          details: result.details || null
        };
      }

      const hasContent = result.content && result.content.trim().length > 100;
      const hasTitle = result.title && result.title !== 'Untitled Article';

      return {
        success: hasContent && hasTitle,
        contentLength: result.content ? result.content.length : 0,
        hasTitle,
        hasContent,
        extractedTitle: result.title,
        error: !hasContent ? 'Insufficient content extracted' : null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: null
      };
    }
  }

  async testSingleFeed(feed) {
    this.log(`\n=== Testing Feed: ${feed.name} ===`);
    const feedResult = {
      name: feed.name,
      url: feed.url,
      category: feed.category,
      rssAccessible: false,
      hasContent: false,
      hasValidArticles: false,
      articlesFound: 0,
      articlesWithContent: 0,
      articlesWithDescription: 0,
      extractionTestResults: [],
      extractionSuccessRate: 0,
      recommendation: 'not_recommended',
      errors: []
    };

    try {
      // Test RSS feed accessibility and content
      const articles = await this.fetchRSSFeed(feed.url);
      feedResult.rssAccessible = true;
      feedResult.articlesFound = articles.length;

      this.log(`Found ${articles.length} articles in RSS feed`);

      if (articles.length === 0) {
        feedResult.errors.push('No articles found in RSS feed');
        return feedResult;
      }

      // Analyze content availability in RSS
      let articlesWithDescription = 0;
      let articlesWithContent = 0;

      for (const article of articles) {
        if (article.description && article.description.length > 50) {
          articlesWithDescription++;
        }
        if (article.content && article.content.length > 100) {
          articlesWithContent++;
        }
      }

      feedResult.articlesWithDescription = articlesWithDescription;
      feedResult.articlesWithContent = articlesWithContent;
      feedResult.hasContent = articlesWithDescription > 0 || articlesWithContent > 0;
      feedResult.hasValidArticles = articles.length > 0;

      // Test article extraction for a sample
      let successfulExtractions = 0;
      for (const article of articles.slice(0, 2)) {
        if (article.url && article.url.startsWith('http')) {
          this.log(`Testing extraction for: ${article.title?.substring(0, 50)}...`);
          const extractionResult = await this.testArticleExtraction(article.url);

          feedResult.extractionTestResults.push({
            title: article.title,
            url: article.url,
            ...extractionResult
          });

          if (extractionResult.success) {
            successfulExtractions++;
          }

          // Add delay between requests
          await this.delay(1000);
        }
      }

      if (feedResult.extractionTestResults.length > 0) {
        feedResult.extractionSuccessRate = successfulExtractions / feedResult.extractionTestResults.length;
      }

      // Determine recommendation
      if (feedResult.hasContent && feedResult.extractionSuccessRate >= 0.5) {
        feedResult.recommendation = 'recommended';
      } else if (feedResult.hasContent || feedResult.extractionSuccessRate > 0) {
        feedResult.recommendation = 'conditionally_recommended';
      } else {
        feedResult.recommendation = 'not_recommended';
      }

      this.log(`Feed test completed. Has content: ${feedResult.hasContent}, Extraction rate: ${(feedResult.extractionSuccessRate * 100).toFixed(1)}%`);

    } catch (error) {
      feedResult.errors.push(error.message);
      this.log(`Feed test failed: ${error.message}`, 'ERROR');
    }

    return feedResult;
  }

  async runAllTests() {
    this.log('Starting RSS validation testing...');
    this.log(`Testing ${RSS_SOURCES_TO_TEST.length} RSS feeds`);

    for (let i = 0; i < RSS_SOURCES_TO_TEST.length; i++) {
      const feed = RSS_SOURCES_TO_TEST[i];
      this.log(`\nProgress: ${i + 1}/${RSS_SOURCES_TO_TEST.length}`);

      try {
        const feedResult = await this.testSingleFeed(feed);
        this.results.feedResults.push(feedResult);

        // Update counters
        if (feedResult.rssAccessible) {
          this.results.validFeeds++;
        } else {
          this.results.invalidFeeds++;
        }

        if (feedResult.extractionSuccessRate > 0) {
          this.results.extractableFeeds++;
        } else {
          this.results.nonExtractableFeeds++;
        }

        // Categorize recommendations
        if (feedResult.recommendation === 'recommended') {
          this.results.recommendations.recommended.push(feedResult);
        } else if (feedResult.recommendation === 'conditionally_recommended') {
          this.results.recommendations.conditionallyRecommended.push(feedResult);
        } else {
          this.results.recommendations.notRecommended.push(feedResult);
        }

      } catch (error) {
        this.log(`Critical error testing feed ${feed.name}: ${error.message}`, 'ERROR');
        this.results.invalidFeeds++;
      }

      // Add delay between feeds
      await this.delay(2000);
    }

    await this.saveResults();
    this.printSummary();
  }

  async saveResults() {
    try {
      await fs.writeFile(
        TEST_CONFIG.outputFile,
        JSON.stringify(this.results, null, 2),
        'utf8'
      );

      await fs.writeFile(
        TEST_CONFIG.logFile,
        this.logEntries.join('\n'),
        'utf8'
      );

      this.log(`Results saved to ${TEST_CONFIG.outputFile}`);
    } catch (error) {
      this.log(`Failed to save results: ${error.message}`, 'ERROR');
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(70));
    console.log('RSS VALIDATION REPORT');
    console.log('='.repeat(70));
    console.log(`Total feeds tested: ${this.results.totalFeeds}`);
    console.log(`RSS accessible: ${this.results.validFeeds}`);
    console.log(`RSS inaccessible: ${this.results.invalidFeeds}`);
    console.log(`Article extraction possible: ${this.results.extractableFeeds}`);
    console.log(`Article extraction not possible: ${this.results.nonExtractableFeeds}`);

    console.log('\n--- RECOMMENDED FEEDS (Content + Extraction) ---');
    this.results.recommendations.recommended.forEach(feed => {
      console.log(`✅ ${feed.name} - ${feed.articlesFound} articles, ${(feed.extractionSuccessRate * 100).toFixed(1)}% extraction rate`);
    });

    console.log('\n--- CONDITIONALLY RECOMMENDED FEEDS (Content OR Partial Extraction) ---');
    this.results.recommendations.conditionallyRecommended.forEach(feed => {
      console.log(`🟡 ${feed.name} - ${feed.articlesFound} articles, ${(feed.extractionSuccessRate * 100).toFixed(1)}% extraction rate`);
    });

    console.log('\n--- NOT RECOMMENDED FEEDS ---');
    this.results.recommendations.notRecommended.forEach(feed => {
      const mainError = feed.errors[0] || 'No content or extraction capability';
      console.log(`❌ ${feed.name} - ${mainError}`);
    });

    console.log('\n' + '='.repeat(70));
  }
}

// Main execution
async function main() {
  const checker = new RSSValidationChecker();

  try {
    await checker.runAllTests();
  } catch (error) {
    console.error('Critical error during testing:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { RSSValidationChecker, RSS_SOURCES_TO_TEST, TEST_CONFIG };