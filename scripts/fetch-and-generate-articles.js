#!/usr/bin/env node

/**
 * Script to fetch RSS content and generate articles using manager API key
 */

const fs = require('fs').promises;
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

async function loadApiKey() {
  try {
    const authFilePath = path.join(__dirname, '..', '.auth', 'user.json');
    const authData = JSON.parse(await fs.readFile(authFilePath, 'utf8'));
    return authData.credentials.apiKey;
  } catch (error) {
    console.error(`${colors.red}❌ Error loading API key from .auth/user.json:${colors.reset}`, error.message);
    process.exit(1);
  }
}

async function makeApiRequest(endpoint, method = 'GET', body = null) {
  const apiKey = await loadApiKey();
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, options);

    // Log rate limit headers
    const rateLimitHeaders = {
      limit: response.headers.get('X-RateLimit-Limit'),
      remaining: response.headers.get('X-RateLimit-Remaining'),
      reset: response.headers.get('X-RateLimit-Reset'),
    };

    if (rateLimitHeaders.limit) {
      console.log(`${colors.cyan}📊 Rate Limit: ${rateLimitHeaders.remaining}/${rateLimitHeaders.limit}${colors.reset}`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API Error (${response.status}): ${JSON.stringify(data)}`);
    }

    return data;
  } catch (error) {
    if (error.message.includes('fetch is not defined')) {
      // Node.js version doesn't have fetch, use node-fetch
      const fetch = require('node-fetch');
      global.fetch = fetch;
      return makeApiRequest(endpoint, method, body);
    }
    throw error;
  }
}

async function addRssSources() {
  console.log(`\n${colors.blue}${colors.bright}1. Adding RSS Sources${colors.reset}`);

  const sources = [
    {
      name: 'TechCrunch',
      feedUrl: 'https://techcrunch.com/feed/',
      description: 'Technology news and analysis',
      category: 'technology'
    },
    {
      name: 'Wall Street Journal - Markets',
      feedUrl: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',
      description: 'Financial markets news',
      category: 'finance'
    },
    {
      name: 'Reuters - Business',
      feedUrl: 'https://feeds.reuters.com/reuters/businessNews',
      description: 'Business news from Reuters',
      category: 'business'
    },
    {
      name: 'Bloomberg Markets',
      feedUrl: 'https://feeds.bloomberg.com/markets/news.rss',
      description: 'Market news from Bloomberg',
      category: 'finance'
    },
    {
      name: 'CNBC Top News',
      feedUrl: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114',
      description: 'Top news from CNBC',
      category: 'business'
    }
  ];

  const results = [];
  for (const source of sources) {
    console.log(`${colors.yellow}   Adding: ${source.name}${colors.reset}`);
    try {
      const result = await makeApiRequest('/api/v1/rss/sources', 'POST', source);
      console.log(`${colors.green}   ✅ Added: ${source.name}${colors.reset}`);
      results.push(result.data);
    } catch (error) {
      console.log(`${colors.red}   ❌ Failed to add ${source.name}: ${error.message}${colors.reset}`);
    }
  }

  return results;
}

async function fetchRssContent() {
  console.log(`\n${colors.blue}${colors.bright}2. Fetching RSS Content${colors.reset}`);

  try {
    const result = await makeApiRequest('/api/v1/rss/fetch', 'POST', {
      fetchAll: true,
      limit: 10 // Limit items per feed
    });

    console.log(`${colors.green}   ✅ Successfully fetched RSS content${colors.reset}`);
    console.log(`   Total items fetched: ${result.data?.totalItems || 0}`);
    console.log(`   Sources processed: ${result.data?.sourcesProcessed || 0}`);

    return result.data;
  } catch (error) {
    console.log(`${colors.red}   ❌ Failed to fetch RSS: ${error.message}${colors.reset}`);
    return null;
  }
}

async function generateArticles() {
  console.log(`\n${colors.blue}${colors.bright}3. Generating Articles from RSS Content${colors.reset}`);

  try {
    // First get the latest RSS items
    const rssItemsResult = await makeApiRequest('/api/v1/rss/items?limit=20');

    if (!rssItemsResult.data || rssItemsResult.data.length === 0) {
      console.log(`${colors.yellow}   ⚠️  No RSS items found to generate articles from${colors.reset}`);
      return [];
    }

    console.log(`   Found ${rssItemsResult.data.length} RSS items to process`);

    const generatedArticles = [];
    let processedCount = 0;
    const maxArticles = 5; // Generate up to 5 articles

    for (const item of rssItemsResult.data.slice(0, maxArticles)) {
      console.log(`\n${colors.yellow}   Generating article ${processedCount + 1}/${maxArticles}: ${item.title}${colors.reset}`);

      try {
        const articleData = {
          rssItemId: item.id,
          title: item.title,
          originalUrl: item.link,
          summary: item.contentSnippet || item.description,
          content: null, // Will be generated by AI
          tags: item.categories || [],
          generateContent: true, // Tell API to generate AI content
          model: 'openai/gpt-4o-mini', // Use a specific model
        };

        const result = await makeApiRequest('/api/v1/articles/generate', 'POST', articleData);

        if (result.data) {
          console.log(`${colors.green}     ✅ Generated article: ${result.data.title}${colors.reset}`);
          generatedArticles.push(result.data);

          // Save article to file
          const fileName = `article_${Date.now()}_${result.data.id || processedCount}.json`;
          const filePath = path.join(__dirname, '..', 'articles', fileName);

          // Ensure articles directory exists
          await fs.mkdir(path.join(__dirname, '..', 'articles'), { recursive: true });
          await fs.writeFile(filePath, JSON.stringify(result.data, null, 2));
          console.log(`     📁 Saved to: articles/${fileName}`);
        }

        processedCount++;

        // Add delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.log(`${colors.red}     ❌ Failed to generate article: ${error.message}${colors.reset}`);
      }
    }

    console.log(`\n${colors.green}   ✅ Successfully generated ${generatedArticles.length} articles${colors.reset}`);
    return generatedArticles;

  } catch (error) {
    console.log(`${colors.red}   ❌ Failed to generate articles: ${error.message}${colors.reset}`);
    return [];
  }
}

async function runProcess() {
  console.log(`${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}📰 RSS Fetch and Article Generation${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

  // Load and display API key info
  try {
    const authFilePath = path.join(__dirname, '..', '.auth', 'user.json');
    const authData = JSON.parse(await fs.readFile(authFilePath, 'utf8'));
    const { email, apiKeyScopes, apiKeyRateLimit } = authData.credentials;

    console.log(`\n📧 Account: ${email}`);
    console.log(`🔐 Scopes: ${JSON.stringify(apiKeyScopes)}`);
    console.log(`⚡ Rate Limit: ${apiKeyRateLimit} req/min`);
  } catch (error) {
    console.log(`\n${colors.yellow}⚠️  Could not read auth details${colors.reset}`);
  }

  // Step 1: Add RSS Sources
  const sources = await addRssSources();

  // Step 2: Fetch RSS Content
  const fetchResult = await fetchRssContent();

  // Step 3: Generate Articles
  const articles = await generateArticles();

  // Summary
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}📊 Process Summary${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  console.log(`  📡 RSS Sources Added: ${sources.length}`);
  console.log(`  📥 RSS Items Fetched: ${fetchResult?.totalItems || 0}`);
  console.log(`  📝 Articles Generated: ${articles.length}`);

  if (articles.length > 0) {
    console.log(`\n${colors.green}${colors.bright}🎉 Successfully generated ${articles.length} articles!${colors.reset}`);
    console.log(`${colors.cyan}Articles saved in the 'articles' directory${colors.reset}\n`);
  } else {
    console.log(`\n${colors.yellow}${colors.bright}⚠️  No articles were generated. Check the output above for details.${colors.reset}\n`);
  }
}

// Run the process
runProcess().catch(error => {
  console.error(`${colors.red}${colors.bright}\n💥 Fatal error:${colors.reset}`, error);
  process.exit(1);
});