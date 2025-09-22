#!/usr/bin/env node

/**
 * CLI Test for Generate Report API
 * Simple command-line test that uses curl to test the endpoints
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

const TEST_MODE = process.argv.includes('--mock');
const endpoint = TEST_MODE
  ? 'http://localhost:4000/api/monitor/generate-report-test'
  : 'http://localhost:4000/api/monitor/generate-report';

async function runTest() {
  log(`\n🚀 Testing ${TEST_MODE ? 'MOCK' : 'LIVE'} Report Generation`, colors.bright + colors.green);
  log('=' .repeat(50), colors.green);

  log(`\nEndpoint: ${endpoint}`, colors.cyan);
  log('Method: POST', colors.cyan);
  log('\nNote: This test assumes you are logged in as a MANAGER role user', colors.yellow);
  log('Please ensure the dev server is running and you have authenticated\n', colors.yellow);

  try {
    // Make the API call using curl
    log('📊 Calling API...', colors.bright);
    const startTime = Date.now();

    const curlCommand = `curl -X POST ${endpoint} \
      -H "Content-Type: application/json" \
      -c cookies.txt \
      -b cookies.txt \
      --silent`;

    const { stdout, stderr } = await execAsync(curlCommand);

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

    if (stderr) {
      log(`\n❌ Error: ${stderr}`, colors.red);
      return;
    }

    try {
      const response = JSON.parse(stdout);

      log(`\n✅ Response received in ${elapsedTime} seconds`, colors.green);

      if (response.success) {
        log('\n📋 Report Generated Successfully!', colors.bright + colors.green);
        log(`\n  Report ID: ${response.reportId}`, colors.cyan);
        log(`  Report Title: ${response.reportTitle}`, colors.cyan);
        log(`  Articles Analyzed: ${response.articlesAnalyzed}`, colors.cyan);
        log(`  New Articles: ${response.newArticlesAdded}`, colors.cyan);
        log(`  Topics Found: ${response.topicsCount}`, colors.cyan);
        log(`  Test Mode: ${response.testMode ? 'Yes' : 'No'}`, colors.cyan);

        if (response.message) {
          log(`\n  Message: ${response.message}`, colors.blue);
        }

        // Performance assessment
        if (elapsedTime < 5) {
          log('\n⚡ Excellent performance!', colors.green);
        } else if (elapsedTime < 30) {
          log('\n⚡ Good performance', colors.green);
        } else {
          log('\n⚡ Acceptable performance', colors.yellow);
        }

      } else {
        log('\n❌ Report generation failed', colors.red);
        if (response.error) {
          log(`Error: ${response.error}`, colors.red);
        }
        if (response.details) {
          log(`Details: ${response.details}`, colors.red);
        }
      }

    } catch (parseError) {
      log('\n❌ Failed to parse response', colors.red);
      log(`Raw response: ${stdout}`, colors.yellow);

      // Check for common error patterns
      if (stdout.includes('401')) {
        log('\n⚠️  Authentication Required', colors.yellow);
        log('Please login as a MANAGER role user first', colors.yellow);
        log('1. Open http://localhost:4000 in your browser', colors.cyan);
        log('2. Login with a manager account', colors.cyan);
        log('3. Run this test again', colors.cyan);
      } else if (stdout.includes('403')) {
        log('\n⚠️  Authorization Failed', colors.yellow);
        log('Current user does not have MANAGER role', colors.yellow);
      }
    }

  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, colors.red);

    if (error.message.includes('ECONNREFUSED')) {
      log('\n⚠️  Server not running', colors.yellow);
      log('Please run: pnpm dev', colors.cyan);
    }
  }

  log('\n' + '=' .repeat(50), colors.green);
}

// Show help
if (process.argv.includes('--help')) {
  console.log(`
${colors.bright}Generate Report API Test${colors.reset}

Usage: node test-report-cli.js [options]

Options:
  --mock    Use mock endpoint (no AI API calls)
  --help    Show this help message

Prerequisites:
  1. Development server running (pnpm dev)
  2. Logged in as MANAGER role user

Examples:
  node test-report-cli.js --mock    # Test with mock data
  node test-report-cli.js           # Test with live AI
`);
  process.exit(0);
}

// Run the test
runTest().catch(error => {
  log(`\nUnexpected error: ${error.message}`, colors.red);
  process.exit(1);
});