// Jest Setup File
// This file is run after the Jest test environment is setup but before tests are run

// Load environment variables for testing
require('dotenv').config({ path: '.env.local' });

// Add any global test setup here
global.console = {
  ...console,
  // Suppress console.error for expected errors in tests
  error: jest.fn(),
  // Keep other console methods
  log: console.log,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};

// Reset fetch for tests
global.fetch = jest.fn();

// Add custom matchers if needed
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Clean up after all tests
afterAll(async () => {
  // Close database connections if needed
  // Clean up any test data
});