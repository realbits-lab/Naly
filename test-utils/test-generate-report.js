#!/usr/bin/env node

/**
 * Test Program for Generate Report API
 * Tests the complete market intelligence report generation workflow
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_BASE_URL = 'http://localhost:4000';
const TEST_MODE = process.argv.includes('--mock');
const VERBOSE = process.argv.includes('--verbose');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Logging helpers
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[STEP ${step}] ${message}`, colors.bright + colors.blue);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.cyan);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logDetail(key, value) {
  if (VERBOSE) {
    console.log(`  ${colors.magenta}${key}:${colors.reset} ${value}`);
  }
}

// HTTP request helper
function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;

    const req = protocol.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

// Get authentication cookie (simulate login)
async function getAuthCookie() {
  logStep(1, 'Getting authentication cookie');

  // In a real scenario, you would authenticate here
  // For testing, we'll use a mock session or expect the server to be running with auth disabled
  logWarning('Using mock authentication for testing');
  logInfo('In production, this would perform actual authentication');

  // Mock cookie for testing
  return 'next-auth.session-token=mock-manager-session';
}

// Test the report generation API
async function testGenerateReport(cookie) {
  const endpoint = TEST_MODE ? '/api/monitor/generate-report-test' : '/api/monitor/generate-report';
  logStep(2, `Testing ${TEST_MODE ? 'MOCK' : 'LIVE'} report generation endpoint`);
  logInfo(`Endpoint: ${endpoint}`);

  const options = {
    hostname: 'localhost',
    port: 4000,
    path: endpoint,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
    }
  };

  const startTime = Date.now();
  log('\n📊 Starting report generation process...', colors.bright);

  try {
    const response = await makeRequest(options);
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

    log(`\n📈 Response received in ${elapsedTime} seconds`, colors.bright);

    // Check response status
    if (response.status === 200) {
      logSuccess(`API returned status ${response.status}`);

      const data = response.data;

      // Validate response structure
      if (data.success) {
        logSuccess('Report generation successful');

        // Display results
        log('\n📋 Report Summary:', colors.bright + colors.cyan);
        logDetail('Report ID', data.reportId);
        logDetail('Report Title', data.reportTitle);
        logDetail('Articles Analyzed', data.articlesAnalyzed);
        logDetail('New Articles Added', data.newArticlesAdded);
        logDetail('Topics Extracted', data.topicsCount);
        logDetail('Test Mode', data.testMode ? 'Yes' : 'No');

        if (data.message) {
          logInfo(`Message: ${data.message}`);
        }

        // Validate each step
        log('\n🔍 Process Validation:', colors.bright);
        validateStep('RSS Fetch', data.newArticlesAdded >= 0);
        validateStep('Article Retrieval', data.articlesAnalyzed > 0);
        validateStep('Topic Extraction', data.topicsCount > 0);
        validateStep('Report Generation', data.reportId !== undefined);
        validateStep('Database Save', data.reportId !== undefined);

      } else {
        logError('Report generation failed');
        if (data.error) {
          logError(`Error: ${data.error}`);
        }
        if (data.details) {
          logError(`Details: ${data.details}`);
        }
      }

    } else if (response.status === 401) {
      logError(`Authentication failed (${response.status})`);
      logInfo('User is not authenticated or session expired');
    } else if (response.status === 403) {
      logError(`Authorization failed (${response.status})`);
      logInfo('User does not have MANAGER role');
    } else {
      logError(`Unexpected status code: ${response.status}`);
      if (response.data.error) {
        logError(`Error: ${response.data.error}`);
      }
    }

    return response;

  } catch (error) {
    logError(`Request failed: ${error.message}`);
    throw error;
  }
}

// Validate individual steps
function validateStep(stepName, condition) {
  if (condition) {
    logSuccess(`${stepName} completed successfully`);
  } else {
    logError(`${stepName} failed validation`);
  }
}

// Monitor server logs (if available)
async function monitorLogs() {
  if (VERBOSE) {
    logStep(3, 'Monitoring server logs');
    logInfo('Check logs/dev-server.log for detailed server output');

    // In a real implementation, we could tail the log file
    const logPath = path.join(process.cwd(), 'logs', 'dev-server.log');

    if (fs.existsSync(logPath)) {
      logSuccess('Server log file found');

      // Get last 20 lines of log
      const logContent = fs.readFileSync(logPath, 'utf8');
      const lines = logContent.split('\n');
      const relevantLines = lines.slice(-20).filter(line =>
        line.includes('market report') ||
        line.includes('Step') ||
        line.includes('Error') ||
        line.includes('Success')
      );

      if (relevantLines.length > 0) {
        log('\n📜 Recent relevant log entries:', colors.bright);
        relevantLines.forEach(line => {
          console.log(`  ${colors.cyan}│${colors.reset} ${line}`);
        });
      }
    } else {
      logWarning('Server log file not found');
    }
  }
}

// Performance metrics
function analyzePerformance(startTime, endTime, data) {
  logStep(4, 'Performance Analysis');

  const totalTime = ((endTime - startTime) / 1000).toFixed(2);
  const articlesPerSecond = (data.articlesAnalyzed / totalTime).toFixed(2);

  log('\n⚡ Performance Metrics:', colors.bright);
  logDetail('Total Processing Time', `${totalTime} seconds`);
  logDetail('Articles Processed', data.articlesAnalyzed);
  logDetail('Processing Rate', `${articlesPerSecond} articles/second`);

  // Performance assessment
  if (totalTime < 30) {
    logSuccess('Excellent performance (< 30s)');
  } else if (totalTime < 60) {
    logSuccess('Good performance (< 60s)');
  } else if (totalTime < 120) {
    logWarning('Acceptable performance (< 120s)');
  } else {
    logWarning(`Slow performance (${totalTime}s) - consider optimization`);
  }
}

// Main test runner
async function runTest() {
  log('🚀 Market Intelligence Report Generation Test', colors.bright + colors.green);
  log('=' .repeat(50), colors.green);

  if (TEST_MODE) {
    logInfo('Running in MOCK mode (no AI API calls)');
  } else {
    logInfo('Running in LIVE mode (requires AI API keys)');
  }

  if (VERBOSE) {
    logInfo('Verbose mode enabled');
  }

  try {
    // Step 1: Get authentication
    const cookie = await getAuthCookie();

    // Step 2: Test report generation
    const startTime = Date.now();
    const result = await testGenerateReport(cookie);
    const endTime = Date.now();

    // Step 3: Monitor logs
    await monitorLogs();

    // Step 4: Analyze performance
    if (result.data.success) {
      analyzePerformance(startTime, endTime, result.data);
    }

    // Final summary
    log('\n' + '=' .repeat(50), colors.green);
    if (result.data.success) {
      log('✅ TEST PASSED - Report generation working correctly', colors.bright + colors.green);
    } else {
      log('❌ TEST FAILED - Report generation encountered issues', colors.bright + colors.red);
    }

  } catch (error) {
    log('\n' + '=' .repeat(50), colors.red);
    log('❌ TEST FAILED WITH ERROR', colors.bright + colors.red);
    logError(error.message);
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  logInfo('Checking if development server is running...');

  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/',
    method: 'GET',
    timeout: 5000
  };

  try {
    await makeRequest(options);
    logSuccess('Development server is running on port 4000');
    return true;
  } catch (error) {
    logError('Development server is not running');
    logInfo('Please run: pnpm dev');
    return false;
  }
}

// Entry point
async function main() {
  // Check if server is running
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }

  // Run the test
  await runTest();
}

// Handle arguments
if (process.argv.includes('--help')) {
  console.log(`
${colors.bright}Market Intelligence Report Generation Test${colors.reset}

Usage: node test-generate-report.js [options]

Options:
  --mock      Use mock endpoint (no AI API calls required)
  --verbose   Show detailed output and server logs
  --help      Show this help message

Examples:
  node test-generate-report.js --mock          # Test with mock data
  node test-generate-report.js --verbose       # Test with detailed output
  node test-generate-report.js --mock --verbose # Mock test with details
`);
  process.exit(0);
}

// Run the test
main().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});