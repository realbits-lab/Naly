#!/usr/bin/env node

/**
 * Script to fetch articles and generate content using manager API key
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

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw new Error(`API Error (${response.status}): ${typeof data === 'object' ? JSON.stringify(data) : data}`);
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

async function fetchArticlesFromSources() {
  console.log(`\n${colors.blue}${colors.bright}1. Fetching Articles from News Sources${colors.reset}`);

  try {
    const result = await makeApiRequest('/api/articles/fetch', 'POST', {
      sources: ['techcrunch', 'reuters', 'bloomberg', 'cnbc'],
      limit: 10
    });

    console.log(`${colors.green}   ✅ Successfully fetched articles${colors.reset}`);

    if (typeof result === 'object' && result.articles) {
      console.log(`   Total articles fetched: ${result.articles.length}`);
      return result.articles;
    } else {
      console.log(`   Response: ${JSON.stringify(result).substring(0, 200)}`);
      return [];
    }
  } catch (error) {
    console.log(`${colors.red}   ❌ Failed to fetch articles: ${error.message}${colors.reset}`);
    return [];
  }
}

async function fetchLatestNews() {
  console.log(`\n${colors.blue}${colors.bright}2. Fetching Latest News${colors.reset}`);

  try {
    const result = await makeApiRequest('/api/news/latest', 'GET');

    console.log(`${colors.green}   ✅ Successfully fetched latest news${colors.reset}`);

    if (Array.isArray(result)) {
      console.log(`   Total news items: ${result.length}`);
      return result;
    } else if (result && result.data) {
      console.log(`   Total news items: ${result.data.length}`);
      return result.data;
    } else {
      console.log(`   Response: ${JSON.stringify(result).substring(0, 200)}`);
      return [];
    }
  } catch (error) {
    console.log(`${colors.red}   ❌ Failed to fetch latest news: ${error.message}${colors.reset}`);
    return [];
  }
}

async function generateArticleContent(newsItem) {
  try {
    const articleData = {
      title: newsItem.title,
      url: newsItem.url || newsItem.link,
      content: newsItem.content || newsItem.description,
      summary: newsItem.summary || newsItem.contentSnippet,
      publishedAt: newsItem.publishedAt || newsItem.pubDate,
      source: newsItem.source || 'unknown'
    };

    const result = await makeApiRequest('/api/news/generate-article', 'POST', articleData);

    if (result && result.article) {
      return result.article;
    } else if (result && result.data) {
      return result.data;
    } else {
      return result;
    }
  } catch (error) {
    console.log(`${colors.red}     ❌ Failed to generate article: ${error.message}${colors.reset}`);
    return null;
  }
}

async function generateArticles(newsItems) {
  console.log(`\n${colors.blue}${colors.bright}3. Generating Articles with AI${colors.reset}`);

  if (!newsItems || newsItems.length === 0) {
    console.log(`${colors.yellow}   ⚠️  No news items to generate articles from${colors.reset}`);
    return [];
  }

  const generatedArticles = [];
  const maxArticles = Math.min(5, newsItems.length); // Generate up to 5 articles

  console.log(`   Processing ${maxArticles} news items...`);

  for (let i = 0; i < maxArticles; i++) {
    const item = newsItems[i];
    console.log(`\n${colors.yellow}   Generating article ${i + 1}/${maxArticles}: ${item.title || 'Untitled'}${colors.reset}`);

    const article = await generateArticleContent(item);

    if (article) {
      console.log(`${colors.green}     ✅ Generated article successfully${colors.reset}`);
      generatedArticles.push(article);

      // Save article to file
      const fileName = `article_${Date.now()}_${i}.json`;
      const filePath = path.join(__dirname, '..', 'articles', fileName);

      // Ensure articles directory exists
      await fs.mkdir(path.join(__dirname, '..', 'articles'), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(article, null, 2));
      console.log(`     📁 Saved to: articles/${fileName}`);

      // Add delay between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return generatedArticles;
}

async function fetchExistingArticles() {
  console.log(`\n${colors.blue}${colors.bright}4. Checking Existing Articles in Database${colors.reset}`);

  try {
    const result = await makeApiRequest('/api/public/articles?limit=10', 'GET');

    if (result && result.articles) {
      console.log(`${colors.green}   ✅ Found ${result.articles.length} existing articles${colors.reset}`);
      if (result.articles.length > 0) {
        console.log(`   Latest: "${result.articles[0].title}"`);
      }
      return result.articles;
    } else if (Array.isArray(result)) {
      console.log(`${colors.green}   ✅ Found ${result.length} existing articles${colors.reset}`);
      if (result.length > 0) {
        console.log(`   Latest: "${result[0].title}"`);
      }
      return result;
    } else {
      console.log(`${colors.yellow}   ⚠️  No articles found${colors.reset}`);
      return [];
    }
  } catch (error) {
    console.log(`${colors.red}   ❌ Failed to fetch existing articles: ${error.message}${colors.reset}`);
    return [];
  }
}

async function runProcess() {
  console.log(`${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}📰 Article Fetch and Generation Process${colors.reset}`);
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

  // Step 1: Fetch articles from sources
  const fetchedArticles = await fetchArticlesFromSources();

  // Step 2: Fetch latest news
  const latestNews = await fetchLatestNews();

  // Combine all news items
  const allNewsItems = [...fetchedArticles, ...latestNews];

  // Step 3: Generate articles with AI
  const generatedArticles = await generateArticles(allNewsItems);

  // Step 4: Check existing articles
  const existingArticles = await fetchExistingArticles();

  // Summary
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}📊 Process Summary${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  console.log(`  📥 Articles Fetched: ${fetchedArticles.length}`);
  console.log(`  📰 Latest News Items: ${latestNews.length}`);
  console.log(`  📝 Articles Generated: ${generatedArticles.length}`);
  console.log(`  📚 Existing Articles in DB: ${existingArticles.length}`);

  if (generatedArticles.length > 0) {
    console.log(`\n${colors.green}${colors.bright}🎉 Successfully generated ${generatedArticles.length} articles!${colors.reset}`);
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