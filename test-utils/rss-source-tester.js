#!/usr/bin/env node

import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import path from 'path';

// Configuration
const TEST_CONFIG = {
  timeout: 30000,
  maxArticlesPerFeed: 3,
  outputFile: 'rss-compatibility-report.json',
  logFile: 'rss-test.log',
  apiBaseUrl: 'http://localhost:4000'
};

// Comprehensive list of financial RSS feeds discovered from web search
const RSS_FEEDS = [
  // Bloomberg
  { name: 'Bloomberg Markets', url: 'https://feeds.bloomberg.com/markets/news.rss', category: 'markets' },
  { name: 'Bloomberg Wealth', url: 'https://feeds.bloomberg.com/wealth/news.rss', category: 'wealth' },
  { name: 'Bloomberg Technology', url: 'https://feeds.bloomberg.com/technology/news.rss', category: 'technology' },
  { name: 'Bloomberg Politics', url: 'https://feeds.bloomberg.com/politics/news.rss', category: 'politics' },

  // Yahoo Finance
  { name: 'Yahoo Finance Top Stories', url: 'https://finance.yahoo.com/news/rssindex', category: 'general' },
  { name: 'Yahoo Finance Headlines', url: 'https://feeds.finance.yahoo.com/rss/2.0/headline', category: 'headlines' },
  { name: 'Yahoo Finance Business', url: 'https://feeds.finance.yahoo.com/rss/2.0/category-business', category: 'business' },

  // Reuters
  { name: 'Reuters Business News', url: 'http://feeds.reuters.com/reuters/businessNews', category: 'business' },
  { name: 'Reuters Top News', url: 'http://feeds.reuters.com/reuters/topNews', category: 'general' },
  { name: 'Reuters World News', url: 'http://feeds.reuters.com/Reuters/worldNews', category: 'world' },
  { name: 'Reuters Money', url: 'http://feeds.reuters.com/news/wealth', category: 'money' },

  // CNN Business
  { name: 'CNN Business', url: 'http://rss.cnn.com/rss/edition_business.rss', category: 'business' },
  { name: 'CNN Money', url: 'http://rss.cnn.com/rss/money_news_international.rss', category: 'money' },

  // MarketWatch
  { name: 'MarketWatch Top Stories', url: 'http://feeds.marketwatch.com/marketwatch/topstories/', category: 'general' },
  { name: 'MarketWatch Real Time Headlines', url: 'http://feeds.marketwatch.com/marketwatch/realtimeheadlines/', category: 'headlines' },

  // CNBC
  { name: 'CNBC Top News', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', category: 'general' },
  { name: 'CNBC World Markets', url: 'https://www.cnbc.com/id/100727362/device/rss/rss.html', category: 'markets' },
  { name: 'CNBC US Markets', url: 'https://www.cnbc.com/id/15839135/device/rss/rss.html', category: 'markets' },

  // Financial Times
  { name: 'Financial Times Companies', url: 'https://www.ft.com/companies?format=rss', category: 'companies' },
  { name: 'Financial Times Markets', url: 'https://www.ft.com/markets?format=rss', category: 'markets' },

  // Wall Street Journal
  { name: 'WSJ Markets Main', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', category: 'markets' },
  { name: 'WSJ World News', url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', category: 'world' },

  // Seeking Alpha
  { name: 'Seeking Alpha Market News', url: 'https://seekingalpha.com/market_currents.xml', category: 'markets' },
  { name: 'Seeking Alpha All Articles', url: 'https://seekingalpha.com/feed.xml', category: 'analysis' },

  // Forbes
  { name: 'Forbes Business', url: 'https://www.forbes.com/business/feed/', category: 'business' },
  { name: 'Forbes Money', url: 'https://www.forbes.com/money/feed/', category: 'money' },

  // Additional Economic Sources
  { name: 'Federal Reserve News', url: 'https://www.federalreserve.gov/feeds/press_all.xml', category: 'economic-policy' },
  { name: 'IMF News', url: 'https://www.imf.org/external/rss/news.xml', category: 'global-economy' },
  { name: 'World Bank News', url: 'https://www.worldbank.org/en/news/all.rss', category: 'development' },

  // Crypto & Tech Finance
  { name: 'CoinDesk', url: 'https://feeds.feedburner.com/CoinDesk', category: 'crypto' },
  { name: 'CoinTelegraph', url: 'https://cointelegraph.com/rss', category: 'crypto' },

  // Alternative Financial Sources
  { name: 'Zacks Investment News', url: 'https://www.zacks.com/rss/rss_news.php', category: 'investment' },
  { name: 'Motley Fool', url: 'https://www.fool.com/a/feeds/foolwatch', category: 'investment' },
  { name: 'Investopedia', url: 'https://www.investopedia.com/feedbuilder/feed/getfeed/?feedName=rss_headlines', category: 'education' }
];

class RSSSourceTester {
  constructor() {
    this.results = {
      testTimestamp: new Date().toISOString(),
      totalFeeds: RSS_FEEDS.length,
      successfulFeeds: 0,
      failedFeeds: 0,
      feedResults: [],
      summary: {
        byCategory: {},
        commonErrors: {},
        recommendations: []
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
    // Simple RSS parsing to extract article URLs
    const articles = [];
    const linkRegex = /<link[^>]*>(.*?)<\/link>/gi;
    const titleRegex = /<title[^>]*>(.*?)<\/title>/gi;
    const guidRegex = /<guid[^>]*>(.*?)<\/guid>/gi;

    let linkMatch, titleMatch;
    const links = [];
    const titles = [];

    while ((linkMatch = linkRegex.exec(rssContent)) !== null) {
      const link = linkMatch[1].trim();
      if (link && link.startsWith('http') && !link.includes('feeds.') && !link.includes('rss')) {
        links.push(link);
      }
    }

    while ((titleMatch = titleRegex.exec(rssContent)) !== null) {
      const title = titleMatch[1].trim().replace(/<!\[CDATA\[|\]\]>/g, '');
      if (title && !title.toLowerCase().includes('rss') && !title.toLowerCase().includes('feed')) {
        titles.push(title);
      }
    }

    // Combine links and titles
    const maxArticles = Math.min(TEST_CONFIG.maxArticlesPerFeed, links.length, titles.length);
    for (let i = 0; i < maxArticles; i++) {
      if (links[i] && titles[i]) {
        articles.push({
          title: titles[i],
          url: links[i]
        });
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

      // Check if we got meaningful content
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
      articlesFound: 0,
      articleExtractionResults: [],
      overallSuccess: false,
      errors: []
    };

    try {
      // Test RSS feed accessibility
      const articles = await this.fetchRSSFeed(feed.url);
      feedResult.rssAccessible = true;
      feedResult.articlesFound = articles.length;

      this.log(`Found ${articles.length} articles in RSS feed`);

      if (articles.length === 0) {
        feedResult.errors.push('No articles found in RSS feed');
        return feedResult;
      }

      // Test article extraction for each article
      for (const article of articles) {
        this.log(`Testing article: ${article.title.substring(0, 50)}...`);
        const extractionResult = await this.testArticleExtraction(article.url);

        feedResult.articleExtractionResults.push({
          title: article.title,
          url: article.url,
          ...extractionResult
        });

        // Add delay between requests to be respectful
        await this.delay(1000);
      }

      // Determine overall success
      const successfulExtractions = feedResult.articleExtractionResults.filter(r => r.success).length;
      const successRate = successfulExtractions / feedResult.articleExtractionResults.length;

      feedResult.overallSuccess = successRate >= 0.5; // At least 50% success rate
      feedResult.successRate = successRate;

      this.log(`Feed test completed. Success rate: ${(successRate * 100).toFixed(1)}%`);

    } catch (error) {
      feedResult.errors.push(error.message);
      this.log(`Feed test failed: ${error.message}`, 'ERROR');
    }

    return feedResult;
  }

  async runAllTests() {
    this.log('Starting comprehensive RSS source testing...');
    this.log(`Testing ${RSS_FEEDS.length} RSS feeds`);

    for (let i = 0; i < RSS_FEEDS.length; i++) {
      const feed = RSS_FEEDS[i];
      this.log(`\nProgress: ${i + 1}/${RSS_FEEDS.length}`);

      try {
        const feedResult = await this.testSingleFeed(feed);
        this.results.feedResults.push(feedResult);

        if (feedResult.overallSuccess) {
          this.results.successfulFeeds++;
        } else {
          this.results.failedFeeds++;
        }

        // Update category statistics
        if (!this.results.summary.byCategory[feed.category]) {
          this.results.summary.byCategory[feed.category] = {
            total: 0,
            successful: 0,
            failed: 0
          };
        }
        this.results.summary.byCategory[feed.category].total++;
        if (feedResult.overallSuccess) {
          this.results.summary.byCategory[feed.category].successful++;
        } else {
          this.results.summary.byCategory[feed.category].failed++;
        }

        // Track common errors
        feedResult.errors.forEach(error => {
          if (!this.results.summary.commonErrors[error]) {
            this.results.summary.commonErrors[error] = 0;
          }
          this.results.summary.commonErrors[error]++;
        });

      } catch (error) {
        this.log(`Critical error testing feed ${feed.name}: ${error.message}`, 'ERROR');
        this.results.failedFeeds++;
      }

      // Add delay between feeds
      await this.delay(2000);
    }

    this.generateRecommendations();
    await this.saveResults();
    this.printSummary();
  }

  generateRecommendations() {
    const recommendations = [];

    // Analyze success patterns
    const successfulFeeds = this.results.feedResults.filter(f => f.overallSuccess);
    const failedFeeds = this.results.feedResults.filter(f => !f.overallSuccess);

    if (successfulFeeds.length > 0) {
      recommendations.push(`${successfulFeeds.length} feeds work well and should be prioritized for the monitor system.`);
    }

    if (failedFeeds.length > 0) {
      recommendations.push(`${failedFeeds.length} feeds have extraction issues and may require alternative approaches.`);
    }

    // Category analysis
    Object.entries(this.results.summary.byCategory).forEach(([category, stats]) => {
      const successRate = (stats.successful / stats.total * 100).toFixed(1);
      if (stats.successful > 0) {
        recommendations.push(`${category} category has ${successRate}% success rate (${stats.successful}/${stats.total} feeds working).`);
      }
    });

    // Common error analysis
    const topErrors = Object.entries(this.results.summary.commonErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (topErrors.length > 0) {
      recommendations.push('Most common issues:');
      topErrors.forEach(([error, count]) => {
        recommendations.push(`  - ${error} (${count} feeds affected)`);
      });
    }

    this.results.summary.recommendations = recommendations;
  }

  async saveResults() {
    try {
      // Save detailed JSON report
      await fs.writeFile(
        TEST_CONFIG.outputFile,
        JSON.stringify(this.results, null, 2),
        'utf8'
      );

      // Save log file
      await fs.writeFile(
        TEST_CONFIG.logFile,
        this.logEntries.join('\n'),
        'utf8'
      );

      this.log(`Results saved to ${TEST_CONFIG.outputFile}`);
      this.log(`Logs saved to ${TEST_CONFIG.logFile}`);
    } catch (error) {
      this.log(`Failed to save results: ${error.message}`, 'ERROR');
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('RSS SOURCE COMPATIBILITY REPORT');
    console.log('='.repeat(60));
    console.log(`Test completed: ${this.results.testTimestamp}`);
    console.log(`Total feeds tested: ${this.results.totalFeeds}`);
    console.log(`Successful feeds: ${this.results.successfulFeeds}`);
    console.log(`Failed feeds: ${this.results.failedFeeds}`);
    console.log(`Overall success rate: ${(this.results.successfulFeeds / this.results.totalFeeds * 100).toFixed(1)}%`);

    console.log('\n--- SUCCESSFUL FEEDS ---');
    this.results.feedResults
      .filter(f => f.overallSuccess)
      .forEach(feed => {
        console.log(`✅ ${feed.name} (${feed.category}) - ${(feed.successRate * 100).toFixed(1)}% success rate`);
      });

    console.log('\n--- FAILED FEEDS ---');
    this.results.feedResults
      .filter(f => !f.overallSuccess)
      .forEach(feed => {
        const mainError = feed.errors[0] || 'Unknown error';
        console.log(`❌ ${feed.name} (${feed.category}) - ${mainError}`);
      });

    console.log('\n--- CATEGORY BREAKDOWN ---');
    Object.entries(this.results.summary.byCategory).forEach(([category, stats]) => {
      const successRate = (stats.successful / stats.total * 100).toFixed(1);
      console.log(`${category}: ${stats.successful}/${stats.total} (${successRate}%)`);
    });

    console.log('\n--- RECOMMENDATIONS ---');
    this.results.summary.recommendations.forEach(rec => {
      console.log(`• ${rec}`);
    });

    console.log('\n' + '='.repeat(60));
  }
}

// Main execution
async function main() {
  const tester = new RSSSourceTester();

  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('Critical error during testing:', error);
    process.exit(1);
  }
}

// Check if this script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { RSSSourceTester, RSS_FEEDS, TEST_CONFIG };