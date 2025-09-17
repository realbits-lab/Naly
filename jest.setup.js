// Jest setup file
// Load environment variables for testing
require('dotenv').config({ path: '.env.local' });

// Set test timeout
jest.setTimeout(30000);

// Console configuration for better test output
const originalConsole = console;
global.console = {
  ...originalConsole,
  // Keep these for test output
  log: jest.fn((...args) => originalConsole.log(...args)),
  info: jest.fn((...args) => originalConsole.info(...args)),
  warn: jest.fn((...args) => originalConsole.warn(...args)),
  error: jest.fn((...args) => originalConsole.error(...args)),
};

// Global test utilities
global.testUtils = {
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to generate test data
  generateTestNewsArticle: () => ({
    title: 'Test News Article',
    content: 'This is test content for a news article about market movements.',
    url: 'https://test-news.com/article/1',
    source: 'Test News Source',
    publishedAt: new Date().toISOString(),
    category: 'financial'
  }),

  // Helper to create API request options
  createAPIRequest: (body, port = 3005) => ({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    },
    body: JSON.stringify(body)
  })
};