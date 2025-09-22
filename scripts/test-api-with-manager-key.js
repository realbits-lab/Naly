#!/usr/bin/env node

/**
 * Test script to fetch and generate articles using manager API key
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

async function testUserProfile() {
  console.log(`\n${colors.blue}${colors.bright}1. Testing User Profile Endpoint${colors.reset}`);
  console.log(`${colors.yellow}   GET /api/v1/user/profile${colors.reset}`);

  try {
    const result = await makeApiRequest('/api/v1/user/profile');
    console.log(`${colors.green}   ✅ Success!${colors.reset}`);
    console.log(`   User: ${result.data?.user?.email || 'Unknown'}`);
    console.log(`   Role: ${result.data?.user?.role || 'Unknown'}`);
    console.log(`   ID: ${result.data?.user?.id || 'Unknown'}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}   ❌ Failed: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testFetchAnalytics() {
  console.log(`\n${colors.blue}${colors.bright}2. Testing Analytics Fetch${colors.reset}`);
  console.log(`${colors.yellow}   GET /api/v1/analytics${colors.reset}`);

  try {
    const result = await makeApiRequest('/api/v1/analytics?limit=5');
    console.log(`${colors.green}   ✅ Success!${colors.reset}`);
    console.log(`   Records fetched: ${result.data?.length || 0}`);
    console.log(`   Total available: ${result.pagination?.total || 0}`);

    if (result.data && result.data.length > 0) {
      console.log(`   Sample: ${result.data[0].ticker || 'N/A'} - ${new Date(result.data[0].timestamp).toLocaleDateString()}`);
    }
    return true;
  } catch (error) {
    console.log(`${colors.red}   ❌ Failed: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testFetchNarratives() {
  console.log(`\n${colors.blue}${colors.bright}3. Testing Narratives Fetch${colors.reset}`);
  console.log(`${colors.yellow}   GET /api/v1/narratives${colors.reset}`);

  try {
    const result = await makeApiRequest('/api/v1/narratives?limit=5');
    console.log(`${colors.green}   ✅ Success!${colors.reset}`);
    console.log(`   Narratives fetched: ${result.data?.length || 0}`);
    console.log(`   Total available: ${result.pagination?.total || 0}`);

    if (result.data && result.data.length > 0) {
      console.log(`   Latest: "${result.data[0].title || 'Untitled'}"`);
    }
    return true;
  } catch (error) {
    console.log(`${colors.red}   ❌ Failed: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testCreateNarrative() {
  console.log(`\n${colors.blue}${colors.bright}4. Testing Narrative Creation${colors.reset}`);
  console.log(`${colors.yellow}   POST /api/v1/narratives${colors.reset}`);

  const narrativeData = {
    title: `API Test Narrative - ${new Date().toISOString()}`,
    content: `This is a test narrative created via API at ${new Date().toLocaleString()}.

    This narrative was generated using the manager API key to test the API functionality.

    Key features tested:
    - Authentication via Bearer token
    - API key validation
    - Scope permissions (narratives:write)
    - Rate limiting
    - Content creation`,
    ticker: 'AAPL',
    type: 'custom',
    summary: 'Test narrative created via API to validate authentication and permissions',
    tags: ['test', 'api', 'automated'],
    published: false,
  };

  try {
    const result = await makeApiRequest('/api/v1/narratives', 'POST', narrativeData);
    console.log(`${colors.green}   ✅ Success!${colors.reset}`);
    console.log(`   Narrative ID: ${result.data?.id || 'Unknown'}`);
    console.log(`   Title: "${result.data?.title || narrativeData.title}"`);
    console.log(`   Created at: ${result.data?.createdAt ? new Date(result.data.createdAt).toLocaleString() : 'Unknown'}`);
    return result.data;
  } catch (error) {
    console.log(`${colors.red}   ❌ Failed: ${error.message}${colors.reset}`);
    return null;
  }
}

async function testCreatePrediction() {
  console.log(`\n${colors.blue}${colors.bright}5. Testing Prediction Creation${colors.reset}`);
  console.log(`${colors.yellow}   POST /api/v1/predictions${colors.reset}`);

  const predictionData = {
    ticker: 'AAPL',
    prediction: {
      direction: 'up',
      confidence: 75,
      targetPrice: 200,
      timeframe: '30 days',
    },
    analysis: {
      reasoning: 'Test prediction created via API. Strong technical indicators and positive market sentiment.',
      factors: ['technical_analysis', 'market_sentiment', 'api_test'],
      risks: ['market_volatility', 'test_data'],
    },
  };

  try {
    const result = await makeApiRequest('/api/v1/predictions', 'POST', predictionData);
    console.log(`${colors.green}   ✅ Success!${colors.reset}`);
    console.log(`   Prediction ID: ${result.data?.id || 'Unknown'}`);
    console.log(`   Ticker: ${result.data?.ticker || predictionData.ticker}`);
    console.log(`   Confidence: ${result.data?.confidence || predictionData.prediction.confidence}%`);
    return result.data;
  } catch (error) {
    console.log(`${colors.red}   ❌ Failed: ${error.message}${colors.reset}`);
    return null;
  }
}

async function testCreateEvent() {
  console.log(`\n${colors.blue}${colors.bright}6. Testing Event Creation${colors.reset}`);
  console.log(`${colors.yellow}   POST /api/v1/events${colors.reset}`);

  const eventData = {
    ticker: 'AAPL',
    eventType: 'api_test',
    title: 'API Test Event',
    description: 'Test event created via API to validate event creation functionality',
    severity: 'medium',
    impact: {
      priceChange: 2.5,
      volumeChange: 120,
      sentiment: 'positive',
    },
    source: 'api_test',
  };

  try {
    const result = await makeApiRequest('/api/v1/events', 'POST', eventData);
    console.log(`${colors.green}   ✅ Success!${colors.reset}`);
    console.log(`   Event ID: ${result.data?.id || 'Unknown'}`);
    console.log(`   Title: "${result.data?.title || eventData.title}"`);
    console.log(`   Severity: ${result.data?.severity || eventData.severity}`);
    return result.data;
  } catch (error) {
    console.log(`${colors.red}   ❌ Failed: ${error.message}${colors.reset}`);
    return null;
  }
}

async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}🔑 API Key Test Suite - Using Manager Account${colors.reset}`);
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

  const results = {
    userProfile: false,
    fetchAnalytics: false,
    fetchNarratives: false,
    createNarrative: false,
    createPrediction: false,
    createEvent: false,
  };

  // Run tests
  results.userProfile = await testUserProfile();
  results.fetchAnalytics = await testFetchAnalytics();
  results.fetchNarratives = await testFetchNarratives();
  results.createNarrative = await testCreateNarrative();
  results.createPrediction = await testCreatePrediction();
  results.createEvent = await testCreateEvent();

  // Summary
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}📊 Test Results Summary${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? `${colors.green}✅` : `${colors.red}❌`;
    const testName = test.replace(/([A-Z])/g, ' $1').trim();
    console.log(`  ${icon} ${testName}${colors.reset}`);
  });

  console.log(`\n${colors.bright}Final Score: ${passed}/${total} tests passed${colors.reset}`);

  if (passed === total) {
    console.log(`${colors.green}${colors.bright}\n🎉 All tests passed! API key is working perfectly!${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}${colors.bright}\n⚠️  Some tests failed. Check the output above for details.${colors.reset}\n`);
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error(`${colors.red}${colors.bright}\n💥 Fatal error:${colors.reset}`, error);
  process.exit(1);
});