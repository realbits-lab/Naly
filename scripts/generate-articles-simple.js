#!/usr/bin/env node

/**
 * Simple script to generate articles using manager API key
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
    console.error(`${colors.red}❌ Error loading API key:${colors.reset}`, error.message);
    process.exit(1);
  }
}

async function makeApiRequest(endpoint, method = 'GET', body = null) {
  const apiKey = await loadApiKey();
  const baseUrl = 'http://localhost:4000';

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
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API Error (${response.status}): ${JSON.stringify(data)}`);
    }

    return data;
  } catch (error) {
    if (error.message.includes('fetch is not defined')) {
      const fetch = require('node-fetch');
      global.fetch = fetch;
      return makeApiRequest(endpoint, method, body);
    }
    throw error;
  }
}

async function fetchNewsAndGenerate() {
  console.log(`${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}📰 Fetching News and Generating Articles${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

  // Step 1: Fetch latest news
  console.log(`\n${colors.blue}${colors.bright}1. Fetching Latest News${colors.reset}`);

  try {
    const newsResult = await makeApiRequest('/api/news/latest');
    console.log(`${colors.green}   ✅ Successfully fetched news${colors.reset}`);

    if (!newsResult.articles || newsResult.articles.length === 0) {
      console.log(`${colors.yellow}   ⚠️  No news articles found${colors.reset}`);
      return;
    }

    console.log(`   Total articles: ${newsResult.articles.length}`);

    // Step 2: Generate articles using the news generate endpoint
    console.log(`\n${colors.blue}${colors.bright}2. Generating Articles${colors.reset}`);

    const generatedArticles = [];
    const maxToGenerate = Math.min(3, newsResult.articles.length);

    for (let i = 0; i < maxToGenerate; i++) {
      const article = newsResult.articles[i];
      console.log(`\n${colors.yellow}   Processing article ${i + 1}/${maxToGenerate}: ${article.title}${colors.reset}`);

      try {
        const articleData = {
          title: article.title,
          content: article.content,
          summary: article.summary,
          url: article.url || `#${article.id}`,
          source: article.source || 'news-api',
          publishedAt: article.publishedAt || new Date().toISOString()
        };

        const generated = await makeApiRequest('/api/news/generate-article', 'POST', articleData);

        if (generated) {
          console.log(`${colors.green}     ✅ Generated article successfully${colors.reset}`);
          generatedArticles.push(generated);

          // Save article to file
          const fileName = `generated_article_${Date.now()}_${i}.json`;
          const filePath = path.join(__dirname, '..', 'articles', fileName);

          // Ensure articles directory exists
          await fs.mkdir(path.join(__dirname, '..', 'articles'), { recursive: true });
          await fs.writeFile(filePath, JSON.stringify(generated, null, 2));
          console.log(`     📁 Saved to: articles/${fileName}`);
        }

        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.log(`${colors.red}     ❌ Failed to generate: ${error.message}${colors.reset}`);
      }
    }

    // Summary
    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}📊 Results${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    console.log(`  📥 News Articles Fetched: ${newsResult.articles.length}`);
    console.log(`  📝 Articles Generated: ${generatedArticles.length}`);

    if (generatedArticles.length > 0) {
      console.log(`\n${colors.green}${colors.bright}🎉 Successfully generated ${generatedArticles.length} articles!${colors.reset}`);
      console.log(`${colors.cyan}Check the 'articles' directory for saved files${colors.reset}\n`);
    } else {
      console.log(`\n${colors.yellow}${colors.bright}⚠️  No articles were generated${colors.reset}\n`);
    }

  } catch (error) {
    console.log(`${colors.red}   ❌ Failed to fetch news: ${error.message}${colors.reset}`);
  }
}

fetchNewsAndGenerate().catch(error => {
  console.error(`${colors.red}${colors.bright}\n💥 Fatal error:${colors.reset}`, error);
  process.exit(1);
});