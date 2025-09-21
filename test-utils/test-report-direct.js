#!/usr/bin/env node

/**
 * Direct API Test for Market Report Generation
 * Uses actual authentication flow
 */

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function runTest() {
  log('\n🚀 Market Report Generation Test (Direct)', colors.bright + colors.green);
  log('=' .repeat(50), colors.green);

  let browser;
  let context;
  let page;

  try {
    // Launch browser
    log('\n[STEP 1] Launching browser...', colors.bright + colors.blue);
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Check if auth file exists
    const authFile = path.join(process.cwd(), '.auth', 'user.json');
    if (fs.existsSync(authFile)) {
      log('✅ Found authentication file', colors.green);

      // Create context with saved auth state
      const authState = JSON.parse(fs.readFileSync(authFile, 'utf8'));
      context = await browser.newContext({
        storageState: authFile,
        baseURL: 'http://localhost:4000'
      });
      log('✅ Loaded authentication state', colors.green);
    } else {
      log('⚠️ No auth file found, creating new context', colors.yellow);
      context = await browser.newContext({
        baseURL: 'http://localhost:4000'
      });
    }

    page = await context.newPage();

    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`  ${colors.red}[Browser Error]${colors.reset} ${msg.text()}`);
      }
    });

    // Navigate to monitor page
    log('\n[STEP 2] Navigating to monitor page...', colors.bright + colors.blue);

    const response = await page.goto('/en/monitor', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    if (response.ok()) {
      log('✅ Successfully loaded monitor page', colors.green);
    } else {
      log(`⚠️ Page loaded with status ${response.status()}`, colors.yellow);
    }

    // Check if we can see the monitoring page (authorized)
    try {
      await page.waitForSelector('h1:has-text("Real-time Monitoring")', { timeout: 5000 });
      log('✅ Authorization confirmed (MANAGER role)', colors.green);
    } catch (error) {
      log('❌ Not authorized or page not loaded correctly', colors.red);

      // Take a screenshot for debugging
      await page.screenshot({ path: 'test-auth-failure.png' });
      log('📸 Screenshot saved as test-auth-failure.png', colors.cyan);

      // Try to check current URL
      const currentUrl = page.url();
      log(`Current URL: ${currentUrl}`, colors.cyan);

      throw new Error('Authorization failed');
    }

    // Test the API directly
    log('\n[STEP 3] Testing generate-report API...', colors.bright + colors.blue);
    log('📊 Calling API endpoint...', colors.cyan);

    const startTime = Date.now();

    // Make API request using page context (includes auth cookies)
    const apiResponse = await page.request.post('/api/monitor/generate-report', {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 180000 // 3 minutes for AI processing
    });

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

    // Check response
    const status = apiResponse.status();
    const data = await apiResponse.json();

    log(`\n📈 Response received in ${elapsedTime} seconds`, colors.bright);
    log(`Status: ${status}`, status === 200 ? colors.green : colors.red);

    if (status === 200 && data.success) {
      log('\n✅ Report Generation Successful!', colors.bright + colors.green);

      log('\n📋 Report Details:', colors.bright + colors.cyan);
      log(`  Report ID: ${data.reportId}`, colors.cyan);
      log(`  Report Title: ${data.reportTitle}`, colors.cyan);
      log(`  Articles Analyzed: ${data.articlesAnalyzed}`, colors.cyan);
      log(`  New Articles Added: ${data.newArticlesAdded}`, colors.cyan);
      log(`  Topics Extracted: ${data.topicsCount}`, colors.cyan);

      // Process validation
      log('\n🔍 Process Validation:', colors.bright);

      const validations = [
        { name: 'RSS Fetch', check: data.newArticlesAdded >= 0, value: `${data.newArticlesAdded} articles` },
        { name: 'Article Analysis', check: data.articlesAnalyzed > 0, value: `${data.articlesAnalyzed} articles` },
        { name: 'Topic Extraction', check: data.topicsCount > 0, value: `${data.topicsCount} topics` },
        { name: 'Report Generation', check: !!data.reportId, value: data.reportId },
        { name: 'Database Save', check: !!data.reportId, value: 'Success' }
      ];

      validations.forEach(v => {
        if (v.check) {
          log(`  ✅ ${v.name}: ${v.value}`, colors.green);
        } else {
          log(`  ❌ ${v.name}: Failed`, colors.red);
        }
      });

      // Performance assessment
      log('\n⚡ Performance Analysis:', colors.bright);
      const articlesPerSecond = (data.articlesAnalyzed / parseFloat(elapsedTime)).toFixed(2);
      log(`  Processing Rate: ${articlesPerSecond} articles/second`, colors.cyan);

      if (parseFloat(elapsedTime) < 30) {
        log(`  ✅ Excellent performance (${elapsedTime}s)`, colors.green);
      } else if (parseFloat(elapsedTime) < 60) {
        log(`  ✅ Good performance (${elapsedTime}s)`, colors.green);
      } else if (parseFloat(elapsedTime) < 120) {
        log(`  ⚠️ Acceptable performance (${elapsedTime}s)`, colors.yellow);
      } else {
        log(`  ⚠️ Slow performance (${elapsedTime}s)`, colors.yellow);
      }

      // Check if report is visible in UI
      log('\n[STEP 4] Verifying report in UI...', colors.bright + colors.blue);

      await page.goto('/en/articles');
      await page.waitForLoadState('networkidle');

      const reportVisible = await page.locator(`text="${data.reportTitle}"`).count() > 0;

      if (reportVisible) {
        log('✅ Report is visible in articles list', colors.green);
      } else {
        log('⚠️ Report not immediately visible (may need refresh)', colors.yellow);
      }

    } else {
      log('\n❌ Report Generation Failed', colors.bright + colors.red);

      if (status === 401) {
        log('Error: Authentication required', colors.red);
      } else if (status === 403) {
        log('Error: User does not have MANAGER role', colors.red);
      } else {
        log(`Error: ${data.error || 'Unknown error'}`, colors.red);
        if (data.details) {
          log(`Details: ${data.details}`, colors.red);
        }
      }
    }

  } catch (error) {
    log(`\n❌ Test failed with error: ${error.message}`, colors.bright + colors.red);
    console.error(error);
  } finally {
    // Cleanup
    if (context) await context.close();
    if (browser) await browser.close();

    log('\n' + '=' .repeat(50), colors.green);
    log('Test completed', colors.bright);
  }
}

// Run the test
runTest().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, colors.red);
  process.exit(1);
});